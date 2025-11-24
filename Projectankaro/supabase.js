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
                broadcast: { 
                    self: false,
                    ack: false
                }
            }
        })
        .on('broadcast', { event: 'player_move' }, (payload) => {
            this.onPlayerMove(payload);
        })
        .on('broadcast', { event: 'game_start' }, () => {
            this.onGameStart();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime channel connected');
            }
        });
    }

    broadcastPosition(position) {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'player_move',
            payload: {
                playerId: this.localPlayerId,
                position: { x: position.x, y: position.y, z: position.z }
            }
        }).catch(() => {});
    }

    broadcastGameStart() {
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'game_start',
            payload: { hostId: this.localPlayerId }
        }).catch(() => {});
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
