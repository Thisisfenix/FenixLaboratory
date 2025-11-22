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
            
            this.supabase = createClient(supabaseUrl, supabaseKey, {
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    },
                    heartbeatIntervalMs: 15000,
                    timeout: 60000
                }
            });
            
            this.myPlayerId = 'player_' + Math.random().toString(36).substr(2, 9);
            await this.setupRealtimeChannel();
            this.initialized = true;
            
        } catch (error) {
            console.error('Supabase init error:', error);
            this.myPlayerId = 'guest_' + Math.random().toString(36).substr(2, 9);
            this.initialized = true;
        }
    }
    
    async setupRealtimeChannel(lobbyId = 'lobby-1') {
        return new Promise((resolve) => {
            this.channel = this.supabase.channel(`deadly-pursuit-${lobbyId}`, {
                config: {
                    broadcast: { self: true },
                    presence: { key: this.myPlayerId }
                }
            })
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
                .on('broadcast', { event: 'player-leave' }, (payload) => {
                    this.removePlayer(payload.payload.playerId);
                })
                .on('broadcast', { event: 'lobby-clear' }, (payload) => {
                    this.handleLobbyClear(payload.payload);
                })
                .on('broadcast', { event: 'timer-sync' }, (payload) => {
                    this.handleTimerSync(payload.payload);
                })
                .on('broadcast', { event: 'lobby-list' }, (payload) => {
                    this.handleLobbyList(payload.payload);
                })
                .on('broadcast', { event: 'escape-ring' }, (payload) => {
                    this.handleEscapeRing(payload.payload);
                })
                .on('broadcast', { event: 'game-config' }, (payload) => {
                    this.handleGameConfig(payload.payload);
                })
                .on('broadcast', { event: 'grabbed-player-move' }, (payload) => {
                    this.handleGrabbedPlayerMove(payload.payload);
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
    
    sendCountdownReset() {
        this.channel.send({
            type: 'broadcast',
            event: 'countdown',
            payload: {
                type: 'reset',
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
    
    sendTimerSync(timerData) {
        this.channel.send({
            type: 'broadcast',
            event: 'timer-sync',
            payload: {
                playerId: this.myPlayerId,
                ...timerData
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
    
    removePlayer(playerId) {
        if (this.players[playerId]) {
            delete this.players[playerId];
            console.log('Player removed:', playerId);
        }
    }
    
    removePlayerFromLobby(playerId) {
        this.channel.send({
            type: 'broadcast',
            event: 'player-leave',
            payload: {
                playerId: playerId,
                timestamp: Date.now()
            }
        });
    }
    
    clearLobby() {
        this.channel.send({
            type: 'broadcast',
            event: 'lobby-clear',
            payload: {
                clearedBy: this.myPlayerId,
                timestamp: Date.now()
            }
        });
    }
    
    handleLobbyClear(data) {
        // This will be overridden by the main game
    }
    
    handleTimerSync(data) {
        // This will be overridden by the main game
    }
    
    requestLobbyList() {
        this.channel.send({
            type: 'broadcast',
            event: 'lobby-list',
            payload: {
                type: 'request',
                playerId: this.myPlayerId
            }
        });
    }
    
    sendLobbyStatus(lobbyData) {
        this.channel.send({
            type: 'broadcast',
            event: 'lobby-list',
            payload: {
                type: 'status',
                playerId: this.myPlayerId,
                ...lobbyData
            }
        });
    }
    
    handleLobbyList(data) {
        // This will be overridden by the main game
    }
    
    sendEscapeRingPosition(x, y) {
        console.log('📡 Sending escape ring position:', x, y);
        this.channel.send({
            type: 'broadcast',
            event: 'escape-ring',
            payload: {
                playerId: this.myPlayerId,
                x: x,
                y: y
            }
        });
    }
    
    handleEscapeRing(data) {
        // This will be overridden by the main game
    }
    
    sendGameConfig(mode, map) {
        console.log('📡 Sending game config - Mode:', mode, 'Map:', map);
        this.channel.send({
            type: 'broadcast',
            event: 'game-config',
            payload: {
                playerId: this.myPlayerId,
                mode: mode,
                map: map
            }
        });
    }
    
    handleGameConfig(data) {
        // This will be overridden by the main game
    }
    
    sendGrabbedPlayerMove(grabbedPlayerId, x, y) {
        this.channel.send({
            type: 'broadcast',
            event: 'grabbed-player-move',
            payload: {
                playerId: this.myPlayerId,
                grabbedPlayerId: grabbedPlayerId,
                x: Math.round(x),
                y: Math.round(y)
            }
        });
    }
    
    handleGrabbedPlayerMove(data) {
        // This will be overridden by the main game
    }
    
    switchLobby(newLobbyId) {
        if (this.channel) {
            this.channel.unsubscribe();
        }
        return this.setupRealtimeChannel(newLobbyId);
    }
}