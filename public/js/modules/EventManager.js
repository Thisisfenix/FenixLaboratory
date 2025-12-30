export class EventManager {
    constructor(game) {
        this.game = game;
    }
    
    setupSupabaseEvents() {
        if (!this.game.supabaseGame) return;
        
        this.game.supabaseGame.updatePlayerPosition = (data) => {
            this.handlePlayerPositionUpdate(data);
        };
        
        this.game.supabaseGame.addPlayer = (data) => {
            this.handlePlayerJoin(data);
        };
        
        this.game.supabaseGame.removePlayer = (playerId) => {
            this.handlePlayerLeave(playerId);
        };
        
        this.game.supabaseGame.handleLobbyClear = (data) => {
            this.handleLobbyClear(data);
        };
        
        this.game.supabaseGame.handleLobbySync = (data) => {
            this.handleLobbySync(data);
        };
        
        this.game.supabaseGame.handleAttack = (data) => {
            this.handleAttack(data);
        };
        
        this.game.supabaseGame.handleCountdown = (data) => {
            this.handleCountdown(data);
        };
        
        this.game.supabaseGame.handleGameStart = (data) => {
            this.handleGameStart(data);
        };
        
        this.game.supabaseGame.handleGameConfig = (data) => {
            this.handleGameConfig(data);
        };
    }
    
    handlePlayerPositionUpdate(data) {
        if (data.id !== this.game.myPlayerId && this.game.players[data.id]) {
            const player = this.game.players[data.id];
            const distance = Math.sqrt(
                Math.pow(data.x - player.x, 2) + 
                Math.pow(data.y - player.y, 2)
            );
            
            if (distance > 5) {
                player.targetX = data.x;
                player.targetY = data.y;
                player.startX = player.x;
                player.startY = player.y;
                player.interpolationProgress = 0;
                player.interpolating = true;
            } else {
                player.x = data.x;
                player.y = data.y;
                player.interpolating = false;
            }
        }
    }
    
    handlePlayerJoin(data) {
        if (data.id !== this.game.myPlayerId) {
            const now = Date.now();
            if (data.joinedAt && (now - data.joinedAt) > 30000) {
                console.log('Ignoring old player:', data.name);
                return;
            }
            
            if (this.game.gameStarted) {
                data.spectating = true;
                data.alive = false;
            }
            
            this.game.players[data.id] = data;
            if (!this.game.gameStarted) {
                this.game.playersInLobby[data.id] = data;
                this.game.gameStateManager.syncLobbyState(data.id);
                this.game.uiManager.updateLobbyUI(this.game.playersInLobby, this.game.currentLobby, this.game.countdownActive, this.game.lobbyCountdown);
                this.game.gameStateManager.checkGameStart();
            }
        }
    }
    
    handlePlayerLeave(playerId) {
        if (this.game.playersInLobby[playerId]) {
            delete this.game.playersInLobby[playerId];
            delete this.game.players[playerId];
            this.game.uiManager.updateLobbyUI(this.game.playersInLobby, this.game.currentLobby, this.game.countdownActive, this.game.lobbyCountdown);
        }
    }
    
    handleLobbyClear(data) {
        if (data.clearedBy !== this.game.myPlayerId) {
            Object.keys(this.game.playersInLobby).forEach(playerId => {
                if (playerId !== this.game.myPlayerId) {
                    delete this.game.playersInLobby[playerId];
                    delete this.game.players[playerId];
                }
            });
            this.game.uiManager.updateLobbyUI(this.game.playersInLobby, this.game.currentLobby, this.game.countdownActive, this.game.lobbyCountdown);
        }
    }
    
    handleLobbySync(data) {
        if (data.playerId !== this.game.myPlayerId) {
            const now = Date.now();
            Object.keys(data.lobbyState).forEach(playerId => {
                const player = data.lobbyState[playerId];
                if (playerId !== this.game.myPlayerId && player.joinedAt && (now - player.joinedAt) <= 30000) {
                    this.game.playersInLobby[playerId] = player;
                    this.game.players[playerId] = player;
                }
            });
            
            if (data.countdownActive) {
                this.game.countdownActive = data.countdownActive;
                this.game.lobbyCountdown = data.lobbyCountdown;
            }
            
            this.game.uiManager.updateLobbyUI(this.game.playersInLobby, this.game.currentLobby, this.game.countdownActive, this.game.lobbyCountdown);
        }
    }
    
    handleAttack(data) {
        if (data.type === 'damage' && this.game.players[data.targetId]) {
            this.handleDamageAttack(data);
        } else if ((data.type === 'basic_attack' || data.type === 'white_orb') && data.playerId !== this.game.myPlayerId) {
            this.game.hitboxes.push(data.attackData);
            this.game.renderManager.createParticles(data.attackData.x, data.attackData.y, data.attackData.color, 8);
        } else if (data.type === 'stealth_activate' && data.playerId !== this.game.myPlayerId && this.game.players[data.playerId]) {
            this.handleStealthActivate(data);
        }
    }
    
    handleDamageAttack(data) {
        const target = this.game.players[data.targetId];
        target.health = data.health;
        target.alive = data.alive;
        
        if (target.autoRepairing) {
            target.autoRepairing = false;
            target.autoRepairTimer = 0;
        }
        
        if (data.downed) {
            target.downed = true;
            target.reviveTimer = 1200;
            target.beingRevived = false;
        }
        
        if (data.spectating) {
            target.spectating = true;
            target.alive = false;
        }
        
        if (target.health <= 0) {
            this.game.playDeathSound();
            this.game.gameTimer += 15;
        }
        
        if (data.knockbackX !== undefined && data.knockbackY !== undefined) {
            target.x = data.knockbackX;
            target.y = data.knockbackY;
        }
        
        let particleColor = '#FF0000';
        if (data.attackType === 'you_cant_run') {
            particleColor = '#8B0000';
            if (data.targetId === this.game.myPlayerId) {
                this.game.triggerJumpscare(data.targetId);
            }
        } else if (data.attackType === 'white_orb') {
            particleColor = '#FF8000';
        } else if (data.damage === 50) {
            particleColor = '#FFD700';
        }
        
        this.game.renderManager.createParticles(target.x + 15, target.y + 15, particleColor, 12);
        this.game.showDamageIndicator(target, data.damage, data.attackType);
    }
    
    handleStealthActivate(data) {
        const player = this.game.players[data.playerId];
        player.stealthMode = data.stealthMode;
        player.criticalStrike = data.criticalStrike;
        player.stealthTimer = 480;
        player.stealthHits = 0;
        player.maxStealthHits = 3;
    }
    
    handleCountdown(data) {
        if (data.playerId !== this.game.myPlayerId) {
            if (data.type === 'start') {
                console.log('📡 Received countdown start:', data.countdown);
                this.game.countdownActive = true;
                this.game.lobbyCountdown = data.countdown;
            } else if (data.type === 'update') {
                console.log('📡 Received countdown update:', data.countdown);
                this.game.lobbyCountdown = data.countdown;
            } else if (data.type === 'reset') {
                console.log('📡 Received countdown reset');
                this.game.countdownActive = false;
                this.game.lobbyCountdown = 0;
            }
            
            // Force update lobby UI immediately
            this.game.updateLobbyUI();
        }
    }
    
    handleGameStart(data) {
        if (data.startedBy !== this.game.myPlayerId) {
            console.log('📡 Received game start from:', data.startedBy);
            // Trigger game start for this player
            this.game.uiManager.showLoadingScreen(() => this.game.setupGameCanvas());
            this.game.gameStateManager.startGameFromRemote();
        }
    }
    
    handleGameConfig(data) {
        if (data.playerId !== this.game.myPlayerId) {
            console.log('📡 Received game config - Mode:', data.mode, 'Map:', data.map);
            this.game.selectedGameMode = data.mode;
            this.game.selectedMap = data.map;
            
            // Update game mode and map if already in game
            if (this.game.gameStarted) {
                this.game.gameModeSystem.initializeMode(data.mode);
                this.game.mapSystem.generateMap(data.map);
            }
        }
    }
}