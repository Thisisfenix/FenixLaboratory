// Supabase Realtime - Más confiable que Firebase
class SupabaseGame {
    constructor() {
        this.supabase = null;
        this.channel = null;
        this.players = {};
        this.myPlayerId = null;
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Configuración Supabase
            const { createClient } = supabase;
            const config = window.GAME_CONFIG || {};
            const supabaseUrl = config.SUPABASE_URL;
            const supabaseKey = config.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration not found');
            }
            
            this.supabase = createClient(supabaseUrl, supabaseKey);
            
            this.myPlayerId = 'player_' + Math.random().toString(36).substr(2, 9);
            await this.setupRealtimeChannel();
            this.initialized = true;
            
        } catch (error) {
            console.error('Supabase init error:', error);
            this.myPlayerId = 'guest_' + Math.random().toString(36).substr(2, 9);
            this.initialized = true;
        }
    }
    
    async setupRealtimeChannel() {
        return new Promise((resolve) => {
            this.channel = this.supabase.channel('deadly-pursuit-game')
                .on('broadcast', { event: 'player-move' }, (payload) => {
                    console.log('Received player-move:', payload.payload);
                    this.updatePlayerPosition(payload.payload);
                })
                .on('broadcast', { event: 'player-join' }, (payload) => {
                    console.log('Received player-join:', payload.payload);
                    this.addPlayer(payload.payload);
                })
                .on('broadcast', { event: 'player-attack' }, (payload) => {
                    console.log('Received player-attack:', payload.payload);
                    this.handleAttack(payload.payload);
                })
                .on('broadcast', { event: 'game-start' }, (payload) => {
                    console.log('Received game-start:', payload.payload);
                    this.handleGameStart(payload.payload);
                })
                .on('broadcast', { event: 'ping' }, (payload) => {
                    this.handlePing(payload.payload);
                })
                .on('broadcast', { event: 'countdown' }, (payload) => {
                    this.handleCountdown(payload.payload);
                })
                .on('broadcast', { event: 'lobby-sync' }, (payload) => {
                    this.handleLobbySync(payload.payload);
                })
                .on('broadcast', { event: 'lobby-request' }, (payload) => {
                    this.handleLobbyRequest(payload.payload);
                })
                .subscribe((status) => {
                    console.log('Supabase subscription status:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Supabase channel subscribed');
                        resolve();
                    }
                });
        });
    }
    
    sendPlayerMove(x, y) {
        const payload = { id: this.myPlayerId, x: Math.round(x), y: Math.round(y) };
        this.channel.send({
            type: 'broadcast',
            event: 'player-move',
            payload: payload
        });
    }
    
    sendAttack(attackData) {
        this.channel.send({
            type: 'broadcast',
            event: 'player-attack',
            payload: { ...attackData, playerId: this.myPlayerId }
        });
    }
    
    sendPlayerJoin(playerData) {
        console.log('Sending player-join:', playerData);
        this.channel.send({
            type: 'broadcast',
            event: 'player-join',
            payload: playerData
        });
    }
    
    sendGameStart() {
        console.log('Sending game-start');
        this.channel.send({
            type: 'broadcast',
            event: 'game-start',
            payload: { startedBy: this.myPlayerId, timestamp: Date.now() }
        });
    }
    
    // Métodos para manejar eventos recibidos
    updatePlayerPosition(data) {
        this.players[data.id] = { ...this.players[data.id], x: data.x, y: data.y };
    }
    
    addPlayer(data) {
        this.players[data.id] = data;
    }
    
    handleAttack(data) {
        console.log('Ataque recibido:', data);
    }
    
    handleGameStart(data) {
        console.log('Game start received:', data);
    }
    
    handlePing(data) {
        // This will be overridden by the main game
    }
    
    handleCountdown(data) {
        // This will be overridden by the main game
    }
    
    handleLobbySync(data) {
        // This will be overridden by the main game
    }
    
    handleLobbyRequest(data) {
        // This will be overridden by the main game
    }
    
    sendCountdownStart(countdown) {
        this.channel.send({
            type: 'broadcast',
            event: 'countdown',
            payload: {
                type: 'start',
                countdown: countdown,
                playerId: this.myPlayerId
            }
        });
    }
    
    sendCountdownUpdate(countdown) {
        this.channel.send({
            type: 'broadcast',
            event: 'countdown',
            payload: {
                type: 'update',
                countdown: countdown,
                playerId: this.myPlayerId
            }
        });
    }
    
    sendPing() {
        this.channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: {
                type: 'ping',
                from: this.myPlayerId,
                timestamp: Date.now()
            }
        });
    }
    
    sendPong(originalTimestamp, to) {
        this.channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: {
                type: 'pong',
                to: to,
                originalTimestamp: originalTimestamp
            }
        });
    }
    
    sendLobbySync(syncData) {
        this.channel.send({
            type: 'broadcast',
            event: 'lobby-sync',
            payload: {
                playerId: this.myPlayerId,
                ...syncData
            }
        });
    }
    
    requestLobbySync() {
        this.channel.send({
            type: 'broadcast',
            event: 'lobby-request',
            payload: {
                playerId: this.myPlayerId,
                timestamp: Date.now()
            }
        });
    }
    
    handleLobbySync(data) {
        // This will be overridden by the main game
    }
    
    handleLobbyRequest(data) {
        // This will be overridden by the main game
    }
}