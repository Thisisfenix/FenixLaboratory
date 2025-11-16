class DiscordFriendsGame {
    constructor() {
        this.supabaseGame = null;
        this.players = {};
        this.myPlayerId = null;
        this.selectedCharacter = null;
        this.selectedRole = null;
        this.gameStarted = false;
        this.playersInLobby = {};
        this.keys = {};
        this.camera = { x: 0, y: 0 };
        const config = window.GAME_CONFIG || {};
        this.worldSize = { 
            width: config.WORLD_WIDTH || 2000, 
            height: config.WORLD_HEIGHT || 1500 
        };
        this.canvas = null;
        this.ctx = null;
        this.abilities = {
            q: { cooldown: 0, maxCooldown: 0 },
            e: { cooldown: 0, maxCooldown: 0 },
            r: { cooldown: 0, maxCooldown: 0 },
            basicAttack: { cooldown: 0, maxCooldown: 1500 }
        };
        this.gameTimer = config.GAME_TIMER || 180; // 3 minutos
        this.lastManStanding = false;
        this.lmsActivated = false;
        this.particles = [];
        this.hitboxes = [];
        this.mapObjects = [];
        this.currentMap = 'discord_server';
        this.jumpscareQueue = [];
        this.rageLevel = 0;
        this.maxRage = 500;
        this.rageMode = { active: false, timer: 0 };
        this.rageUsed = false;
        this.gameTimerPaused = false;
        this.pausedTimer = 0;
        this.lmsMusic = null;
        this.pendingLMSMusic = false;
        this.lobbyCountdown = 0;
        this.countdownActive = false;
        this.joystickActive = false;
        this.joystickTouch = null;
        this.mobileControls = null;
        this.ping = 0;
        this.lastPingTime = 0;
        
        this.init();
    }

    async init() {
        // Show loading while connecting
        this.showConnectionLoading();
        
        await this.initSupabase();
        
        this.setupEventListeners();
        this.setupSupabaseEvents();
        
        // Hide loading and show lobby
        this.hideConnectionLoading();
        this.startGameLoop();
    }
    
    showConnectionLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'connectionLoading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #0f0f23, #1a1a2e);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: #FFD700;
            font-family: Arial, sans-serif;
        `;
        
        loadingDiv.innerHTML = `
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem;">🎮 Discord Friends</div>
            <div style="font-size: 1rem; color: #fff; margin-bottom: 2rem;">Conectando al servidor...</div>
            <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
                <div id="loadingBar" style="width: 0%; height: 100%; background: #FFD700; transition: width 0.3s;"></div>
            </div>
        `;
        
        document.body.appendChild(loadingDiv);
        
        // Animate loading bar
        let progress = 0;
        this.loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            document.getElementById('loadingBar').style.width = progress + '%';
        }, 200);
    }
    
    hideConnectionLoading() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        
        const loadingDiv = document.getElementById('connectionLoading');
        if (loadingDiv) {
            // Complete loading bar
            document.getElementById('loadingBar').style.width = '100%';
            
            setTimeout(() => {
                loadingDiv.remove();
            }, 500);
        }
    }

    async initSupabase() {
        console.log('🔄 Initializing Supabase connection...');
        
        try {
            this.supabaseGame = new SupabaseGame();
            
            // Wait for Supabase to initialize
            await new Promise(resolve => {
                const checkInit = () => {
                    if (this.supabaseGame.initialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 100);
                    }
                };
                checkInit();
            });
            
            this.myPlayerId = this.supabaseGame.myPlayerId;
            console.log('✅ Connected to Supabase:', this.myPlayerId);
            
            // Limpiar lobby de jugadores antiguos
            this.clearOldPlayers();
            
        } catch (error) {
            console.error('❌ Supabase init error:', error);
            this.myPlayerId = 'guest_' + Math.random().toString(36).substr(2, 9);
        }
    }
    
    clearOldPlayers() {
        // Limpiar estado local del lobby
        this.playersInLobby = {};
        this.players = {};
        
        // Enviar señal de limpieza si hay conexión
        if (this.supabaseGame) {
            this.supabaseGame.clearLobby();
        }
        
        console.log('🧹 Cleared old players from lobby');
    }



    setupEventListeners() {
        document.querySelectorAll('.character-card').forEach(char => {
            char.addEventListener('click', () => {
                const role = char.dataset.role;
                
                // Verificar si ya hay un killer
                if (role === 'killer') {
                    const existingKiller = Object.values(this.playersInLobby).find(p => p.role === 'killer');
                    if (existingKiller && existingKiller.id !== this.myPlayerId) {
                        alert('Ya hay un killer en el lobby. Solo puede haber uno.');
                        return;
                    }
                }
                
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                char.classList.add('selected');
                this.selectedCharacter = char.dataset.character;
                this.selectedRole = char.dataset.role;
            });
        });

        document.getElementById('joinBtn').addEventListener('click', () => {
            this.joinGame();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanupPlayer();
        });
        
        // Sync timer on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.gameStarted) {
                this.syncGameTimer();
            }
        });
    }

    setupSupabaseEvents() {
        if (!this.supabaseGame) return;
        
        // Override Supabase event handlers
        this.supabaseGame.updatePlayerPosition = (data) => {
            if (data.id !== this.myPlayerId && this.players[data.id]) {
                const player = this.players[data.id];
                
                // Direct position update for better precision
                const distance = Math.sqrt(
                    Math.pow(data.x - player.x, 2) + 
                    Math.pow(data.y - player.y, 2)
                );
                
                // Only interpolate if distance is significant
                if (distance > 5) {
                    player.targetX = data.x;
                    player.targetY = data.y;
                    player.startX = player.x;
                    player.startY = player.y;
                    player.interpolationProgress = 0;
                    player.interpolating = true;
                } else {
                    // Direct update for small movements
                    player.x = data.x;
                    player.y = data.y;
                    player.interpolating = false;
                }
            }
        };
        
        this.supabaseGame.addPlayer = (data) => {
            if (data.id !== this.myPlayerId) {
                // Verificar que el jugador sea reciente (últimos 30 segundos)
                const now = Date.now();
                if (data.joinedAt && (now - data.joinedAt) > 30000) {
                    console.log('Ignoring old player:', data.name, 'joined', (now - data.joinedAt)/1000, 'seconds ago');
                    return;
                }
                
                console.log('Adding remote player:', data.name, data.role);
                
                // Si el juego ya empezó, poner en modo espectador
                if (this.gameStarted) {
                    data.spectating = true;
                    data.alive = false;
                    console.log('Game already started, setting player as spectator:', data.name);
                }
                
                this.players[data.id] = data;
                if (!this.gameStarted) {
                    this.playersInLobby[data.id] = data;
                    console.log('Current lobby:', Object.keys(this.playersInLobby).length, 'players');
                    console.log('Players in lobby:', Object.values(this.playersInLobby).map(p => `${p.name}(${p.role})`));
                    
                    // Sincronizar estado del lobby para nuevos jugadores
                    this.syncLobbyState(data.id);
                    
                    this.updateLobbyUI();
                    this.checkGameStart();
                }
            }
        };
        
        // Manejar desconexiones de jugadores
        this.supabaseGame.removePlayer = (playerId) => {
            if (this.playersInLobby[playerId]) {
                console.log('Removing player from lobby:', playerId);
                delete this.playersInLobby[playerId];
                delete this.players[playerId];
                this.updateLobbyUI();
            }
        };
        
        // Manejar limpieza del lobby
        this.supabaseGame.handleLobbyClear = (data) => {
            if (data.clearedBy !== this.myPlayerId) {
                console.log('Lobby cleared by:', data.clearedBy);
                // Limpiar todos los jugadores excepto el propio
                Object.keys(this.playersInLobby).forEach(playerId => {
                    if (playerId !== this.myPlayerId) {
                        delete this.playersInLobby[playerId];
                        delete this.players[playerId];
                    }
                });
                this.updateLobbyUI();
            }
        };
        
        // Manejar sincronización de lobby
        this.supabaseGame.handleLobbySync = (data) => {
            if (data.playerId !== this.myPlayerId) {
                console.log('Syncing lobby state from:', data.playerId);
                const now = Date.now();
                
                // Limpiar jugadores antiguos antes de sincronizar
                Object.keys(data.lobbyState).forEach(playerId => {
                    const player = data.lobbyState[playerId];
                    // Solo agregar jugadores recientes (últimos 30 segundos)
                    if (playerId !== this.myPlayerId && player.joinedAt && (now - player.joinedAt) <= 30000) {
                        this.playersInLobby[playerId] = player;
                        this.players[playerId] = player;
                    }
                });
                
                // Sincronizar countdown si está activo
                if (data.countdownActive) {
                    this.countdownActive = data.countdownActive;
                    this.lobbyCountdown = data.lobbyCountdown;
                }
                
                console.log('Updated lobby after sync:', Object.values(this.playersInLobby).map(p => `${p.name}(${p.role})`));
                this.updateLobbyUI();
            }
        };
        
        this.supabaseGame.handleAttack = (data) => {
            console.log('Attack received:', data);
            
            if (data.type === 'damage' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.health = data.health;
                target.alive = data.alive;
                
                // Cancelar auto repair si está activo
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
                
                // Reproducir sonido de muerte para todos
                if (target.health <= 0) {
                    this.playDeathSound();
                }
                
                // Aplicar knockback si está presente
                if (data.knockbackX !== undefined && data.knockbackY !== undefined) {
                    target.x = data.knockbackX;
                    target.y = data.knockbackY;
                }
                
                // Crear partículas según el tipo de ataque
                let particleColor = '#FF0000';
                if (data.attackType === 'you_cant_run') {
                    particleColor = '#8B0000';
                    // Trigger jumpscare para el jugador objetivo
                    if (data.targetId === this.myPlayerId) {
                        this.triggerJumpscare(data.targetId);
                    }
                } else if (data.attackType === 'white_orb') {
                    particleColor = '#FF8000';
                } else if (data.damage === 50) {
                    particleColor = '#FFD700'; // Stealth attack
                }
                
                this.createParticles(target.x + 15, target.y + 15, particleColor, 12);
                
                console.log(`Player ${target.name} took ${data.damage} damage: ${target.health}HP (${data.attackType})`);
                
                // Mostrar indicador de daño flotante
                this.showDamageIndicator(target, data.damage, data.attackType);
            } else if ((data.type === 'basic_attack' || data.type === 'white_orb') && data.playerId !== this.myPlayerId) {
                this.hitboxes.push(data.attackData);
                this.createParticles(data.attackData.x, data.attackData.y, data.attackData.color, 8);
            } else if (data.type === 'stealth_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.stealthMode = data.stealthMode;
                player.criticalStrike = data.criticalStrike;
                player.stealthTimer = 480;
                player.stealthHits = 0;
                player.maxStealthHits = 3;
            } else if (data.type === 'you_cant_run_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.youCantRunActive = true;
                player.youCantRunTimer = 300;
                player.youCantRunHit = false;
            } else if (data.type === 'sharp_wings_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.sharpWingsActive = true;
                player.sharpWingsTimer = 300;
                player.sharpWingsHit = false;
            } else if (data.type === 'stun' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.stunned = true;
                target.stunTimer = data.stunDuration;
                
                // Aplicar knockback visual
                if (data.knockbackX !== undefined && data.knockbackY !== undefined) {
                    target.x = data.knockbackX;
                    target.y = data.knockbackY;
                }
                
                this.createParticles(target.x + 15, target.y + 15, '#FF69B4', 15);
            } else if (data.type === 'revive' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.alive = true;
                target.downed = false;
                target.beingRevived = false;
                target.health = data.health;
                target.reviveProgress = 0;
                target.lastLife = true;
                target.spectating = false;
                
                this.createParticles(target.x + 15, target.y + 15, '#00FF00', 20);
            } else if (data.type === 'charge_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.charging = true;
                player.chargeTimer = 420;
                player.chargeHit = false;
                player.grabbedKiller = null;
                player.chargeStunned = false;
            } else if (data.type === 'charge_grab' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                const charger = this.players[data.playerId];
                
                if (charger) {
                    charger.grabbedKiller = data.targetId;
                    charger.chargeStunned = true;
                }
                
                target.stunned = true;
                target.stunTimer = 420;
                target.grabbedBy = data.playerId;
                
                this.createParticles(target.x + 15, target.y + 15, '#00FFFF', 20);
            } else if (data.type === 'heal' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.health = data.health;
                
                this.createParticles(target.x + 15, target.y + 15, '#00FF00', 8);
            } else if (data.type === 'auto_repair_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.autoRepairing = true;
                player.autoRepairTimer = 1200;
                player.autoRepairTick = 0;
            } else if (data.type === 'sierra_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.sierraActive = true;
                player.sierraTimer = 60;
                player.sierraHit = false;
                player.sierraFlash = true;
            } else if (data.type === 'sierra_hit' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.stunned = true;
                target.stunTimer = data.stunDuration;
                target.x = data.knockbackX;
                target.y = data.knockbackY;
                
                this.createParticles(target.x + 15, target.y + 15, '#FF0000', 25);
            } else if (data.type === 'rage_mode' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.rageMode = data.rageMode;
                player.rageLevel = 0;
                player.rageUsed = true;
            } else if (data.type === 'energy_juice_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.energyJuiceActive = true;
                player.energyJuiceTimer = 600;
                player.speedBoost = true;
            } else if (data.type === 'punch_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.punchActive = true;
                player.punchTimer = 60;
                player.punchHit = false;
            } else if (data.type === 'punch_hit' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                const puncher = this.players[data.puncherId];
                
                target.health = Math.max(0, target.health - data.damage);
                target.stunned = true;
                target.stunTimer = data.stunDuration;
                
                if (puncher) {
                    puncher.health = data.puncherHealth;
                    puncher.punchStuns = (puncher.punchStuns || 0) + 1;
                    
                    if (puncher.health >= 30 && !puncher.resistanceActive) {
                        puncher.resistanceActive = true;
                    }
                }
                
                this.createParticles(target.x + 15, target.y + 15, '#FFD700', 15);
            } else if (data.type === 'taunt_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.tauntActive = true;
                player.tauntTimer = 60;
                player.tauntHit = false;
            } else if (data.type === 'taunt_hit' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.screenBlurred = true;
                target.blurTimer = data.blurDuration;
                
                this.createParticles(target.x + 15, target.y + 15, '#FF69B4', 20);
            }
        };
        
        this.supabaseGame.handleGameStart = (data) => {
            console.log('Game start received from:', data.startedBy);
            if (data.startedBy !== this.myPlayerId) {
                this.startGameFromRemote();
            }
        };
        
        this.supabaseGame.handleCountdown = (data) => {
            if (data.playerId !== this.myPlayerId) {
                if (data.type === 'start') {
                    this.countdownActive = true;
                    this.lobbyCountdown = data.countdown;
                    console.log('📡 Received countdown start:', data.countdown);
                } else if (data.type === 'update') {
                    // Forzar countdown válido entre 0 y 30
                    if (data.countdown >= 0 && data.countdown <= 30) {
                        this.lobbyCountdown = Math.max(0, Math.min(30, data.countdown));
                    } else {
                        this.resetCountdown(); // Reset si está fuera de rango
                        return;
                    }
                } else if (data.type === 'reset') {
                    this.resetCountdown();
                }
                this.updateLobbyUI();
            }
        };
        
        this.supabaseGame.handlePing = (data) => {
            if (data.type === 'ping' && data.from !== this.myPlayerId) {
                // Send pong back
                this.supabaseGame.sendPong(data.timestamp, data.from);
            } else if (data.type === 'pong' && data.to === this.myPlayerId) {
                // Calculate ping
                this.ping = Date.now() - data.originalTimestamp;
            }
        };
        
        this.supabaseGame.handleTimerSync = (data) => {
            if (data.playerId !== this.myPlayerId && data.gameStartTime) {
                this.gameStartTime = data.gameStartTime;
                console.log('🕐 Timer synced with', data.playerId);
            }
        };
    }

    async joinGame() {
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!playerName) {
            alert('Por favor ingresa tu nombre');
            return;
        }

        if (!this.selectedCharacter) {
            alert('Por favor selecciona un personaje');
            return;
        }
        
        // Verificar si ya hay un killer
        if (this.selectedRole === 'killer') {
            const existingKiller = Object.values(this.playersInLobby).find(p => p.role === 'killer');
            if (existingKiller && existingKiller.id !== this.myPlayerId) {
                alert('Ya hay un killer en el lobby. Solo puede haber uno.');
                return;
            }
        }

        const playerData = {
            id: this.myPlayerId,
            name: playerName,
            character: this.selectedCharacter,
            role: this.selectedRole,
            x: Math.random() * 800 + 100,
            y: Math.random() * 600 + 100,
            alive: !this.gameStarted,
            health: this.selectedRole === 'survivor' ? (this.selectedCharacter === 'iA777' ? 120 : (this.selectedCharacter === 'luna' ? 85 : (this.selectedCharacter === 'angel' ? 90 : 100))) : 600,
            maxHealth: this.selectedRole === 'survivor' ? (this.selectedCharacter === 'iA777' ? 120 : (this.selectedCharacter === 'luna' ? 85 : (this.selectedCharacter === 'angel' ? 90 : 100))) : 600,
            spectating: this.gameStarted,
            joinedAt: Date.now()
        };

        try {
            if (this.supabaseGame) {
                console.log('📝 Joining lobby as:', playerData.name, playerData.character, playerData.role);
                
                // Si el juego ya empezó, notificar al jugador
                if (this.gameStarted) {
                    alert('La partida ya comenzó. Entrarás como espectador.');
                }
                
                // Add player to local state first
                this.playersInLobby[this.myPlayerId] = playerData;
                this.players[this.myPlayerId] = playerData;
                
                console.log('Local lobby after join:', Object.values(this.playersInLobby).map(p => `${p.name}(${p.role})`));
                
                // Broadcast to other players
                this.supabaseGame.sendPlayerJoin(playerData);
                
                // Solicitar sincronización del lobby
                this.requestLobbySync();
                
                this.setupAbilities();
                this.updateLobbyUI();
                
                // Check if we can start the game after joining
                setTimeout(() => {
                    this.checkGameStart();
                }, 1000);
                
                console.log('✅ Successfully joined lobby!');
            }
        } catch (error) {
            console.error('❌ Error joining game:', error);
            alert('Error conectando al servidor. Intenta de nuevo.');
        }
    }
    
    syncLobbyState(newPlayerId) {
        // Enviar estado actual del lobby al nuevo jugador
        if (this.supabaseGame) {
            this.supabaseGame.sendLobbySync({
                targetPlayerId: newPlayerId,
                lobbyState: this.playersInLobby,
                countdownActive: this.countdownActive,
                lobbyCountdown: this.lobbyCountdown
            });
        }
    }
    
    requestLobbySync() {
        // Solicitar sincronización cuando un jugador se une
        if (this.supabaseGame) {
            this.supabaseGame.requestLobbySync();
        }
    }

    checkGameStart() {
        const playerList = Object.values(this.playersInLobby);
        const survivors = playerList.filter(p => p.role === 'survivor').length;
        const killers = playerList.filter(p => p.role === 'killer').length;
        
        console.log('🔍 Checking game start:', { 
            total: playerList.length, 
            survivors, 
            killers, 
            countdownActive: this.countdownActive,
            countdown: this.lobbyCountdown,
            players: playerList.map(p => `${p.name}(${p.role})`)
        });
        
        // Reset countdown si está atascado o fuera de rango
        if (this.countdownActive && (this.lobbyCountdown > 30 || this.lobbyCountdown < 0)) {
            console.log('⚠️ Countdown out of range, resetting...');
            this.resetCountdown();
            return;
        }
        
        if (playerList.length >= 2 && survivors >= 1 && killers >= 1 && !this.countdownActive) {
            // Only the first player (by ID) starts the countdown
            const sortedPlayers = playerList.sort((a, b) => a.id.localeCompare(b.id));
            console.log('First player should start countdown:', sortedPlayers[0].name, 'My ID:', this.myPlayerId);
            if (sortedPlayers[0].id === this.myPlayerId) {
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
        
        this.countdownActive = true;
        this.lobbyCountdown = 30; // COUNTDOWN FIJO DE 30 SEGUNDOS
        
        console.log('⏰ Starting countdown from 30...');
        
        // Broadcast countdown start to all players
        if (this.supabaseGame) {
            this.supabaseGame.sendCountdownStart(this.lobbyCountdown);
        }
        
        this.countdownInterval = setInterval(() => {
            this.lobbyCountdown--;
            
            // Broadcast countdown update every second
            if (this.supabaseGame) {
                this.supabaseGame.sendCountdownUpdate(this.lobbyCountdown);
            }
            
            this.updateLobbyUI();
            
            if (this.lobbyCountdown <= 0) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.countdownActive = false;
                
                try {
                    if (this.supabaseGame) {
                        this.supabaseGame.sendGameStart();
                    }
                    this.startGameFromRemote();
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
        this.countdownActive = false;
        this.lobbyCountdown = 0;
        this.updateLobbyUI();
        console.log('🔄 Countdown reset');
    }

    setupAbilities() {
        if (this.selectedCharacter === '2019x') {
            this.abilities.q = { cooldown: 0, maxCooldown: 20000 }; // Sigilo - 20s
            this.abilities.e = { cooldown: 0, maxCooldown: 15000 }; // You Can't Run - 15s
            this.abilities.r = { cooldown: 0, maxCooldown: 8000 }; // Orbe Blanco - 8s
        } else if (this.selectedCharacter === 'gissel') {
            this.abilities.q = { cooldown: 0, maxCooldown: 18000 }; // Alas Puntiagudas - 18s
            this.abilities.e = { cooldown: 0, maxCooldown: 12000 };
            this.abilities.r = { cooldown: 0, maxCooldown: 15000 };
        } else if (this.selectedCharacter === 'iA777') {
            this.abilities.q = { cooldown: 0, maxCooldown: 20000 }; // Carga - 20s
            this.abilities.e = { cooldown: 0, maxCooldown: 25000 }; // Autoreparación - 25s
            this.abilities.r = { cooldown: 0, maxCooldown: 25000 }; // Sierra - 25s en LMS
        } else if (this.selectedCharacter === 'luna') {
            this.abilities.q = { cooldown: 0, maxCooldown: 16000, uses: 4, maxUses: 4 }; // Energy Juice - 16s, 4 usos
            this.abilities.e = { cooldown: 0, maxCooldown: 25000 }; // Punch - 25s
            this.abilities.r = { cooldown: 0, maxCooldown: 12000 }; // Taunt - 12s
        } else if (this.selectedCharacter === 'angel') {
            this.abilities.q = { cooldown: 0, maxCooldown: 35000 }; // Sacrificio Angelical - 35s
            this.abilities.e = { cooldown: 0, maxCooldown: 40000 }; // Dash Protector - 40s
            this.abilities.r = { cooldown: 0, maxCooldown: 25000 }; // Descanso - 25s
        }
        this.abilities.basicAttack = { cooldown: 0, maxCooldown: 1500 };
    }

    showGameScreen() {
        document.getElementById('lobby').classList.remove('active');
        document.getElementById('game').classList.add('active');
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.setupGameEventListeners();
        this.generateDiscordServerMap();
    }

    setupGameEventListeners() {
        // Remove existing listeners if any
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            document.removeEventListener('keyup', this.keyupHandler);
        }
        
        this.keydownHandler = (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Abilities
            if (key === 'q') this.useAbility('q');
            if (key === 'e') {
                // Verificar si es para revivir
                if (this.showRevivePrompt) {
                    const downedPlayer = this.players[this.showRevivePrompt];
                    if (downedPlayer && downedPlayer.downed) {
                        downedPlayer.beingRevived = true;
                        downedPlayer.reviveProgress = 0;
                        this.showRevivePrompt = null;
                    }
                } else {
                    this.useAbility('e');
                }
            }
            if (key === 'r') this.useAbility('r');
            if (key === 'c') this.activateRageMode();
            if (key === ' ') {
                e.preventDefault();
                this.handleAttack();
            }
        };
        
        this.keyupHandler = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
        // Mouse controls
        this.canvas.addEventListener('click', (e) => {
            this.handleAttack(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.lastMouseX = e.clientX - rect.left + this.camera.x;
            this.lastMouseY = e.clientY - rect.top + this.camera.y;
        });
        
        // Mobile touch controls
        if (this.isMobile()) {
            this.setupMobileControls();
            this.activateMobileControls();
            this.forceLandscape();
        }
        
        // Simple resize handling
        window.addEventListener('resize', () => {
            this.handleViewportChange();
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleViewportChange();
            }, 500);
        });
        
        // Supabase handles disconnection automatically
    }
    
    setupMobileControls() {
        // Improved touch handling with better performance
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, {passive: false});
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, {passive: false});
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, {passive: false});
        
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, {passive: false});
        
        // Initialize joystick state
        this.joystickState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            touchId: null
        };
        
        // Setup ability button listeners
        this.setupMobileAbilityButtons();
    }
    
    activateMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.classList.add('active');
        }
    }
    
    setupMobileAbilityButtons() {
        // Setup ability buttons with touch events
        ['Q', 'E', 'R', 'C'].forEach(key => {
            const btn = document.getElementById(`ability${key}`);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const ability = this.abilities[key.toLowerCase()];
                    if (!ability || ability.cooldown > 0) return;
                    
                    if (key === 'C') {
                        this.activateRageMode();
                    } else {
                        this.useAbility(key.toLowerCase());
                    }
                    
                    // Visual feedback
                    btn.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        btn.style.transform = 'scale(1)';
                    }, 100);
                }, {passive: false});
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        });
    }

    handleAttack(e) {
        const player = this.players[this.myPlayerId];
        if (!player || !player.alive || player.role !== 'killer') return;
        if (this.abilities.basicAttack.cooldown > 0) return;
        
        this.abilities.basicAttack.cooldown = this.abilities.basicAttack.maxCooldown;
        
        // Calcular dirección del ataque
        let attackX = player.x;
        let attackY = player.y;
        
        if (this.lastMouseX && this.lastMouseY) {
            const angle = Math.atan2(this.lastMouseY - (player.y + 15), this.lastMouseX - (player.x + 15));
            const distance = 40; // Distancia del ataque
            attackX = player.x + Math.cos(angle) * distance;
            attackY = player.y + Math.sin(angle) * distance;
        }
        
        const hitboxData = {
            type: 'basic_attack',
            x: attackX,
            y: attackY,
            width: 60,
            height: 60,
            life: 30,
            ownerId: player.id,
            color: '#FF0000'
        };
        
        this.hitboxes.push(hitboxData);
        this.createParticles(attackX + 30, attackY + 30, '#FF0000', 8);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'basic_attack',
                attackData: hitboxData,
                playerId: player.id
            });
        }
    }

    updateStealth() {
        Object.values(this.players).forEach(player => {
            if (player.stealthMode && player.stealthTimer > 0) {
                player.stealthTimer--;
                
                // Crear partículas de sigilo
                if (Math.random() < 0.3) {
                    this.createParticles(player.x + Math.random() * 30, player.y + Math.random() * 30, '#2C2C2C', 1);
                }
                
                // Terminar sigilo
                if (player.stealthTimer <= 0) {
                    player.stealthMode = false;
                    this.createParticles(player.x + 15, player.y + 15, '#FF0000', 10);
                }
            }
        });
    }

    updateRageMode() {
        Object.values(this.players).forEach(player => {
            if (player.role === 'killer') {
                // Ganar rage gradualmente
                if (!player.rageMode.active && !player.rageUsed && player.rageLevel < player.maxRage) {
                    player.rageLevel += player.rageGainRate;
                    
                    // Ganar rage extra por atacar survivors
                    if (player.id === this.myPlayerId && this.abilities.basicAttack.cooldown > this.abilities.basicAttack.maxCooldown - 100) {
                        player.rageLevel += 5; // Bonus por atacar
                    }
                }
                
                // Rage mode activo
                if (player.rageMode && player.rageMode.active) {
                    player.rageMode.timer--;
                    
                    // Crear partículas de rage
                    if (Math.random() < 0.4) {
                        this.createParticles(
                            player.x + Math.random() * 30, 
                            player.y + Math.random() * 30, 
                            '#FF4500', 
                            1
                        );
                    }
                    
                    // Terminar rage mode
                    if (player.rageMode.timer <= 0) {
                        player.rageMode.active = false;
                        this.createParticles(player.x + 15, player.y + 15, '#8B0000', 8);
                    }
                }
            }
        });
    }

    showLoadingScreen() {
        // Hide lobby and show loading
        document.getElementById('lobby').classList.remove('active');
        document.getElementById('loadingScreen').classList.add('active');
        
        const loadingDiv = document.getElementById('loadingScreen');
        if (loadingDiv) {
            loadingDiv.style.background = "linear-gradient(135deg, rgba(0,0,0,0.8), rgba(10,10,10,0.8)), url('assets/loading-screen.png')";
            loadingDiv.style.backgroundSize = "cover";
            loadingDiv.style.backgroundPosition = "center";
            loadingDiv.innerHTML = `
                <div style="text-align: center;">
                    <div id="loadingText" style="font-size: 2rem; color: #FFD700; font-weight: bold; background: rgba(0,0,0,0.7); padding: 1rem 2rem; border-radius: 15px; backdrop-filter: blur(10px);">Conectando al servidor...</div>
                    <div style="margin-top: 1rem; color: #fff; font-size: 1.2rem; background: rgba(0,0,0,0.5); padding: 0.5rem 1rem; border-radius: 10px;">Sincronizando jugadores</div>
                    <div style="margin-top: 2rem; color: rgba(255,255,255,0.7); font-size: 1rem; background: rgba(0,0,0,0.5); padding: 0.5rem 1rem; border-radius: 10px;">Preparando Discord Friends Game...</div>
                    <div style="margin-top: 1rem; color: rgba(255,255,255,0.5); font-size: 0.9rem;">Por favor espera...</div>
                </div>
            `;
            
            // Show connecting message, then countdown
            setTimeout(() => {
                let countdown = 3;
                const countdownInterval = setInterval(() => {
                    const loadingText = document.getElementById('loadingText');
                    if (loadingText) {
                        if (countdown > 0) {
                            loadingText.textContent = `Iniciando en ${countdown}...`;
                            countdown--;
                        } else {
                            clearInterval(countdownInterval);
                            loadingDiv.classList.remove('active');
                            document.getElementById('game').classList.add('active');
                            this.setupGameCanvas();
                        }
                    }
                }, 1000);
            }, 2000); // Wait 2 seconds before countdown
        }
    }
    
    setupGameCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.setupGameEventListeners();
        this.generateDiscordServerMap();
    }
    
    startGameFromRemote() {
        this.gameStarted = true;
        this.gameStartTime = Date.now();
        this.players = {...this.playersInLobby};
        this.playersInLobby = {};
        this.countdownActive = false;
        
        this.showLoadingScreen();
    }

    checkLMSCondition() {
        if (!this.gameStarted) return;
        
        const aliveSurvivors = Object.values(this.players).filter(p => p.role === 'survivor' && p.alive && !p.downed && !p.spectating);
        const totalActiveSurvivors = Object.values(this.players).filter(p => p.role === 'survivor' && !p.spectating);
        const aliveKillers = Object.values(this.players).filter(p => p.role === 'killer' && p.alive);
        
        // Solo verificar si hay jugadores
        if (Object.keys(this.players).length === 0) return;
        
        // Debug logs para LMS
        if (totalActiveSurvivors.length <= 2 && !this.lmsActivated) {
            console.log('🔍 LMS Check:', {
                totalActiveSurvivors: totalActiveSurvivors.length,
                aliveSurvivors: aliveSurvivors.length,
                aliveKillers: aliveKillers.length,
                lmsActivated: this.lmsActivated,
                survivors: totalActiveSurvivors.map(p => `${p.name}(${p.character}) - alive:${p.alive} downed:${p.downed}`)
            });
        }
        
        // Activar LMS cuando quede 1 survivor (contando downed como potencialmente vivos)
        if (totalActiveSurvivors.length === 1 && aliveKillers.length >= 1 && !this.lmsActivated) {
            console.log('🚀 LMS CONDITIONS MET! Activating...');
            this.activateLMS();
        }
        
        // Condiciones de victoria - solo si hay jugadores de ambos roles
        const totalSurvivors = Object.values(this.players).filter(p => p.role === 'survivor').length;
        const totalKillers = Object.values(this.players).filter(p => p.role === 'killer').length;
        
        if (totalSurvivors > 0 && totalKillers > 0) {
            // Contar solo survivors realmente vivos (no downed ni espectadores)
            const trulyAliveSurvivors = Object.values(this.players).filter(p => p.role === 'survivor' && p.alive && !p.downed && !p.spectating);
            
            if (trulyAliveSurvivors.length === 0 && aliveKillers.length > 0) {
                // Si estamos en LMS y el survivor murió, detener música
                if (this.lastManStanding) {
                    this.stopLMSMusic();
                }
                this.endGame('KILLERS WIN!');
            } else if (this.gameTimer <= 0 && trulyAliveSurvivors.length > 0 && !this.gameTimerPaused) {
                this.endGame('SURVIVORS WIN!');
            }
        }
    }

    activateLMS() {
        console.log('🔥 ACTIVATING LAST MAN STANDING!');
        this.lastManStanding = true;
        this.lmsActivated = true;
        
        const lastSurvivor = Object.values(this.players).find(p => p.role === 'survivor' && !p.spectating);
        console.log('Last survivor found:', lastSurvivor ? lastSurvivor.name : 'None');
        
        if (lastSurvivor) {
            // Si está downed, revivir para LMS
            if (lastSurvivor.downed) {
                lastSurvivor.alive = true;
                lastSurvivor.downed = false;
                lastSurvivor.beingRevived = false;
                lastSurvivor.reviveProgress = 0;
                console.log('Revived downed survivor for LMS:', lastSurvivor.name);
            }
            
            // Curación completa para iA777 en LMS
            if (lastSurvivor.character === 'iA777') {
                lastSurvivor.health = lastSurvivor.maxHealth;
                lastSurvivor.lmsFullHeal = true;
                lastSurvivor.lmsResistance = true; // 25% menos daño
                console.log('iA777 LMS bonuses applied: Full heal + resistance');
            } else if (lastSurvivor.character === 'luna') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(140, lastSurvivor.health + 55);
                lastSurvivor.maxHealth = 140;
                lastSurvivor.lmsSpeedBoost = true; // Velocidad permanente en LMS
                lastSurvivor.lmsPunchBoost = true; // Punch más fuerte
                lastSurvivor.lmsResistance = true; // 20% menos daño
                console.log(`Luna LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Speed boost, Punch boost, Resistance`);
            } else if (lastSurvivor.character === 'angel') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(130, lastSurvivor.health + 40);
                lastSurvivor.maxHealth = 130;
                lastSurvivor.lmsAngelPower = true; // Poder angelical supremo
                lastSurvivor.lmsResistance = true; // 25% menos daño
                lastSurvivor.lmsHealBoost = true; // Curación mejorada
                lastSurvivor.lmsDashBoost = true; // Dash mejorado
                console.log(`Angel LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Angel Power, Resistance, Heal boost, Dash boost`);
            } else {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(160, lastSurvivor.health + 60);
                lastSurvivor.maxHealth = 160;
                console.log(`LMS health boost: ${oldHealth} -> ${lastSurvivor.health}`);
            }
            lastSurvivor.lmsBonus = true;
            lastSurvivor.lastLife = true;
            
            this.createParticles(lastSurvivor.x + 15, lastSurvivor.y + 15, '#FFD700', 20);
        }
        
        // El timer se ajustará automáticamente cuando se cargue la música
        // Valor temporal hasta que se cargue la duración real
        this.gameTimer = 300; // Temporal, se actualizará con la duración real
        
        // Reproducir música de LMS
        this.playLMSMusic();
        
        console.log('🔥 LAST MAN STANDING ACTIVATED! Timer:', this.gameTimer);
    }

    endGame(winCondition) {
        this.gameStarted = false;
        this.lastManStanding = false;
        this.lmsActivated = false;
        
        // Determinar mensaje según el rol del jugador
        const player = this.players[this.myPlayerId];
        let message;
        
        if (winCondition === 'KILLERS WIN!') {
            message = player && player.role === 'killer' ? '🔥 ¡GANASTE!' : '💀 ¡PERDISTE!';
        } else if (winCondition === 'SURVIVORS WIN!' || winCondition === 'SURVIVORS ESCAPED!') {
            message = player && player.role === 'survivor' ? '🌟 ¡GANASTE!' : '💀 ¡PERDISTE!';
        } else {
            message = winCondition; // Fallback
        }
        
        this.startEndGameAnimation(message, winCondition);
    }
    
    startEndGameAnimation(message, winCondition) {
        Object.values(this.players).forEach(player => {
            if (player.role === 'killer') {
                player.endGameRed = true;
            }
        });
        
        setTimeout(() => {
            Object.values(this.players).forEach(player => {
                if (player.role === 'killer') {
                    player.disappearing = true;
                    this.createParticles(player.x + 15, player.y + 15, '#FF0000', 50);
                }
            });
        }, 5000);
        
        setTimeout(() => {
            this.showGameResults(message, winCondition);
        }, 15000);
    }
    
    showGameResults(message, winCondition) {
        this.cleanupDatabase();
        
        const survivors = Object.values(this.players).filter(p => p.role === 'survivor');
        const player = this.players[this.myPlayerId];
        
        // Color del mensaje principal según si ganó o perdió
        const messageColor = message.includes('GANASTE') ? '#00FF00' : '#FF0000';
        
        let resultsHTML = `<div style="font-size: 2rem; margin-bottom: 2rem; color: ${messageColor};">${message}</div>`;
        
        // Mostrar condición de victoria general
        resultsHTML += `<div style="font-size: 1.5rem; margin-bottom: 1rem; color: #FFD700;">${winCondition}</div>`;
        
        resultsHTML += '<div style="font-size: 1.2rem; color: #fff; text-align: left; max-width: 400px;">';
        resultsHTML += '<h3 style="color: #4ecdc4; margin-bottom: 1rem;">📊 Resultados Survivors:</h3>';
        
        survivors.forEach(survivor => {
            const status = survivor.escaped ? '✅ ESCAPÓ' : '💀 MURIÓ';
            const color = survivor.escaped ? '#00FF00' : '#FF0000';
            resultsHTML += `<div style="color: ${color}; margin: 5px 0;">🛡️ ${survivor.name}: ${status}</div>`;
        });
        
        resultsHTML += '</div>';
        
        const victoryDiv = document.createElement('div');
        victoryDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: #FFD700;
            font-weight: bold;
            text-align: center;
        `;
        
        victoryDiv.innerHTML = resultsHTML + 
            '<div style="font-size: 1rem; margin-top: 2rem; color: #fff;">Volviendo al lobby en 10 segundos...</div>';
        
        document.body.appendChild(victoryDiv);
        
        setTimeout(() => {
            document.body.removeChild(victoryDiv);
            this.resetGame();
        }, 10000);
    }

    resetGame() {
        // Limpiar jugadores antiguos
        this.clearOldPlayers();
        
        const config = window.GAME_CONFIG || {};
        this.gameTimer = config.GAME_TIMER || 180;
        this.lastManStanding = false;
        this.lmsActivated = false;
        this.particles = [];
        this.hitboxes = [];
        this.countdownActive = false;
        this.lobbyCountdown = 0;
        
        // Detener música de LMS
        this.stopLMSMusic();
        
        document.getElementById('lobby').classList.add('active');
        document.getElementById('game').classList.remove('active');
        
        this.gameTimerPaused = false;
        this.pausedTimer = 0;
        this.rageUsed = false;
    }

    activateSharpWings(player) {
        player.sharpWingsActive = true;
        player.sharpWingsTimer = 300;
        player.sharpWingsHit = false;
        player.stunHits = 0;
        
        this.createParticles(player.x + 15, player.y + 15, '#FF69B4', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'sharp_wings_activate',
                playerId: player.id
            });
        }
    }

    updateSharpWings() {
        Object.values(this.players).forEach(player => {
            if (player.sharpWingsActive) {
                player.sharpWingsTimer--;
                
                // Verificar colisión con killers
                const nearbyKillers = Object.values(this.players).filter(target => 
                    target.role === 'killer' && target.alive && target.id !== player.id
                );
                
                nearbyKillers.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 40 && !player.sharpWingsHit) {
                        player.sharpWingsHit = true;
                        player.sharpWingsActive = false;
                        player.stunHits = (player.stunHits || 0) + 1;
                        
                        // Aplicar stun y knockback (solo si no está en rage mode)
                        if (!(target.rageMode && target.rageMode.active)) {
                            const stunDuration = player.stunHits >= 3 ? 180 : 90;
                            target.stunned = true;
                            target.stunTimer = stunDuration;
                            
                            // Ganar rage por ser stuneado
                            if (target.role === 'killer' && !target.rageUsed) {
                                target.rageLevel = Math.min(target.maxRage, target.rageLevel + 30);
                            }
                        }
                        
                        // Knockback
                        const angle = Math.atan2(target.y - player.y, target.x - player.x);
                        const knockback = 80;
                        const newX = Math.max(0, Math.min(this.worldSize.width - 30, 
                            target.x + Math.cos(angle) * knockback));
                        const newY = Math.max(0, Math.min(this.worldSize.height - 30, 
                            target.y + Math.sin(angle) * knockback));
                        
                        target.x = newX;
                        target.y = newY;
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendPlayerMove(newX, newY);
                            this.supabaseGame.sendAttack({
                                type: 'stun',
                                targetId: target.id,
                                stunDuration: stunDuration,
                                stunHits: player.stunHits,
                                knockbackX: newX,
                                knockbackY: newY
                            });
                        }
                        
                        this.createParticles(target.x + 15, target.y + 15, '#FF69B4', 15);
                    }
                });
                
                if (player.sharpWingsTimer <= 0) {
                    player.sharpWingsActive = false;
                }
            }
            
            // Actualizar stun
            if (player.stunned) {
                player.stunTimer--;
                
                // Ganar rage mientras está stuneado (1% por frame = 5 rage)
                if (player.role === 'killer' && !player.rageUsed && player.rageLevel < player.maxRage) {
                    player.rageLevel = Math.min(player.maxRage, player.rageLevel + 5);
                }
                
                if (player.stunTimer <= 0) {
                    player.stunned = false;
                }
            }
        });
    }
    
    updateYouCantRun() {
        Object.values(this.players).forEach(player => {
            if (player.youCantRunActive) {
                player.youCantRunTimer--;
                
                // Verificar colisión con survivors
                const nearbyTargets = Object.values(this.players).filter(target => 
                    target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
                );
                
                nearbyTargets.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 50 && !player.youCantRunHit) {
                        player.youCantRunHit = true;
                        player.youCantRunActive = false;
                        
                        // Aplicar daño y efectos
                        let damage = 25;
                        if (player.rageMode && player.rageMode.active) {
                            damage = Math.floor(damage * 1.5); // Rage mode bonus
                        }
                        
                        target.health = Math.max(0, target.health - damage);
                        this.createParticles(target.x + 15, target.y + 15, '#8B0000', 15);
                        this.triggerJumpscare(target.id);
                        
                        // Cancelar auto repair
                        if (target.autoRepairing) {
                            target.autoRepairing = false;
                            target.autoRepairTimer = 0;
                        }
                        
                        if (target.health <= 0) {
                            if (target.lastLife || target.character === 'iA777') {
                                target.alive = false;
                                target.spectating = true;
                                this.playDeathSound();
                            } else {
                                target.alive = false;
                                target.downed = true;
                                target.reviveTimer = 1200;
                                target.beingRevived = false;
                            }
                        }
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'damage',
                                targetId: target.id,
                                health: target.health,
                                alive: target.health > 0,
                                downed: target.health <= 0 && !target.lastLife && target.character !== 'iA777',
                                spectating: target.health <= 0 && (target.lastLife || target.character === 'iA777'),
                                damage: damage,
                                attackerId: player.id,
                                attackType: 'you_cant_run'
                            });
                        }
                        
                        // Mostrar indicador de daño local
                        this.showDamageIndicator(target, damage, 'you_cant_run');
                    }
                });
                
                if (player.youCantRunTimer <= 0) {
                    player.youCantRunActive = false;
                }
            }
        });
    }

    updateCharge() {
        Object.values(this.players).forEach(player => {
            if (player.charging) {
                player.chargeTimer--;
                
                // Si no ha agarrado a nadie, buscar killers cercanos
                if (!player.grabbedKiller) {
                    const nearbyKillers = Object.values(this.players).filter(target => 
                        target.role === 'killer' && target.alive && target.id !== player.id
                    );
                    
                    nearbyKillers.forEach(target => {
                        const distance = Math.sqrt(
                            Math.pow(target.x - player.x, 2) + 
                            Math.pow(target.y - player.y, 2)
                        );
                        
                        if (distance < 40 && !player.chargeHit) {
                            // Agarrar al killer
                            player.chargeHit = true;
                            player.grabbedKiller = target.id;
                            player.chargeStunned = true;
                            
                            // Stunear al killer por 7 segundos (solo si no está en rage mode)
                            if (!(target.rageMode && target.rageMode.active)) {
                                target.stunned = true;
                                target.stunTimer = 420;
                                
                                // Ganar rage por ser stuneado
                                if (target.role === 'killer' && !target.rageUsed) {
                                    target.rageLevel = Math.min(target.maxRage, target.rageLevel + 30);
                                }
                            }
                            target.grabbedBy = player.id;
                            
                            this.createParticles(target.x + 15, target.y + 15, '#00FFFF', 20);
                            
                            if (this.supabaseGame) {
                                this.supabaseGame.sendAttack({
                                    type: 'charge_grab',
                                    playerId: player.id,
                                    targetId: target.id
                                });
                            }
                        }
                    });
                }
                
                // Si está agarrando a un killer, perder HP cada segundo
                if (player.grabbedKiller && player.chargeStunned) {
                    if (player.chargeTimer % 60 === 0 && player.id === this.myPlayerId) {
                        player.health = Math.max(0, player.health - 4);
                        this.createParticles(player.x + 15, player.y + 15, '#FF0000', 8);
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'damage',
                                targetId: player.id,
                                health: player.health,
                                alive: player.health > 0
                            });
                        }
                    }
                }
                
                // Verificar colisión con paredes (bordes del mundo)
                if (player.grabbedKiller) {
                    const margin = 50;
                    if (player.x <= margin || player.x >= this.worldSize.width - margin - 30 ||
                        player.y <= margin || player.y >= this.worldSize.height - margin - 30) {
                        // Chocó con pared, quedarse parado por 1 segundo
                        player.wallStunned = true;
                        player.wallStunTimer = 60;
                        player.charging = false;
                        player.grabbedKiller = null;
                        player.chargeStunned = false;
                        
                        // Liberar al killer
                        const killer = this.players[player.grabbedKiller];
                        if (killer) {
                            killer.grabbedBy = null;
                        }
                        
                        this.createParticles(player.x + 15, player.y + 15, '#8B4513', 15);
                    }
                }
                
                // Terminar carga después de 7 segundos
                if (player.chargeTimer <= 0) {
                    player.charging = false;
                    player.grabbedKiller = null;
                    player.chargeStunned = false;
                    
                    // Resetear objetivo de carga en móvil
                    if (player.id === this.myPlayerId && this.isMobile()) {
                        this.chargeTarget = null;
                    }
                    
                    // Liberar killer si estaba agarrado
                    Object.values(this.players).forEach(killer => {
                        if (killer.grabbedBy === player.id) {
                            killer.grabbedBy = null;
                        }
                    });
                }
            }
            
            // Actualizar wall stun
            if (player.wallStunned) {
                player.wallStunTimer--;
                if (player.wallStunTimer <= 0) {
                    player.wallStunned = false;
                }
            }
        });
    }

    updateAutoRepair() {
        Object.values(this.players).forEach(player => {
            if (player.autoRepairing) {
                player.autoRepairTimer--;
                player.autoRepairTick++;
                
                // Regenerar 5 HP cada 180 frames (3 segundos) - curación completa para iA777 en LMS
                if (player.autoRepairTick >= 180 && player.id === this.myPlayerId) {
                    const maxHealHealth = (player.character === 'iA777' && this.lastManStanding) ? player.maxHealth : Math.min(100, player.maxHealth);
                    if (player.health < maxHealHealth) {
                        player.health = Math.min(maxHealHealth, player.health + 5);
                        this.createParticles(player.x + 15, player.y + 15, '#00FF00', 8);
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'heal',
                                targetId: player.id,
                                health: player.health
                            });
                        }
                    }
                    player.autoRepairTick = 0;
                }
                
                // Terminar después de 20 segundos
                if (player.autoRepairTimer <= 0) {
                    player.autoRepairing = false;
                }
            }
        });
    }

    updateLunaAbilities() {
        Object.values(this.players).forEach(player => {
            // Energy Juice
            if (player.energyJuiceActive) {
                player.energyJuiceTimer--;
                if (player.energyJuiceTimer <= 0) {
                    player.energyJuiceActive = false;
                    player.speedBoost = false;
                }
            }
            
            // Punch
            if (player.punchActive) {
                player.punchTimer--;
                
                const nearbyKillers = Object.values(this.players).filter(target => 
                    target.role === 'killer' && target.alive && target.id !== player.id
                );
                
                nearbyKillers.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 40 && !player.punchHit) {
                        player.punchHit = true;
                        player.punchActive = false;
                        
                        // Incrementar contador de stuneos
                        player.punchStuns = (player.punchStuns || 0) + 1;
                        
                        // Daño base 20, mayor si ha stuneado 3 veces, boost en LMS
                        let damage = player.punchStuns >= 3 ? 35 : 20;
                        if (player.lmsPunchBoost) {
                            damage += 15; // +15 daño en LMS
                        }
                        
                        // Aplicar resistencia si está activa
                        if (player.resistanceActive) {
                            damage = Math.floor(damage * 0.7); // 30% menos daño
                        }
                        
                        target.health = Math.max(0, target.health - damage);
                        
                        // Stun duration (solo si no está en rage mode)
                        if (!(target.rageMode && target.rageMode.active)) {
                            let stunDuration = player.resistanceActive ? 180 : 240; // 3s o 4s
                            if (player.lmsPunchBoost) {
                                stunDuration += 60; // +1s stun en LMS
                            }
                            target.stunned = true;
                            target.stunTimer = stunDuration;
                            
                            // Ganar rage por ser stuneado
                            if (target.role === 'killer' && !target.rageUsed) {
                                target.rageLevel = Math.min(target.maxRage, target.rageLevel + 30);
                            }
                        }
                        
                        // Ganar vida por acertar (más en LMS)
                        if (player.id === this.myPlayerId) {
                            const healAmount = player.lmsPunchBoost ? 25 : 15;
                            player.health = Math.min(player.maxHealth, player.health + healAmount);
                            
                            // Activar resistencia si llega a 30 HP
                            if (player.health >= 30 && !player.resistanceActive) {
                                player.resistanceActive = true;
                                this.createParticles(player.x + 15, player.y + 15, '#9370DB', 20);
                            }
                        }
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'punch_hit',
                                targetId: target.id,
                                damage: damage,
                                stunDuration: stunDuration,
                                puncherId: player.id,
                                puncherHealth: player.health
                            });
                        }
                        
                        this.createParticles(target.x + 15, target.y + 15, '#FFD700', 15);
                    }
                });
                
                if (player.punchTimer <= 0) {
                    player.punchActive = false;
                }
            }
            
            // Taunt
            if (player.tauntActive) {
                player.tauntTimer--;
                
                const nearbyKillers = Object.values(this.players).filter(target => 
                    target.role === 'killer' && target.alive && target.id !== player.id
                );
                
                nearbyKillers.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 60 && !player.tauntHit) {
                        player.tauntHit = true;
                        player.tauntActive = false;
                        
                        // Aplicar efecto de pantalla nublada
                        target.screenBlurred = true;
                        target.blurTimer = 300; // 5 segundos
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'taunt_hit',
                                targetId: target.id,
                                blurDuration: 300
                            });
                        }
                        
                        this.createParticles(target.x + 15, target.y + 15, '#FF69B4', 20);
                    }
                });
                
                if (player.tauntTimer <= 0) {
                    player.tauntActive = false;
                }
            }
            
            // Actualizar blur
            if (player.screenBlurred) {
                player.blurTimer--;
                if (player.blurTimer <= 0) {
                    player.screenBlurred = false;
                }
            }
        });
    }
    
    updateAngelAbilities() {
        Object.values(this.players).forEach(player => {
            // Fatiga
            if (player.fatigued) {
                player.fatigueTimer--;
                if (player.fatigueTimer <= 0) {
                    player.fatigued = false;
                }
            }
            
            // Bendición angelical
            if (player.angelBlessing) {
                player.blessingTimer--;
                if (player.blessingTimer <= 0) {
                    player.angelBlessing = false;
                }
            }
            
            // Speed boost angelical
            if (player.angelSpeedBoost) {
                player.speedBoostTimer--;
                if (player.speedBoostTimer <= 0) {
                    player.angelSpeedBoost = false;
                }
            }
            
            // Dash protector
            if (player.dashActive) {
                player.dashTimer--;
                if (player.dashTimer <= 0) {
                    player.dashActive = false;
                    player.dashProtection = false;
                }
            }
            
            // Descanso (curación)
            if (player.restActive) {
                player.restTimer--;
                player.restTick++;
                
                // Curar cada 60 frames (1 segundo)
                if (player.restTick >= 60) {
                    // Curar a sí mismo (mejorado + LMS)
                    if (player.id === this.myPlayerId && player.health < player.maxHealth) {
                        const healAmount = player.lmsHealBoost ? 6 : 3; // 6 HP/s en LMS
                        player.health = Math.min(player.maxHealth, player.health + healAmount);
                        this.createParticles(player.x + 15, player.y + 15, '#98FB98', player.lmsHealBoost ? 8 : 5);
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'heal',
                                targetId: player.id,
                                health: player.health
                            });
                        }
                    }
                    
                    // Curar a aliados cercanos
                    const nearbySurvivors = Object.values(this.players).filter(target => 
                        target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
                    );
                    
                    nearbySurvivors.forEach(target => {
                        const distance = Math.sqrt(
                            Math.pow(target.x - player.x, 2) + 
                            Math.pow(target.y - player.y, 2)
                        );
                        
                        if (distance < 120 && target.health < target.maxHealth) { // Mayor rango
                            const healAmount = target.angelBlessing ? 8 : 6; // Más curación
                            target.health = Math.min(target.maxHealth, target.health + healAmount);
                            this.createParticles(target.x + 15, target.y + 15, '#98FB98', 3);
                            
                            if (this.supabaseGame) {
                                this.supabaseGame.sendAttack({
                                    type: 'heal',
                                    targetId: target.id,
                                    health: target.health
                                });
                            }
                        }
                    });
                    
                    player.restTick = 0;
                }
                
                if (player.restTimer <= 0) {
                    player.restActive = false;
                }
            }
        });
    }
    
    updateSelfDestruct() {
        Object.values(this.players).forEach(player => {
            // Activar canSelfDestruct cuando la vida baje a 50 o menos
            if (player.character === 'iA777' && player.health <= 50 && !player.canSelfDestruct) {
                player.canSelfDestruct = true;
            }
            
            if (player.sierraActive) {
                player.sierraTimer--;
                
                // Verificar colisión con killers durante el dash
                const nearbyKillers = Object.values(this.players).filter(target => 
                    target.role === 'killer' && target.alive && target.id !== player.id
                );
                
                nearbyKillers.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 50 && !player.sierraHit) {
                        player.sierraHit = true;
                        
                        // Stun por 5-7 segundos y empuje (más en LMS) - solo si no está en rage mode
                        if (!(target.rageMode && target.rageMode.active)) {
                            const stunDuration = this.lastManStanding ? 420 : 300; // 7s en LMS, 5s normal
                            target.stunned = true;
                            target.stunTimer = stunDuration;
                            
                            // Ganar rage por ser stuneado
                            if (target.role === 'killer' && !target.rageUsed) {
                                target.rageLevel = Math.min(target.maxRage, target.rageLevel + 100);
                            }
                        }
                        
                        // Empuje para alejar al killer
                        const angle = Math.atan2(target.y - player.y, target.x - player.x);
                        const pushDistance = 120;
                        const newX = Math.max(0, Math.min(this.worldSize.width - 30, 
                            target.x + Math.cos(angle) * pushDistance));
                        const newY = Math.max(0, Math.min(this.worldSize.height - 30, 
                            target.y + Math.sin(angle) * pushDistance));
                        
                        target.x = newX;
                        target.y = newY;
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendPlayerMove(newX, newY);
                            this.supabaseGame.sendAttack({
                                type: 'sierra_hit',
                                targetId: target.id,
                                stunDuration: 300,
                                knockbackX: newX,
                                knockbackY: newY
                            });
                        }
                        
                        this.createParticles(target.x + 15, target.y + 15, '#FF0000', 25);
                    }
                });
                
                if (player.sierraTimer <= 0) {
                    player.sierraActive = false;
                    player.sierraFlash = false;
                }
            }
        });
    }

    updateReviveSystem() {
        Object.values(this.players).forEach(player => {
            if (player.downed && player.reviveTimer > 0) {
                player.reviveTimer--;
                
                if (player.reviveTimer <= 0) {
                    player.downed = false;
                    player.spectating = true;
                    this.playDeathSound();
                }
                
                // Verificar si otro survivor está cerca para revivir
                if (!player.beingRevived) {
                    const nearbyReviver = Object.values(this.players).find(other => 
                        other.id !== player.id && 
                        other.role === 'survivor' && 
                        other.alive && 
                        !other.downed &&
                        Math.sqrt(Math.pow(other.x - player.x, 2) + Math.pow(other.y - player.y, 2)) < 50
                    );
                    
                    if (nearbyReviver && nearbyReviver.id === this.myPlayerId) {
                        this.showRevivePrompt = player.id;
                    }
                } else {
                    player.reviveProgress = (player.reviveProgress || 0) + 1;
                    if (player.reviveProgress >= 180) { // 3 segundos
                        player.alive = true;
                        player.downed = false;
                        player.beingRevived = false;
                        player.health = 60;
                        player.lastLife = true;
                        player.reviveProgress = 0;
                        
                        if (this.supabaseGame) {
                            this.supabaseGame.sendAttack({
                                type: 'revive',
                                targetId: player.id,
                                health: 60
                            });
                        }
                    }
                }
            }
        });
    }

    updateGameTimer() {
        if (!this.gameTimerPaused && this.gameTimer > 0) {
            if (this.lastManStanding && this.lmsMusic && this.lmsMusicStartTime) {
                const elapsed = (Date.now() - this.lmsMusicStartTime) / 1000;
                const remaining = Math.max(0, (this.lmsMusicDuration || 210) - elapsed);
                this.gameTimer = Math.ceil(remaining);
            } else {
                // Usar tiempo real basado en timestamp de inicio
                if (this.gameStartTime) {
                    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
                    const config = window.GAME_CONFIG || {};
                    const totalTime = config.GAME_TIMER || 180;
                    this.gameTimer = Math.max(0, totalTime - elapsed);
                    
                    // Mostrar anillo de escape a los 80 segundos (1:20)
                    if (this.gameTimer === 80 && !this.escapeRing && !this.lastManStanding) {
                        this.showEscapeRing();
                    }
                }
            }
        }
    }

    generateDiscordServerMap() {
        this.mapObjects = [];
        this.escapeRing = null;
        
        // Forest themed objects
        for (let i = 0; i < 40; i++) {
            this.mapObjects.push({
                type: 'tree',
                x: Math.random() * (this.worldSize.width - 80) + 40,
                y: Math.random() * (this.worldSize.height - 80) + 40,
                size: 60 + Math.random() * 40
            });
        }
        
        for (let i = 0; i < 25; i++) {
            this.mapObjects.push({
                type: 'bush',
                x: Math.random() * (this.worldSize.width - 40) + 20,
                y: Math.random() * (this.worldSize.height - 40) + 20,
                size: 30 + Math.random() * 20
            });
        }
        
        for (let i = 0; i < 15; i++) {
            this.mapObjects.push({
                type: 'rock',
                x: Math.random() * (this.worldSize.width - 50) + 25,
                y: Math.random() * (this.worldSize.height - 50) + 25,
                size: 35 + Math.random() * 25
            });
        }
    }

    startGameLoop() {
        const gameLoop = () => {
            if (this.gameStarted && this.canvas) {
                this.updateMovement();
                this.updateRemotePlayerInterpolation();
                this.updateCamera();
                this.updateCooldowns();
                this.updateParticles();
                this.updateHitboxes();
                this.updateStealth();
                this.updateRageMode();
                this.updateSharpWings();
                this.updateYouCantRun();
                this.updateCharge();
                this.updateAutoRepair();
                this.updateSelfDestruct();
                this.updateLunaAbilities();
                this.updateAngelAbilities();
                this.updateReviveSystem();
                this.updateGameTimer();
                this.updatePing();
                this.updateDamageIndicators();
                this.checkLMSCondition();
            }
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    updateMovement() {
        const player = this.players[this.myPlayerId];
        if (!player || (!player.alive && !player.spectating)) return;
        
        // Si está en modo espectador, permitir movimiento libre de cámara
        if (player.spectating) {
            let moved = false;
            let newX = this.camera.x;
            let newY = this.camera.y;
            
            if (this.keys['w'] || this.keys['ArrowUp']) {
                newY = Math.max(0, this.camera.y - 8);
                moved = true;
            }
            if (this.keys['s'] || this.keys['ArrowDown']) {
                newY = Math.min(this.worldSize.height - this.canvas.height, this.camera.y + 8);
                moved = true;
            }
            if (this.keys['a'] || this.keys['ArrowLeft']) {
                newX = Math.max(0, this.camera.x - 8);
                moved = true;
            }
            if (this.keys['d'] || this.keys['ArrowRight']) {
                newX = Math.min(this.worldSize.width - this.canvas.width, this.camera.x + 8);
                moved = true;
            }
            
            if (moved) {
                this.camera.x = newX;
                this.camera.y = newY;
            }
            return;
        }
        
        if (!player.alive || player.downed) return;

        let speed = player.role === 'killer' ? 6 : (player.character === 'iA777' ? 5 : 4);
        
        // Rage mode speed boost para killers
        if (player.role === 'killer' && player.rageMode && player.rageMode.active) {
            speed = 8; // Velocidad aumentada en rage mode
        }
        
        // iA777 speed boost en LMS
        if (player.character === 'iA777' && this.lastManStanding) {
            speed = 6; // Velocidad de killer en LMS
        }
        
        // Luna speed boost
        if (player.character === 'luna' && (player.speedBoost || player.lmsSpeedBoost)) {
            speed = 7; // Velocidad II
        }
        
        // Angel speed boost para aliados
        if (player.angelSpeedBoost) {
            speed = 6; // Velocidad de killer temporalmente
        }
        let moved = false;
        let newX = player.x;
        let newY = player.y;

        // You Can't Run movement override
        if (player.youCantRunActive) {
            if (this.lastMouseX && this.lastMouseY) {
                const angle = Math.atan2(this.lastMouseY - (player.y + 15), this.lastMouseX - (player.x + 15));
                const distance = Math.sqrt(
                    Math.pow(this.lastMouseX - (player.x + 15), 2) + 
                    Math.pow(this.lastMouseY - (player.y + 15), 2)
                );
                
                if (distance > 10) {
                    const moveSpeed = 8;
                    newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * moveSpeed));
                    newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * moveSpeed));
                    moved = true;
                }
            }
        } else if (player.sharpWingsActive) {
            if (this.lastMouseX && this.lastMouseY) {
                const angle = Math.atan2(this.lastMouseY - (player.y + 15), this.lastMouseX - (player.x + 15));
                const distance = Math.sqrt(
                    Math.pow(this.lastMouseX - (player.x + 15), 2) + 
                    Math.pow(this.lastMouseY - (player.y + 15), 2)
                );
                
                if (distance > 10) {
                    const moveSpeed = 6;
                    newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * moveSpeed));
                    newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * moveSpeed));
                    moved = true;
                }
            }
        } else if (player.charging && !player.wallStunned) {
            // En móvil, usar la posición del toque para dirigir la carga
            let targetX = this.lastMouseX;
            let targetY = this.lastMouseY;
            
            // Si es móvil y hay un toque activo, usar esa posición
            if (this.isMobile() && this.chargeTarget) {
                targetX = this.chargeTarget.x;
                targetY = this.chargeTarget.y;
            }
            
            if (targetX && targetY) {
                const angle = Math.atan2(targetY - (player.y + 15), targetX - (player.x + 15));
                const distance = Math.sqrt(
                    Math.pow(targetX - (player.x + 15), 2) + 
                    Math.pow(targetY - (player.y + 15), 2)
                );
                
                if (distance > 10) {
                    const moveSpeed = 7;
                    newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * moveSpeed));
                    newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * moveSpeed));
                    moved = true;
                    
                    // Si está agarrando a un killer, moverlo también
                    if (player.grabbedKiller) {
                        const killer = this.players[player.grabbedKiller];
                        if (killer) {
                            killer.x = newX;
                            killer.y = newY;
                            
                            if (this.supabaseGame && killer.id !== this.myPlayerId) {
                                this.supabaseGame.sendPlayerMove(killer.x, killer.y);
                            }
                        }
                    }
                }
            }
        } else if (!player.stunned && !player.wallStunned && !player.autoRepairing) {
            // Normal movement
            if (this.keys['w'] || this.keys['arrowup']) {
                newY = Math.max(0, player.y - speed);
                moved = true;
            }
            if (this.keys['s'] || this.keys['arrowdown']) {
                newY = Math.min(this.worldSize.height - 30, player.y + speed);
                moved = true;
            }
            if (this.keys['a'] || this.keys['arrowleft']) {
                newX = Math.max(0, player.x - speed);
                moved = true;
            }
            if (this.keys['d'] || this.keys['arrowright']) {
                newX = Math.min(this.worldSize.width - 30, player.x + speed);
                moved = true;
            }
        }

        if (moved) {
            player.x = newX;
            player.y = newY;
            
            if (this.supabaseGame && (!this.lastPositionUpdate || Date.now() - this.lastPositionUpdate > 16)) {
                this.supabaseGame.sendPlayerMove(Math.round(newX), Math.round(newY));
                this.lastPositionUpdate = Date.now();
            }
        }
    }
    
    updateRemotePlayerInterpolation() {
        Object.values(this.players).forEach(player => {
            if (player.id !== this.myPlayerId && player.interpolating) {
                const speed = 0.25; // Faster interpolation for better responsiveness
                
                player.interpolationProgress += speed;
                
                if (player.interpolationProgress >= 1) {
                    // Interpolation complete - snap to exact position
                    player.x = player.targetX;
                    player.y = player.targetY;
                    player.interpolating = false;
                } else {
                    // Linear interpolation for precision
                    const t = player.interpolationProgress;
                    player.x = player.startX + (player.targetX - player.startX) * t;
                    player.y = player.startY + (player.targetY - player.startY) * t;
                }
            }
        });
    }

    updateCamera() {
        const player = this.players[this.myPlayerId];
        if (player && this.canvas) {
            const canvasWidth = this.canvas.cssWidth || window.innerWidth;
            const canvasHeight = this.canvas.cssHeight || window.innerHeight;
            
            this.camera.x = player.x - canvasWidth / 2;
            this.camera.y = player.y - canvasHeight / 2;
            
            // Clamp camera to world bounds
            this.camera.x = Math.max(0, Math.min(Math.max(0, this.worldSize.width - canvasWidth), this.camera.x));
            this.camera.y = Math.max(0, Math.min(Math.max(0, this.worldSize.height - canvasHeight), this.camera.y));
        }
    }

    updateCooldowns() {
        const player = this.players[this.myPlayerId];
        // Cooldowns más rápidos para survivors en LMS y killers en rage mode
        let deltaTime = 16;
        if (player && this.lastManStanding) {
            if (player.character === 'iA777') {
                deltaTime = 32; // Cooldowns 2x más rápidos
            } else if (player.character === 'luna') {
                deltaTime = 24; // Cooldowns 1.5x más rápidos
            } else if (player.character === 'angel') {
                deltaTime = 28; // Cooldowns 1.75x más rápidos
            }
        }
        
        // Rage mode cooldown boost para killers
        if (player && player.role === 'killer' && player.rageMode && player.rageMode.active) {
            deltaTime = 32; // Cooldowns 2x más rápidos en rage mode
        }
        
        if (this.abilities.q.cooldown > 0) {
            this.abilities.q.cooldown = Math.max(0, this.abilities.q.cooldown - deltaTime);
            // Resetear usos de Energy Juice para Luna
            if (this.abilities.q.cooldown === 0 && this.selectedCharacter === 'luna') {
                this.abilities.q.uses = this.abilities.q.maxUses;
            }
        }
        if (this.abilities.e.cooldown > 0) {
            this.abilities.e.cooldown = Math.max(0, this.abilities.e.cooldown - deltaTime);
        }
        if (this.abilities.r.cooldown > 0) {
            this.abilities.r.cooldown = Math.max(0, this.abilities.r.cooldown - deltaTime);
        }
        if (this.abilities.basicAttack.cooldown > 0) {
            this.abilities.basicAttack.cooldown = Math.max(0, this.abilities.basicAttack.cooldown - deltaTime);
        }
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }

    updateHitboxes() {
        this.hitboxes = this.hitboxes.filter(hitbox => {
            hitbox.life--;
            
            // Mover hitboxes con velocidad
            if (hitbox.type === 'white_orb') {
                // Agregar posición actual al rastro
                hitbox.trail.push({x: hitbox.x, y: hitbox.y, alpha: 1.0});
                if (hitbox.trail.length > 8) hitbox.trail.shift();
                
                // Actualizar rastro
                hitbox.trail.forEach((point, index) => {
                    point.alpha = (index + 1) / hitbox.trail.length * 0.5;
                });
                

                
                // Mover hitbox
                hitbox.x += hitbox.vx;
                hitbox.y += hitbox.vy;
                
                // Verificar límites del mundo
                if (hitbox.x < 0 || hitbox.x > this.worldSize.width || 
                    hitbox.y < 0 || hitbox.y > this.worldSize.height) {
                    hitbox.life = 0;
                }
            }
            
            if (hitbox.life > 0) {
                this.checkHitboxCollisions(hitbox);
            }
            return hitbox.life > 0;
        });
    }

    checkHitboxCollisions(hitbox) {
        Object.values(this.players).forEach(target => {
            if (!target.alive || target.id === hitbox.ownerId) return;
            
            let collision = false;
            
            if (hitbox.type === 'basic_attack') {
                // Rectangular collision for basic attack
                collision = target.x < hitbox.x + hitbox.width &&
                           target.x + 30 > hitbox.x &&
                           target.y < hitbox.y + hitbox.height &&
                           target.y + 30 > hitbox.y;
            } else {
                // Circular collision for other attacks
                const distance = Math.sqrt(
                    Math.pow(target.x + 15 - hitbox.x, 2) + 
                    Math.pow(target.y + 15 - hitbox.y, 2)
                );
                collision = distance <= hitbox.radius;
            }
            
            if (collision) {
                // Aplicar efectos a todos los jugadores, no solo al local
                this.applyHitboxEffect(hitbox, target);
                hitbox.life = 0;
            }
        });
    }

    applyHitboxEffect(hitbox, target) {
        if (hitbox.type === 'you_cant_run' && target.role === 'survivor' && !hitbox.hasHit) {
            target.health = Math.max(0, target.health - 25);
            this.createParticles(target.x + 15, target.y + 15, '#8B0000', 15);
            this.triggerJumpscare(target.id);
            
            hitbox.hasHit = true;
            hitbox.life = 0;
            
            // Cancelar auto repair
            if (target.autoRepairing) {
                target.autoRepairing = false;
                target.autoRepairTimer = 0;
            }
            
            if (target.health <= 0) {
                if (target.lastLife || target.character === 'iA777') {
                    target.alive = false;
                    target.spectating = true;
                    this.playDeathSound();
                } else {
                    target.alive = false;
                    target.downed = true;
                    target.reviveTimer = 1200;
                    target.beingRevived = false;
                }
            }
            
            if (this.supabaseGame) {
                this.supabaseGame.sendAttack({
                    type: 'damage',
                    targetId: target.id,
                    health: target.health,
                    alive: target.health > 0,
                    downed: target.health <= 0 && !target.lastLife && target.character !== 'iA777',
                    spectating: target.health <= 0 && (target.lastLife || target.character === 'iA777'),
                    damage: 25,
                    attackerId: hitbox.ownerId,
                    attackType: 'you_cant_run'
                });
            }
            
            // Mostrar indicador de daño local
            this.showDamageIndicator(target, 25, 'you_cant_run');
        } else if (hitbox.type === 'basic_attack' && target.role === 'survivor') {
            const attacker = this.players[hitbox.ownerId];
            let damage = 30;
            
            if (attacker && attacker.stealthMode && attacker.stealthHits < attacker.maxStealthHits) {
                damage = 50;
                attacker.stealthHits++;
                
                if (attacker.stealthHits >= attacker.maxStealthHits) {
                    attacker.stealthMode = false;
                    attacker.criticalStrike = false;
                }
                
                this.createParticles(target.x + 15, target.y + 15, '#FFD700', 20);
            } else {
                this.createParticles(target.x + 15, target.y + 15, '#FF0000', 12);
            }
            
            // Aplicar rage mode damage boost
            if (attacker && attacker.rageMode && attacker.rageMode.active) {
                damage = Math.floor(damage * 1.5); // 50% más daño en rage mode
            }
            
            // Aplicar resistencia de LMS
            if (target.character === 'luna' && target.lmsResistance) {
                damage = Math.floor(damage * 0.8); // 20% menos daño
            } else if (target.character === 'iA777' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75); // 25% menos daño
            } else if (target.character === 'angel' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75); // 25% menos daño
            }
            
            target.health = Math.max(0, target.health - damage);
            
            // Cancelar auto repair
            if (target.autoRepairing) {
                target.autoRepairing = false;
                target.autoRepairTimer = 0;
            }
            
            if (target.health <= 0) {
                if (target.lastLife || target.character === 'iA777') {
                    target.alive = false;
                    target.spectating = true;
                    this.playDeathSound();
                } else {
                    target.alive = false;
                    target.downed = true;
                    target.reviveTimer = 1200;
                    target.beingRevived = false;
                }
            }
            
            if (this.supabaseGame) {
                this.supabaseGame.sendAttack({
                    type: 'damage',
                    targetId: target.id,
                    health: target.health,
                    alive: target.health > 0,
                    downed: target.health <= 0 && !target.lastLife && target.character !== 'iA777',
                    spectating: target.health <= 0 && (target.lastLife || target.character === 'iA777'),
                    damage: damage,
                    attackerId: hitbox.ownerId,
                    attackType: 'basic_attack'
                });
            }
            
            // Mostrar indicador de daño local
            this.showDamageIndicator(target, damage, 'basic_attack');
        } else if (hitbox.type === 'white_orb' && target.role === 'survivor' && !hitbox.hasHit) {
            const attacker = this.players[hitbox.ownerId];
            let damage = 40;
            
            // Aplicar rage mode damage boost
            if (attacker && attacker.rageMode && attacker.rageMode.active) {
                damage = Math.floor(damage * 1.5); // 50% más daño en rage mode
            }
            
            // Aplicar resistencia de LMS
            if (target.character === 'luna' && target.lmsResistance) {
                damage = Math.floor(damage * 0.8); // 20% menos daño
            } else if (target.character === 'iA777' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75); // 25% menos daño
            } else if (target.character === 'angel' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75); // 25% menos daño
            }
            
            target.health = Math.max(0, target.health - damage);
            hitbox.hasHit = true;
            
            const knockback = 100;
            const angle = Math.atan2(hitbox.vy, hitbox.vx);
            const newX = Math.max(0, Math.min(this.worldSize.width - 30, 
                target.x + Math.cos(angle) * knockback));
            const newY = Math.max(0, Math.min(this.worldSize.height - 30, 
                target.y + Math.sin(angle) * knockback));
            
            target.x = newX;
            target.y = newY;
            
            // Cancelar auto repair
            if (target.autoRepairing) {
                target.autoRepairing = false;
                target.autoRepairTimer = 0;
            }
            
            if (target.health <= 0) {
                if (target.lastLife || target.character === 'iA777') {
                    target.alive = false;
                    target.spectating = true;
                    this.playDeathSound();
                } else {
                    target.alive = false;
                    target.downed = true;
                    target.reviveTimer = 1200;
                    target.beingRevived = false;
                }
            }
            
            if (this.supabaseGame) {
                this.supabaseGame.sendPlayerMove(newX, newY);
                this.supabaseGame.sendAttack({
                    type: 'damage',
                    targetId: target.id,
                    health: target.health,
                    alive: target.health > 0,
                    downed: target.health <= 0 && !target.lastLife && target.character !== 'iA777',
                    spectating: target.health <= 0 && (target.lastLife || target.character === 'iA777'),
                    damage: damage,
                    attackerId: hitbox.ownerId,
                    attackType: 'white_orb',
                    knockbackX: newX,
                    knockbackY: newY
                });
            }
            
            // Mostrar indicador de daño local
            this.showDamageIndicator(target, damage, 'white_orb');
            
            this.createParticles(target.x + 15, target.y + 15, '#FF8000', 15);
            hitbox.life = 0;
        }
    }

    createParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: color,
                life: 30 + Math.random() * 30,
                maxLife: 60,
                alpha: 1
            });
        }
    }

    useAbility(ability) {
        const player = this.players[this.myPlayerId];
        if (!player || !player.alive) return;
        
        const abilityData = this.abilities[ability];
        if (abilityData.cooldown > 0) return;

        abilityData.cooldown = abilityData.maxCooldown;

        if (player.character === '2019x') {
            if (ability === 'q') {
                // Sigilo - Invisibilidad + daño crítico
                this.activateStealth(player);
            } else if (ability === 'e') {
                // You Can't Run - Dash hacia survivor más cercano
                this.youCantRun(player);
            } else if (ability === 'r') {
                // Orbe de Daño
                this.launchDamageOrb(player);
            }
        } else if (player.character === 'gissel') {
            if (ability === 'q') {
                this.activateSharpWings(player);
            }
        } else if (player.character === 'iA777') {
            if (ability === 'q') {
                this.activateCharge(player);
            } else if (ability === 'e') {
                this.activateAutoRepair(player);
            } else if (ability === 'r') {
                if (this.lastManStanding) {
                    this.activateSierra(player);
                } else if (player.health <= 50 || player.canSelfDestruct) {
                    // Autodestrucción no tiene cooldown
                    abilityData.cooldown = 0;
                    this.activateSelfDestruct(player);
                }
            }
        } else if (player.character === 'luna') {
            if (ability === 'q' && abilityData.uses > 0) {
                this.activateEnergyJuice(player);
                abilityData.uses--;
                if (abilityData.uses <= 0) {
                    abilityData.cooldown = abilityData.maxCooldown;
                } else {
                    abilityData.cooldown = 0; // No cooldown si aún tiene usos
                }
            } else if (ability === 'e') {
                this.activatePunch(player);
            } else if (ability === 'r') {
                this.activateTaunt(player);
            }
        } else if (player.character === 'angel') {
            if (ability === 'q') {
                this.activateAngelicSacrifice(player);
            } else if (ability === 'e') {
                this.activateProtectiveDash(player);
            } else if (ability === 'r') {
                this.activateRest(player);
            }
        }
    }

    youCantRun(killer) {
        killer.youCantRunActive = true;
        killer.youCantRunTimer = 300;
        killer.youCantRunHit = false;
        
        this.createParticles(killer.x + 15, killer.y + 15, '#8B0000', 20);
        
        // Sync with Supabase
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'you_cant_run_activate',
                playerId: killer.id
            });
        }
    }

    triggerJumpscare(targetPlayerId) {
        // Solo mostrar jumpscare al jugador objetivo
        if (targetPlayerId === this.myPlayerId) {
            this.showJumpscare();
        }
    }

    showJumpscare() {
        // Crear overlay de jumpscare
        const jumpscareDiv = document.createElement('div');
        jumpscareDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            animation: jumpscareFlash 0.5s ease-out;
        `;
        
        jumpscareDiv.innerHTML = `
            <div style="font-size: 8rem; color: #FF0000; text-shadow: 0 0 50px #FF0000; animation: shake 0.5s infinite;">
                👹
            </div>
            <div style="font-size: 4rem; color: #FF0000; font-weight: bold; text-shadow: 0 0 30px #FF0000; margin-top: 2rem; animation: glow 0.3s infinite alternate;">
                I AM GOD
            </div>
        `;
        
        // Añadir animaciones CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes jumpscareFlash {
                0% { opacity: 0; transform: scale(0.5); }
                50% { opacity: 1; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            @keyframes glow {
                from { text-shadow: 0 0 30px #FF0000; }
                to { text-shadow: 0 0 50px #FF0000, 0 0 70px #FF0000; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(jumpscareDiv);
        
        // Reproducir sonido de jumpscare (opcional)
        try {
            const audio = new Audio();
            audio.volume = 0.7;
            // Usar un sonido de jumpscare si tienes uno
            // audio.src = 'assets/jumpscare.mp3';
            // audio.play();
        } catch (e) {
            console.log('No jumpscare sound available');
        }
        
        // Remover jumpscare después de 1.5 segundos
        setTimeout(() => {
            document.body.removeChild(jumpscareDiv);
            document.head.removeChild(style);
        }, 1500);
    }

    activateStealth(killer) {
        killer.stealthMode = true;
        killer.stealthTimer = 480;
        killer.criticalStrike = true;
        killer.stealthHits = 0;
        killer.maxStealthHits = 3;
        
        this.createParticles(killer.x + 15, killer.y + 15, '#2C2C2C', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'stealth_activate',
                playerId: killer.id,
                stealthMode: true,
                criticalStrike: true
            });
        }
    }

    launchDamageOrb(killer) {
        const survivors = Object.values(this.players).filter(p => 
            p.role === 'survivor' && p.alive && p.id !== killer.id && !p.downed
        );
        
        if (survivors.length === 0) return;
        
        let closestSurvivor = null;
        let minDistance = Infinity;
        
        survivors.forEach(survivor => {
            const distance = Math.sqrt(
                Math.pow(killer.x - survivor.x, 2) + 
                Math.pow(killer.y - survivor.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestSurvivor = survivor;
            }
        });
        
        if (!closestSurvivor) return;
        
        const angle = Math.atan2(closestSurvivor.y - killer.y, closestSurvivor.x - killer.x);
        const speed = 12; // Velocidad más lenta para que sea esquivable
        
        const orbData = {
            type: 'white_orb',
            x: killer.x + 15,
            y: killer.y + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 25,
            life: 180, // Más duración
            maxLife: 180,
            ownerId: killer.id,
            color: '#FFFFFF',
            trail: [],
            hasHit: false
        };
        
        this.hitboxes.push(orbData);
        this.createParticles(killer.x + 15, killer.y + 15, '#FFFFFF', 12);
        
        // Sincronizar orbe con otros jugadores
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'white_orb',
                attackData: orbData,
                playerId: killer.id
            });
        }
    }

    activateRageMode() {
        const player = this.players[this.myPlayerId];
        if (!player || !player.alive || player.role !== 'killer') return;
        if (player.rageLevel < player.maxRage || player.rageMode.active || player.rageUsed) return;
        if (this.lastManStanding) return; // Deshabilitado en LMS
        
        // Activar Rage Mode
        player.rageMode = { active: true, timer: 5400 }; // 1:30 minutos
        player.rageLevel = 0;
        player.rageUsed = true; // Solo se puede usar una vez
        
        // Bonuses durante rage mode:
        // - Velocidad aumentada (8 en lugar de 6)
        // - Cooldowns reducidos a la mitad
        // - Daño aumentado 50%
        // - Inmunidad a stuns
        
        // Efectos visuales
        this.createParticles(player.x + 15, player.y + 15, '#FF4500', 30);
        
        // Sync with Supabase
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'rage_mode',
                playerId: player.id,
                rageMode: player.rageMode
            });
        }
    }

    render() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas with forest background
        this.ctx.fillStyle = '#1B4332';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameStarted) {
            // Show lobby screen
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Discord Friends Game', this.canvas.width/2, this.canvas.height/2);
            return;
        }
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw world border
        this.ctx.strokeStyle = '#7289DA';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.worldSize.width, this.worldSize.height);
        
        // Draw map objects
        this.drawMapObjects();
        
        // Draw players
        Object.values(this.players).forEach(player => {
            this.drawPlayer(player);
        });
        
        this.renderParticles();
        this.drawHitboxes();
        
        this.ctx.restore();
        
        this.drawUI();
        this.drawEscapeRing();
        this.drawDamageIndicators();
        this.drawHitConfirmation();
        
        // Update mobile controls UI
        const player = this.players[this.myPlayerId];
        if (player && this.isMobile()) {
            this.updateMobileControlsUI(player);
            this.drawVirtualJoystick();
        }
    }
    
    isMobile() {
        const isTouchDevice = 'ontouchstart' in window;
        const isSmallScreen = Math.min(screen.width, screen.height) <= 1024;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        return isTouchDevice || isSmallScreen || isMobileUA;
    }

    drawHitboxes() {
        this.hitboxes.forEach(hitbox => {
            if (hitbox.type === 'white_orb') {
                // Dibujar rastro
                if (hitbox.trail) {
                    hitbox.trail.forEach(point => {
                        this.ctx.save();
                        this.ctx.globalAlpha = point.alpha;
                        this.ctx.fillStyle = hitbox.color;
                        this.ctx.beginPath();
                        this.ctx.arc(point.x, point.y, hitbox.radius * 0.6, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    });
                }
                
                // Dibujar hitbox principal con glow
                this.ctx.save();
                this.ctx.shadowColor = hitbox.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = hitbox.color;
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Núcleo brillante
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.arc(hitbox.x, hitbox.y, hitbox.radius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            } else if (hitbox.type === 'basic_attack') {
                // Hitbox rectangular para ataque básico
                const alpha = Math.min(0.5, hitbox.life / 30);
                this.ctx.save();
                this.ctx.fillStyle = hitbox.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                this.ctx.restore();
            } else {
                // Hitboxes estáticas normales
                const alpha = Math.min(0.3, hitbox.life / 30);
                this.ctx.strokeStyle = hitbox.color;
                this.ctx.fillStyle = hitbox.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.globalAlpha = alpha * 0.2;
                this.ctx.fill();
                
                this.ctx.globalAlpha = 1.0;
            }
        });
    }

    drawMapObjects() {
        this.mapObjects.forEach(obj => {
            this.ctx.save();
            
            if (obj.type === 'tree') {
                // Draw tree
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(obj.x + obj.size/3, obj.y + obj.size/2, obj.size/3, obj.size/2);
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(obj.x + obj.size/2, obj.y + obj.size/3, obj.size/3, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obj.type === 'bush') {
                // Draw bush
                this.ctx.fillStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.arc(obj.x + obj.size/2, obj.y + obj.size/2, obj.size/2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obj.type === 'rock') {
                // Draw rock
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(obj.x, obj.y, obj.size, obj.size * 0.8);
                this.ctx.fillStyle = '#A9A9A9';
                this.ctx.fillRect(obj.x + 3, obj.y + 3, obj.size - 6, obj.size * 0.6);
            }
            
            this.ctx.restore();
        });
    }

    drawPlayer(player) {
        if (!player || (!player.alive && !player.downed)) return;
        
        // Si está downed, dibujar semi-transparente
        if (player.downed) {
            this.ctx.globalAlpha = 0.6;
        }
        
        const size = 30;
        
        // Character-specific colors and shapes
        if (player.character === '2019x') {
            // Aplicar efecto de sigilo
            if (player.stealthMode) {
                this.ctx.globalAlpha = 0.3;
                this.ctx.shadowColor = '#2C2C2C';
                this.ctx.shadowBlur = 10;
            }
            
            // Aplicar efecto de rage mode
            if (player.rageMode && player.rageMode.active) {
                this.ctx.shadowColor = '#FF4500';
                this.ctx.shadowBlur = 20;
                // Efecto de parpadeo rojo
                const flash = Math.sin(Date.now() * 0.02) > 0;
                if (flash) {
                    this.ctx.globalAlpha = 0.8;
                }
            }
            
            // Efecto de stun
            if (player.stunned) {
                this.ctx.save();
                this.ctx.translate(player.x + size/2, player.y + size/2);
                this.ctx.rotate(Math.sin(Date.now() * 0.01) * 0.2);
                this.ctx.translate(-size/2, -size/2);
                
                // Red cube for 2019x
                this.ctx.fillStyle = '#FF8080';
                this.ctx.fillRect(0, 0, size, size);
                this.ctx.fillStyle = '#FF4040';
                this.ctx.fillRect(3, 3, size - 6, size - 6);
                
                this.ctx.restore();
            } else {
                // Red cube for 2019x con efectos
                let color1 = '#FF0000';
                let color2 = '#8B0000';
                
                if (player.stealthMode) {
                    color1 = '#4A0000';
                    color2 = '#2C0000';
                } else if (player.rageMode && player.rageMode.active) {
                    color1 = '#FF4500';
                    color2 = '#FF0000';
                }
                
                this.ctx.fillStyle = color1;
                this.ctx.fillRect(player.x, player.y, size, size);
                this.ctx.fillStyle = color2;
                this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            }
            
            // Character symbol
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            if (player.endGameRed) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.shadowColor = '#FF0000';
                this.ctx.shadowBlur = 20;
            }
            
            if (player.disappearing) {
                this.ctx.globalAlpha = Math.max(0, 1 - (Date.now() % 1000) / 1000);
            }
            
            let emoji = '🔥';
            if (player.stealthMode) emoji = '👻';
            else if (player.stunned && !(player.rageMode && player.rageMode.active)) emoji = '😵'; // Inmune a stun en rage
            else if (player.rageMode && player.rageMode.active) emoji = '😈';
            
            this.ctx.fillText(emoji, player.x + size/2, player.y + size/2 + 5);
            
            // Indicador de crítico
            if (player.criticalStrike) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('CRIT', player.x + size/2, player.y - 15);
            }
            
            // Indicador de stun (solo si no está en rage mode)
            if (player.stunned && !(player.rageMode && player.rageMode.active)) {
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('STUNNED', player.x + size/2, player.y - 25);
            }
            
            // Indicador de rage mode
            if (player.rageMode && player.rageMode.active) {
                this.ctx.fillStyle = '#FF4500';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('RAGE MODE', player.x + size/2, player.y - 25);
            }
            
            this.ctx.globalAlpha = 1.0;
            this.ctx.shadowBlur = 0;
        } else if (player.character === 'gissel') {
            // Efecto de Sharp Wings
            if (player.sharpWingsActive) {
                this.ctx.shadowColor = '#FF69B4';
                this.ctx.shadowBlur = 15;
            }
            
            // Cubo rosa para Gissel
            this.ctx.fillStyle = player.sharpWingsActive ? '#FF1493' : '#FF69B4';
            this.ctx.fillRect(player.x, player.y, size, size);
            this.ctx.fillStyle = player.sharpWingsActive ? '#8B008B' : '#9370DB';
            this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            
            // Character symbol
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.sharpWingsActive ? '⚡' : '🦋', player.x + size/2, player.y + size/2 + 5);
            
            // Indicador de Sharp Wings
            if (player.sharpWingsActive) {
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('WINGS', player.x + size/2, player.y - 15);
            }
            
            this.ctx.shadowBlur = 0;
        } else if (player.character === 'luna') {
            // Efectos especiales de Luna
            if (player.energyJuiceActive) {
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.shadowBlur = 10;
            } else if (player.punchActive) {
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 15;
            } else if (player.tauntActive) {
                this.ctx.shadowColor = '#FF69B4';
                this.ctx.shadowBlur = 10;
            }
            
            // Cubo morado para Luna
            let color1 = '#9370DB';
            let color2 = '#8A2BE2';
            
            if (player.resistanceActive) {
                color1 = '#4B0082';
                color2 = '#6A0DAD';
            }
            
            this.ctx.fillStyle = color1;
            this.ctx.fillRect(player.x, player.y, size, size);
            this.ctx.fillStyle = color2;
            this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            let emoji = '👊';
            if (player.energyJuiceActive) emoji = '⚡';
            else if (player.punchActive) emoji = '🥊';
            else if (player.tauntActive) emoji = '😜';
            
            this.ctx.fillText(emoji, player.x + size/2, player.y + size/2 + 5);
            
            // Indicadores de habilidades
            if (player.resistanceActive) {
                this.ctx.fillStyle = '#9370DB';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('RESIST', player.x + size/2, player.y - 15);
            }
            if (player.energyJuiceActive) {
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('SPEED II', player.x + size/2, player.y - 25);
            }
            if (player.angelSpeedBoost) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('ANGEL BOOST', player.x + size/2, player.y - 35);
            }
            
            this.ctx.shadowBlur = 0;
        } else if (player.character === 'iA777') {
            // Efectos especiales
            if (player.charging) {
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.shadowBlur = 15;
            } else if (player.autoRepairing) {
                this.ctx.shadowColor = '#00FF00';
                this.ctx.shadowBlur = 10;
            } else if (player.sierraActive) {
                this.ctx.shadowColor = '#FF0000';
                this.ctx.shadowBlur = 20;
            }
            
            // Efecto de wall stun
            if (player.wallStunned) {
                this.ctx.save();
                this.ctx.translate(player.x + size/2, player.y + size/2);
                this.ctx.rotate(Math.sin(Date.now() * 0.02) * 0.3);
                this.ctx.translate(-size/2, -size/2);
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(0, 0, size, size);
                this.ctx.fillStyle = '#A0522D';
                this.ctx.fillRect(3, 3, size - 6, size - 6);
                
                this.ctx.restore();
            } else {
                let color1 = '#C0C0C0';
                let color2 = '#808080';
                
                if (player.charging) {
                    color1 = '#00FFFF';
                    color2 = '#0080FF';
                } else if (player.autoRepairing) {
                    color1 = '#00FF00';
                    color2 = '#008000';
                } else if (player.sierraActive) {
                    color1 = '#FF0000';
                    color2 = '#8B0000';
                }
                
                this.ctx.fillStyle = color1;
                this.ctx.fillRect(player.x, player.y, size, size);
                this.ctx.fillStyle = color2;
                this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            }
            
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            let emoji = '🤖';
            if (player.wallStunned) emoji = '😵';
            else if (player.charging) emoji = '⚡';
            else if (player.autoRepairing) emoji = '🔧';
            else if (player.sierraActive) emoji = '⚔️';
            
            this.ctx.fillText(emoji, player.x + size/2, player.y + size/2 + 5);
            
            // Indicadores de habilidades
            if (player.charging && player.grabbedKiller) {
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('GRABBING', player.x + size/2, player.y - 15);
            } else if (player.charging) {
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('CHARGING', player.x + size/2, player.y - 15);
            } else if (player.autoRepairing) {
                this.ctx.fillStyle = '#00FF00';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('REPAIRING', player.x + size/2, player.y - 15);
            } else if (player.sierraActive) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('SIERRA', player.x + size/2, player.y - 15);
            }
            
            // Indicador de wall stun
            if (player.wallStunned) {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('STUNNED', player.x + size/2, player.y - 25);
            }
            
            // Efecto de parpadeo rojo para Sierra
            if (player.sierraFlash && this.lastManStanding) {
                const flash = Math.sin(Date.now() * 0.02) > 0;
                if (flash) {
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.fillRect(player.x, player.y, size, size);
                    this.ctx.globalAlpha = 1.0;
                }
            }
            
            this.ctx.shadowBlur = 0;
        } else if (player.character === 'angel') {
            // Efectos especiales de Angel
            if (player.restActive) {
                this.ctx.shadowColor = '#98FB98';
                this.ctx.shadowBlur = 15;
            } else if (player.dashActive) {
                this.ctx.shadowColor = '#87CEEB';
                this.ctx.shadowBlur = 10;
            } else if (player.fatigued) {
                this.ctx.shadowColor = '#8B0000';
                this.ctx.shadowBlur = 8;
            }
            
            // Cubo celeste para Angel
            let color1 = '#87CEEB';
            let color2 = '#4682B4';
            
            if (player.fatigued) {
                color1 = '#696969';
                color2 = '#2F4F4F';
            } else if (player.restActive) {
                color1 = '#98FB98';
                color2 = '#32CD32';
            }
            
            this.ctx.fillStyle = color1;
            this.ctx.fillRect(player.x, player.y, size, size);
            this.ctx.fillStyle = color2;
            this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            let emoji = '😇'; // Angel face
            if (player.fatigued) emoji = '😵'; // Dizzy
            else if (player.restActive) emoji = '✨'; // Sparkles
            else if (player.dashActive) emoji = '💫'; // Dash
            
            this.ctx.fillText(emoji, player.x + size/2, player.y + size/2 + 5);
            
            // Indicadores de habilidades
            if (player.fatigued) {
                this.ctx.fillStyle = '#8B0000';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('FATIGUED', player.x + size/2, player.y - 15);
            }
            if (player.restActive) {
                this.ctx.fillStyle = '#98FB98';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('HEALING', player.x + size/2, player.y - 25);
            }
            if (player.dashProtection) {
                this.ctx.fillStyle = '#87CEEB';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('PROTECTED', player.x + size/2, player.y - 35);
            }
            if (player.lmsAngelPower) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('DIVINE POWER', player.x + size/2, player.y - 45);
            }
            
            this.ctx.shadowBlur = 0;
        } else {
            // Default colored cubes for other characters
            let playerColor = player.role === 'survivor' ? '#4ecdc4' : '#ff6b6b';
            this.ctx.fillStyle = playerColor;
            this.ctx.fillRect(player.x, player.y, size, size);
            
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👤', player.x + size/2, player.y + size/2 + 5);
        }
        
        // Name
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(player.name || 'Unknown', player.x + size/2, player.y - 5);
        
        // Health bar
        this.drawHealthBar(player);
        
        // Highlight own player
        if (player.id === this.myPlayerId) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(player.x - 2, player.y - 2, size + 4, size + 4);
        }
        
        // Indicadores especiales para downed players
        if (player.downed) {
            // Texto "DOWNED"
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('DOWNED', player.x + size/2, player.y - 35);
            
            // Timer de revive
            const timeLeft = Math.ceil(player.reviveTimer / 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(`${timeLeft}s`, player.x + size/2, player.y - 45);
            
            // Barra de progreso de revive si está siendo revivido
            if (player.beingRevived && player.reviveProgress) {
                const barWidth = 40;
                const barHeight = 6;
                const barX = player.x + (size - barWidth) / 2;
                const barY = player.y + size + 5;
                
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                const progress = player.reviveProgress / 180;
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            }
        }
        
        // Restaurar alpha
        this.ctx.globalAlpha = 1.0;
    }

    isImageValid(img) {
        return img && img.complete && img.naturalWidth > 0 && !img.src.includes('broken');
    }

    drawHealthBar(player) {
        const barWidth = 60;
        const barHeight = 8;
        const x = player.x - 15;
        const y = player.y - 30;
        
        // Icon for survivors - Gissel and Luna
        if (player.role === 'survivor' && player.character === 'gissel') {
            if (!this.gisselIcon) {
                this.gisselIcon = new Image();
                this.gisselIcon.src = 'assets/icons/GisselInactiveIcon.png';
            }
            
            if (this.isImageValid(this.gisselIcon)) {
                this.ctx.drawImage(this.gisselIcon, x - 18, y - 2, 12, 12);
            }
        } else if (player.role === 'survivor' && player.character === 'luna') {
            let iconSrc;
            if (!player.alive) {
                iconSrc = 'assets/icons/LunaDeadIcon.png';
            } else if (player.health <= 50) {
                iconSrc = 'assets/icons/LunaDangerIcon.png';
            } else {
                iconSrc = 'assets/icons/LunaNormalIcon.png';
            }
            
            if (!this.lunaIcons) {
                this.lunaIcons = {};
            }
            
            if (!this.lunaIcons[iconSrc]) {
                this.lunaIcons[iconSrc] = new Image();
                this.lunaIcons[iconSrc].src = iconSrc;
            }
            
            if (this.isImageValid(this.lunaIcons[iconSrc])) {
                this.ctx.drawImage(this.lunaIcons[iconSrc], x - 18, y - 2, 12, 12);
            }
        }
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health bar color based on health amount
        let healthColor;
        if (player.health > 100) {
            healthColor = '#9370DB'; // Purple for LMS bonus health
        } else if (player.health === player.maxHealth) {
            healthColor = '#44ff44'; // Bright green for full health
        } else if (player.health >= player.maxHealth * 0.7) {
            healthColor = '#228B22'; // Dark green for good health
        } else {
            healthColor = '#ff4444'; // Red for low health
        }
        
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y, (player.health / player.maxHealth) * barWidth, barHeight);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${player.health}/${player.maxHealth}`, x + barWidth/2, y - 2);
        

    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            this.ctx.restore();
        });
    }

    drawUI() {
        // Timer
        const minutes = Math.floor(this.gameTimer / 60);
        const seconds = this.gameTimer % 60;
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(this.canvas.width/2 - 80, 10, 160, 40);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(timeText, this.canvas.width/2, 35);
        
        // Player info
        const player = this.players[this.myPlayerId];
        if (player) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(10, 10, 250, 120);
            
            this.ctx.fillStyle = '#7289DA';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`🎮 ${player.name} (${player.character})`, 15, 30);
            this.ctx.fillText(`❤️ HP: ${player.health}/${player.maxHealth}`, 15, 50);
            this.ctx.fillText(`🎯 Role: ${player.role}`, 15, 70);
            
            // Rage bar para killers
            if (player.role === 'killer') {
                const ragePercent = (player.rageLevel / player.maxRage) * 100;
                this.ctx.fillText(`🔥 Rage: ${Math.floor(ragePercent)}%`, 15, 90);
                
                // Barra de rage
                const barWidth = 200;
                const barHeight = 8;
                const barX = 15;
                const barY = 95;
                
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Barra de rage con gradiente
                const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                gradient.addColorStop(0, '#FF4500');
                gradient.addColorStop(1, '#FF0000');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(barX, barY, (ragePercent / 100) * barWidth, barHeight);
                
                // Indicador de rage mode disponible
                if (player.rageLevel >= player.maxRage && !player.rageUsed) {
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.fillText('PRESIONA C PARA RAGE MODE', 15, 115);
                } else if (player.rageMode.active) {
                    const timeLeft = Math.ceil(player.rageMode.timer / 60);
                    this.ctx.fillStyle = '#FF4500';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.fillText(`RAGE MODE ACTIVO: ${timeLeft}s`, 15, 115);
                }
            } else {
                // Mostrar usos de Energy Juice para Luna
                if (player.character === 'luna') {
                    const ability = this.abilities.q;
                    this.ctx.fillText(`⚡ Energy Juice: ${ability.uses}/${ability.maxUses}`, 15, 90);
                    if (player.punchStuns) {
                        this.ctx.fillText(`👊 Punch Stuns: ${player.punchStuns}`, 15, 110);
                    }
                } else {
                    this.ctx.fillText(`💥 Hitboxes: ${this.hitboxes.length}`, 15, 90);
                }
            }
        
        // Mostrar prompt de revive
        if (this.showRevivePrompt) {
            this.ctx.fillStyle = 'rgba(0,255,0,0.8)';
            this.ctx.fillRect(10, 120, 200, 30);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText('Presiona E para revivir', 15, 140);
        }
        }
        
        // Controls help
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(this.canvas.width - 200, this.canvas.height - 100, 190, 90);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('WASD: Mover', this.canvas.width - 190, this.canvas.height - 80);
        this.ctx.fillText('Q/E/R: Habilidades', this.canvas.width - 190, this.canvas.height - 60);
        this.ctx.fillText('Click/Space: Atacar', this.canvas.width - 190, this.canvas.height - 40);
        this.ctx.fillText('C: Rage Mode (Killers)', this.canvas.width - 190, this.canvas.height - 20);
        this.ctx.fillText('E: Revivir (cerca de downed)', this.canvas.width - 190, this.canvas.height - 0);
        
        // Mostrar estado de espectador
        if (player && player.spectating) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
            this.ctx.fillRect(this.canvas.width/2 - 100, 60, 200, 30);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MODO ESPECTADOR', this.canvas.width/2, 80);
        }
        
        // Efecto de pantalla nublada para Luna's taunt
        if (player && player.screenBlurred) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(128,128,128,0.4)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Texto de efecto
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('BURLADO', this.canvas.width/2, this.canvas.height/2);
            this.ctx.restore();
        }
        
        // Ping display
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(this.canvas.width - 100, 10, 90, 30);
        
        let pingColor = '#00ff00'; // Green
        if (this.ping > 100) pingColor = '#ffff00'; // Yellow
        if (this.ping > 200) pingColor = '#ff0000'; // Red
        
        this.ctx.fillStyle = pingColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.ping}ms`, this.canvas.width - 55, 30);
    }
    
    updatePing() {
        // Send ping every 2 seconds
        if (Date.now() - this.lastPingTime > 2000) {
            if (this.supabaseGame) {
                this.supabaseGame.sendPing();
                this.lastPingTime = Date.now();
            }
        }
    }

    updateMobileControlsUI(player) {
        // Update cooldown displays on mobile buttons
        ['q', 'e', 'r'].forEach(key => {
            const btn = document.getElementById(`ability${key.toUpperCase()}`);
            const ability = this.abilities[key];
            
            if (btn && ability) {
                if (ability.cooldown > 0) {
                    btn.classList.add('cooldown');
                    const cooldownSec = Math.ceil(ability.cooldown / 1000);
                    btn.textContent = cooldownSec + 's';
                } else {
                    btn.classList.remove('cooldown');
                    btn.textContent = key.toUpperCase();
                }
            }
        });
        
        // Update rage mode button for all killers
        const rageBtn = document.getElementById('abilityC');
        if (rageBtn && player.role === 'killer') {
            if (player.rageUsed || player.rageLevel < player.maxRage || this.lastManStanding || (player.rageMode && player.rageMode.active)) {
                rageBtn.classList.add('cooldown');
                if (player.rageMode && player.rageMode.active) {
                    const timeLeft = Math.ceil(player.rageMode.timer / 60);
                    rageBtn.textContent = timeLeft + 's';
                } else {
                    const ragePercent = Math.floor((player.rageLevel / player.maxRage) * 100);
                    rageBtn.textContent = ragePercent + '%';
                }
            } else {
                rageBtn.classList.remove('cooldown');
                rageBtn.textContent = 'C';
            }
        }
        
        // Update Energy Juice uses for Luna
        if (player.character === 'luna') {
            const qBtn = document.getElementById('abilityQ');
            if (qBtn) {
                const ability = this.abilities.q;
                if (ability.uses <= 0 && ability.cooldown > 0) {
                    qBtn.classList.add('cooldown');
                    const cooldownSec = Math.ceil(ability.cooldown / 1000);
                    qBtn.textContent = cooldownSec + 's';
                } else if (ability.uses > 0) {
                    qBtn.classList.remove('cooldown');
                    qBtn.textContent = `Q(${ability.uses})`;
                } else {
                    qBtn.classList.remove('cooldown');
                    qBtn.textContent = 'Q';
                }
            }
        }
    }
    
    drawVirtualJoystick() {
        if (!this.joystickState.active) return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const baseRadius = 60;
        const knobRadius = 25;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.joystickState.startX, this.joystickState.startY, baseRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        const dx = this.joystickState.currentX - this.joystickState.startX;
        const dy = this.joystickState.currentY - this.joystickState.startY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDistance = baseRadius - knobRadius;
        
        let knobX = this.joystickState.currentX;
        let knobY = this.joystickState.currentY;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            knobX = this.joystickState.startX + Math.cos(angle) * maxDistance;
            knobY = this.joystickState.startY + Math.sin(angle) * maxDistance;
        }
        
        this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawMobileControls(player) {
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Better sizing for different screen sizes
        const joystickSize = Math.min(canvasWidth, canvasHeight) * (isLandscape ? 0.12 : 0.15);
        const buttonSize = Math.min(canvasWidth, canvasHeight) * (isLandscape ? 0.08 : 0.1);
        const spacing = buttonSize * 1.2;
        
        // Better positioning
        const joystickX = joystickSize * 0.8;
        const joystickY = canvasHeight - joystickSize * 0.8;
        
        // Draw enhanced joystick
        this.ctx.save();
        
        // Outer ring shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.beginPath();
        this.ctx.arc(joystickX + 2, joystickY + 2, joystickSize/2 + 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Outer ring
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.beginPath();
        this.ctx.arc(joystickX, joystickY, joystickSize/2 + 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner background
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.beginPath();
        this.ctx.arc(joystickX, joystickY, joystickSize/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#7289DA';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Calculate stick position with smooth interpolation
        let stickX = joystickX;
        let stickY = joystickY;
        
        if (this.joystickState.active) {
            const maxDistance = joystickSize/2 - 15;
            const dx = this.joystickState.currentX - joystickX;
            const dy = this.joystickState.currentY - joystickY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance > maxDistance) {
                const angle = Math.atan2(dy, dx);
                stickX = joystickX + Math.cos(angle) * maxDistance;
                stickY = joystickY + Math.sin(angle) * maxDistance;
            } else {
                stickX = this.joystickState.currentX;
                stickY = this.joystickState.currentY;
            }
        }
        
        // Draw stick with glow effect
        const stickRadius = joystickSize * 0.15;
        
        // Stick glow
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(stickX, stickY, stickRadius + 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Stick core
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.arc(stickX, stickY, stickRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Stick highlight
        this.ctx.fillStyle = '#FFFF80';
        this.ctx.beginPath();
        this.ctx.arc(stickX - stickRadius/3, stickY - stickRadius/3, stickRadius/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Enhanced ability buttons
        const buttonY = canvasHeight - buttonSize * 0.8;
        const startX = canvasWidth - (buttonSize * 3 + spacing * 2) - buttonSize * 0.5;
        
        ['Q', 'E', 'R'].forEach((key, index) => {
            const x = startX + (buttonSize + spacing) * index;
            const ability = this.abilities[key.toLowerCase()];
            const onCooldown = ability && ability.cooldown > 0;
            
            this.ctx.save();
            
            // Enhanced button shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x + 3, buttonY + 3, buttonSize/2 + 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Button background with gradient effect
            const gradient = this.ctx.createRadialGradient(x, buttonY - buttonSize/4, 0, x, buttonY, buttonSize/2);
            if (onCooldown) {
                gradient.addColorStop(0, 'rgba(120,120,120,0.9)');
                gradient.addColorStop(1, 'rgba(80,80,80,0.9)');
            } else {
                gradient.addColorStop(0, 'rgba(255,235,0,0.9)');
                gradient.addColorStop(1, 'rgba(255,165,0,0.9)');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, buttonY, buttonSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enhanced border
            this.ctx.strokeStyle = onCooldown ? '#666' : '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Button text with better sizing
            this.ctx.fillStyle = onCooldown ? '#444' : '#000';
            this.ctx.font = `bold ${buttonSize * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(key, x, buttonY + buttonSize * 0.12);
            
            // Enhanced cooldown indicator
            if (onCooldown) {
                const cooldownSec = Math.ceil(ability.cooldown / 1000);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `bold ${buttonSize * 0.25}px Arial`;
                this.ctx.fillText(cooldownSec + 's', x, buttonY + buttonSize * 0.35);
                
                // Cooldown arc
                const progress = 1 - (ability.cooldown / ability.maxCooldown);
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(x, buttonY, buttonSize/2 - 2, -Math.PI/2, -Math.PI/2 + (progress * Math.PI * 2));
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
        
        // Enhanced attack button for killers
        if (player.role === 'killer') {
            const attackX = canvasWidth - buttonSize * 0.8;
            const attackY = buttonY - buttonSize * 1.3;
            
            this.ctx.save();
            
            // Attack button shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.beginPath();
            this.ctx.arc(attackX + 3, attackY + 3, buttonSize/2 + 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Attack button gradient
            const attackGradient = this.ctx.createRadialGradient(attackX, attackY - buttonSize/4, 0, attackX, attackY, buttonSize/2);
            attackGradient.addColorStop(0, 'rgba(255, 100, 100, 0.9)');
            attackGradient.addColorStop(1, 'rgba(200, 0, 0, 0.9)');
            
            this.ctx.fillStyle = attackGradient;
            this.ctx.beginPath();
            this.ctx.arc(attackX, attackY, buttonSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = `bold ${buttonSize * 0.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚔️', attackX, attackY + buttonSize * 0.15);
            
            this.attackButton = {x: attackX, y: attackY, size: buttonSize};
            this.ctx.restore();
        }
        
        // Store enhanced control positions with proper touch areas
        this.mobileControls = {
            joystick: {x: joystickX, y: joystickY, size: joystickSize, touchRadius: joystickSize/2 + 10},
            abilities: {
                q: {x: startX, y: buttonY, size: buttonSize, touchRadius: buttonSize/2 + 5},
                e: {x: startX + buttonSize + spacing, y: buttonY, size: buttonSize, touchRadius: buttonSize/2 + 5},
                r: {x: startX + (buttonSize + spacing) * 2, y: buttonY, size: buttonSize, touchRadius: buttonSize/2 + 5}
            }
        };
    }

    updateLobbyUI() {
        const totalPlayers = Object.keys(this.playersInLobby).length;
        const survivors = Object.values(this.playersInLobby).filter(p => p.role === 'survivor');
        const killers = Object.values(this.playersInLobby).filter(p => p.role === 'killer');
        const killerPlayer = killers.length > 0 ? killers[0] : null;
        
        let statusElement = document.getElementById('lobbyStatus');
        if (!statusElement) return;
        
        let statusMessage;
        if (this.countdownActive && this.lobbyCountdown > 0) {
            statusMessage = `<p style="color: #FFD700; text-align: center; font-size: 1.5rem; font-weight: bold;">🚀 Iniciando en ${this.lobbyCountdown}...</p>`;
        } else if (totalPlayers >= 2 && survivors.length >= 1 && killers.length >= 1) {
            statusMessage = '<p style="color: #4ecdc4; text-align: center; font-size: 1.2rem;">✅ ¡Listos para jugar!</p>';
        } else {
            statusMessage = '<p style="color: #ff6b6b; text-align: center;">⏳ Esperando más jugadores...</p>';
        }
        
        // Lista de survivors
        let survivorsList = survivors.length > 0 ? 
            survivors.map(s => `${s.name} (${s.character})`).join(', ') : 
            'Ninguno';
        
        let killerStatus = killerPlayer ? 
            `${killerPlayer.name} (${killerPlayer.character})` : 
            'Disponible';
        
        statusElement.innerHTML = `
            <div style="background: rgba(114,137,218,0.2); padding: 20px; border-radius: 15px; margin: 20px 0; border: 2px solid #7289DA; text-align: center;">
                <h3 style="color: #7289DA; margin-bottom: 15px;">🎮 Discord Friends Lobby</h3>
                <p style="color: #fff; font-size: 1.1rem; margin: 10px 0;">Jugadores: ${totalPlayers}/8</p>
                <p style="color: #fff; margin: 10px 0;">🛡️ Survivors: ${survivors.length} | ⚔️ Killer: ${killerStatus}</p>
                ${statusMessage}
            </div>
        `;
    }

    playLMSMusic() {
        try {
            // Determinar qué música usar según el survivor
            const lastSurvivor = Object.values(this.players).find(p => p.role === 'survivor' && !p.spectating);
            let musicPath;
            
            if (lastSurvivor && lastSurvivor.character === 'iA777') {
                musicPath = 'assets/IA777LMS.mp3';
            } else {
                musicPath = 'assets/SpeedofSoundRound2.mp3';
            }
            
            this.lmsMusic = new Audio(musicPath);
            this.lmsMusic.volume = 0.6;
            this.lmsMusic.loop = false;
            this.lmsMusicStartTime = Date.now();
            
            this.lmsMusic.addEventListener('loadedmetadata', () => {
                if (this.lastManStanding) {
                    // Timer = duración exacta de la canción
                    this.gameTimer = Math.floor(this.lmsMusic.duration);
                    this.lmsMusicDuration = this.lmsMusic.duration;
                    console.log(`🎵 LMS Timer set to song duration: ${this.gameTimer} seconds`);
                }
            });
            
            this.lmsMusic.addEventListener('ended', () => {
                if (this.lastManStanding) {
                    this.gameTimer = 0;
                    console.log('🎵 Song ended, LMS timer finished');
                }
            });
            
            const playPromise = this.lmsMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('LMS music autoplay blocked, will play on next user interaction');
                    this.pendingLMSMusic = true;
                });
            }
        } catch (error) {
            console.log('LMS music not available:', error);
            // Fallback: usar duración estimada de la canción
            this.gameTimer = 300; // Fallback de 5 minutos
            this.lmsMusicDuration = 300;
        }
    }

    stopLMSMusic() {
        if (this.lmsMusic) {
            this.lmsMusic.pause();
            this.lmsMusic.currentTime = 0;
            this.lmsMusic = null;
        }
    }

    syncGameTimer() {
        if (this.supabaseGame) {
            this.supabaseGame.sendTimerSync({
                gameStartTime: this.gameStartTime,
                currentTimer: this.gameTimer
            });
        }
    }
    
    showDamageIndicator(target, damage, attackType) {
        // Crear indicador de daño flotante
        const indicator = {
            x: target.x + 15,
            y: target.y - 10,
            damage: damage,
            attackType: attackType,
            life: 120, // 2 segundos
            maxLife: 120,
            alpha: 1.0,
            vy: -2 // Velocidad hacia arriba
        };
        
        // Agregar a array de indicadores
        if (!this.damageIndicators) {
            this.damageIndicators = [];
        }
        this.damageIndicators.push(indicator);
        
        // Efecto de pantalla roja para el atacante
        if (target.id !== this.myPlayerId) {
            this.showHitConfirmation();
        }
    }
    
    showHitConfirmation() {
        // Efecto de confirmación de golpe
        this.hitConfirmation = {
            active: true,
            timer: 30, // 0.5 segundos
            alpha: 0.3
        };
    }
    
    updateDamageIndicators() {
        if (!this.damageIndicators) return;
        
        this.damageIndicators = this.damageIndicators.filter(indicator => {
            indicator.life--;
            indicator.y += indicator.vy;
            indicator.alpha = indicator.life / indicator.maxLife;
            return indicator.life > 0;
        });
    }
    
    drawDamageIndicators() {
        if (!this.damageIndicators) return;
        
        this.damageIndicators.forEach(indicator => {
            this.ctx.save();
            this.ctx.globalAlpha = indicator.alpha;
            
            // Color según tipo de ataque
            let color = '#FF0000';
            if (indicator.attackType === 'you_cant_run') color = '#8B0000';
            else if (indicator.attackType === 'white_orb') color = '#FF8000';
            else if (indicator.damage === 50) color = '#FFD700'; // Stealth
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            
            // Dibujar texto con borde
            this.ctx.strokeText(`-${indicator.damage}`, indicator.x, indicator.y);
            this.ctx.fillText(`-${indicator.damage}`, indicator.x, indicator.y);
            
            this.ctx.restore();
        });
    }
    
    drawHitConfirmation() {
        if (!this.hitConfirmation || !this.hitConfirmation.active) return;
        
        this.hitConfirmation.timer--;
        if (this.hitConfirmation.timer <= 0) {
            this.hitConfirmation.active = false;
            return;
        }
        
        // Efecto de borde rojo
        this.ctx.save();
        this.ctx.globalAlpha = this.hitConfirmation.alpha;
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    cleanupPlayer() {
        // Limpiar jugador del lobby
        if (this.supabaseGame && this.myPlayerId) {
            this.supabaseGame.removePlayerFromLobby(this.myPlayerId);
            console.log('🧹 Player cleanup:', this.myPlayerId);
        }
        
        // Limpiar estado local
        if (this.playersInLobby[this.myPlayerId]) {
            delete this.playersInLobby[this.myPlayerId];
        }
        if (this.players[this.myPlayerId]) {
            delete this.players[this.myPlayerId];
        }
    }

    cleanupDatabase() {
        // Supabase channels handle cleanup automatically
        console.log('🧹 Database cleanup handled by Supabase');
    }
    
    showEscapeRing() {
        // Crear anillo de escape en posición aleatoria
        this.escapeRing = {
            x: Math.random() * (this.worldSize.width - 200) + 100,
            y: Math.random() * (this.worldSize.height - 200) + 100,
            radius: 80,
            glowRadius: 100,
            active: true,
            pulseTimer: 0,
            showIndicator: true,
            indicatorTimer: 300 // 5 segundos de indicador
        };
        
        // Cargar imagen de Meowl
        if (!this.meowlImage) {
            this.meowlImage = new Image();
            this.meowlImage.src = 'assets/Meowl.png';
        }
        
        console.log('🌟 Escape ring appeared!');
    }
    
    drawEscapeRing() {
        if (!this.escapeRing || !this.escapeRing.active) return;
        
        this.ctx.save();
        
        // Efecto de pulso
        this.escapeRing.pulseTimer += 0.1;
        const pulse = Math.sin(this.escapeRing.pulseTimer) * 0.2 + 1;
        
        // Indicador en el minimapa/UI si está activo
        if (this.escapeRing.showIndicator && this.escapeRing.indicatorTimer > 0) {
            this.escapeRing.indicatorTimer--;
            this.drawEscapeRingIndicator();
            
            if (this.escapeRing.indicatorTimer <= 0) {
                this.escapeRing.showIndicator = false;
            }
        }
        
        // Glow exterior
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 30;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 8 * pulse;
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(this.escapeRing.x, this.escapeRing.y, this.escapeRing.glowRadius * pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Anillo principal
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 6;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(this.escapeRing.x, this.escapeRing.y, this.escapeRing.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Imagen de Meowl en el centro
        if (this.meowlImage && this.meowlImage.complete) {
            this.ctx.globalAlpha = 1;
            this.ctx.shadowBlur = 0;
            const imageSize = 60;
            this.ctx.drawImage(
                this.meowlImage,
                this.escapeRing.x - imageSize/2,
                this.escapeRing.y - imageSize/2,
                imageSize,
                imageSize
            );
        }
        
        // Texto "ESCAPE"
        this.ctx.globalAlpha = 1;
        this.ctx.shadowColor = '#000';
        this.ctx.shadowBlur = 3;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ESCAPE', this.escapeRing.x, this.escapeRing.y + 50);
        
        this.ctx.restore();
        
        // Verificar si algún survivor está en el anillo
        this.checkEscapeRingCollision();
    }
    
    drawEscapeRingIndicator() {
        const player = this.players[this.myPlayerId];
        if (!player || player.role !== 'survivor') return;
        
        // Calcular dirección hacia el anillo
        const dx = this.escapeRing.x - (player.x + 15);
        const dy = this.escapeRing.y - (player.y + 15);
        const distance = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        
        // Dibujar flecha indicadora en el borde de la pantalla
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const indicatorDistance = Math.min(centerX, centerY) - 50;
        
        const indicatorX = centerX + Math.cos(angle) * indicatorDistance;
        const indicatorY = centerY + Math.sin(angle) * indicatorDistance;
        
        this.ctx.save();
        this.ctx.translate(indicatorX, indicatorY);
        this.ctx.rotate(angle);
        
        // Flecha dorada pulsante
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 1;
        this.ctx.scale(pulse, pulse);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Texto de distancia
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(distance)}m`, indicatorX, indicatorY + 25);
    }
    
    checkEscapeRingCollision() {
        if (!this.escapeRing || !this.escapeRing.active) return;
        
        Object.values(this.players).forEach(player => {
            if (player.role === 'survivor' && player.alive) {
                const distance = Math.sqrt(
                    Math.pow(player.x + 15 - this.escapeRing.x, 2) + 
                    Math.pow(player.y + 15 - this.escapeRing.y, 2)
                );
                
                if (distance <= this.escapeRing.radius) {
                    // Survivor escapó
                    if (player.id === this.myPlayerId) {
                        this.survivorEscaped(player);
                    }
                }
            }
        });
    }
    
    survivorEscaped(player) {
        player.escaped = true;
        this.escapeRing.active = false;
        
        // Efectos visuales
        this.createParticles(player.x + 15, player.y + 15, '#FFD700', 30);
        
        // Mensaje de escape
        const escapeDiv = document.createElement('div');
        escapeDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.9);
            color: #000;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 2rem;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 0 30px #FFD700;
        `;
        
        escapeDiv.innerHTML = '🌟 ¡ESCAPASTE! 🌟';
        document.body.appendChild(escapeDiv);
        
        setTimeout(() => {
            document.body.removeChild(escapeDiv);
        }, 3000);
        
        // Verificar si todos los survivors escaparon o están muertos
        const aliveSurvivors = Object.values(this.players).filter(p => p.role === 'survivor' && (p.alive || p.downed) && !p.escaped);
        if (aliveSurvivors.length === 0) {
            this.endGame('SURVIVORS ESCAPED!');
        }
    }

    handleTouchStart(e) {
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Check if touch is on left side (joystick area) or right side (abilities)
            const isLeftSide = touchX < window.innerWidth / 2;
            
            if (isLeftSide && !this.joystickState.active) {
                // Activate joystick anywhere on left side
                this.joystickState = {
                    active: true,
                    startX: touchX,
                    startY: touchY,
                    currentX: touchX,
                    currentY: touchY,
                    touchId: touch.identifier
                };
            } else if (!isLeftSide) {
                // Right side - check for attack or abilities
                const player = this.players[this.myPlayerId];
                if (player && player.role === 'killer') {
                    this.handleAttack();
                }
                
                // Para iA777, capturar toque para dirigir la carga
                if (player && player.character === 'iA777' && player.charging) {
                    this.chargeTarget = {
                        x: touchX + this.camera.x,
                        y: touchY + this.camera.y
                    };
                }
            }
        }
    }
    
    handleTouchMove(e) {
        if (!this.joystickState.active) return;
        
        // Find the touch that corresponds to our joystick
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.identifier === this.joystickState.touchId) {
                const rect = this.canvas.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                
                // Update joystick position
                this.joystickState.currentX = touchX;
                this.joystickState.currentY = touchY;
                
                // Calculate movement direction
                const centerX = this.joystickState.startX;
                const centerY = this.joystickState.startY;
                
                const dx = touchX - centerX;
                const dy = touchY - centerY;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Improved sensitivity and deadzone
                const deadzone = 30; // pixels
                const maxDistance = 80; // pixels
                
                if (distance > deadzone) {
                    const normalizedX = Math.max(-1, Math.min(1, dx / maxDistance));
                    const normalizedY = Math.max(-1, Math.min(1, dy / maxDistance));
                    
                    // Set movement keys based on normalized values
                    this.keys['w'] = normalizedY < -0.3;
                    this.keys['s'] = normalizedY > 0.3;
                    this.keys['a'] = normalizedX < -0.3;
                    this.keys['d'] = normalizedX > 0.3;
                } else {
                    // Clear movement if within deadzone
                    this.keys['w'] = false;
                    this.keys['s'] = false;
                    this.keys['a'] = false;
                    this.keys['d'] = false;
                }
                
                break;
            }
        }
    }
    
    handleTouchEnd(e) {
        // Check if our joystick touch ended
        if (this.joystickState.active) {
            let touchStillActive = false;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.joystickState.touchId) {
                    touchStillActive = true;
                    break;
                }
            }
            
            if (!touchStillActive) {
                // Reset joystick state
                this.joystickState = {
                    active: false,
                    startX: 0,
                    startY: 0,
                    currentX: 0,
                    currentY: 0,
                    touchId: null
                };
                
                // Clear virtual movement keys
                this.keys['w'] = false;
                this.keys['s'] = false;
                this.keys['a'] = false;
                this.keys['d'] = false;
            }
        }
    }

    playDeathSound() {
        try {
            const deathAudio = new Audio('assets/deathsound.mp3');
            deathAudio.volume = 0.5;
            deathAudio.play().catch(e => console.log('Death sound blocked'));
        } catch (e) {
            console.log('Death sound not available');
        }
    }

    handleViewportChange() {
        setTimeout(() => {
            this.resizeCanvas();
        }, 100);
    }
    
    repositionMobileControls() {
        // Mobile controls will automatically adjust via CSS clamp() functions
        // This function can be used for additional JavaScript-based adjustments if needed
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            // Force a reflow to apply new CSS dimensions
            mobileControls.style.display = 'none';
            mobileControls.offsetHeight; // Trigger reflow
            mobileControls.style.display = 'flex';
        }
    }
    
    forceLandscape() {
        // Remove forced landscape - let users play in any orientation
        console.log('Game will adapt to current orientation:', 
                   window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    }
    
    activateCharge(player) {
        player.charging = true;
        player.chargeTimer = 420; // 7 segundos
        player.chargeHit = false;
        player.grabbedKiller = null;
        player.chargeStunned = false;
        
        // Resetear objetivo de carga en móvil
        if (this.isMobile()) {
            this.chargeTarget = null;
        }
        
        this.createParticles(player.x + 15, player.y + 15, '#00FFFF', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'charge_activate',
                playerId: player.id
            });
        }
    }
    
    activateAutoRepair(player) {
        player.autoRepairing = true;
        player.autoRepairTimer = 1200; // 20 segundos
        player.autoRepairTick = 0;
        
        this.createParticles(player.x + 15, player.y + 15, '#00FF00', 10);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'auto_repair_activate',
                playerId: player.id
            });
        }
    }
    
    activateSelfDestruct(player) {
        // Marcar que puede usar autodestrucción permanentemente
        player.canSelfDestruct = true;
        
        player.alive = false;
        player.spectating = true;
        
        Object.values(this.players).forEach(target => {
            if (target.role === 'killer' && target.alive) {
                const distance = Math.sqrt(
                    Math.pow(target.x - player.x, 2) + 
                    Math.pow(target.y - player.y, 2)
                );
                
                if (distance < 100) {
                    target.stunned = true;
                    target.stunTimer = 300;
                }
            }
        });
        
        this.createParticles(player.x + 15, player.y + 15, '#FF4500', 50);
        this.playDeathSound();
    }
    
    activateSierra(player) {
        player.sierraActive = true;
        player.sierraTimer = 60; // 1 segundo de duración
        player.sierraHit = false;
        player.sierraFlash = true;
        
        // Movimiento hacia adelante (más largo en LMS)
        if (this.lastMouseX && this.lastMouseY) {
            const angle = Math.atan2(this.lastMouseY - (player.y + 15), this.lastMouseX - (player.x + 15));
            const dashDistance = this.lastManStanding ? 120 : 80; // Dash más largo en LMS
            const newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * dashDistance));
            const newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * dashDistance));
            
            player.x = newX;
            player.y = newY;
            
            if (this.supabaseGame) {
                this.supabaseGame.sendPlayerMove(newX, newY);
            }
        }
        
        this.createParticles(player.x + 15, player.y + 15, '#FF0000', 20);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'sierra_activate',
                playerId: player.id
            });
        }
    }
    
    activateEnergyJuice(player) {
        player.energyJuiceActive = true;
        player.energyJuiceTimer = 600; // 10 segundos
        player.speedBoost = true;
        
        this.createParticles(player.x + 15, player.y + 15, '#00FFFF', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'energy_juice_activate',
                playerId: player.id
            });
        }
    }
    
    activatePunch(player) {
        player.punchActive = true;
        player.punchTimer = 60; // 1 segundo de duración
        player.punchHit = false;
        
        this.createParticles(player.x + 15, player.y + 15, '#FFD700', 20);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'punch_activate',
                playerId: player.id
            });
        }
    }
    
    activateTaunt(player) {
        player.tauntActive = true;
        player.tauntTimer = 60; // 1 segundo de duración
        player.tauntHit = false;
        
        this.createParticles(player.x + 15, player.y + 15, '#FF69B4', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'taunt_activate',
                playerId: player.id
            });
        }
    }
    
    activateAngelicSacrifice(player) {
        // Buscar survivor más cercano
        const nearbySurvivors = Object.values(this.players).filter(target => 
            target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
        );
        
        // En LMS, si no hay aliados, se convierte en auto-curación
        if (nearbySurvivors.length === 0 && player.lmsAngelPower) {
            // Sacrificio angelical supremo - curación masiva
            const sacrifice = Math.floor(player.health * 0.3); // Solo 30% en LMS
            player.health = Math.max(15, player.health - sacrifice);
            
            // Curación instantánea masiva después de 2 segundos
            setTimeout(() => {
                if (player.alive) {
                    player.health = Math.min(player.maxHealth, player.health + sacrifice * 2);
                    this.createParticles(player.x + 15, player.y + 15, '#FFD700', 30);
                }
            }, 2000);
            
            this.createParticles(player.x + 15, player.y + 15, '#FFD700', 25);
            return;
        }
        
        if (nearbySurvivors.length === 0) return;
        
        let closestSurvivor = null;
        let minDistance = Infinity;
        
        nearbySurvivors.forEach(survivor => {
            const distance = Math.sqrt(
                Math.pow(player.x - survivor.x, 2) + 
                Math.pow(player.y - survivor.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestSurvivor = survivor;
            }
        });
        
        if (!closestSurvivor) return;
        
        // Sacrificar 40% de vida (menos riesgo)
        const sacrifice = Math.floor(player.health * 0.4);
        player.health = Math.max(10, player.health - sacrifice); // Mínimo 10 HP
        
        // Dar vida y boost de velocidad al aliado (más generoso)
        const healAmount = sacrifice + 15; // +15 bonus
        closestSurvivor.health = Math.min(closestSurvivor.maxHealth, closestSurvivor.health + healAmount);
        closestSurvivor.angelSpeedBoost = true; // Boost de velocidad
        closestSurvivor.speedBoostTimer = 600; // 10s de velocidad
        closestSurvivor.angelBlessing = true;
        closestSurvivor.blessingTimer = 300; // 5s de bendición
        
        // Aplicar fatiga (menos tiempo)
        player.fatigued = true;
        player.fatigueTimer = 240; // 4 segundos
        
        this.createParticles(player.x + 15, player.y + 15, '#FFD700', 20);
        this.createParticles(closestSurvivor.x + 15, closestSurvivor.y + 15, '#00FF00', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'angelic_sacrifice',
                playerId: player.id,
                targetId: closestSurvivor.id,
                sacrifice: sacrifice
            });
        }
    }
    
    activateProtectiveDash(player) {
        player.dashActive = true;
        player.dashTimer = 60; // 1 segundo
        player.dashProtection = true;
        
        // Dash hacia adelante (más distancia + LMS)
        if (this.lastMouseX && this.lastMouseY) {
            const angle = Math.atan2(this.lastMouseY - (player.y + 15), this.lastMouseX - (player.x + 15));
            const dashDistance = player.lmsDashBoost ? 130 : 90; // 130 en LMS
            const newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * dashDistance));
            const newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * dashDistance));
            
            player.x = newX;
            player.y = newY;
            
            if (this.supabaseGame) {
                this.supabaseGame.sendPlayerMove(newX, newY);
            }
        }
        
        this.createParticles(player.x + 15, player.y + 15, '#87CEEB', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'protective_dash',
                playerId: player.id
            });
        }
    }
    
    activateRest(player) {
        player.restActive = true;
        player.restTimer = 600; // 10 segundos
        player.restTick = 0;
        
        this.createParticles(player.x + 15, player.y + 15, '#98FB98', 20);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'rest_activate',
                playerId: player.id
            });
        }
    }

    resizeCanvas() {
        if (this.canvas && this.ctx) {
            // Detectar tamaño real del dispositivo
            const screenWidth = screen.width;
            const screenHeight = screen.height;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Usar el tamaño más apropiado
            const width = Math.min(screenWidth, viewportWidth);
            const height = Math.min(screenHeight, viewportHeight);
            
            this.canvas.width = width;
            this.canvas.height = height;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            
            // Store dimensions
            this.canvas.cssWidth = width;
            this.canvas.cssHeight = height;
            
            console.log('Canvas resized to:', width, 'x', height);
            this.updateCamera();
        }
    }
    
    updateCameraBounds() {
        if (this.canvas && this.players[this.myPlayerId]) {
            const player = this.players[this.myPlayerId];
            const canvasWidth = this.canvas.cssWidth || window.innerWidth;
            const canvasHeight = this.canvas.cssHeight || window.innerHeight;
            
            // Recalculate camera position
            this.camera.x = player.x - canvasWidth / 2;
            this.camera.y = player.y - canvasHeight / 2;
            
            // Clamp camera to world bounds
            this.camera.x = Math.max(0, Math.min(Math.max(0, this.worldSize.width - canvasWidth), this.camera.x));
            this.camera.y = Math.max(0, Math.min(Math.max(0, this.worldSize.height - canvasHeight), this.camera.y));
        }
    }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new DiscordFriendsGame();
});