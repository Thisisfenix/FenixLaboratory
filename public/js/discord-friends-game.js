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
        this.gameTimer = config.GAME_TIMER || 180;
        this.lastManStanding = false;
        this.lmsActivated = false;
        this.particles = [];
        this.hitboxes = [];
        this.jumpscareQueue = [];

        // Initialize map system
        this.mapSystem = new DiscordFriendsMaps(this);

        // Initialize game modes system
        this.gameModeSystem = new DiscordFriendsGameModes(this);
        this.selectedGameMode = 'classic';

        // Initialize survivor interactions system
        this.survivorInteractions = window.SurvivorInteractions ? new SurvivorInteractions(this) : null;

        this.rageLevel = 0;
        this.maxRage = 500;
        this.rageMode = { active: false, timer: 0 };
        this.rageUsed = false;
        this.gameTimerPaused = false;
        this.pausedTimer = 0;
        this.lobbyCountdown = 0;
        this.countdownActive = false;
        this.joystickActive = false;
        this.joystickTouch = null;
        this.mobileControls = null;
        this.ping = 0;
        this.lastPingTime = 0;
        this.gamepadController = null;
        this.skinShop = null;

        this.init();
    }

    async init() {
        // Initialize modules
        this.uiManager = new (await import('./modules/UIManager.js')).UIManager();
        this.inputManager = new (await import('./modules/InputManager.js')).InputManager(this);
        this.visualManager = new (await import('./modules/VisualManager.js')).VisualManager(this);
        this.eventManager = new (await import('./modules/EventManager.js')).EventManager(this);
        this.gameStateManager = new (await import('./modules/GameStateManager.js')).GameStateManager(this);
        this.movementManager = new (await import('./modules/MovementManager.js')).MovementManager(this);
        this.combatManager = new (await import('./modules/CombatManager.js')).CombatManager(this);
        this.abilityManager = new (await import('./modules/AbilityManager.js')).AbilityManager(this);
        this.lobbyManager = new (await import('./modules/LobbyManager.js')).LobbyManager(this);
        this.audioManager = new (await import('./modules/AudioManager.js')).AudioManager(this);
        this.sandboxManager = new (await import('./modules/SandboxManager.js')).SandboxManager(this);
        this.reviveManager = new (await import('./modules/ReviveManager.js')).ReviveManager(this);
        this.utils = new (await import('./modules/Utils.js')).Utils(this);

        // Check if SupabaseGame is available (not mock)
        this.supabaseGame = new SupabaseGame();
        
        if (this.supabaseGame.isConnected === false) {
            // Sandbox mode only
            console.log('🔧 Modo Sandbox - Sin conexión multijugador');
            this.myPlayerId = 'sandbox-player';
            // Setup basic event listeners for sandbox
            this.setupBasicEventListeners();
            this.startGameLoop();
            return;
        }

        // Show loading while connecting
        this.uiManager.showConnectionLoading();

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

        this.uiManager.setupEventListeners(this);
        this.setupSupabaseEvents();

        // Hide loading and show lobby
        this.uiManager.hideConnectionLoading();
        
        // Update initial lobby UI
        setTimeout(() => {
            this.updateLobbyUI();
        }, 100);
        
        // Only refresh lobby list if the method exists
        if (this.supabaseGame && typeof this.supabaseGame.requestLobbyStatus === 'function') {
            this.lobbyManager.refreshLobbyList();
        }
        
        this.startGameLoop();
    }

    setupBasicEventListeners() {
        // Wait for DOM to be ready
        setTimeout(() => {
            // Setup only sandbox button listener
            const sandboxBtn = document.getElementById('sandboxBtn');
            console.log('🔍 Buscando botón sandbox:', sandboxBtn);
            
            if (sandboxBtn) {
                sandboxBtn.addEventListener('click', () => {
                    console.log('🔧 Botón sandbox clickeado');
                    this.startSandboxMode();
                });
                console.log('✅ Event listener agregado al botón sandbox');
            } else {
                console.error('❌ Botón sandbox no encontrado');
            }
            
            // Setup character selection
            const characterCards = document.querySelectorAll('.character-card');
            console.log('🔍 Cartas de personajes encontradas:', characterCards.length);
            
            characterCards.forEach(card => {
                card.addEventListener('click', () => {
                    // Remove previous selection
                    characterCards.forEach(c => c.classList.remove('selected'));
                    // Add selection to clicked card
                    card.classList.add('selected');
                    
                    this.selectedCharacter = card.dataset.character;
                    this.selectedRole = card.dataset.role;
                    
                    console.log('🎮 Personaje seleccionado:', this.selectedCharacter, this.selectedRole);
                });
            });
        }, 500);
    }

    startSandboxMode() {
        if (!this.selectedCharacter) {
            alert('⚠️ Selecciona un personaje primero');
            return;
        }
        
        console.log('🔧 Iniciando modo sandbox con:', this.selectedCharacter);
        
        // Setup canvas and start game
        this.setupGameCanvas();
        
        // Create sandbox player
        this.players[this.myPlayerId] = {
            id: this.myPlayerId,
            name: 'Sandbox Player',
            character: this.selectedCharacter,
            role: this.selectedRole,
            x: 400,
            y: 300,
            health: this.selectedRole === 'killer' ? 200 : 100,
            maxHealth: this.selectedRole === 'killer' ? 200 : 100,
            alive: true,
            downed: false
        };
        
        this.gameStarted = true;
        
        // Initialize sandbox with dummies
        if (this.sandboxManager && typeof this.sandboxManager.startSandboxMode === 'function') {
            this.sandboxManager.startSandboxMode();
        }
        
        console.log('✅ Modo sandbox iniciado');
    }

    setupSupabaseEvents() {
        this.eventManager.setupSupabaseEvents();
    }

    async joinGame() {
        return this.lobbyManager.joinGame();
    }

    requestLobbySync() {
        return this.lobbyManager.requestLobbySync();
    }

    checkGameStart() {
        return this.lobbyManager.checkGameStart();
    }

    startLobbyCountdown() {
        return this.lobbyManager.startLobbyCountdown();
    }

    resetCountdown() {
        return this.lobbyManager.resetCountdown();
    }

    updateLobbyUI() {
        // Ensure playersInLobby is initialized before calling updateLobbyUI
        if (!this.playersInLobby) {
            this.playersInLobby = {};
        }
        if (!this.currentLobby) {
            this.currentLobby = 'lobby-1';
        }
        
        // Call UIManager directly with proper parameters
        if (this.uiManager && typeof this.uiManager.updateLobbyUI === 'function') {
            console.log('🔄 Updating lobby UI:', {
                players: Object.keys(this.playersInLobby).length,
                lobby: this.currentLobby,
                countdown: this.countdownActive,
                timer: this.lobbyCountdown
            });
            this.uiManager.updateLobbyUI(
                this.playersInLobby,
                this.currentLobby,
                this.countdownActive || false,
                this.lobbyCountdown || 0
            );
        } else {
            console.error('❌ UIManager.updateLobbyUI not available');
        }
        
        // Also call LobbyManager if it exists
        if (this.lobbyManager && typeof this.lobbyManager.updateLobbyUI === 'function') {
            return this.lobbyManager.updateLobbyUI();
        }
    }

    refreshLobbyList() {
        return this.lobbyManager.refreshLobbyList();
    }

    setupGameEventListeners() {
        this.inputManager.setupGameEventListeners(this);
    }

    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    update() {
        if (this.gameStarted && this.canvas) {
            if (this.movementManager) {
                if (typeof this.movementManager.updateMovement === 'function') this.movementManager.updateMovement();
                if (typeof this.movementManager.updateRemotePlayerInterpolation === 'function') this.movementManager.updateRemotePlayerInterpolation();
                if (typeof this.movementManager.updateCamera === 'function') this.movementManager.updateCamera();
            }
            if (this.sandboxManager && typeof this.sandboxManager.updateSandboxDummies === 'function') this.sandboxManager.updateSandboxDummies();
            if (this.combatManager) {
                if (typeof this.combatManager.updateCooldowns === 'function') this.combatManager.updateCooldowns();
                if (typeof this.combatManager.updateHitboxes === 'function') this.combatManager.updateHitboxes();
            }
            if (this.visualManager && typeof this.visualManager.update === 'function') this.visualManager.update();
            if (this.abilityManager && typeof this.abilityManager.updateAbilities === 'function') this.abilityManager.updateAbilities();
            if (this.reviveManager && typeof this.reviveManager.updateReviveSystem === 'function') this.reviveManager.updateReviveSystem();
            if (this.survivorInteractions && typeof this.survivorInteractions.update === 'function') this.survivorInteractions.update();
            if (this.gameStateManager) {
                if (typeof this.gameStateManager.updateGameTimer === 'function') this.gameStateManager.updateGameTimer();
                if (typeof this.gameStateManager.checkLMSCondition === 'function') this.gameStateManager.checkLMSCondition();
            }
            this.updatePing();
            if (this.audioManager && typeof this.audioManager.updateChaseThemeVolume === 'function') this.audioManager.updateChaseThemeVolume();
        }
    }

    render() {
        // Only render if game has started
        if (!this.gameStarted) return;
        
        if (this.visualManager && typeof this.visualManager.render === 'function') {
            this.visualManager.render(this);
        } else {
            this.basicRender();
        }
    }

    basicRender() {
        if (!this.canvas || !this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = '#1B4332';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.gameStarted) {
            // Show lobby screen
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Discord Friends Game', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        // Basic game rendering would go here
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

    // Delegate methods to appropriate managers
    updateVortexAbilities() {
        return this.abilityManager.updateVortexAbilities();
    }

    updateLunaAbilities() {
        return this.abilityManager.updateLunaAbilities();
    }

    updateAngelAbilities() {
        return this.abilityManager.updateAngelAbilities();
    }

    updateIrisAbilities() {
        return this.abilityManager.updateIrisAbilities();
    }

    updateSelfDestruct() {
        return this.abilityManager.updateSelfDestruct();
    }

    updateCharge() {
        return this.abilityManager.updateCharge();
    }

    updateAutoRepair() {
        return this.abilityManager.updateAutoRepair();
    }

    updateReviveSystem() {
        return this.reviveManager.updateReviveSystem();
    }

    updateGameTimer() {
        return this.gameStateManager.updateGameTimer();
    }

    checkHitboxCollisions(hitbox) {
        return this.combatManager.checkHitboxCollisions(hitbox);
    }

    applyHitboxEffect(hitbox, target) {
        return this.combatManager.applyHitboxEffect(hitbox, target);
    }

    drawHitboxes() {
        return this.combatManager.drawHitboxes(this.ctx);
    }

    setPlayerDowned(target) {
        return this.combatManager.setPlayerDowned(target);
    }

    showDamageIndicator(target, damage, type) {
        return this.visualManager.showDamageIndicator(target, damage, type);
    }

    triggerJumpscare(targetPlayerId) {
        return this.visualManager.triggerJumpscare(targetPlayerId);
    }

    isImageValid(img) {
        return this.utils.isImageValid(img);
    }

    findNearestSurvivor(killer) {
        return this.utils.findNearestSurvivor(killer);
    }

    cleanupPlayer() {
        return this.utils.cleanupPlayer();
    }

    cleanupDatabase() {
        return this.utils.cleanupDatabase();
    }

    showEscapeDoor(x, y) {
        return this.gameStateManager.showEscapeDoor(x, y);
    }

    drawEscapeDoor() {
        return this.gameStateManager.drawEscapeDoor(this.ctx, this.camera);
    }

    survivorEscaped(player) {
        return this.gameStateManager.survivorEscaped(player);
    }

    syncGameTimer() {
        return this.gameStateManager.syncGameTimer();
    }

    playDeathSound() {
        return this.audioManager.playDeathSound();
    }

    createParticles(x, y, color, count) {
        return this.visualManager.createParticles(x, y, color, count);
    }

    endGame(winCondition) {
        return this.gameStateManager.endGame(winCondition);
    }

    resetGame() {
        return this.gameStateManager.resetGame();
    }

    useAbility(ability) {
        return this.abilityManager.useAbility(ability);
    }

    activateRageMode() {
        return this.abilityManager.activateRageMode();
    }

    startSandboxMode() {
        if (this.sandboxManager && typeof this.sandboxManager.startSandboxMode === 'function') {
            return this.sandboxManager.startSandboxMode();
        } else {
            console.log('Sandbox mode not available');
        }
    }

    setupGameCanvas() {
        this.visualManager.setupCanvas('gameCanvas');
        this.canvas = this.visualManager.canvas;
        this.ctx = this.visualManager.ctx;
        
        // Show game screen and hide lobby
        document.getElementById('lobby').classList.remove('active');
        document.getElementById('game').classList.add('active');

        this.setupGameEventListeners();

        // Solo el host selecciona modo y mapa, luego los sincroniza
        const sortedPlayers = Object.values(this.players).sort((a, b) => a.id.localeCompare(b.id));
        const isHost = sortedPlayers.length > 0 && sortedPlayers[0].id === this.myPlayerId;

        if (isHost) {
            // Host selecciona modo y mapa aleatorios
            const gameModes = ['classic', 'escape', 'deathmatch', 'infection', 'juggernaut', 'hide_and_seek'];
            const randomMode = gameModes[Math.floor(Math.random() * gameModes.length)];

            const maps = ['discord_server', 'abandoned_factory', 'haunted_mansion'];
            const randomMap = maps[Math.floor(Math.random() * maps.length)];

            console.log(`🎮 [HOST] Modo seleccionado: ${randomMode}`);
            console.log(`🗺️ [HOST] Mapa seleccionado: ${randomMap}`);

            this.selectedGameMode = randomMode;
            this.selectedMap = randomMap;

            // Enviar a otros jugadores
            if (this.supabaseGame) {
                this.supabaseGame.sendGameConfig(randomMode, randomMap);
            }

            this.gameModeSystem.initializeMode(randomMode);
            this.mapSystem.generateMap(randomMap);
        } else {
            // Non-host players use default until they receive config
            console.log('🎮 [CLIENT] Waiting for host config...');
            this.selectedGameMode = 'classic';
            this.selectedMap = 'discord_server';
            this.gameModeSystem.initializeMode(this.selectedGameMode);
            this.mapSystem.generateMap(this.selectedMap);
        }
    }

    startGameFromRemote() {
        this.gameStarted = true;
        this.gameStartTime = Date.now();
        this.players = { ...this.playersInLobby };
        this.playersInLobby = {};
        this.countdownActive = false;

        // Reproducir chase theme si soy 2019X o Vortex
        const myPlayer = this.players[this.myPlayerId];
        if (myPlayer && (myPlayer.character === '2019x' || myPlayer.character === 'vortex') && myPlayer.role === 'killer') {
            this.audioManager.playChaseTheme();
        }

        this.showLoadingScreen();
    }

    showLoadingScreen() {
        this.uiManager.showLoadingScreen();
    }

    resizeCanvas() {
        if (this.canvas && this.ctx) {
            const screenWidth = screen.width;
            const screenHeight = screen.height;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const width = Math.min(screenWidth, viewportWidth);
            const height = Math.min(screenHeight, viewportHeight);

            this.canvas.width = width;
            this.canvas.height = height;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';

            this.canvas.cssWidth = width;
            this.canvas.cssHeight = height;

            console.log('Canvas resized to:', width, 'x', height);
            this.updateCamera();
        }
    }

    updateCamera() {
        return this.movementManager.updateCamera();
    }

    updateCameraBounds() {
        if (this.canvas && this.players[this.myPlayerId]) {
            const player = this.players[this.myPlayerId];
            const canvasWidth = this.canvas.cssWidth || window.innerWidth;
            const canvasHeight = this.canvas.cssHeight || window.innerHeight;

            this.camera.x = player.x - canvasWidth / 2;
            this.camera.y = player.y - canvasHeight / 2;

            this.camera.x = Math.max(0, Math.min(Math.max(0, this.worldSize.width - canvasWidth), this.camera.x));
            this.camera.y = Math.max(0, Math.min(Math.max(0, this.worldSize.height - canvasHeight), this.camera.y));
        }
    }
    
    playChaseTheme() {
        return this.audioManager.playChaseTheme();
    }
    
    cleanupDatabase() {
        return this.utils.cleanupDatabase();
    }
    
    checkLMSCondition() {
        return this.gameStateManager.checkLMSCondition();
    }
    
    updateMovement() {
        return this.movementManager.updateMovement();
    }
    
    updateRemotePlayerInterpolation() {
        return this.movementManager.updateRemotePlayerInterpolation();
    }
    
    updateCooldowns() {
        return this.combatManager.updateCooldowns();
    }
    
    updateHitboxes() {
        return this.combatManager.updateHitboxes();
    }
    
    updateAbilities() {
        return this.abilityManager.updateAbilities();
    }
    
    handleAttack(e) {
        return this.combatManager.handleAttack(e);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new DiscordFriendsGame();
});