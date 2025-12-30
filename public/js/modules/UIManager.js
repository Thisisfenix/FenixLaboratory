export class UIManager {
    constructor() {
        this.lobbyCountdown = 0;
        this.countdownActive = false;
        this.skinShop = null;
    }
    
    init() {
        this.setupEventListeners();
        this.initSkinShop();
    }
    
    setupEventListeners() {
        // Character selection
        document.querySelectorAll('.character-card').forEach(char => {
            char.addEventListener('click', (e) => this.handleCharacterSelect(e));
        });
        
        // Lobby controls
        const joinBtn = document.getElementById('joinBtn');
        const spectateBtn = document.getElementById('spectateBtn');
        const sandboxBtn = document.getElementById('sandboxBtn');
        const refreshBtn = document.getElementById('refreshLobbies');
        const shopBtn = document.getElementById('shopBtn');
        
        if (joinBtn) joinBtn.addEventListener('click', () => this.onJoinGame(false));
        if (spectateBtn) spectateBtn.addEventListener('click', () => this.onJoinGame(true));
        if (sandboxBtn) sandboxBtn.addEventListener('click', () => this.onSandboxMode());
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.onRefreshLobbies());
        if (shopBtn) shopBtn.addEventListener('click', () => this.openShop());
        
        // Lobby selection
        const lobbySelect = document.getElementById('lobbySelect');
        if (lobbySelect) {
            lobbySelect.addEventListener('change', (e) => this.onLobbyChange(e.target.value));
        }
    }
    
    handleCharacterSelect(e) {
        const char = e.currentTarget;
        const role = char.dataset.role;
        
        // Check if killer is already taken
        if (role === 'killer' && this.isKillerTaken()) {
            alert('Ya hay un killer en el lobby. Solo puede haber uno.');
            return;
        }
        
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        char.classList.add('selected');
        
        this.onCharacterSelected(char.dataset.character, role);
    }
    
    isKillerTaken() {
        // This would be implemented by the main game class
        return false;
    }
    
    initSkinShop() {
        if (window.SkinShop) {
            this.skinShop = new SkinShop();
        }
    }
    
    openShop() {
        if (this.skinShop) {
            this.skinShop.open();
        } else {
            console.log('Skin shop not initialized');
        }
    }
    
    showLobbyScreen() {
        const lobbyScreen = document.getElementById('lobbyScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        if (lobbyScreen) lobbyScreen.style.display = 'block';
        if (gameScreen) gameScreen.style.display = 'none';
    }
    
    showGameScreen() {
        const lobbyScreen = document.getElementById('lobbyScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        if (lobbyScreen) lobbyScreen.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'block';
    }
    
    updateLobbyInfo(lobbyData) {
        const lobbyInfo = document.getElementById('lobbyInfo');
        if (lobbyInfo && lobbyData) {
            lobbyInfo.innerHTML = `
                <h3>Lobby: ${lobbyData.name}</h3>
                <p>Jugadores: ${lobbyData.players}/8</p>
                <p>Estado: ${lobbyData.status}</p>
            `;
        }
    }
    
    startCountdown(seconds) {
        this.lobbyCountdown = seconds;
        this.countdownActive = true;
        this.updateCountdownDisplay();
        
        const interval = setInterval(() => {
            this.lobbyCountdown--;
            this.updateCountdownDisplay();
            
            if (this.lobbyCountdown <= 0) {
                clearInterval(interval);
                this.countdownActive = false;
                this.onCountdownComplete();
            }
        }, 1000);
    }
    
    updateCountdownDisplay() {
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            if (this.countdownActive) {
                countdownEl.textContent = `Iniciando en: ${this.lobbyCountdown}s`;
                countdownEl.style.display = 'block';
            } else {
                countdownEl.style.display = 'none';
            }
        }
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
    
    updateLobbyUI(playersInLobby, currentLobby, countdownActive, lobbyCountdown) {
        // Ensure playersInLobby is not null or undefined
        if (!playersInLobby) {
            playersInLobby = {};
        }
        
        // Ensure currentLobby has a default value
        if (!currentLobby) {
            currentLobby = 'lobby-1';
        }
        
        const playerList = Object.values(playersInLobby);
        const survivors = playerList.filter(p => p.role === 'survivor');
        const killers = playerList.filter(p => p.role === 'killer');
        
        // Update lobby status card
        const statusCard = document.getElementById('lobbyStatusCard');
        if (statusCard) {
            let statusClass = 'waiting';
            let statusIcon = '⏳';
            let statusText = 'Esperando jugadores...';
            
            if (countdownActive && lobbyCountdown > 0) {
                statusClass = 'starting';
                statusIcon = '🚀';
                statusText = `Iniciando en ${lobbyCountdown}...`;
            } else if (playerList.length >= 2 && survivors.length >= 1 && killers.length >= 1) {
                statusClass = 'ready';
                statusIcon = '✅';
                statusText = '¡Listos para jugar!';
            }
            
            statusCard.className = `lobby-status-card ${statusClass}`;
            statusCard.innerHTML = `
                <div class="lobby-status-icon">${statusIcon}</div>
                <div class="lobby-status-text">${statusText}</div>
                <div style="font-size: 1.2rem; color: rgba(255,255,255,0.8);">${playerList.length}/8 jugadores</div>
            `;
        }
        
        // Update players grid with avatars
        const playersGrid = document.getElementById('lobbyPlayersGrid');
        if (playersGrid) {
            const maxSlots = 8;
            let slotsHTML = '';
            
            // Fill slots with players
            for (let i = 0; i < maxSlots; i++) {
                if (i < playerList.length) {
                    const player = playerList[i];
                    const avatarClass = player.role === 'killer' ? 'killer' : 'filled';
                    const roleClass = player.role === 'killer' ? 'killer' : 'survivor';
                    const roleText = player.role === 'killer' ? 'Killer' : 'Survivor';
                    
                    // Get character icon
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
                    // Empty slot
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
    
    showLoadingScreen(onComplete) {
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
                            if (onComplete) onComplete();
                        }
                    }
                }, 1000);
            }, 2000); // Wait 2 seconds before countdown
        }
    }
    
    refreshLobbyList(availableLobbies, onRequest) {
        // Clear existing lobby info
        availableLobbies = {};
        
        // Request lobby status from other players
        if (onRequest) onRequest();
        
        // Update lobby select options
        setTimeout(() => {
            this.updateLobbySelectOptions(availableLobbies);
        }, 1000);
    }
    
    updateLobbySelectOptions(availableLobbies, currentLobby) {
        const lobbySelect = document.getElementById('lobbySelect');
        if (!lobbySelect) return;
        
        // Clear existing options
        lobbySelect.innerHTML = '';
        
        // Add default lobbies
        for (let i = 1; i <= 5; i++) {
            const lobbyId = `lobby-${i}`;
            const option = document.createElement('option');
            option.value = lobbyId;
            
            const lobbyInfo = availableLobbies[lobbyId];
            if (lobbyInfo) {
                const status = lobbyInfo.gameStarted ? ' (En juego)' : '';
                option.textContent = `${lobbyId} (${lobbyInfo.players}/8)${status}`;
                if (lobbyInfo.players >= 8 && !lobbyInfo.gameStarted) {
                    option.textContent += ' - LLENO';
                }
            } else {
                option.textContent = `${lobbyId} (0/8)`;
            }
            
            if (lobbyId === currentLobby) {
                option.selected = true;
            }
            
            lobbySelect.appendChild(option);
        }
    }
    
    setupEventListeners(game) {
        document.querySelectorAll('.character-card').forEach(char => {
            char.addEventListener('click', () => {
                const role = char.dataset.role;
                
                // Verificar si ya hay un killer
                if (role === 'killer') {
                    // Ensure playersInLobby exists
                    if (!game.playersInLobby) {
                        game.playersInLobby = {};
                    }
                    const existingKiller = Object.values(game.playersInLobby).find(p => p.role === 'killer');
                    if (existingKiller && existingKiller.id !== game.myPlayerId) {
                        alert('Ya hay un killer en el lobby. Solo puede haber uno.');
                        return;
                    }
                }
                
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                char.classList.add('selected');
                game.selectedCharacter = char.dataset.character;
                game.selectedRole = char.dataset.role;
            });
        });

        document.getElementById('joinBtn').addEventListener('click', () => {
            game.spectatorMode = false;
            game.joinGame();
        });
        
        document.getElementById('spectateBtn').addEventListener('click', () => {
            game.spectatorMode = true;
            game.joinGame();
        });
        
        document.getElementById('sandboxBtn').addEventListener('click', () => {
            game.startSandboxMode();
        });
        
        document.getElementById('refreshLobbies').addEventListener('click', () => {
            game.refreshLobbyList();
        });
        
        document.getElementById('lobbySelect').addEventListener('change', (e) => {
            game.currentLobby = e.target.value;
            game.updateLobbyInfo();
        });
        
        // Setup shop button with delay to ensure DOM is ready
        setTimeout(() => {
            const shopBtn = document.getElementById('shopBtn');
            if (shopBtn) {
                shopBtn.addEventListener('click', () => {
                    if (game.skinShop) {
                        game.skinShop.open();
                    } else {
                        console.log('Skin shop not initialized');
                    }
                });
            }
        }, 100);
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            game.cleanupPlayer();
        });
        
        // Sync timer on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && game.gameStarted) {
                game.syncGameTimer();
            }
        });
        
        // Initialize gamepad controller
        if (window.GamepadController) {
            game.gamepadController = new GamepadController(game);
        }
        
        // Initialize skin shop with delay
        setTimeout(() => {
            if (window.SkinShop) {
                game.skinShop = new SkinShop(game);
                console.log('🛒 Skin Shop initialized');
            } else {
                console.log('SkinShop class not found');
            }
        }, 500);
    }
    
    // Event callbacks - to be overridden by main game class
    onCharacterSelected(character, role) {}
    onJoinGame(spectate) {}
    onSandboxMode() {}
    onRefreshLobbies() {}
    onLobbyChange(lobbyId) {}
    onCountdownComplete() {}
}