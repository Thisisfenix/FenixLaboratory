class DiscordFriendsGame {
    constructor() {
        this.supabaseGame = null;
        this.players = {};
        this.myPlayerId = null;
        this.selectedCharacter = null;
        this.selectedRole = null;
        this.gameStarted = false;
        this.playersInLobby = {};
        this.currentLobby = 'lobby-1';
        this.availableLobbies = {};
        this.spectatorMode = false;
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
        this.jumpscareQueue = [];
        
        // Initialize map system
        this.mapSystem = new DiscordFriendsMaps(this);
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
        this.gamepadIndex = null;
        this.gamepadButtons = {};
        
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
        this.refreshLobbyList();
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
            this.spectatorMode = false;
            this.joinGame();
        });
        
        document.getElementById('spectateBtn').addEventListener('click', () => {
            this.spectatorMode = true;
            this.joinGame();
        });
        
        document.getElementById('sandboxBtn').addEventListener('click', () => {
            this.startSandboxMode();
        });
        
        document.getElementById('refreshLobbies').addEventListener('click', () => {
            this.refreshLobbyList();
        });
        
        document.getElementById('lobbySelect').addEventListener('change', (e) => {
            this.currentLobby = e.target.value;
            this.updateLobbyInfo();
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
        
        // Gamepad support
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 Gamepad disconnected');
            this.gamepadIndex = null;
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
                    // Increase timer by 15 seconds on death
                    this.gameTimer += 15;
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
            } else if (data.type === 'iris_healing' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.healingAura = true;
                player.healingTimer = 1200;
                player.healingTick = 0;
            } else if (data.type === 'telekinesis_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.telekinesisActive = true;
                player.telekinesisTimer = 300;
            } else if (data.type === 'telekinesis_hit' && this.players[data.targetId]) {
                const target = this.players[data.targetId];
                target.x = data.knockbackX;
                target.y = data.knockbackY;
                target.telekinesisEffect = true;
                target.telekinesisTimer = 300;
                
                this.createParticles(target.x + 15, target.y + 15, '#9370DB', 20);
            } else if (data.type === 'iris_dash' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.irisDashActive = true;
                player.irisDashTimer = 60;
            } else if (data.type === 'dodge_regen' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.dodgeBar = data.dodgeBar;
            } else if (data.type === 'warp_strike_activate' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.warpStrikeActive = true;
                player.warpStrikeTimer = 300;
            } else if (data.type === 'power_surge' && data.playerId !== this.myPlayerId && this.players[data.playerId]) {
                const player = this.players[data.playerId];
                player.powerSurge = data.powerSurge;
                player.powerSurgeUsed = data.powerSurgeUsed;
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
        
        this.supabaseGame.handleLobbyList = (data) => {
            if (data.type === 'request' && data.playerId !== this.myPlayerId) {
                const lobbyStatus = {
                    lobbyId: this.currentLobby,
                    players: Object.keys(this.playersInLobby).length,
                    gameStarted: this.gameStarted
                };
                this.supabaseGame.sendLobbyStatus(lobbyStatus);
            } else if (data.type === 'status' && data.playerId !== this.myPlayerId) {
                this.availableLobbies[data.lobbyId] = {
                    players: data.players,
                    gameStarted: data.gameStarted
                };
                this.updateLobbyInfo();
            }
        };
    }

    async joinGame() {
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!playerName) {
            alert('Por favor ingresa tu nombre de jugador');
            return;
        }

        if (!this.spectatorMode && !this.selectedCharacter) {
            alert('Por favor selecciona un personaje antes de unirte como jugador');
            return;
        }
        
        // Verificar estado del lobby seleccionado
        const lobbyInfo = this.availableLobbies[this.currentLobby];
        if (!this.spectatorMode && lobbyInfo && lobbyInfo.players >= 8) {
            alert(`El ${this.currentLobby} está lleno (8/8 jugadores). Prueba otro lobby o únete como espectador.`);
            return;
        }
        
        // Verificar si ya hay un killer (solo si no es espectador)
        if (!this.spectatorMode && this.selectedRole === 'killer') {
            const existingKiller = Object.values(this.playersInLobby).find(p => p.role === 'killer');
            if (existingKiller && existingKiller.id !== this.myPlayerId) {
                alert(`Ya hay un killer en ${this.currentLobby}. Solo puede haber uno por lobby.`);
                return;
            }
        }

        const playerData = {
            id: this.myPlayerId,
            name: playerName,

            x: Math.random() * 800 + 100,
            y: Math.random() * 600 + 100,
            alive: !this.gameStarted && !this.spectatorMode,
            character: this.spectatorMode ? 'spectator' : this.selectedCharacter,
            role: this.spectatorMode ? 'spectator' : this.selectedRole,
            health: this.spectatorMode ? 0 : (this.selectedRole === 'survivor' ? (this.selectedCharacter === 'iA777' ? 120 : (this.selectedCharacter === 'luna' ? 85 : (this.selectedCharacter === 'angel' ? 90 : (this.selectedCharacter === 'iris' ? 100 : 100)))) : (this.selectedCharacter === 'vortex' ? 700 : 600)),
            maxHealth: this.spectatorMode ? 0 : (this.selectedRole === 'survivor' ? (this.selectedCharacter === 'iA777' ? 120 : (this.selectedCharacter === 'luna' ? 85 : (this.selectedCharacter === 'angel' ? 90 : (this.selectedCharacter === 'iris' ? 100 : 100)))) : (this.selectedCharacter === 'vortex' ? 700 : 600)),
            // Iris passive - dodge bar
            dodgeBar: this.selectedCharacter === 'iris' ? 75 : 0,
            maxDodgeBar: this.selectedCharacter === 'iris' ? 75 : 0,
            dodgeHits: this.selectedCharacter === 'iris' ? 0 : 0,
            spectating: this.gameStarted || this.spectatorMode,
            lobby: this.currentLobby,
            joinedAt: Date.now()
        };

        try {
            if (this.supabaseGame) {
                console.log('📝 Joining lobby as:', playerData.name, playerData.character, playerData.role);
                
                // Mensajes según el modo de unión
                if (this.gameStarted && !this.spectatorMode) {
                    alert(`La partida en ${this.currentLobby} ya comenzó. Entrarás como espectador.`);
                } else if (this.spectatorMode) {
                    console.log(`Joining ${this.currentLobby} as spectator`);
                } else {
                    console.log(`Joining ${this.currentLobby} as player: ${playerData.character}`);
                }
                
                // Add player to local state first
                this.playersInLobby[this.myPlayerId] = playerData;
                this.players[this.myPlayerId] = playerData;
                
                console.log('Local lobby after join:', Object.values(this.playersInLobby).map(p => `${p.name}(${p.role})`));
                
                // Switch to selected lobby if different
                if (this.currentLobby !== 'lobby-1') {
                    await this.supabaseGame.switchLobby(this.currentLobby);
                    this.setupSupabaseEvents();
                }
                
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
        } else if (this.selectedCharacter === 'vortex') {
            this.abilities.q = { cooldown: 0, maxCooldown: 25000 }; // Warp Strike - 25s
            this.abilities.e = { cooldown: 0, maxCooldown: 18000 }; // Void Step - 18s
            this.abilities.r = { cooldown: 0, maxCooldown: 12000 }; // Phantom Orb - 12s
        } else if (this.selectedCharacter === 'gissel') {
            this.abilities.q = { cooldown: 0, maxCooldown: 18000 }; // Alas Puntiagudas - 18s
            this.abilities.e = { cooldown: 0, maxCooldown: 12000 };
            this.abilities.r = { cooldown: 0, maxCooldown: 15000 };
        } else if (this.selectedCharacter === 'iA777') {
            this.abilities.q = { cooldown: 0, maxCooldown: 20000 }; // Carga - 20s
            this.abilities.e = { cooldown: 0, maxCooldown: 25000 }; // Autoreparación - 25s
            this.abilities.r = { cooldown: 0, maxCooldown: 25000 }; // Sierra - 25s en LMS
        } else if (this.selectedCharacter === 'luna') {
            this.abilities.q = { cooldown: 0, maxCooldown: 20000, uses: 3, maxUses: 3 }; // Energy Juice - 20s, 3 usos
            this.abilities.e = { cooldown: 0, maxCooldown: 32000 }; // Punch - 32s
            this.abilities.r = { cooldown: 0, maxCooldown: 15000 }; // Taunt - 15s
        } else if (this.selectedCharacter === 'angel') {
            this.abilities.q = { cooldown: 0, maxCooldown: 35000 }; // Sacrificio Angelical - 35s
            this.abilities.e = { cooldown: 0, maxCooldown: 40000 }; // Dash Protector - 40s
            this.abilities.r = { cooldown: 0, maxCooldown: 25000 }; // Descanso - 25s
        } else if (this.selectedCharacter === 'iris') {
            this.abilities.q = { cooldown: 0, maxCooldown: 20000 }; // Curación - 20s
            this.abilities.e = { cooldown: 0, maxCooldown: 25000 }; // Telekinesis - 25s
            this.abilities.r = { cooldown: 0, maxCooldown: 15000 }; // Dash - 15s
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
        
        // Cargar mapa sandbox si está en modo sandbox
        if (this.sandboxMode) {
            this.mapSystem.generateMap('sandbox');
        }
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // Set canvas size for high DPI displays
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale context for high DPI
        this.ctx.scale(dpr, dpr);
        
        // Store CSS dimensions for calculations
        this.canvas.cssWidth = rect.width;
        this.canvas.cssHeight = rect.height;
        
        // Set CSS size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        console.log(`Canvas resized: ${rect.width}x${rect.height} (DPR: ${dpr})`);
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
            
            const player = this.players[this.myPlayerId];
            
            // Controles de espectador
            if (player && player.spectating) {
                const alivePlayers = Object.values(this.players).filter(p => p.alive && !p.spectating);
                if (alivePlayers.length > 0) {
                    if (key === 'arrowleft' || key === 'a') {
                        e.preventDefault();
                        this.spectatorIndex = (this.spectatorIndex - 1 + alivePlayers.length) % alivePlayers.length;
                    } else if (key === 'arrowright' || key === 'd') {
                        e.preventDefault();
                        this.spectatorIndex = (this.spectatorIndex + 1) % alivePlayers.length;
                    }
                }
                return; // No procesar otras teclas en modo espectador
            }
            
            // Abilities
            if (key === 'q') this.useAbility('q');
            if (key === 'e') this.useAbility('e');
            if (key === 'f') {
                // Verificar si es para revivir
                if (this.showRevivePrompt) {
                    const downedPlayer = this.players[this.showRevivePrompt];
                    if (downedPlayer && downedPlayer.downed) {
                        downedPlayer.beingRevived = true;
                        downedPlayer.reviveProgress = 0;
                        this.showRevivePrompt = null;
                    }
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
            const player = this.players[this.myPlayerId];
            
            // Manejar clicks en botones de espectador
            if (player && player.spectating && this.spectatorButtons) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                const alivePlayers = Object.values(this.players).filter(p => p.alive && !p.spectating);
                
                if (alivePlayers.length > 0) {
                    // Click en botón anterior
                    if (clickX >= this.spectatorButtons.prev.x && clickX <= this.spectatorButtons.prev.x + this.spectatorButtons.prev.width &&
                        clickY >= this.spectatorButtons.prev.y && clickY <= this.spectatorButtons.prev.y + this.spectatorButtons.prev.height) {
                        this.spectatorIndex = (this.spectatorIndex - 1 + alivePlayers.length) % alivePlayers.length;
                        return;
                    }
                    
                    // Click en botón siguiente
                    if (clickX >= this.spectatorButtons.next.x && clickX <= this.spectatorButtons.next.x + this.spectatorButtons.next.width &&
                        clickY >= this.spectatorButtons.next.y && clickY <= this.spectatorButtons.next.y + this.spectatorButtons.next.height) {
                        this.spectatorIndex = (this.spectatorIndex + 1) % alivePlayers.length;
                        return;
                    }
                }
            }
            
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
    
    handleTouchStart(e) {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const rect = this.canvas.getBoundingClientRect();
            // Usar directamente las coordenadas sin escalar
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // DEBUG: Guardar último toque para visualización
            if (!this.debugTouches) this.debugTouches = [];
            this.debugTouches.push({ x, y, time: Date.now(), detected: false, reason: 'none' });
            if (this.debugTouches.length > 5) this.debugTouches.shift();
            
            console.log(`Touch at (${Math.round(x)}, ${Math.round(y)})`);
            
            // Check joystick area - SOLO dentro del círculo visual
            if (this.mobileControls && this.mobileControls.joystick) {
                const joystick = this.mobileControls.joystick;
                const isLandscape = window.innerWidth > window.innerHeight;
                const baseRadius = isLandscape ? 45 : 55; // Mismo radio que el visual
                
                const joyDist = Math.sqrt(
                    Math.pow(x - joystick.x, 2) + 
                    Math.pow(y - joystick.y, 2)
                );
                
                console.log(`Touch: (${Math.round(x)}, ${Math.round(y)}), Joy: (${Math.round(joystick.x)}, ${Math.round(joystick.y)}), Dist: ${Math.round(joyDist)}px, Radius: ${baseRadius}px`);
                
                // DEBUG: Marcar si fue detectado
                if (this.debugTouches.length > 0) {
                    this.debugTouches[this.debugTouches.length - 1].joyDist = joyDist;
                    this.debugTouches[this.debugTouches.length - 1].detected = joyDist <= baseRadius;
                    this.debugTouches[this.debugTouches.length - 1].reason = joyDist <= baseRadius ? 'joystick' : 'outside';
                }
                
                // SOLO activar si está dentro del círculo visual
                if (joyDist <= baseRadius) {
                    console.log('✅ JOYSTICK ACTIVATED');
                    this.joystickState.active = true;
                    this.joystickState.startX = joystick.x;
                    this.joystickState.startY = joystick.y;
                    this.joystickState.currentX = x;
                    this.joystickState.currentY = y;
                    this.joystickState.touchId = touch.identifier;
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    return;
                }
            }
            
            // Check ability buttons with improved detection
            if (this.mobileControls && this.mobileControls.abilities) {
                for (const [key, button] of Object.entries(this.mobileControls.abilities)) {
                    const dist = Math.sqrt(
                        Math.pow(x - button.x, 2) + 
                        Math.pow(y - button.y, 2)
                    );
                    if (dist < button.touchRadius) {
                        // Haptic feedback
                        if (navigator.vibrate) {
                            navigator.vibrate(30);
                        }
                        
                        if (key === 'c') {
                            this.activateRageMode();
                        } else if (key === 'f') {
                            if (this.showRevivePrompt) {
                                const downedPlayer = this.players[this.showRevivePrompt];
                                if (downedPlayer && downedPlayer.downed) {
                                    downedPlayer.beingRevived = true;
                                    downedPlayer.reviveProgress = 0;
                                    this.showRevivePrompt = null;
                                }
                            }
                        } else {
                            this.useAbility(key);
                        }
                        return;
                    }
                }
            }
        }
        
        const canvasWidth = this.canvas.cssWidth || this.canvas.width;
        const canvasHeight = this.canvas.cssHeight || this.canvas.height;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Improved touch areas for landscape mode
        if (isLandscape) {
            // Revive area - left third of screen
            if (this.showRevivePrompt && x < canvasWidth * 0.33) {
                const downedPlayer = this.players[this.showRevivePrompt];
                if (downedPlayer && downedPlayer.downed) {
                    downedPlayer.beingRevived = true;
                    downedPlayer.reviveProgress = 0;
                    this.showRevivePrompt = null;
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(100);
                    }
                }
                return;
            }
            
            // Attack area for killers - right third of screen
            const player = this.players[this.myPlayerId];
            if (player && player.role === 'killer' && x > canvasWidth * 0.67) {
                this.handleAttack();
                
                if (navigator.vibrate) {
                    navigator.vibrate(80);
                }
                return;
            }
        } else {
            // Portrait mode touch areas
            if (this.showRevivePrompt && x < canvasWidth * 0.4) {
                const downedPlayer = this.players[this.showRevivePrompt];
                if (downedPlayer && downedPlayer.downed) {
                    downedPlayer.beingRevived = true;
                    downedPlayer.reviveProgress = 0;
                    this.showRevivePrompt = null;
                }
                return;
            }
            
            const player = this.players[this.myPlayerId];
            if (player && player.role === 'killer' && x > canvasWidth * 0.6) {
                this.handleAttack();
                return;
            }
        }
    }
    
    handleTouchMove(e) {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            if (this.joystickState.active && touch.identifier === this.joystickState.touchId) {
                const rect = this.canvas.getBoundingClientRect();
                // Usar directamente las coordenadas sin escalar
                this.joystickState.currentX = touch.clientX - rect.left;
                this.joystickState.currentY = touch.clientY - rect.top;
                
                // Update movement keys based on joystick with improved sensitivity
                const dx = this.joystickState.currentX - this.joystickState.startX;
                const dy = this.joystickState.currentY - this.joystickState.startY;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Adaptive threshold based on screen size
                const isLandscape = window.innerWidth > window.innerHeight;
                const threshold = isLandscape ? 12 : 18;
                
                if (distance > threshold) {
                    // Simple and responsive directional detection
                    this.keys['w'] = dy < -threshold;
                    this.keys['s'] = dy > threshold;
                    this.keys['a'] = dx < -threshold;
                    this.keys['d'] = dx > threshold;
                } else {
                    // Reset all movement keys when in deadzone
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
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            if (this.joystickState.active && touch.identifier === this.joystickState.touchId) {
                this.joystickState.active = false;
                this.joystickState.touchId = null;
                
                // Reset movement keys
                this.keys['w'] = false;
                this.keys['s'] = false;
                this.keys['a'] = false;
                this.keys['d'] = false;
                break;
            }
        }
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
        
        // Reset showRevivePrompt when not near downed players
        this.showRevivePrompt = null;
        

    }
    
    activateMobileControls() {
        // Mobile controls are now drawn on canvas, no DOM needed
    }
    
    forceLandscape() {
        if (!this.isMobile()) return;
        
        // Request landscape orientation
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => {
                console.log('Could not lock orientation:', err);
            });
        }
        
        // Show landscape prompt if in portrait
        this.checkOrientationPrompt();
    }
    
    checkOrientationPrompt() {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        if (isPortrait && this.isMobile()) {
            this.showLandscapePrompt();
        } else {
            this.hideLandscapePrompt();
        }
    }
    
    showLandscapePrompt() {
        if (document.getElementById('landscapePrompt')) return;
        
        const prompt = document.createElement('div');
        prompt.id = 'landscapePrompt';
        prompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10001;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem;">📱➡️📱</div>
            <div style="font-size: 1.5rem; margin-bottom: 1rem;">Rota tu dispositivo</div>
            <div style="font-size: 1rem; color: #ccc;">Para una mejor experiencia de juego</div>
        `;
        
        document.body.appendChild(prompt);
    }
    
    hideLandscapePrompt() {
        const prompt = document.getElementById('landscapePrompt');
        if (prompt) {
            prompt.remove();
        }
    }
    
    handleViewportChange() {
        if (this.canvas) {
            this.resizeCanvas();
        }
        
        if (this.isMobile()) {
            this.checkOrientationPrompt();
            // Recalculate mobile controls positions
            setTimeout(() => {
                this.updateMobileControlsLayout();
            }, 100);
        }
    }
    
    updateMobileControlsLayout() {
        if (!this.isMobile() || !this.canvas) return;
        
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Adjust control sizes based on orientation
        const buttonSize = Math.min(canvasWidth, canvasHeight) * (isLandscape ? 0.08 : 0.12);
        const spacing = buttonSize * 1.2;
        
        // Update joystick position
        const joystickX = isLandscape ? buttonSize * 1.8 : buttonSize * 1.5;
        const joystickY = canvasHeight - buttonSize * (isLandscape ? 1.5 : 1.8);
        
        // Update ability buttons position
        const buttonY = canvasHeight - buttonSize * (isLandscape ? 1.5 : 1.2);
        const startX = canvasWidth - (buttonSize * 4 + spacing * 3) - buttonSize * (isLandscape ? 1.2 : 0.5);
        
        // Store updated positions
        if (this.mobileControls) {
            this.mobileControls.joystick = {x: joystickX, y: joystickY, size: buttonSize * 1.6};
            
            const player = this.players[this.myPlayerId];
            const abilities = player && player.role === 'killer' ? ['q', 'e', 'r', 'c'] : ['q', 'e', 'r', 'f'];
            abilities.forEach((key, index) => {
                const x = startX + (buttonSize + spacing) * index;
                if (!this.mobileControls.abilities) this.mobileControls.abilities = {};
                this.mobileControls.abilities[key] = {
                    x: x,
                    y: buttonY,
                    size: buttonSize,
                    touchRadius: buttonSize/2 + 10
                };
            });
        }
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
                // Inicializar rageMode si no existe
                if (!player.rageMode) {
                    player.rageMode = { active: false, timer: 0 };
                }
                if (player.rageLevel === undefined) {
                    player.rageLevel = 0;
                }
                if (player.maxRage === undefined) {
                    player.maxRage = 500;
                }
                
                // Rage solo se gana por stuns, no gradualmente
                
                // Asegurar que rageUsed permanezca true después de usar rage mode
                if (player.rageUsed) {
                    player.rageLevel = 0; // Mantener en 0 después de usar
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

    updateVortexAbilities() {
        Object.values(this.players).forEach(player => {
            if (player.character === 'vortex') {
                // Warp Strike - movimiento teledirigido
                if (player.warpStrikeActive) {
                    player.warpStrikeTimer--;
                    
                    const nearestSurvivor = this.findNearestSurvivor(player);
                    if (nearestSurvivor && player.id === this.myPlayerId) {
                        const angle = Math.atan2(nearestSurvivor.y - player.y, nearestSurvivor.x - player.x);
                        const speed = 6.5;
                        const newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * speed));
                        const newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * speed));
                        
                        player.x = newX;
                        player.y = newY;
                        
                        // Verificar colisión con survivor para hacer daño
                        const distance = Math.sqrt(
                            Math.pow(nearestSurvivor.x - player.x, 2) + 
                            Math.pow(nearestSurvivor.y - player.y, 2)
                        );
                        
                        if (distance < 40 && !player.warpStrikeHit) {
                            player.warpStrikeHit = true;
                            player.warpStrikeActive = false;
                            
                            let damage = 35;
                            if (player.powerSurge && player.powerSurge.active) {
                                damage = Math.floor(damage * 1.5);
                            }
                            
                            nearestSurvivor.health = Math.max(0, nearestSurvivor.health - damage);
                            
                            if (nearestSurvivor.autoRepairing) {
                                nearestSurvivor.autoRepairing = false;
                                nearestSurvivor.autoRepairTimer = 0;
                            }
                            
                            if (nearestSurvivor.health <= 0) {
                                if (nearestSurvivor.lastLife || nearestSurvivor.character === 'iA777') {
                                    nearestSurvivor.alive = false;
                                    nearestSurvivor.spectating = true;
                                    this.playDeathSound();
                                    this.gameTimer += 15;
                                } else {
                                    nearestSurvivor.alive = false;
                                    nearestSurvivor.downed = true;
                                    nearestSurvivor.reviveTimer = 1200;
                                    nearestSurvivor.beingRevived = false;
                                    this.gameTimer += 10;
                                }
                            }
                            
                            this.createParticles(nearestSurvivor.x + 15, nearestSurvivor.y + 15, '#9370DB', 20);
                            this.showDamageIndicator(nearestSurvivor, damage, 'warp_strike');
                            
                            if (this.supabaseGame) {
                                this.supabaseGame.sendAttack({
                                    type: 'damage',
                                    targetId: nearestSurvivor.id,
                                    health: nearestSurvivor.health,
                                    alive: nearestSurvivor.health > 0,
                                    downed: nearestSurvivor.health <= 0 && !nearestSurvivor.lastLife && nearestSurvivor.character !== 'iA777',
                                    spectating: nearestSurvivor.health <= 0 && (nearestSurvivor.lastLife || nearestSurvivor.character === 'iA777'),
                                    damage: damage,
                                    attackerId: player.id,
                                    attackType: 'warp_strike'
                                });
                            }
                        }
                        
                        // Limitar actualizaciones de red para evitar spam
                        if (!player.warpStrikeLastUpdate || Date.now() - player.warpStrikeLastUpdate > 100) {
                            if (this.supabaseGame) {
                                this.supabaseGame.sendPlayerMove(newX, newY);
                            }
                            player.warpStrikeLastUpdate = Date.now();
                        }
                    }
                    
                    if (player.warpStrikeTimer <= 0) {
                        player.warpStrikeActive = false;
                        player.warpStrikeLastUpdate = null;
                    }
                }
                
                // Power Surge
                if (player.powerSurge && player.powerSurge.active) {
                    player.powerSurge.timer--;
                    
                    if (player.powerSurge.timer <= 0) {
                        player.powerSurge.active = false;
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
        this.mapSystem.generateMap('discord_server');
    }
    
    startGameFromRemote() {
        this.gameStarted = true;
        this.gameStartTime = Date.now();
        this.players = {...this.playersInLobby};
        this.playersInLobby = {};
        this.countdownActive = false;
        
        // Reproducir chase theme si soy 2019X o Vortex
        const myPlayer = this.players[this.myPlayerId];
        if (myPlayer && (myPlayer.character === '2019x' || myPlayer.character === 'vortex') && myPlayer.role === 'killer') {
            this.playChaseTheme();
        }
        
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
        
        // Detener chase theme durante LMS
        this.stopChaseTheme();
        
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
            
            // Curación completa para iA777 en LMS + bonus de HP
            if (lastSurvivor.character === 'iA777') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(180, lastSurvivor.health + 60);
                lastSurvivor.maxHealth = 180; // 120 base + 60 bonus
                lastSurvivor.lmsFullHeal = true;
                lastSurvivor.lmsResistance = true; // 25% menos daño
                console.log(`iA777 LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Full heal + resistance`);
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
            } else if (lastSurvivor.character === 'gissel') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(160, lastSurvivor.health + 60);
                lastSurvivor.maxHealth = 160;
                lastSurvivor.lmsGisselPower = true; // Poder especial de Gissel
                lastSurvivor.lmsResistance = true; // 20% menos daño
                console.log(`Gissel LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Gissel Power, Resistance`);
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
        
        // Detener música de LMS y chase theme
        this.stopLMSMusic();
        this.stopChaseTheme();
        
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
                        let stunDuration = player.stunHits >= 3 ? 180 : 90;
                        if (!(target.rageMode && target.rageMode.active)) {
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

    activateCharge(player) {
        player.charging = true;
        player.chargeTimer = 420;
        player.chargeHit = false;
        player.grabbedKiller = null;
        player.chargeStunned = false;
        player.chargeFlash = true;
        player.chargeFlashTimer = 60; // 1 segundo de parpadeo antes de poder agarrar
        
        this.createParticles(player.x + 15, player.y + 15, '#00FFFF', 20);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'charge_activate',
                playerId: player.id
            });
        }
    }

    updateCharge() {
        Object.values(this.players).forEach(player => {
            if (player.charging) {
                player.chargeTimer--;
                
                // Actualizar flash timer
                if (player.chargeFlashTimer > 0) {
                    player.chargeFlashTimer--;
                    if (player.chargeFlashTimer <= 0) {
                        player.chargeFlash = false;
                    }
                }
                
                // Si no ha agarrado a nadie y el flash terminó, buscar killers cercanos
                if (!player.grabbedKiller && !player.chargeFlash) {
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
                            
                            // Stunear al killer por toda la duración del charge (7s) + 3s adicionales al soltar
                            if (!(target.rageMode && target.rageMode.active)) {
                                target.stunned = true;
                                target.stunTimer = 420; // 7 segundos durante el charge
                                
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
                    player.chargeDirection = null;
                    
                    // Empujar al killer lejos antes de soltarlo
                    if (player.grabbedKiller) {
                        const killer = this.players[player.grabbedKiller];
                        if (killer) {
                            if (player.chargeDirection) {
                                const pushDistance = 150;
                                killer.x = Math.max(0, Math.min(this.worldSize.width - 30, 
                                    killer.x + player.chargeDirection.x * pushDistance));
                                killer.y = Math.max(0, Math.min(this.worldSize.height - 30, 
                                    killer.y + player.chargeDirection.y * pushDistance));
                                
                                if (this.supabaseGame) {
                                    this.supabaseGame.sendPlayerMove(killer.x, killer.y);
                                }
                            }
                            
                            // Extender stun por 3 segundos adicionales al soltarlo
                            if (!(killer.rageMode && killer.rageMode.active)) {
                                killer.stunned = true;
                                killer.stunTimer = 180; // 3 segundos adicionales después de soltar
                                
                                if (this.supabaseGame) {
                                    this.supabaseGame.sendAttack({
                                        type: 'stun',
                                        targetId: killer.id,
                                        stunDuration: 180
                                    });
                                }
                            }
                        }
                    }
                    
                    player.grabbedKiller = null;
                    player.chargeStunned = false;
                    
                    // Liberar killer
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
                
                // Regenerar 5 HP cada 180 frames (3 segundos)
                if (player.autoRepairTick >= 180 && player.id === this.myPlayerId) {
                    // En LMS, iA777 puede curar hasta su maxHealth (180)
                    // Fuera de LMS, solo hasta 100
                    let maxHealHealth = 100;
                    if (player.character === 'iA777' && this.lastManStanding) {
                        maxHealHealth = player.maxHealth; // 180 en LMS
                    }
                    
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
            // Pasiva: Inicializar contador de vida ganada
            if (player.character === 'luna' && player.lunaLifeGain === undefined) {
                player.lunaLifeGain = 0;
            }
            
            // Energy Juice - Speed II por 10s
            if (player.energyJuiceActive) {
                player.energyJuiceTimer--;
                if (player.energyJuiceTimer <= 0) {
                    player.energyJuiceActive = false;
                    player.speedBoost = false;
                }
            }
            
            // Punch - Daño 20, stun 4s, mayor daño tras 3 stuneos
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
                        
                        player.punchStuns = (player.punchStuns || 0) + 1;
                        
                        let damage = 20;
                        if (player.punchStuns >= 3) {
                            damage = 35;
                        }
                        
                        // Aplicar resistencia (menos daño, menos stun)
                        let stunDuration = 240; // 4s base
                        if (player.resistanceActive) {
                            damage = Math.floor(damage * 0.7);
                            stunDuration = 180; // 3s con resistencia
                        }
                        
                        target.health = Math.max(0, target.health - damage);
                        
                        if (!(target.rageMode && target.rageMode.active)) {
                            target.stunned = true;
                            target.stunTimer = stunDuration;
                            
                            if (target.role === 'killer' && !target.rageUsed) {
                                target.rageLevel = Math.min(target.maxRage, target.rageLevel + 30);
                            }
                        }
                        
                        // Pasiva: Ganar vida por acertar
                        if (player.id === this.myPlayerId) {
                            player.lunaLifeGain = (player.lunaLifeGain || 0) + 15;
                            player.health = Math.min(player.maxHealth, player.health + 15);
                            
                            // Activar resistencia al llegar a 30 HP ganados
                            if (player.lunaLifeGain >= 30 && !player.resistanceActive) {
                                player.resistanceActive = true;
                                player.lunaLifeGain = 0;
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
            
            // Taunt - Nublar pantalla del killer
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
                        
                        target.screenBlurred = true;
                        target.blurTimer = 300; // 5s
                        
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
    
    updateIrisAbilities() {
        Object.values(this.players).forEach(player => {
            // Dodge bar regeneration for Iris
            if (player.character === 'iris' && player.dodgeBar < player.maxDodgeBar) {
                // Regenerate 1 dodge point every 2 seconds (120 frames)
                if (!player.dodgeRegenTimer) player.dodgeRegenTimer = 0;
                player.dodgeRegenTimer++;
                
                if (player.dodgeRegenTimer >= 120) {
                    player.dodgeBar = Math.min(player.maxDodgeBar, player.dodgeBar + 1);
                    player.dodgeRegenTimer = 0;
                    
                    // Sync dodge bar with other players
                    if (player.id === this.myPlayerId && this.supabaseGame) {
                        this.supabaseGame.sendAttack({
                            type: 'dodge_regen',
                            playerId: player.id,
                            dodgeBar: player.dodgeBar
                        });
                    }
                }
            }
            
            // Healing aura
            if (player.healingAura) {
                player.healingTimer--;
                player.healingTick++;
                
                // Heal allies every 3 seconds (180 frames)
                if (player.healingTick >= 180) {
                    const nearbySurvivors = Object.values(this.players).filter(target => 
                        target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
                    );
                    
                    nearbySurvivors.forEach(target => {
                        if (target.health < target.maxHealth) {
                            target.health = Math.min(target.maxHealth, target.health + 15);
                            this.createParticles(target.x + 15, target.y + 15, '#00FF7F', 8);
                            
                            if (this.supabaseGame) {
                                this.supabaseGame.sendAttack({
                                    type: 'heal',
                                    targetId: target.id,
                                    health: target.health
                                });
                            }
                        }
                    });
                    
                    player.healingTick = 0;
                }
                
                if (player.healingTimer <= 0) {
                    player.healingAura = false;
                }
            }
            
            // Telekinesis active state
            if (player.telekinesisActive) {
                player.telekinesisTimer--;
                if (player.telekinesisTimer <= 0) {
                    player.telekinesisActive = false;
                }
            }
            
            // Telekinesis effect on targets
            if (player.telekinesisEffect) {
                player.telekinesisTimer--;
                if (player.telekinesisTimer <= 0) {
                    player.telekinesisEffect = false;
                }
            }
            
            // Iris dash
            if (player.irisDashActive) {
                player.irisDashTimer--;
                if (player.irisDashTimer <= 0) {
                    player.irisDashActive = false;
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
                    // Increase timer by 15 seconds on death
                    this.gameTimer += 15;
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
                    } else if (this.showRevivePrompt === player.id) {
                        // Clear prompt if no longer near
                        const myPlayer = this.players[this.myPlayerId];
                        if (myPlayer && Math.sqrt(Math.pow(myPlayer.x - player.x, 2) + Math.pow(myPlayer.y - player.y, 2)) >= 50) {
                            this.showRevivePrompt = null;
                        }
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
                    if (this.gameTimer === 80 && !this.mapSystem.escapeRing && !this.lastManStanding) {
                        this.mapSystem.showEscapeRing();
                    }
                }
            }
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
                this.updateVortexAbilities();
                this.updateSharpWings();
                this.updateYouCantRun();
                this.updateCharge();
                this.updateAutoRepair();
                this.updateSelfDestruct();
                this.updateLunaAbilities();
                this.updateAngelAbilities();
                this.updateIrisAbilities();
                this.updateReviveSystem();
                this.updateGameTimer();
                this.updatePing();
                this.updateDamageIndicators();
                this.updateChaseThemeVolume();
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

        // Balanced base speeds for all characters
        let speed;
        if (player.role === 'killer') {
            // Killers base speed: 4.2 (slower than before)
            speed = player.character === 'vortex' ? 4.4 : 4.2;
        } else {
            // Survivors base speed: 4.0 (slightly slower than killers)
            speed = 4.0;
        }
        
        // Rage mode speed boost para killers (moderado)
        if (player.role === 'killer' && player.rageMode && player.rageMode.active) {
            speed = 5.8; // Boost moderado en rage mode
        }
        
        // iA777 speed boost en LMS (equilibrado)
        if (player.character === 'iA777' && this.lastManStanding) {
            speed = 4.8; // Boost menor en LMS
        }
        
        // Luna speed boost (equilibrado)
        if (player.character === 'luna' && (player.speedBoost || player.lmsSpeedBoost)) {
            speed = 5.2; // Boost moderado
        }
        
        // Angel speed boost para aliados (equilibrado)
        if (player.angelSpeedBoost) {
            speed = 4.8; // Boost menor para aliados
        }
        // Handle gamepad input
        this.updateGamepadInput();
        
        let moved = false;
        let newX = player.x;
        let newY = player.y;

        // You Can't Run movement override (velocidad reducida)
        if (player.youCantRunActive) {
            if (this.lastMouseX && this.lastMouseY) {
                const angle = Math.atan2(this.lastMouseY - (player.y + 15), this.lastMouseX - (player.x + 15));
                const distance = Math.sqrt(
                    Math.pow(this.lastMouseX - (player.x + 15), 2) + 
                    Math.pow(this.lastMouseY - (player.y + 15), 2)
                );
                
                if (distance > 10) {
                    const moveSpeed = 6.5; // Reducido de 8 a 6.5
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
                    const moveSpeed = 5.5; // Reducido de 6 a 5.5
                    newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + Math.cos(angle) * moveSpeed));
                    newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + Math.sin(angle) * moveSpeed));
                    moved = true;
                }
            }
        } else if (player.charging && !player.wallStunned) {
            // Movimiento automático con control de dirección
            const chargeSpeed = 7.0;
            let dirX = 0;
            let dirY = 0;
            
            // Obtener dirección del input (teclado o joystick)
            if (this.keys['w'] || this.keys['arrowup']) dirY = -1;
            if (this.keys['s'] || this.keys['arrowdown']) dirY = 1;
            if (this.keys['a'] || this.keys['arrowleft']) dirX = -1;
            if (this.keys['d'] || this.keys['arrowright']) dirX = 1;
            
            // Si no hay input, mantener última dirección o ir recto
            if (!player.chargeDirection) {
                player.chargeDirection = { x: 0, y: 1 }; // Dirección inicial hacia abajo
            }
            
            // Actualizar dirección si hay input
            if (dirX !== 0 || dirY !== 0) {
                const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
                player.chargeDirection.x = dirX / magnitude;
                player.chargeDirection.y = dirY / magnitude;
            }
            
            // Mover automáticamente en la dirección actual
            newX = Math.max(0, Math.min(this.worldSize.width - 30, player.x + player.chargeDirection.x * chargeSpeed));
            newY = Math.max(0, Math.min(this.worldSize.height - 30, player.y + player.chargeDirection.y * chargeSpeed));
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

    updateGamepadInput() {
        if (this.gamepadIndex === null) return;
        
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;
        
        // Left stick movement (axes 0,1)
        const deadzone = 0.2;
        const leftX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
        const leftY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
        
        this.keys['a'] = leftX < -deadzone;
        this.keys['d'] = leftX > deadzone;
        this.keys['w'] = leftY < -deadzone;
        this.keys['s'] = leftY > deadzone;
        
        // Buttons
        const buttons = {
            0: 'space', // A button - attack
            1: 'q',     // B button - Q ability
            2: 'e',     // X button - E ability
            3: 'r',     // Y button - R ability
            4: 'c',     // LB - C ability
            9: 'escape' // Start - pause/menu
        };
        
        Object.keys(buttons).forEach(buttonIndex => {
            const button = gamepad.buttons[buttonIndex];
            const key = buttons[buttonIndex];
            const wasPressed = this.gamepadButtons[buttonIndex];
            const isPressed = button && button.pressed;
            
            if (isPressed && !wasPressed) {
                if (key === 'space') this.handleAttack();
                else if (key === 'q') this.useAbility('q');
                else if (key === 'e') this.useAbility('e');
                else if (key === 'r') this.useAbility('r');
                else if (key === 'c') this.activateRageMode();
            }
            
            this.gamepadButtons[buttonIndex] = isPressed;
        });
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
            // Para Luna: no resetear usos automáticamente, solo cuando el cooldown termina Y aún tiene usos
            if (this.abilities.q.cooldown === 0 && this.selectedCharacter === 'luna' && this.abilities.q.uses > 0) {
                // El cooldown terminó pero aún hay usos disponibles, no hacer nada
                // Solo resetear usos cuando se agoten todas (uses === 0)
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
            } else if (hitbox.type === 'phantom_orb') {
                // Mover phantom orb
                hitbox.x += hitbox.vx;
                hitbox.y += hitbox.vy;
                
                // Verificar límites del mundo
                if (hitbox.x < 0 || hitbox.x > this.worldSize.width || 
                    hitbox.y < 0 || hitbox.y > this.worldSize.height) {
                    hitbox.life = 0;
                }
                
                // Explotar después de un tiempo si no tocó a nadie
                if (hitbox.life <= 0 && !hitbox.exploded) {
                    hitbox.exploded = true;
                    this.createParticles(hitbox.x, hitbox.y, '#8A2BE2', 25);
                    // No hace daño si explota por tiempo
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
                    // Increase timer by 15 seconds on death
                    this.gameTimer += 15;
                } else {
                    target.alive = false;
                    target.downed = true;
                    target.reviveTimer = 1200;
                    target.beingRevived = false;
                    // Increase timer by 10 seconds on down
                    this.gameTimer += 10;
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
                damage = Math.floor(damage * 1.5);
            }
            
            // Iris dodge mechanic
            if (target.character === 'iris' && target.dodgeBar > 0) {
                target.dodgeHits++;
                if (target.dodgeHits <= 2) {
                    target.dodgeBar = Math.max(0, target.dodgeBar - 37.5);
                    this.createParticles(target.x + 15, target.y + 15, '#00BFFF', 15);
                    this.showDamageIndicator(target, 0, 'dodged');
                    
                    // Sync dodge bar consumption
                    if (target.id === this.myPlayerId && this.supabaseGame) {
                        this.supabaseGame.sendAttack({
                            type: 'dodge_regen',
                            playerId: target.id,
                            dodgeBar: target.dodgeBar
                        });
                    }
                    return;
                }
            }
            
            // Aplicar resistencia de LMS
            if (target.character === 'luna' && target.lmsResistance) {
                damage = Math.floor(damage * 0.8);
            } else if (target.character === 'iA777' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75);
            } else if (target.character === 'angel' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75);
            } else if (target.character === 'gissel' && target.lmsResistance) {
                damage = Math.floor(damage * 0.8);
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
                    // Increase timer by 15 seconds on death
                    this.gameTimer += 15;
                } else {
                    target.alive = false;
                    target.downed = true;
                    target.reviveTimer = 1200;
                    target.beingRevived = false;
                    // Increase timer by 10 seconds on down
                    this.gameTimer += 10;
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
                damage = Math.floor(damage * 1.5);
            }
            
            // Iris dodge mechanic for white orb
            if (target.character === 'iris' && target.dodgeBar > 0) {
                target.dodgeHits++;
                if (target.dodgeHits <= 2) {
                    target.dodgeBar = Math.max(0, target.dodgeBar - 37.5);
                    this.createParticles(target.x + 15, target.y + 15, '#00BFFF', 15);
                    this.showDamageIndicator(target, 0, 'dodged');
                    
                    // Sync dodge bar consumption
                    if (target.id === this.myPlayerId && this.supabaseGame) {
                        this.supabaseGame.sendAttack({
                            type: 'dodge_regen',
                            playerId: target.id,
                            dodgeBar: target.dodgeBar
                        });
                    }
                    
                    hitbox.life = 0;
                    return;
                }
            }
            
            // Aplicar resistencia de LMS
            if (target.character === 'luna' && target.lmsResistance) {
                damage = Math.floor(damage * 0.8);
            } else if (target.character === 'iA777' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75);
            } else if (target.character === 'angel' && target.lmsResistance) {
                damage = Math.floor(damage * 0.75);
            } else if (target.character === 'gissel' && target.lmsResistance) {
                damage = Math.floor(damage * 0.8);
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
                    // Increase timer by 15 seconds on death
                    this.gameTimer += 15;
                } else {
                    target.alive = false;
                    target.downed = true;
                    target.reviveTimer = 1200;
                    target.beingRevived = false;
                    // Increase timer by 10 seconds on down
                    this.gameTimer += 10;
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
        } else if (hitbox.type === 'phantom_orb' && target.role === 'survivor' && !hitbox.exploded) {
            // Phantom orb explota si está cerca del survivor
            const distance = Math.sqrt(
                Math.pow(target.x + 15 - hitbox.x, 2) + 
                Math.pow(target.y + 15 - hitbox.y, 2)
            );
            
            // Explotar si está cerca del survivor (dentro del radio)
            if (distance <= hitbox.radius + 30) {
                hitbox.exploded = true;
                this.createParticles(hitbox.x, hitbox.y, '#8A2BE2', 25);
                
                // Daño de explosión en área
                Object.values(this.players).forEach(nearbyTarget => {
                    if (nearbyTarget.role === 'survivor' && nearbyTarget.alive) {
                        const explosionDistance = Math.sqrt(
                            Math.pow(nearbyTarget.x + 15 - hitbox.x, 2) + 
                            Math.pow(nearbyTarget.y + 15 - hitbox.y, 2)
                        );
                        
                        if (explosionDistance <= 80) {
                            const attacker = this.players[hitbox.ownerId];
                            let damage = 35;
                            
                            if (attacker && attacker.powerSurge && attacker.powerSurge.active) {
                                damage = Math.floor(damage * 2);
                            }
                            
                            nearbyTarget.health = Math.max(0, nearbyTarget.health - damage);
                            
                            if (nearbyTarget.health <= 0) {
                                if (nearbyTarget.lastLife || nearbyTarget.character === 'iA777') {
                                    nearbyTarget.alive = false;
                                    nearbyTarget.spectating = true;
                                } else {
                                    nearbyTarget.alive = false;
                                    nearbyTarget.downed = true;
                                    nearbyTarget.reviveTimer = 1200;
                                }
                            }
                            
                            this.createParticles(nearbyTarget.x + 15, nearbyTarget.y + 15, '#8A2BE2', 15);
                            this.showDamageIndicator(nearbyTarget, damage, 'phantom_orb');
                        }
                    }
                });
                
                hitbox.life = 0;
            }
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
        } else if (player.character === 'vortex') {
            if (ability === 'q') {
                this.activateWarpStrike(player);
            } else if (ability === 'e') {
                this.activateVoidStep(player);
            } else if (ability === 'r') {
                this.launchPhantomOrb(player);
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
                // Siempre aplicar cooldown de 20s, excepto cuando se acaban todas
                abilityData.cooldown = abilityData.maxCooldown;
            } else if (ability === 'e') {
                this.activateLunaPunch(player);
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
        } else if (player.character === 'iris') {
            if (ability === 'q') {
                this.activateHealing(player);
            } else if (ability === 'e') {
                this.activateTelekinesis(player);
            } else if (ability === 'r') {
                this.activateIrisDash(player);
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

    activateLunaPunch(player) {
        const nearestKiller = Object.values(this.players).find(p => 
            p.role === 'killer' && p.alive && p.id !== player.id
        );
        
        if (!nearestKiller) return;
        
        const angle = Math.atan2(nearestKiller.y - player.y, nearestKiller.x - player.x);
        const dashDistance = 80;
        const newX = Math.max(0, Math.min(this.worldSize.width - 30, 
            player.x + Math.cos(angle) * dashDistance));
        const newY = Math.max(0, Math.min(this.worldSize.height - 30, 
            player.y + Math.sin(angle) * dashDistance));
        
        player.x = newX;
        player.y = newY;
        player.punchActive = true;
        player.punchTimer = 60;
        
        const distance = Math.sqrt(
            Math.pow(nearestKiller.x - newX, 2) + 
            Math.pow(nearestKiller.y - newY, 2)
        );
        
        if (distance < 50 && player.id === this.myPlayerId) {
            player.punchStuns = (player.punchStuns || 0) + 1;
            
            let damage = 20;
            if (player.punchStuns >= 3) damage = 35;
            
            let stunDuration = 240;
            if (player.resistanceActive) {
                damage = Math.floor(damage * 0.7);
                stunDuration = 180;
            }
            
            nearestKiller.health = Math.max(0, nearestKiller.health - damage);
            
            if (!(nearestKiller.rageMode && nearestKiller.rageMode.active)) {
                nearestKiller.stunned = true;
                nearestKiller.stunTimer = stunDuration;
                
                if (!nearestKiller.rageUsed) {
                    nearestKiller.rageLevel = Math.min(nearestKiller.maxRage, nearestKiller.rageLevel + 30);
                }
            }
            
            player.lunaLifeGain = (player.lunaLifeGain || 0) + 15;
            player.health = Math.min(player.maxHealth, player.health + 15);
            
            if (player.lunaLifeGain >= 30 && !player.resistanceActive) {
                player.resistanceActive = true;
                player.lunaLifeGain = 0;
                this.createParticles(player.x + 15, player.y + 15, '#9370DB', 20);
            }
            
            this.createParticles(nearestKiller.x + 15, nearestKiller.y + 15, '#FFD700', 20);
            
            if (this.supabaseGame) {
                this.supabaseGame.sendAttack({
                    type: 'punch_hit',
                    targetId: nearestKiller.id,
                    damage: damage,
                    stunDuration: stunDuration,
                    puncherId: player.id,
                    puncherHealth: player.health
                });
            }
        }
        
        if (this.supabaseGame) {
            this.supabaseGame.sendPlayerMove(newX, newY);
        }
        
        this.createParticles(player.x + 15, player.y + 15, '#FFD700', 15);
    }

    activateEnergyJuice(player) {
        player.energyJuiceActive = true;
        player.energyJuiceTimer = 600;
        player.speedBoost = true;
        
        this.createParticles(player.x + 15, player.y + 15, '#00FFFF', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'energy_juice_activate',
                playerId: player.id
            });
        }
    }

    activateTaunt(player) {
        player.tauntActive = true;
        player.tauntTimer = 60;
        player.tauntHit = false;
        
        this.createParticles(player.x + 15, player.y + 15, '#FF69B4', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'taunt_activate',
                playerId: player.id
            });
        }
    }

    activateRageMode() {
        const player = this.players[this.myPlayerId];
        if (!player || !player.alive || player.role !== 'killer') return;
        
        if (player.character === 'vortex') {
            if (player.powerSurgeUsed) return;
            
            // Power Surge para Vortex
            player.powerSurge = { active: true, timer: 3600 }; // 1 minuto
            player.powerSurgeUsed = true;
            
            this.createParticles(player.x + 15, player.y + 15, '#9370DB', 30);
            
            if (this.supabaseGame) {
                this.supabaseGame.sendAttack({
                    type: 'power_surge',
                    playerId: player.id,
                    powerSurge: player.powerSurge,
                    powerSurgeUsed: true
                });
            }
        } else {
            if (player.rageLevel < player.maxRage || player.rageMode.active || player.rageUsed) return;
            if (this.lastManStanding) return;
            
            // Rage Mode para otros killers
            player.rageMode = { active: true, timer: 3600 }; // Reducido de 90s a 60s
            player.rageLevel = 0;
            player.rageUsed = true;
            
            this.createParticles(player.x + 15, player.y + 15, '#FF4500', 30);
            
            if (this.supabaseGame) {
                this.supabaseGame.sendAttack({
                    type: 'rage_mode',
                    playerId: player.id,
                    rageMode: player.rageMode,
                    rageUsed: true
                });
            }
        }
    }

    activateWarpStrike(player) {
        // Teleport a ubicación random
        const randomX = Math.random() * (this.worldSize.width - 30);
        const randomY = Math.random() * (this.worldSize.height - 30);
        
        player.x = randomX;
        player.y = randomY;
        player.warpStrikeActive = true;
        player.warpStrikeTimer = 300; // 5 segundos
        player.warpStrikeLastUpdate = null;
        player.warpStrikeHit = false;
        
        this.createParticles(randomX + 15, randomY + 15, '#9370DB', 20);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendPlayerMove(randomX, randomY);
            this.supabaseGame.sendAttack({
                type: 'warp_strike_activate',
                playerId: player.id
            });
        }
    }

    activateVoidStep(player) {
        const nearestSurvivor = this.findNearestSurvivor(player);
        if (!nearestSurvivor) return;
        
        // Teleport cerca del survivor
        const angle = Math.random() * Math.PI * 2;
        const distance = 60;
        const newX = Math.max(0, Math.min(this.worldSize.width - 30, nearestSurvivor.x + Math.cos(angle) * distance));
        const newY = Math.max(0, Math.min(this.worldSize.height - 30, nearestSurvivor.y + Math.sin(angle) * distance));
        
        player.x = newX;
        player.y = newY;
        
        this.createParticles(newX + 15, newY + 15, '#4B0082', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendPlayerMove(newX, newY);
        }
    }

    launchPhantomOrb(player) {
        const nearestSurvivor = this.findNearestSurvivor(player);
        if (!nearestSurvivor) return;
        
        const angle = Math.atan2(nearestSurvivor.y - player.y, nearestSurvivor.x - player.x);
        const speed = 8;
        
        const orbData = {
            type: 'phantom_orb',
            x: player.x + 15,
            y: player.y + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 20,
            life: 240,
            ownerId: player.id,
            color: '#8A2BE2',
            hasHit: false,
            exploded: false
        };
        
        this.hitboxes.push(orbData);
        this.createParticles(player.x + 15, player.y + 15, '#8A2BE2', 12);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'phantom_orb',
                attackData: orbData,
                playerId: player.id
            });
        }
    }

    findNearestSurvivor(killer) {
        const survivors = Object.values(this.players).filter(p => 
            p.role === 'survivor' && p.alive && !p.downed
        );
        
        if (survivors.length === 0) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        survivors.forEach(survivor => {
            const distance = Math.sqrt(
                Math.pow(killer.x - survivor.x, 2) + 
                Math.pow(killer.y - survivor.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = survivor;
            }
        });
        
        return nearest;
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
        this.mapSystem.drawMapObjects(this.ctx, this.camera);
        
        // Draw players
        Object.values(this.players).forEach(player => {
            this.drawPlayer(player);
        });
        
        this.renderParticles();
        this.drawHitboxes();
        
        this.ctx.restore();
        
        this.drawUI();
        this.mapSystem.drawEscapeRing(this.ctx, this.camera);
        this.drawDamageIndicators();
        this.drawHitConfirmation();
        
        // Update mobile controls UI
        const player = this.players[this.myPlayerId];
        if (player && this.isMobile()) {
            this.drawMobileControls(player);
            this.drawVirtualJoystick();
            
            // Draw mobile UI indicators
            const canvasWidth = this.canvas.cssWidth || this.canvas.width;
            const canvasHeight = this.canvas.cssHeight || this.canvas.height;
            const isLandscape = window.innerWidth > window.innerHeight;
            
            // VISUALIZAR ÁREAS DE DETECCIÓN (solo cuando están activas)
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Área de revivir (izquierda) - SOLO cuando showRevivePrompt está activo
            if (this.showRevivePrompt) {
                const reviveWidth = isLandscape ? canvasWidth * 0.33 : canvasWidth * 0.4;
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                this.ctx.fillRect(0, 0, reviveWidth, canvasHeight);
            }
            
            // Área de ataque para killers (derecha) - siempre visible para killers
            if (player.role === 'killer') {
                const attackAreaStart = isLandscape ? canvasWidth * 0.67 : canvasWidth * 0.6;
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
                this.ctx.fillRect(attackAreaStart, 0, canvasWidth - attackAreaStart, canvasHeight);
            }
            
            this.ctx.restore();
            
            // Draw revive prompt for mobile
            if (this.showRevivePrompt) {
                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                const reviveWidth = isLandscape ? canvasWidth * 0.33 : canvasWidth * 0.4;
                const promptHeight = isLandscape ? 50 : 60;
                const promptY = canvasHeight/2 - promptHeight/2;
                
                // Semi-transparent overlay
                this.ctx.fillStyle = 'rgba(0,255,0,0.15)';
                this.ctx.fillRect(0, 0, reviveWidth, canvasHeight);
                
                // Revive prompt box
                this.ctx.fillStyle = 'rgba(0,255,0,0.9)';
                this.ctx.fillRect(10, promptY, Math.min(220, reviveWidth - 20), promptHeight);
                
                this.ctx.fillStyle = '#000';
                this.ctx.font = `bold ${isLandscape ? '14px' : '16px'} Arial`;
                this.ctx.textAlign = 'left';
                
                if (isLandscape) {
                    this.ctx.fillText('Toca área verde', 15, promptY + 20);
                    this.ctx.fillText('para revivir', 15, promptY + 35);
                } else {
                    this.ctx.fillText('Toca lado izquierdo', 15, promptY + 25);
                    this.ctx.fillText('para revivir', 15, promptY + 45);
                }
                
                this.ctx.restore();
            }
            
            // Draw attack area indicator for killers
            if (player.role === 'killer') {
                this.ctx.save();
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                const attackAreaStart = isLandscape ? canvasWidth * 0.67 : canvasWidth * 0.6;
                const attackAreaWidth = canvasWidth - attackAreaStart;
                
                // Semi-transparent attack area
                this.ctx.fillStyle = 'rgba(255,0,0,0.1)';
                this.ctx.fillRect(attackAreaStart, 0, attackAreaWidth, canvasHeight);
                
                // Attack indicator
                this.ctx.fillStyle = 'rgba(255,0,0,0.8)';
                this.ctx.font = `bold ${isLandscape ? '16px' : '14px'} Arial`;
                this.ctx.textAlign = 'center';
                
                const textX = attackAreaStart + attackAreaWidth/2;
                const textY = canvasHeight - (isLandscape ? 30 : 20);
                
                this.ctx.fillText('ATACAR', textX, textY);
                
                // Attack icon
                this.ctx.font = `${isLandscape ? '24px' : '20px'} Arial`;
                this.ctx.fillText('⚔️', textX, textY - (isLandscape ? 30 : 25));
                
                this.ctx.restore();
            }
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
        } else if (player.character === 'vortex') {
            // Efectos especiales de Vortex
            if (player.warpStrikeActive) {
                this.ctx.shadowColor = '#9370DB';
                this.ctx.shadowBlur = 20;
            } else if (player.powerSurge && player.powerSurge.active) {
                this.ctx.shadowColor = '#8A2BE2';
                this.ctx.shadowBlur = 25;
            }
            
            // Cubo púrpura para Vortex
            let color1 = '#8A2BE2';
            let color2 = '#4B0082';
            
            if (player.powerSurge && player.powerSurge.active) {
                color1 = '#9370DB';
                color2 = '#6A0DAD';
            }
            
            this.ctx.fillStyle = color1;
            this.ctx.fillRect(player.x, player.y, size, size);
            this.ctx.fillStyle = color2;
            this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            let emoji = '🌀';
            if (player.warpStrikeActive) emoji = '⚡';
            else if (player.powerSurge && player.powerSurge.active) emoji = '🔮';
            
            this.ctx.fillText(emoji, player.x + size/2, player.y + size/2 + 5);
            
            // Indicadores de habilidades
            if (player.warpStrikeActive) {
                this.ctx.fillStyle = '#9370DB';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('WARP STRIKE', player.x + size/2, player.y - 15);
            }
            if (player.powerSurge && player.powerSurge.active) {
                this.ctx.fillStyle = '#8A2BE2';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('POWER SURGE', player.x + size/2, player.y - 25);
            }
            
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
                
                // Efecto de parpadeo durante chargeFlash
                if (player.chargeFlash) {
                    const flash = Math.sin(Date.now() * 0.03) > 0;
                    if (flash) {
                        this.ctx.shadowBlur = 25;
                        this.ctx.globalAlpha = 0.7;
                    }
                }
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
        } else if (player.character === 'iris') {
            // Efectos especiales de Iris
            if (player.healingAura) {
                this.ctx.shadowColor = '#00FF7F';
                this.ctx.shadowBlur = 15;
            } else if (player.telekinesisActive) {
                this.ctx.shadowColor = '#9370DB';
                this.ctx.shadowBlur = 12;
            } else if (player.irisDashActive) {
                this.ctx.shadowColor = '#00BFFF';
                this.ctx.shadowBlur = 10;
            }
            
            // Cubo púrpura para Iris
            let color1 = '#9370DB';
            let color2 = '#8A2BE2';
            
            if (player.healingAura) {
                color1 = '#00FF7F';
                color2 = '#32CD32';
            } else if (player.telekinesisActive) {
                color1 = '#9370DB';
                color2 = '#4B0082';
            }
            
            this.ctx.fillStyle = color1;
            this.ctx.fillRect(player.x, player.y, size, size);
            this.ctx.fillStyle = color2;
            this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            
            let emoji = '🔮'; // Crystal ball
            if (player.healingAura) emoji = '💚'; // Green heart
            else if (player.telekinesisActive) emoji = '🌀'; // Cyclone
            else if (player.irisDashActive) emoji = '💨'; // Dash
            
            this.ctx.fillText(emoji, player.x + size/2, player.y + size/2 + 5);
            
            // Indicadores de habilidades
            if (player.healingAura) {
                this.ctx.fillStyle = '#00FF7F';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('HEALING AURA', player.x + size/2, player.y - 15);
            }
            if (player.telekinesisActive) {
                this.ctx.fillStyle = '#9370DB';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText('TELEKINESIS', player.x + size/2, player.y - 25);
            }
            
            this.ctx.shadowBlur = 0;
        } else if (player.character === 'spectator') {
            this.ctx.fillStyle = '#666666';
            this.ctx.fillRect(player.x, player.y, size, size);
            this.ctx.fillStyle = '#999999';
            this.ctx.fillRect(player.x + 3, player.y + 3, size - 6, size - 6);
            
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👁️', player.x + size/2, player.y + size/2 + 5);
            
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
        
        // Name - Estilo Outcome Memories
        const nameY = player.y - 42;
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(player.name || 'Unknown', player.x + size/2, nameY);
        this.ctx.restore();
        
        // Health bar
        this.drawHealthBar(player);
        
        // Dodge bar for Iris
        if (player.character === 'iris') {
            this.drawDodgeBar(player);
        }
        
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
            if (player.alive && player.health > 50) {
                iconSrc = 'assets/icons/LunaNormalIcon.png';
            } else if (player.alive && player.health <= 50) {
                iconSrc = 'assets/icons/LunaDangerIcon.png';
            } else {
                iconSrc = 'assets/icons/LunaDeadIcon.png';
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
        } else if (player.role === 'survivor' && player.character === 'iA777') {
            let iconSrc;
            if (player.alive && player.health > 60) {
                iconSrc = 'assets/icons/IA777NormalIcon.png';
            } else if (player.alive && player.health <= 60) {
                iconSrc = 'assets/icons/IA777DangerIcon.png';
            } else {
                iconSrc = 'assets/icons/IA777DeadIcon.png';
            }
            
            if (!this.ia777Icons) {
                this.ia777Icons = {};
            }
            
            if (!this.ia777Icons[iconSrc]) {
                this.ia777Icons[iconSrc] = new Image();
                this.ia777Icons[iconSrc].src = iconSrc;
            }
            
            if (this.isImageValid(this.ia777Icons[iconSrc])) {
                this.ctx.drawImage(this.ia777Icons[iconSrc], x - 18, y - 2, 12, 12);
            }
        }
        
        // Sistema viejo - simple
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
    
    drawDodgeBar(player) {
        const barWidth = 60;
        const barHeight = 6;
        const x = player.x - 15;
        const y = player.y - 45;
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        this.ctx.fillStyle = '#00BFFF';
        this.ctx.fillRect(x, y, (player.dodgeBar / player.maxDodgeBar) * barWidth, barHeight);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 8px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Dodge: ${player.dodgeBar}/${player.maxDodgeBar}`, x + barWidth/2, y - 2);
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
        
        // Player info - Estilo Outcome Memories
        const player = this.players[this.myPlayerId];
        if (player) {
            const hudX = 15;
            const hudY = 15;
            const hudWidth = 250;
            const hudHeight = 90;
            const iconSize = 60;
            
            // Sombra del HUD
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 3;
            this.ctx.shadowOffsetY = 3;
            
            // Fondo del HUD con gradiente
            const bgGradient = this.ctx.createLinearGradient(hudX, hudY, hudX, hudY + hudHeight);
            bgGradient.addColorStop(0, 'rgba(20, 20, 30, 0.95)');
            bgGradient.addColorStop(1, 'rgba(10, 10, 20, 0.95)');
            this.ctx.fillStyle = bgGradient;
            this.ctx.fillRect(hudX, hudY, hudWidth, hudHeight);
            this.ctx.restore();
            
            // Borde superior decorativo
            const borderGradient = this.ctx.createLinearGradient(hudX, hudY, hudX + hudWidth, hudY);
            borderGradient.addColorStop(0, '#7289DA');
            borderGradient.addColorStop(0.5, '#5B6EAE');
            borderGradient.addColorStop(1, '#7289DA');
            this.ctx.fillStyle = borderGradient;
            this.ctx.fillRect(hudX, hudY, hudWidth, 3);
            
            // Recuadro del icono del personaje
            const iconX = hudX + 10;
            const iconY = hudY + 15;
            
            // Fondo del recuadro del icono
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(iconX - 2, iconY - 2, iconSize + 4, iconSize + 4);
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(iconX, iconY, iconSize, iconSize);
            
            // Borde del recuadro del icono
            this.ctx.strokeStyle = '#7289DA';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(iconX, iconY, iconSize, iconSize);
            
            // Icono del personaje usando los iconos existentes
            let hudIconSrc = null;
            
            if (player.character === 'gissel') {
                hudIconSrc = 'assets/icons/GisselInactiveIcon.png';
                if (!this.gisselIcon) {
                    this.gisselIcon = new Image();
                    this.gisselIcon.src = hudIconSrc;
                }
                if (this.isImageValid(this.gisselIcon)) {
                    this.ctx.drawImage(this.gisselIcon, iconX + 10, iconY + 10, iconSize - 20, iconSize - 20);
                }
            } else if (player.character === 'luna') {
                if (player.alive && player.health > 50) {
                    hudIconSrc = 'assets/icons/LunaNormalIcon.png';
                } else if (player.alive && player.health <= 50) {
                    hudIconSrc = 'assets/icons/LunaDangerIcon.png';
                } else {
                    hudIconSrc = 'assets/icons/LunaDeadIcon.png';
                }
                if (!this.lunaIcons) this.lunaIcons = {};
                if (!this.lunaIcons[hudIconSrc]) {
                    this.lunaIcons[hudIconSrc] = new Image();
                    this.lunaIcons[hudIconSrc].src = hudIconSrc;
                }
                if (this.isImageValid(this.lunaIcons[hudIconSrc])) {
                    this.ctx.drawImage(this.lunaIcons[hudIconSrc], iconX + 10, iconY + 10, iconSize - 20, iconSize - 20);
                }
            } else if (player.character === 'iA777') {
                if (player.alive && player.health > 60) {
                    hudIconSrc = 'assets/icons/IA777NormalIcon.png';
                } else if (player.alive && player.health <= 60) {
                    hudIconSrc = 'assets/icons/IA777DangerIcon.png';
                } else {
                    hudIconSrc = 'assets/icons/IA777DeadIcon.png';
                }
                if (!this.ia777Icons) this.ia777Icons = {};
                if (!this.ia777Icons[hudIconSrc]) {
                    this.ia777Icons[hudIconSrc] = new Image();
                    this.ia777Icons[hudIconSrc].src = hudIconSrc;
                }
                if (this.isImageValid(this.ia777Icons[hudIconSrc])) {
                    this.ctx.drawImage(this.ia777Icons[hudIconSrc], iconX + 10, iconY + 10, iconSize - 20, iconSize - 20);
                }
            } else if (player.character === 'angel') {
                if (player.alive && player.health > 50) {
                    hudIconSrc = 'assets/icons/AngelNormalIcon.png';
                } else if (player.alive && player.health <= 50) {
                    hudIconSrc = 'assets/icons/AngelDangerIcon.png';
                } else {
                    hudIconSrc = 'assets/icons/AngelDeadIcon.png';
                }
                if (!this.angelIcons) this.angelIcons = {};
                if (!this.angelIcons[hudIconSrc]) {
                    this.angelIcons[hudIconSrc] = new Image();
                    this.angelIcons[hudIconSrc].src = hudIconSrc;
                }
                if (this.isImageValid(this.angelIcons[hudIconSrc])) {
                    this.ctx.drawImage(this.angelIcons[hudIconSrc], iconX + 10, iconY + 10, iconSize - 20, iconSize - 20);
                }
            } else if (player.character === 'iris') {
                if (player.alive && player.health > 50) {
                    hudIconSrc = 'assets/icons/IrisNormalIcon.png';
                } else if (player.alive && player.health <= 50) {
                    hudIconSrc = 'assets/icons/IrisDangerIcon.png';
                } else {
                    hudIconSrc = 'assets/icons/IrisDeadIcon.png';
                }
                if (!this.irisIcons) this.irisIcons = {};
                if (!this.irisIcons[hudIconSrc]) {
                    this.irisIcons[hudIconSrc] = new Image();
                    this.irisIcons[hudIconSrc].src = hudIconSrc;
                }
                if (this.isImageValid(this.irisIcons[hudIconSrc])) {
                    this.ctx.drawImage(this.irisIcons[hudIconSrc], iconX + 10, iconY + 10, iconSize - 20, iconSize - 20);
                }
            } else {
                // Fallback para personajes sin icono
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const iconEmoji = player.role === 'survivor' ? '🛡️' : '⚔️';
                this.ctx.fillText(iconEmoji, iconX + iconSize/2, iconY + iconSize/2);
            }
            
            // Nombre del jugador con sombra (a la derecha del icono)
            const textX = iconX + iconSize + 15;
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(player.name, textX, iconY + 5);
            this.ctx.restore();
            
            // Personaje
            this.ctx.fillStyle = '#B0B0B0';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(player.character.toUpperCase(), textX, iconY + 28);
            
            // Barra de HP - Estilo Outcome Memories (a la derecha del icono)
            const hpBarX = textX;
            const hpBarY = iconY + 42;
            const hpBarWidth = hudWidth - (textX - hudX) - 15;
            const hpBarHeight = 18;
            
            // Fondo de la barra HP
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(hpBarX - 2, hpBarY - 2, hpBarWidth + 4, hpBarHeight + 4);
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            // Barra de HP con gradiente
            const healthPercent = player.health / player.maxHealth;
            const healthWidth = healthPercent * hpBarWidth;
            
            if (healthWidth > 0) {
                const hpGradient = this.ctx.createLinearGradient(hpBarX, hpBarY, hpBarX, hpBarY + hpBarHeight);
                
                if (player.health > 100) {
                    hpGradient.addColorStop(0, '#B19CD9');
                    hpGradient.addColorStop(1, '#7B68EE');
                } else if (healthPercent >= 0.7) {
                    hpGradient.addColorStop(0, '#7FFF00');
                    hpGradient.addColorStop(1, '#32CD32');
                } else if (healthPercent >= 0.3) {
                    hpGradient.addColorStop(0, '#FFD700');
                    hpGradient.addColorStop(1, '#FFA500');
                } else {
                    hpGradient.addColorStop(0, '#FF6B6B');
                    hpGradient.addColorStop(1, '#DC143C');
                }
                
                this.ctx.fillStyle = hpGradient;
                this.ctx.fillRect(hpBarX, hpBarY, healthWidth, hpBarHeight);
                
                // Brillo superior
                const shine = this.ctx.createLinearGradient(hpBarX, hpBarY, hpBarX, hpBarY + hpBarHeight/2);
                shine.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = shine;
                this.ctx.fillRect(hpBarX, hpBarY, healthWidth, hpBarHeight/2);
            }
            
            // Borde de la barra HP
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            // Texto de HP
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 13px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${player.health}`, hpBarX + hpBarWidth/2, hpBarY + hpBarHeight - 4);
            this.ctx.restore();
            
            // Info adicional (Rage/Energy) debajo de la barra HP
            if (player.role === 'killer') {
                const ragePercent = Math.floor((player.rageLevel / player.maxRage) * 100);
                this.ctx.fillStyle = '#FF6B6B';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`RAGE: ${ragePercent}%`, textX, hpBarY + hpBarHeight + 12);
            } else if (player.character === 'luna') {
                const ability = this.abilities.q;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(`ENERGY: ${ability.uses}/${ability.maxUses}`, textX, hpBarY + hpBarHeight + 12);
            }
        }
        
        // Controls help - Solo en desktop
        if (!this.isMobile()) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.fillRect(this.canvas.width - 200, this.canvas.height - 100, 190, 90);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('WASD: Mover', this.canvas.width - 190, this.canvas.height - 80);
            this.ctx.fillText('Q/E/R: Habilidades', this.canvas.width - 190, this.canvas.height - 60);
            this.ctx.fillText('Click/Space: Atacar', this.canvas.width - 190, this.canvas.height - 40);
            this.ctx.fillText('C: Rage Mode (Killers)', this.canvas.width - 190, this.canvas.height - 20);
            this.ctx.fillText('F: Revivir (cerca de downed)', this.canvas.width - 190, this.canvas.height - 0);
        }
        
        // Mostrar estado de espectador con controles
        if (player && player.spectating) {
            const alivePlayers = Object.values(this.players).filter(p => p.alive && !p.spectating);
            
            if (alivePlayers.length > 0) {
                // Inicializar índice de espectador si no existe
                if (this.spectatorIndex === undefined) {
                    this.spectatorIndex = 0;
                }
                
                // Asegurar que el índice sea válido
                if (this.spectatorIndex >= alivePlayers.length) {
                    this.spectatorIndex = 0;
                }
                
                const watchingPlayer = alivePlayers[this.spectatorIndex];
                
                // Panel de espectador
                const panelWidth = 350;
                const panelHeight = 80;
                const panelX = this.canvas.width/2 - panelWidth/2;
                const panelY = 60;
                
                // Fondo del panel
                this.ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
                this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
                
                // Borde
                this.ctx.strokeStyle = '#7289DA';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
                
                // Título
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('👁️ MODO ESPECTADOR', this.canvas.width/2, panelY + 25);
                
                // Info del jugador observado
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.fillText(`Observando: ${watchingPlayer.name} (${watchingPlayer.character})`, this.canvas.width/2, panelY + 50);
                
                // Contador
                this.ctx.fillStyle = '#B0B0B0';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`${this.spectatorIndex + 1}/${alivePlayers.length}`, this.canvas.width/2, panelY + 70);
                
                // Botones de navegación
                const buttonSize = 40;
                const buttonY = panelY + panelHeight/2 - buttonSize/2;
                
                // Botón anterior (izquierda)
                const prevButtonX = panelX + 20;
                this.ctx.fillStyle = 'rgba(114, 137, 218, 0.8)';
                this.ctx.fillRect(prevButtonX, buttonY, buttonSize, buttonSize);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(prevButtonX, buttonY, buttonSize, buttonSize);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('◀', prevButtonX + buttonSize/2, buttonY + buttonSize/2 + 8);
                
                // Botón siguiente (derecha)
                const nextButtonX = panelX + panelWidth - 20 - buttonSize;
                this.ctx.fillStyle = 'rgba(114, 137, 218, 0.8)';
                this.ctx.fillRect(nextButtonX, buttonY, buttonSize, buttonSize);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(nextButtonX, buttonY, buttonSize, buttonSize);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('▶', nextButtonX + buttonSize/2, buttonY + buttonSize/2 + 8);
                
                // Guardar posiciones de botones para clicks
                this.spectatorButtons = {
                    prev: { x: prevButtonX, y: buttonY, width: buttonSize, height: buttonSize },
                    next: { x: nextButtonX, y: buttonY, width: buttonSize, height: buttonSize }
                };
                
                // Centrar cámara en el jugador observado
                const canvasWidth = this.canvas.cssWidth || this.canvas.width;
                const canvasHeight = this.canvas.cssHeight || this.canvas.height;
                this.camera.x = watchingPlayer.x - canvasWidth / 2;
                this.camera.y = watchingPlayer.y - canvasHeight / 2;
                this.camera.x = Math.max(0, Math.min(Math.max(0, this.worldSize.width - canvasWidth), this.camera.x));
                this.camera.y = Math.max(0, Math.min(Math.max(0, this.worldSize.height - canvasHeight), this.camera.y));
            } else {
                // No hay jugadores vivos para observar
                this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
                this.ctx.fillRect(this.canvas.width/2 - 150, 60, 300, 50);
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('👁️ MODO ESPECTADOR', this.canvas.width/2, 80);
                this.ctx.font = '12px Arial';
                this.ctx.fillText('No hay jugadores vivos para observar', this.canvas.width/2, 100);
            }
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
        
        // Gamepad indicator
        if (this.gamepadIndex !== null) {
            this.ctx.fillStyle = 'rgba(0,255,0,0.8)';
            this.ctx.fillRect(this.canvas.width - 100, 45, 90, 25);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('🎮 Controller', this.canvas.width - 55, 62);
        }
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
        // Mobile controls are now drawn directly on canvas, no DOM updates needed
    }
    
    drawVirtualJoystick() {
        if (!this.mobileControls || !this.mobileControls.joystick) return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const joystick = this.mobileControls.joystick;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Responsive joystick sizing - Reducido
        const baseRadius = isLandscape ? 45 : 55;
        const knobRadius = isLandscape ? 18 : 22;
        
        // HITBOX VISUAL - Múltiples áreas para debug
        
        // 1. Área de joystick.size (buttonSize * 1.6) - AZUL
        if (joystick.size) {
            this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(joystick.x, joystick.y, joystick.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // 2. Área de detección real (20px) - NEGRO
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(joystick.x, joystick.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // 3. Centro exacto - ROJO
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(joystick.x, joystick.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw joystick base with better visibility
        const baseGradient = this.ctx.createRadialGradient(
            joystick.x, joystick.y, 0,
            joystick.x, joystick.y, baseRadius
        );
        baseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        baseGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
        baseGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        
        this.ctx.fillStyle = baseGradient;
        this.ctx.beginPath();
        this.ctx.arc(joystick.x, joystick.y, baseRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = isLandscape ? 2 : 3;
        this.ctx.beginPath();
        this.ctx.arc(joystick.x, joystick.y, baseRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw directional indicators
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        const indicatorLength = baseRadius * 0.3;
        
        // Cross indicators
        this.ctx.beginPath();
        this.ctx.moveTo(joystick.x - indicatorLength, joystick.y);
        this.ctx.lineTo(joystick.x + indicatorLength, joystick.y);
        this.ctx.moveTo(joystick.x, joystick.y - indicatorLength);
        this.ctx.lineTo(joystick.x, joystick.y + indicatorLength);
        this.ctx.stroke();
        
        // Calculate knob position
        let knobX = joystick.x;
        let knobY = joystick.y;
        
        if (this.joystickState.active) {
            const dx = this.joystickState.currentX - this.joystickState.startX;
            const dy = this.joystickState.currentY - this.joystickState.startY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            const maxDistance = baseRadius - knobRadius - 2;
            
            if (distance > 0) {
                const clampedDistance = Math.min(distance, maxDistance);
                const angle = Math.atan2(dy, dx);
                knobX = joystick.x + Math.cos(angle) * clampedDistance;
                knobY = joystick.y + Math.sin(angle) * clampedDistance;
            }
        }
        
        // Draw knob with gradient
        const knobGradient = this.ctx.createRadialGradient(
            knobX - knobRadius * 0.3, knobY - knobRadius * 0.3, 0,
            knobX, knobY, knobRadius
        );
        
        if (this.joystickState.active) {
            knobGradient.addColorStop(0, 'rgba(0, 255, 0, 0.9)');
            knobGradient.addColorStop(1, 'rgba(0, 200, 0, 0.8)');
        } else {
            knobGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            knobGradient.addColorStop(1, 'rgba(200, 200, 200, 0.8)');
        }
        
        this.ctx.fillStyle = knobGradient;
        this.ctx.beginPath();
        this.ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Knob border
        this.ctx.strokeStyle = this.joystickState.active ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 255, 255, 1)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // DEBUG: Mostrar toques recientes
        if (this.debugTouches) {
            this.debugTouches.forEach((touch, index) => {
                const age = Date.now() - touch.time;
                if (age < 2000) { // Mostrar por 2 segundos
                    const alpha = 1 - (age / 2000);
                    
                    // Círculo del toque
                    this.ctx.fillStyle = touch.detected ? `rgba(0, 255, 0, ${alpha * 0.5})` : `rgba(255, 0, 0, ${alpha * 0.5})`;
                    this.ctx.beginPath();
                    this.ctx.arc(touch.x, touch.y, 15, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Línea al centro del joystick
                    if (touch.joyDist !== undefined) {
                        this.ctx.strokeStyle = touch.detected ? `rgba(0, 255, 0, ${alpha})` : `rgba(255, 0, 0, ${alpha})`;
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(touch.x, touch.y);
                        this.ctx.lineTo(joystick.x, joystick.y);
                        this.ctx.stroke();
                        
                        // Texto con distancia
                        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                        this.ctx.font = 'bold 12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(`${Math.round(touch.joyDist)}px`, touch.x, touch.y - 20);
                    }
                }
            });
        }
        
        // Movement indicator
        if (this.joystickState.active) {
            const dx = this.joystickState.currentX - this.joystickState.startX;
            const dy = this.joystickState.currentY - this.joystickState.startY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance > 10) {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(joystick.x, joystick.y);
                this.ctx.lineTo(knobX, knobY);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
    
    drawMobileControls(player) {
        const canvasWidth = this.canvas.cssWidth || this.canvas.width;
        const canvasHeight = this.canvas.cssHeight || this.canvas.height;
        
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Optimized sizing for landscape mode
        const buttonSize = isLandscape ? 
            Math.min(canvasWidth * 0.08, canvasHeight * 0.12) : 
            Math.min(canvasWidth * 0.12, canvasHeight * 0.08);
        const spacing = buttonSize * 1.1;
        
        // Position joystick - better placement for landscape
        const joystickX = isLandscape ? buttonSize * 1.8 : buttonSize * 1.5;
        const joystickY = canvasHeight - buttonSize * (isLandscape ? 1.5 : 1.8);
        
        // Position ability buttons - optimized for landscape
        const buttonY = canvasHeight - buttonSize * (isLandscape ? 1.5 : 1.2);
        const abilities = player.role === 'killer' ? ['Q', 'E', 'R', 'C'] : ['Q', 'E', 'R', 'F'];
        const totalButtonWidth = abilities.length * buttonSize + (abilities.length - 1) * spacing;
        const startX = canvasWidth - totalButtonWidth - buttonSize * (isLandscape ? 1.2 : 0.8);
        
        // Draw ability buttons with improved layout
        abilities.forEach((key, index) => {
            const x = startX + (buttonSize + spacing) * index;
            let onCooldown = false;
            
            if (key === 'C' && player.role === 'killer') {
                onCooldown = player.rageUsed || player.rageLevel < player.maxRage || this.lastManStanding || (player.rageMode && player.rageMode.active);
            } else if (key === 'F') {
                onCooldown = !this.showRevivePrompt;
            } else {
                const ability = this.abilities[key.toLowerCase()];
                onCooldown = ability && ability.cooldown > 0;
            }
            
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Enhanced button shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this.ctx.beginPath();
            this.ctx.arc(x + 2, buttonY + 2, buttonSize/2 + 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Button background with better gradient
            const gradient = this.ctx.createRadialGradient(x, buttonY - buttonSize/6, 0, x, buttonY, buttonSize/2);
            if (onCooldown) {
                gradient.addColorStop(0, 'rgba(100,100,100,0.95)');
                gradient.addColorStop(1, 'rgba(60,60,60,0.95)');
            } else {
                // Different colors per ability
                if (key === 'Q') {
                    gradient.addColorStop(0, 'rgba(0,255,0,0.9)');
                    gradient.addColorStop(1, 'rgba(0,200,0,0.9)');
                } else if (key === 'E') {
                    gradient.addColorStop(0, 'rgba(0,150,255,0.9)');
                    gradient.addColorStop(1, 'rgba(0,100,200,0.9)');
                } else if (key === 'R') {
                    gradient.addColorStop(0, 'rgba(255,100,0,0.9)');
                    gradient.addColorStop(1, 'rgba(200,80,0,0.9)');
                } else if (key === 'C') {
                    gradient.addColorStop(0, 'rgba(255,0,0,0.9)');
                    gradient.addColorStop(1, 'rgba(200,0,0,0.9)');
                } else if (key === 'F') {
                    gradient.addColorStop(0, 'rgba(255,255,0,0.9)');
                    gradient.addColorStop(1, 'rgba(200,200,0,0.9)');
                }
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, buttonY, buttonSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enhanced border
            this.ctx.strokeStyle = onCooldown ? '#555' : '#FFFFFF';
            this.ctx.lineWidth = isLandscape ? 2 : 3;
            this.ctx.stroke();
            
            // Button text with responsive sizing
            this.ctx.fillStyle = onCooldown ? '#333' : '#000';
            this.ctx.font = `bold ${Math.max(12, buttonSize * 0.35)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(key, x, buttonY + buttonSize * 0.1);
            
            // Para Luna Q, mostrar contador de bebidas debajo
            if (key === 'Q' && this.selectedCharacter === 'luna' && this.abilities.q && this.abilities.q.uses !== undefined) {
                this.ctx.font = `bold ${Math.max(10, buttonSize * 0.25)}px Arial`;
                this.ctx.fillStyle = onCooldown ? '#555' : '#FFD700';
                this.ctx.fillText(`x${this.abilities.q.uses}`, x, buttonY + buttonSize * 0.35);
            }

            
            // Enhanced cooldown indicator
            if (onCooldown) {
                let cooldownText;
                if (key === 'C' && player.role === 'killer') {
                    if (player.rageMode && player.rageMode.active) {
                        const timeLeft = Math.ceil(player.rageMode.timer / 60);
                        cooldownText = timeLeft + 's';
                    } else {
                        const ragePercent = Math.floor((player.rageLevel / player.maxRage) * 100);
                        cooldownText = ragePercent + '%';
                    }
                } else if (key === 'F') {
                    cooldownText = 'WAIT';
                } else {
                    const abilityKey = this.abilities[key.toLowerCase()];
                    if (abilityKey) {
                        const cooldownSec = Math.ceil(abilityKey.cooldown / 1000);
                        cooldownText = cooldownSec + 's';
                    }
                }
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `bold ${Math.max(8, buttonSize * 0.22)}px Arial`;
                this.ctx.fillText(cooldownText, x, buttonY + buttonSize * 0.32);
                
                // Cooldown arc
                if (key !== 'C' && key !== 'F') {
                    const abilityKey = this.abilities[key.toLowerCase()];
                    if (abilityKey && abilityKey.maxCooldown) {
                        const progress = 1 - (abilityKey.cooldown / abilityKey.maxCooldown);
                        this.ctx.strokeStyle = '#00ff00';
                        this.ctx.lineWidth = 3;
                        this.ctx.beginPath();
                        this.ctx.arc(x, buttonY, buttonSize/2 - 1, -Math.PI/2, -Math.PI/2 + (progress * Math.PI * 2));
                        this.ctx.stroke();
                    }
                }
            }
            
            this.ctx.restore();
        });
        
        // Store control positions
        this.mobileControls = {
            joystick: {x: joystickX, y: joystickY, size: buttonSize * 1.2},
            abilities: {}
        };
        
        // Store ability button positions
        abilities.forEach((key, index) => {
            const x = startX + (buttonSize + spacing) * index;
            this.mobileControls.abilities[key.toLowerCase()] = {
                x: x,
                y: buttonY,
                size: buttonSize,
                touchRadius: buttonSize/2 + 15
            };
        });
    }

    refreshLobbyList() {
        if (this.supabaseGame) {
            this.supabaseGame.requestLobbyList();
        }
        this.updateLobbyInfo();
    }
    
    updateLobbyInfo() {
        const lobbySelect = document.getElementById('lobbySelect');
        if (lobbySelect) {
            // Update lobby dropdown with status info
            Array.from(lobbySelect.options).forEach(option => {
                const lobbyId = option.value;
                const lobbyInfo = this.availableLobbies[lobbyId];
                if (lobbyInfo) {
                    const status = lobbyInfo.gameStarted ? '🎮' : '⏳';
                    option.textContent = `${lobbyId.toUpperCase()} (${lobbyInfo.players}/8) ${status}`;
                } else {
                    option.textContent = `${lobbyId.toUpperCase()} (0/8) ⏳`;
                }
            });
        }
    }

    updateLobbyUI() {
        const totalPlayers = Object.keys(this.playersInLobby).length;
        const survivors = Object.values(this.playersInLobby).filter(p => p.role === 'survivor');
        const killers = Object.values(this.playersInLobby).filter(p => p.role === 'killer');
        const spectators = Object.values(this.playersInLobby).filter(p => p.role === 'spectator');
        
        // Actualizar card de estado
        const statusCard = document.getElementById('lobbyStatusCard');
        if (statusCard) {
            let statusClass = 'waiting';
            let statusIcon = '⏳';
            let statusText = 'Esperando jugadores...';
            
            if (this.countdownActive && this.lobbyCountdown > 0) {
                statusClass = 'starting';
                statusIcon = '🚀';
                statusText = `Iniciando en ${this.lobbyCountdown}...`;
            } else if (totalPlayers >= 2 && survivors.length >= 1 && killers.length >= 1) {
                statusClass = 'ready';
                statusIcon = '✅';
                statusText = '¡Listos para jugar!';
            }
            
            statusCard.className = `lobby-status-card ${statusClass}`;
            statusCard.innerHTML = `
                <div class="lobby-status-icon">${statusIcon}</div>
                <div class="lobby-status-text">${statusText}</div>
                <div style="font-size: 1.2rem; color: rgba(255,255,255,0.8);">${totalPlayers}/8 jugadores</div>
            `;
        }
        
        // Actualizar grid de jugadores con avatares
        const playersGrid = document.getElementById('lobbyPlayersGrid');
        if (playersGrid) {
            const allPlayers = Object.values(this.playersInLobby);
            const maxSlots = 8;
            
            let slotsHTML = '';
            
            // Llenar slots con jugadores
            for (let i = 0; i < maxSlots; i++) {
                if (i < allPlayers.length) {
                    const player = allPlayers[i];
                    const avatarClass = player.role === 'killer' ? 'killer' : 'filled';
                    const roleClass = player.role === 'killer' ? 'killer' : 'survivor';
                    const roleText = player.role === 'killer' ? 'Killer' : 'Survivor';
                    
                    // Obtener icono del personaje
                    let avatarContent = '';
                    const characterIcons = {
                        'gissel': 'assets/icons/GisselInactiveIcon.png',
                        'luna': 'assets/icons/LunaNormalIcon.png',
                        'iA777': 'assets/icons/IA777NormalIcon.png',
                        'angel': 'assets/icons/AngelNormalIcon.png',
                        'iris': 'assets/icons/IrisNormalIcon.png',
                        '2019x': '🔥',
                        'vortex': '🌀'
                    };
                    
                    if (characterIcons[player.character] && characterIcons[player.character].startsWith('assets')) {
                        avatarContent = `<img src="${characterIcons[player.character]}" alt="${player.character}">`;
                    } else {
                        avatarContent = `<span style="font-size: 2.5rem;">${characterIcons[player.character] || '👤'}</span>`;
                    }
                    
                    slotsHTML += `
                        <div class="lobby-player-slot">
                            <div class="lobby-player-avatar ${avatarClass}">
                                ${avatarContent}
                            </div>
                            <div class="lobby-player-name">${player.name}</div>
                            <div class="lobby-player-role ${roleClass}">${roleText}</div>
                        </div>
                    `;
                } else {
                    // Slot vacío
                    slotsHTML += `
                        <div class="lobby-player-slot">
                            <div class="lobby-player-avatar">
                                <span style="font-size: 2rem; opacity: 0.3;">❓</span>
                            </div>
                            <div class="lobby-player-name" style="opacity: 0.5;">Vacío</div>
                        </div>
                    `;
                }
            }
            
            playersGrid.innerHTML = slotsHTML;
        }
        
    }

    playLMSMusic() {
        try {
            // Determinar qué música usar según el survivor
            const lastSurvivor = Object.values(this.players).find(p => p.role === 'survivor' && !p.spectating);
            let musicPath;
            
            if (lastSurvivor && lastSurvivor.character === 'iA777') {
                musicPath = 'assets/IA777LMS.mp3';
            } else if (lastSurvivor && lastSurvivor.character === 'gissel') {
                musicPath = 'assets/GisselLMS1.mp3';
            } else if (lastSurvivor && lastSurvivor.character === 'luna') {
                musicPath = 'assets/LunaLMS2.mp3';
            } else if (lastSurvivor && lastSurvivor.character === 'iris') {
                musicPath = 'assets/IrisLMS_.mp3';
            } else {
                musicPath = 'assets/SpeedofSoundRound2.mp3';
            }
            
            this.lmsMusic = new Audio(musicPath);
            this.lmsMusic.volume = 0.6;
            this.lmsMusic.loop = false;
            
            // Evento cuando la canción REALMENTE empieza a reproducirse
            this.lmsMusic.addEventListener('play', () => {
                this.lmsMusicStartTime = Date.now();
                console.log('🎵 LMS Music started playing, timer synchronized');
            });
            
            this.lmsMusic.addEventListener('loadedmetadata', () => {
                if (this.lastManStanding) {
                    this.lmsMusicDuration = this.lmsMusic.duration;
                    console.log(`🎵 LMS Music loaded: ${this.lmsMusicDuration} seconds`);
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
                playPromise.then(() => {
                    // Timer se sincroniza cuando la canción REALMENTE empieza
                    if (this.lastManStanding && this.lmsMusicDuration) {
                        this.gameTimer = Math.floor(this.lmsMusicDuration);
                        console.log(`🎵 LMS Timer set to song duration: ${this.gameTimer} seconds`);
                    }
                }).catch(error => {
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
    
    playChaseTheme() {
        try {
            const myPlayer = this.players[this.myPlayerId];
            let themePath = 'assets/ChaseTheme2019X.mp3';
            
            if (myPlayer && myPlayer.character === 'vortex') {
                themePath = 'assets/VortexChaseTheme.mp3';
            }
            
            this.chaseMusic = new Audio(themePath);
            this.chaseMusic.volume = 0.4;
            this.chaseMusic.loop = true;
            
            const playPromise = this.chaseMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Chase theme autoplay blocked');
                });
            }
        } catch (error) {
            console.log('Chase theme not available:', error);
        }
    }
    
    updateChaseThemeVolume() {
        if (!this.chaseMusic || this.lastManStanding) return;
        
        const myPlayer = this.players[this.myPlayerId];
        if (!myPlayer || myPlayer.role !== 'survivor') return;
        
        const chaseKiller = Object.values(this.players).find(p => 
            (p.character === '2019x' || p.character === 'vortex') && p.role === 'killer' && p.alive
        );
        
        if (!chaseKiller) {
            this.chaseMusic.volume = 0;
            return;
        }
        
        // Calcular distancia al killer
        const distance = Math.sqrt(
            Math.pow(myPlayer.x - chaseKiller.x, 2) + 
            Math.pow(myPlayer.y - chaseKiller.y, 2)
        );
        
        // Radio de 300 unidades para escuchar el chase theme
        const maxDistance = 300;
        if (distance <= maxDistance) {
            const volume = Math.max(0.1, 0.4 * (1 - distance / maxDistance));
            this.chaseMusic.volume = volume;
        } else {
            this.chaseMusic.volume = 0;
        }
    }
    
    stopChaseTheme() {
        if (this.chaseMusic) {
            this.chaseMusic.pause();
            this.chaseMusic.currentTime = 0;
            this.chaseMusic = null;
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
            let text = `-${indicator.damage}`;
            if (indicator.attackType === 'you_cant_run') color = '#8B0000';
            else if (indicator.attackType === 'white_orb') color = '#FF8000';
            else if (indicator.damage === 50) color = '#FFD700';
            else if (indicator.attackType === 'dodged') {
                color = '#00BFFF';
                text = 'DODGED!';
            }
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            
            this.ctx.strokeText(text, indicator.x, indicator.y);
            this.ctx.fillText(text, indicator.x, indicator.y);
            
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
    
    drawVirtualJoystick() {
        if (!this.mobileControls || !this.mobileControls.joystick) return;
        
        const joy = this.mobileControls.joystick;
        const isLandscape = window.innerWidth > window.innerHeight;
        const baseRadius = isLandscape ? 45 : 55;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Base del joystick
        this.ctx.strokeStyle = this.joystickState.active ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(joy.x, joy.y, baseRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Stick del joystick
        let stickX = joy.x;
        let stickY = joy.y;
        
        if (this.joystickState.active) {
            const dx = this.joystickState.currentX - this.joystickState.startX;
            const dy = this.joystickState.currentY - this.joystickState.startY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            const maxDistance = baseRadius * 0.6;
            
            if (distance > 0) {
                const ratio = Math.min(distance, maxDistance) / distance;
                stickX = joy.x + dx * ratio;
                stickY = joy.y + dy * ratio;
            }
        }
        
        this.ctx.fillStyle = this.joystickState.active ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(stickX, stickY, baseRadius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawMobileControls(player) {
        if (!this.mobileControls) {
            this.initializeMobileControls();
        }
        
        const canvasWidth = this.canvas.cssWidth || this.canvas.width;
        const canvasHeight = this.canvas.cssHeight || this.canvas.height;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const abilities = player.role === 'killer' ? ['q', 'e', 'r', 'c'] : ['q', 'e', 'r', 'f'];
        const buttonSize = isLandscape ? 80 : 90;
        const spacing = buttonSize * 0.2;
        const startX = canvasWidth - (abilities.length * (buttonSize + spacing)) - 20;
        const buttonY = canvasHeight - buttonSize - 20;
        
        const abilityColors = {
            'q': { ready: '#FF4444', glow: '#FF0000', dark: '#8B0000' },
            'e': { ready: '#4444FF', glow: '#0000FF', dark: '#00008B' },
            'r': { ready: '#FF8800', glow: '#FF6600', dark: '#CC5500' },
            'c': { ready: '#FF0066', glow: '#FF0044', dark: '#CC0044' },
            'f': { ready: '#00FF88', glow: '#00FF66', dark: '#00AA55' }
        };
        
        abilities.forEach((key, index) => {
            const x = startX + index * (buttonSize + spacing);
            const cooldown = this.abilities[key];
            const isReady = !cooldown || cooldown.cooldown <= 0;
            const colors = abilityColors[key];
            
            if (!this.mobileControls.abilities) this.mobileControls.abilities = {};
            this.mobileControls.abilities[key] = {
                x: x + buttonSize/2,
                y: buttonY + buttonSize/2,
                size: buttonSize,
                touchRadius: buttonSize * 0.7
            };
            
            const centerX = x + buttonSize/2;
            const centerY = buttonY + buttonSize/2;
            const radius = buttonSize/2;
            
            // Sombra exterior
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowOffsetY = 4;
            
            // Fondo oscuro
            this.ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Borde brillante
            if (isReady) {
                const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                this.ctx.strokeStyle = colors.glow;
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = colors.glow;
                this.ctx.shadowBlur = 15 * pulse;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            } else {
                this.ctx.strokeStyle = 'rgba(80, 80, 90, 0.6)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Gradiente interior
            const gradient = this.ctx.createRadialGradient(centerX, centerY - radius/3, 0, centerX, centerY, radius);
            if (isReady) {
                gradient.addColorStop(0, colors.ready + '40');
                gradient.addColorStop(1, colors.dark + '20');
            } else {
                gradient.addColorStop(0, 'rgba(60, 60, 70, 0.3)');
                gradient.addColorStop(1, 'rgba(30, 30, 40, 0.5)');
            }
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Letra con efecto
            this.ctx.fillStyle = isReady ? '#FFFFFF' : 'rgba(120, 120, 130, 0.7)';
            this.ctx.font = `bold ${buttonSize * 0.45}px 'Courier New', monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (isReady) {
                this.ctx.shadowColor = colors.glow;
                this.ctx.shadowBlur = 8;
            }
            
            this.ctx.fillText(key.toUpperCase(), centerX, centerY - (isReady ? 0 : radius * 0.15));
            this.ctx.shadowBlur = 0;
            
            // Para Luna Q: mostrar contador de usos Y cooldown
            if (key === 'q' && this.selectedCharacter === 'luna' && cooldown && cooldown.uses !== undefined) {
                // Contador de usos arriba
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = `bold ${buttonSize * 0.25}px Arial`;
                this.ctx.shadowColor = '#000';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(`x${cooldown.uses}`, centerX - radius * 0.5, centerY - radius * 0.3);
                this.ctx.shadowBlur = 0;
                
                // Cooldown abajo si está activo
                if (!isReady) {
                    const timeLeft = Math.ceil(cooldown.cooldown / 1000);
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = `bold ${buttonSize * 0.3}px Arial`;
                    this.ctx.shadowColor = '#000';
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillText(timeLeft + 's', centerX, centerY + radius * 0.5);
                    this.ctx.shadowBlur = 0;
                }
            }
            // Cooldown normal para otras habilidades
            else if (!isReady && cooldown) {
                const timeLeft = Math.ceil(cooldown.cooldown / 1000);
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `bold ${buttonSize * 0.35}px Arial`;
                this.ctx.shadowColor = '#000';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(timeLeft + 's', centerX, centerY + radius * 0.4);
                this.ctx.shadowBlur = 0;
            }
        });
        
        this.ctx.restore();
    }
    
    initializeMobileControls() {
        const canvasWidth = this.canvas.cssWidth || this.canvas.width;
        const canvasHeight = this.canvas.cssHeight || this.canvas.height;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        const joySize = isLandscape ? 45 : 55;
        const joyX = joySize * 2;
        const joyY = canvasHeight - joySize * 2;
        
        this.mobileControls = {
            joystick: { x: joyX, y: joyY, size: joySize },
            abilities: {}
        };
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
    
    // Iris Abilities
    activateHealing(player) {
        // Self heal 10-20 HP
        const selfHeal = Math.floor(Math.random() * 11) + 10; // 10-20
        player.health = Math.min(player.maxHealth, player.health + selfHeal);
        
        // Find nearby survivors to heal
        const nearbySurvivors = Object.values(this.players).filter(target => 
            target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
        );
        
        // Start healing aura for allies
        player.healingAura = true;
        player.healingTimer = nearbySurvivors.length > 0 ? 1200 : 300; // 20s if healing others, 5s if alone
        player.healingTick = 0;
        
        this.createParticles(player.x + 15, player.y + 15, '#00FF7F', 25);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'iris_healing',
                playerId: player.id,
                selfHeal: selfHeal
            });
        }
    }
    
    activateTelekinesis(player) {
        // Find killers within 0.5 meter range (30 pixels)
        const nearbyKillers = Object.values(this.players).filter(target => 
            target.role === 'killer' && target.alive && target.id !== player.id
        );
        
        let telekinesisHit = false;
        nearbyKillers.forEach(target => {
            const distance = Math.sqrt(
                Math.pow(target.x - player.x, 2) + 
                Math.pow(target.y - player.y, 2)
            );
            
            if (distance <= 30) { // 0.5 meter range
                telekinesisHit = true;
                
                // Push killer away
                const angle = Math.atan2(target.y - player.y, target.x - player.x);
                const pushDistance = 80;
                const newX = Math.max(0, Math.min(this.worldSize.width - 30, 
                    target.x + Math.cos(angle) * pushDistance));
                const newY = Math.max(0, Math.min(this.worldSize.height - 30, 
                    target.y + Math.sin(angle) * pushDistance));
                
                target.x = newX;
                target.y = newY;
                
                // Apply telekinesis effect
                target.telekinesisEffect = true;
                target.telekinesisTimer = 300; // 5 seconds
                
                this.createParticles(target.x + 15, target.y + 15, '#9370DB', 20);
                
                if (this.supabaseGame) {
                    this.supabaseGame.sendPlayerMove(newX, newY);
                    this.supabaseGame.sendAttack({
                        type: 'telekinesis_hit',
                        targetId: target.id,
                        knockbackX: newX,
                        knockbackY: newY
                    });
                }
            }
        });
        
        if (telekinesisHit) {
            player.telekinesisActive = true;
            player.telekinesisTimer = 300; // 5 seconds duration
        }
        
        this.createParticles(player.x + 15, player.y + 15, '#9370DB', 15);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'telekinesis_activate',
                playerId: player.id
            });
        }
    }
    
    activateIrisDash(player) {
        player.irisDashActive = true;
        player.irisDashTimer = 60; // 1 second
        
        // Dash away from killer (opposite direction)
        const nearbyKillers = Object.values(this.players).filter(target => 
            target.role === 'killer' && target.alive && target.id !== player.id
        );
        
        if (nearbyKillers.length > 0) {
            // Find closest killer
            let closestKiller = null;
            let minDistance = Infinity;
            
            nearbyKillers.forEach(killer => {
                const distance = Math.sqrt(
                    Math.pow(killer.x - player.x, 2) + 
                    Math.pow(killer.y - player.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestKiller = killer;
                }
            });
            
            if (closestKiller) {
                // Dash away from killer
                const angle = Math.atan2(player.y - closestKiller.y, player.x - closestKiller.x);
                const dashDistance = 100;
                const newX = Math.max(0, Math.min(this.worldSize.width - 30, 
                    player.x + Math.cos(angle) * dashDistance));
                const newY = Math.max(0, Math.min(this.worldSize.height - 30, 
                    player.y + Math.sin(angle) * dashDistance));
                
                player.x = newX;
                player.y = newY;
                
                // Stun killer if close enough
                if (minDistance <= 50) {
                    closestKiller.stunned = true;
                    closestKiller.stunTimer = 120; // 2 seconds
                    
                    this.createParticles(closestKiller.x + 15, closestKiller.y + 15, '#FF69B4', 15);
                    
                    if (this.supabaseGame) {
                        this.supabaseGame.sendAttack({
                            type: 'stun',
                            targetId: closestKiller.id,
                            stunDuration: 120
                        });
                    }
                }
                
                // Recharge dodge bar by 25
                player.dodgeBar = Math.min(player.maxDodgeBar, player.dodgeBar + 25);
                
                // Sync dodge bar recharge
                if (this.supabaseGame) {
                    this.supabaseGame.sendAttack({
                        type: 'dodge_regen',
                        playerId: player.id,
                        dodgeBar: player.dodgeBar
                    });
                }
                
                if (this.supabaseGame) {
                    this.supabaseGame.sendPlayerMove(newX, newY);
                }
            }
        }
        
        this.createParticles(player.x + 15, player.y + 15, '#00BFFF', 20);
        
        if (this.supabaseGame) {
            this.supabaseGame.sendAttack({
                type: 'iris_dash',
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
    startSandboxMode(){const e=document.getElementById('playerName').value.trim();if(!e)return alert('Por favor ingresa tu nombre');if(!this.selectedCharacter)return alert('Selecciona un personaje');this.sandboxMode=!0,this.gameStarted=!0,this.myPlayerId='sandbox_player';const t={id:this.myPlayerId,name:e,x:400,y:300,alive:!0,character:this.selectedCharacter,role:this.selectedRole,health:this.selectedRole==='survivor'?(this.selectedCharacter==='iA777'?120:this.selectedCharacter==='luna'?85:this.selectedCharacter==='angel'?90:this.selectedCharacter==='iris'?100:100):(this.selectedCharacter==='vortex'?700:600),maxHealth:this.selectedRole==='survivor'?(this.selectedCharacter==='iA777'?120:this.selectedCharacter==='luna'?85:this.selectedCharacter==='angel'?90:this.selectedCharacter==='iris'?100:100):(this.selectedCharacter==='vortex'?700:600),dodgeBar:this.selectedCharacter==='iris'?75:0,maxDodgeBar:this.selectedCharacter==='iris'?75:0,spectating:!1};this.players[this.myPlayerId]=t,this.createSandboxDummies(),this.setupAbilities(),this.showGameScreen()}
createSandboxDummies(){const e=this.players[this.myPlayerId],t=e.role==='killer'?'survivor':'killer',s=t==='killer'?['2019x','vortex']:['gissel','iA777','luna','angel','iris'];for(let i=0;i<3;i++){const a=s[i%s.length],r=`dummy_${i}`;this.players[r]={id:r,name:`Dummy ${a}`,x:200+i*300,y:500+i*100,alive:!0,character:a,role:t,health:t==='survivor'?(a==='iA777'?120:a==='luna'?85:a==='angel'?90:a==='iris'?100:100):(a==='vortex'?700:600),maxHealth:t==='survivor'?(a==='iA777'?120:a==='luna'?85:a==='angel'?90:a==='iris'?100:100):(a==='vortex'?700:600),dodgeBar:a==='iris'?75:0,maxDodgeBar:a==='iris'?75:0,spectating:!1,isDummy:!0,aiMovement:{moveTimer:0,direction:Math.random()*Math.PI*2}}}if(e.role==='survivor'){const d='gissel';this.players.dummy_downed={id:'dummy_downed',name:'Downed Dummy',x:600,y:400,alive:!1,downed:!0,reviveTimer:1200,beingRevived:!1,character:d,role:t,health:0,maxHealth:100,spectating:!1,isDummy:!0}}}
updateSandboxDummies(){if(!this.sandboxMode)return;Object.values(this.players).forEach(e=>{if(!e.isDummy||!e.alive)return;e.aiMovement.moveTimer++,e.aiMovement.moveTimer>=180&&(e.aiMovement.direction=Math.random()*Math.PI*2,e.aiMovement.moveTimer=0);const t=Math.max(50,Math.min(this.worldSize.width-80,e.x+Math.cos(e.aiMovement.direction)*2)),s=Math.max(50,Math.min(this.worldSize.height-80,e.y+Math.sin(e.aiMovement.direction)*2));e.x=t,e.y=s,(e.x<=50||e.x>=this.worldSize.width-80||e.y<=50||e.y>=this.worldSize.height-80)&&(e.aiMovement.direction+=Math.PI)})}
exitSandbox(){this.sandboxMode=!1,this.gameStarted=!1,this.players={},this.particles=[],this.hitboxes=[],document.getElementById('lobby').classList.add('active'),document.getElementById('game').classList.remove('active')}
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new DiscordFriendsGame();
});