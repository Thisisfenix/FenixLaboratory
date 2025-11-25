// Supabase.js - Configuración y cliente
const SUPABASE_URL = 'https://obvuetxkfodulfdbjhri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Realtime para sincronización de jugadores
class SupabaseNetwork {
    constructor() {
        this.roomCode = null;
        this.localPlayerId = null;
        this.channel = null;
    }

    async createRoom(playerName) {
        this.roomCode = this.generateRoomCode();
        this.localPlayerId = Date.now().toString();
        this.isHost = true;

        const { data, error } = await supabase
            .from('rooms')
            .insert({
                code: this.roomCode,
                host_id: this.localPlayerId,
                players: [{
                    id: this.localPlayerId,
                    name: playerName,
                    color: 0x00ff00,
                    position: { x: -3, y: 1, z: 0 }
                }],
                status: 'waiting'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating room:', error);
            return null;
        }

        this.setupRealtimeChannel();
        return data;
    }

    async joinRoom(roomCode, playerName) {
        this.roomCode = roomCode;
        this.localPlayerId = Date.now().toString();
        this.isHost = false;

        const { data: room, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('code', roomCode)
            .single();

        if (error || !room) {
            console.error('Room not found');
            return null;
        }

        if (room.players.length >= 8) {
            console.error('Room full');
            return null;
        }

        const updatedPlayers = [...room.players, {
            id: this.localPlayerId,
            name: playerName,
            color: 0xff0000,
            position: { x: 3, y: 1, z: 0 }
        }];

        const { data, error: updateError } = await supabase
            .from('rooms')
            .update({ players: updatedPlayers })
            .eq('code', roomCode)
            .select()
            .single();

        if (updateError) {
            console.error('Error joining room:', updateError);
            return null;
        }

        this.setupRealtimeChannel();
        return data;
    }

    setupRealtimeChannel() {
        if (this.channel) {
            this.channel.unsubscribe();
        }
        
        this.channel = supabase.channel(`room:${this.roomCode}`, {
            config: {
                presence: { key: this.localPlayerId },
                broadcast: { self: false }
            }
        })
        .on('presence', { event: 'sync' }, () => {
            const state = this.channel.presenceState();
            Object.values(state).forEach(presences => {
                presences.forEach(presence => {
                    if (presence.playerId !== this.localPlayerId && presence.position) {
                        this.onPlayerMove({ payload: presence });
                    }
                    if (presence.event === 'game_start') {
                        this.onGameStart();
                    }
                    if (presence.event === 'mic_noise') {
                        this.onMicNoise({ payload: presence });
                    }
                });
            });
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime channel connected');
            }
        });
    }

    broadcastPosition(position) {
        if (!this.channel) return;

        this.channel.track({
            playerId: this.localPlayerId,
            position: { x: position.x, y: position.y, z: position.z }
        });
    }

    broadcastGameStart() {
        if (!this.channel) return;

        this.channel.track({
            event: 'game_start',
            hostId: this.localPlayerId
        });
    }
    
    broadcastMicNoise(position, range) {
        if (!this.channel) return;
        
        this.channel.track({
            event: 'mic_noise',
            playerId: this.localPlayerId,
            position: { x: position.x, y: position.y, z: position.z },
            range: range
        });
    }

    onPlayerMove(payload) {
        const { playerId, position } = payload.payload;
        if (playerId === this.localPlayerId) return;

        const player = playerManager.getPlayer(playerId);
        if (player) {
            player.setPosition(position.x, position.y, position.z);
        }
    }

    onGameStart() {
        if (typeof startGame === 'function') {
            startGame();
        }
    }
    
    onMicNoise(payload) {
        const { playerId, position, range } = payload.payload;
        if (playerId === this.localPlayerId) return;
        
        if (typeof game !== 'undefined' && game.killer) {
            const dist = Math.sqrt(
                Math.pow(game.killer.position.x - position.x, 2) +
                Math.pow(game.killer.position.z - position.z, 2)
            );
            
            if (dist < range) {
                game.killer.userData.heardPlayer = { x: position.x, z: position.z };
            }
        }
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    async disconnect() {
        if (this.channel) {
            await this.channel.unsubscribe();
        }

        if (this.roomCode && this.localPlayerId) {
            const { data: room } = await supabase
                .from('rooms')
                .select('*')
                .eq('code', this.roomCode)
                .single();

            if (room) {
                const updatedPlayers = room.players.filter(p => p.id !== this.localPlayerId);
                
                if (updatedPlayers.length === 0) {
                    await supabase.from('rooms').delete().eq('code', this.roomCode);
                } else {
                    await supabase.from('rooms').update({ players: updatedPlayers }).eq('code', this.roomCode);
                }
            }
        }
    }
}

const supabaseNetwork = new SupabaseNetwork();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    supabaseNetwork.disconnect();
});
