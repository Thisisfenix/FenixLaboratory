export class LobbyManager {
    constructor(game) {
        this.game = game;
        this.countdownInterval = null;
    }

    async joinGame() {
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!playerName) {
            alert('Por favor ingresa tu nombre de jugador');
            return;
        }

        if (!this.game.spectatorMode && !this.game.selectedCharacter) {
            alert('Por favor selecciona un personaje antes de unirte como jugador');
            return;
        }
        
        // Verificar estado del lobby seleccionado
        const lobbyInfo = this.game.availableLobbies[this.game.currentLobby];
        if (!this.game.spectatorMode && lobbyInfo && lobbyInfo.players >= 8) {
            alert(`El ${this.game.currentLobby} está lleno (8/8 jugadores). Prueba otro lobby o únete como espectador.`);
            return;
        }
        
        // Verificar si ya hay un killer (solo si no es espectador)
        if (!this.game.spectatorMode && this.game.selectedRole === 'killer') {
            const existingKiller = Object.values(this.game.playersInLobby).find(p => p.role === 'killer');
            if (existingKiller && existingKiller.id !== this.game.myPlayerId) {
                alert(`Ya hay un killer en ${this.game.currentLobby}. Solo puede haber uno por lobby.`);
                return;
            }
        }

        const playerData = {
            id: this.game.myPlayerId,
            name: playerName,
            x: Math.random() * 800 + 100,
            y: Math.random() * 600 + 100,
            alive: !this.game.gameStarted && !this.game.spectatorMode,
            character: this.game.spectatorMode ? 'spectator' : this.game.selectedCharacter,
            role: this.game.spectatorMode ? 'spectator' : this.game.selectedRole,
            health: this.game.spectatorMode ? 0 : (this.game.selectedRole === 'survivor' ? this.getSurvivorHealth(this.game.selectedCharacter) : this.getKillerHealth(this.game.selectedCharacter)),
            maxHealth: this.game.spectatorMode ? 0 : (this.game.selectedRole === 'survivor' ? this.getSurvivorHealth(this.game.selectedCharacter) : this.getKillerHealth(this.game.selectedCharacter)),
            dodgeBar: this.game.selectedCharacter === 'iris' ? 75 : 0,
            maxDodgeBar: this.game.selectedCharacter === 'iris' ? 75 : 0,
            dodgeHits: this.game.selectedCharacter === 'iris' ? 0 : 0,
            spectating: this.game.gameStarted || this.game.spectatorMode,
            lobby: this.game.currentLobby,
            joinedAt: Date.now()
        };

        try {
            if (this.game.supabaseGame) {
                console.log('📝 Joining lobby as:', playerData.name, playerData.character, playerData.role);
                
                // Mensajes según el modo de unión
                if (this.game.gameStarted && !this.game.spectatorMode) {
                    alert(`La partida en ${this.game.currentLobby} ya comenzó. Entrarás como espectador.`);
                } else if (this.game.spectatorMode) {
                    console.log(`Joining ${this.game.currentLobby} as spectator`);
                } else {
                    console.log(`Joining ${this.game.currentLobby} as player: ${playerData.character}`);
                }
                
                // Add player to local state first
                this.game.playersInLobby[this.game.myPlayerId] = playerData;
                this.game.players[this.game.myPlayerId] = playerData;
                
                console.log('Local lobby after join:', Object.values(this.game.playersInLobby).map(p => `${p.name}(${p.role})`));
                
                // Switch to selected lobby if different
                if (this.game.currentLobby !== 'lobby-1') {
                    await this.game.supabaseGame.switchLobby(this.game.currentLobby);
                    this.game.setupSupabaseEvents();
                }
                
                this.game.supabaseGame.sendPlayerJoin(playerData);
                
                // Solicitar sincronización del lobby
                this.requestLobbySync();
                
                this.game.abilityManager.setupAbilities();
                this.updateLobbyUI();
                
                // Check if we can start the game after joining
                setTimeout(() => {
                    this.checkGameStart();
                }, 1000);
                
                // Also check immediately in case other players are already waiting
                setTimeout(() => {
                    this.checkGameStart();
                }, 100);
                
                console.log('✅ Successfully joined lobby!');
            }
        } catch (error) {
            console.error('❌ Error joining game:', error);
            alert('Error conectando al servidor. Intenta de nuevo.');
        }
    }

    getSurvivorHealth(character) {
        switch (character) {
            case 'iA777': return 120;
            case 'luna': return 85;
            case 'angel': return 90;
            case 'iris': return 100;
            case 'molly': return 95;
            default: return 100;
        }
    }

    getKillerHealth(character) {
        switch (character) {
            case 'vortex': return 700;
            default: return 600;
        }
    }
    
    syncLobbyState(newPlayerId) {
        // Enviar estado actual del lobby al nuevo jugador
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendLobbySync({
                targetPlayerId: newPlayerId,
                lobbyState: this.game.playersInLobby,
                countdownActive: this.game.countdownActive,
                lobbyCountdown: this.game.lobbyCountdown
            });
        }
    }
    
    requestLobbySync() {
        // Solicitar sincronización cuando un jugador se une
        if (this.game.supabaseGame && typeof this.game.supabaseGame.requestLobbySync === 'function') {
            this.game.supabaseGame.requestLobbySync();
        } else {
            console.log('requestLobbySync method not available');
        }
    }

    checkGameStart() {
        const playerList = Object.values(this.game.playersInLobby);
        const survivors = playerList.filter(p => p.role === 'survivor').length;
        const killers = playerList.filter(p => p.role === 'killer').length;
        
        console.log('🔍 Checking game start:', { 
            total: playerList.length, 
            survivors, 
            killers, 
            countdownActive: this.game.countdownActive,
            countdown: this.game.lobbyCountdown,
            players: playerList.map(p => `${p.name}(${p.role})`)
        });
        
        // Reset countdown si está atascado o fuera de rango
        if (this.game.countdownActive && (this.game.lobbyCountdown > 30 || this.game.lobbyCountdown < 0)) {
            console.log('⚠️ Countdown out of range, resetting...');
            this.resetCountdown();
            return;
        }
        
        if (playerList.length >= 2 && survivors >= 1 && killers >= 1 && !this.game.countdownActive) {
            // Only the first player (by ID) starts the countdown
            const sortedPlayers = playerList.sort((a, b) => a.id.localeCompare(b.id));
            console.log('First player should start countdown:', sortedPlayers[0].name, 'My ID:', this.game.myPlayerId);
            if (sortedPlayers[0].id === this.game.myPlayerId) {
                console.log('🚀 Starting countdown as first player');
                this.startLobbyCountdown();
            } else {
                console.log('⏳ Waiting for first player to start countdown');
            }
        }
    }

    startLobbyCountdown() {
        // Limpiar countdown anterior si existe
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.game.countdownActive = true;
        this.game.lobbyCountdown = 30; // COUNTDOWN FIJO DE 30 SEGUNDOS
        
        console.log('⏰ Starting countdown from 30...');
        
        // Broadcast countdown start to all players
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendCountdownStart(this.game.lobbyCountdown);
        }
        
        this.countdownInterval = setInterval(() => {
            this.game.lobbyCountdown--;
            
            // Broadcast countdown update every second
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendCountdownUpdate(this.game.lobbyCountdown);
            }
            
            this.game.uiManager.updateLobbyUI();
            
            if (this.game.lobbyCountdown <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.game.countdownActive = false;
                
                try {
                    if (this.game.supabaseGame) {
                        this.game.supabaseGame.sendGameStart();
                    }
                    this.game.uiManager.showLoadingScreen(() => this.game.setupGameCanvas());
                    this.game.gameStateManager.startGameFromRemote();
                    console.log('🚀 Game started!');
                } catch (error) {
                    console.error('❌ Error starting game:', error);
                    this.resetCountdown();
                }
            }
        }, 1000);
    }
    
    resetCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        this.game.countdownActive = false;
        this.game.lobbyCountdown = 0;
        this.game.uiManager.updateLobbyUI();
        console.log('🔄 Countdown reset');
    }

    refreshLobbyList() {
        // Clear existing lobby info
        this.game.availableLobbies = {};
        
        // Request lobby status from other players if method exists
        if (this.game.supabaseGame && typeof this.game.supabaseGame.requestLobbyStatus === 'function') {
            this.game.supabaseGame.requestLobbyStatus();
        } else {
            console.log('requestLobbyStatus method not available, skipping lobby refresh');
        }
        
        // Update lobby select options
        setTimeout(() => {
            this.game.uiManager.updateLobbySelectOptions(this.game.availableLobbies, this.game.currentLobby);
        }, 1000);
    }

    updateLobbyUI() {
        // Ensure all required data exists
        const playersInLobby = this.game.playersInLobby || {};
        const currentLobby = this.game.currentLobby || 'lobby-1';
        const countdownActive = this.game.countdownActive || false;
        const lobbyCountdown = this.game.lobbyCountdown || 0;
        
        if (this.game.uiManager && typeof this.game.uiManager.updateLobbyUI === 'function') {
            this.game.uiManager.updateLobbyUI(
                playersInLobby, 
                currentLobby, 
                countdownActive, 
                lobbyCountdown
            );
        }
        
        // Only check game start if countdown is not already active
        if (!countdownActive) {
            setTimeout(() => {
                this.checkGameStart();
            }, 100);
        }
    }
}