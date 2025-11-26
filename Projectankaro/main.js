// Main.js - Inicialización y loop principal
let gameState = 'lobby'; // lobby, game, end

// UI Elements
const playerNameInput = document.getElementById('playerName');
const roomCodeInput = document.getElementById('roomCodeInput');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinBtn = document.getElementById('joinBtn');
const startBtn = document.getElementById('startBtn');
const roomCodeEl = document.getElementById('roomCode');
const currentPlayersEl = document.getElementById('currentPlayers');
const statusEl = document.getElementById('status');
const micBtn = document.getElementById('micBtn');
const micIcon = document.getElementById('micIcon');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenIcon = document.getElementById('fullscreenIcon');
const dummyBtn = document.getElementById('dummyBtn');

// Loading screen
function updateLoadingProgress(percent, text) {
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    if (loadingBar) loadingBar.style.width = percent + '%';
    if (loadingText) loadingText.textContent = text;
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 1s';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }
}

// Init
function init() {
    console.log('Initializing game...');
    updateLoadingProgress(10, 'Verificando THREE.js...');
    
    // Verificar que THREE.js esté cargado
    if (typeof THREE === 'undefined') {
        console.error('THREE.js not loaded!');
        updateLoadingProgress(0, '❌ Error: THREE.js no cargado');
        return;
    }
    
    updateLoadingProgress(30, 'Inicializando motor 3D...');
    
    try {
        const engineInit = engine.init();
        if (!engineInit) {
            throw new Error('Engine initialization failed');
        }
        console.log('Engine initialized successfully');
        updateLoadingProgress(60, 'Creando lobby...');
        
        if (typeof lobby !== 'undefined' && lobby.create) {
            lobby.create();
            console.log('Lobby created');
        }
        
        updateLoadingProgress(90, 'Iniciando...');
        
        animate();
        console.log('Animation loop started');
        
        updateLoadingProgress(100, '✔️ Listo!');
        setTimeout(hideLoadingScreen, 500);
    } catch (error) {
        console.error('Init error:', error);
        updateLoadingProgress(0, '❌ Error: ' + error.message);
    }
}

// Fullscreen button
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            fullscreenIcon.textContent = '⬜';
            updateStatus('📺 Pantalla completa activada', '#00ff00');
        }).catch(err => {
            console.error('Fullscreen error:', err);
            updateStatus('⚠️ No se pudo activar pantalla completa', '#ff0000');
        });
    } else {
        document.exitFullscreen();
        fullscreenIcon.textContent = '⛶';
        updateStatus('📺 Pantalla completa desactivada', '#ffd700');
    }
});

// Create room button
createRoomBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    
    if (!name) {
        updateStatus('⚠️ Ingresa tu nombre', '#ffd700');
        return;
    }
    
    updateStatus('🔄 Creando sala...', '#ffd700');
    
    // Crear sala en Supabase
    const room = await supabaseNetwork.createRoom(name);
    
    if (!room) {
        updateStatus('❌ Error al crear sala', '#ff0000');
        return;
    }
    
    // Actualizar UI
    roomCodeEl.textContent = room.code;
    
    // Spawn jugador local con color asignado
    const playerData = room.players[0];
    const playerIndex = 0;
    playerData.color = lobby.playerColors[playerIndex];
    playerData.isLocal = true;
    lobby.spawnPlayer(playerData, playerIndex);
    lobby.canMove = true;
    
    playerNameInput.disabled = true;
    roomCodeInput.disabled = true;
    createRoomBtn.disabled = true;
    joinBtn.disabled = true;
    
    updatePlayerCount(room.players.length);
    updateStatus(`✔️ Sala creada: ${room.code} - Esperando jugadores...`, '#00ff00');
    
    // Inicializar voz
    await voiceChat.init(supabaseNetwork.localPlayerId);
    const micEnabled = await voiceChat.enableMicrophone();
    
    if (micEnabled) {
        micBtn.style.display = 'flex';
    }
    
    // Escuchar cambios en la sala
    listenToRoomChanges(room.code);
});

// Join button
joinBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    const code = roomCodeInput.value.trim().toUpperCase();
    
    if (!name) {
        updateStatus('⚠️ Ingresa tu nombre', '#ffd700');
        return;
    }
    
    if (!code) {
        updateStatus('⚠️ Ingresa el código de sala', '#ffd700');
        return;
    }
    
    updateStatus('🔄 Uniéndose...', '#ffd700');
    
    // Unirse a sala existente
    const room = await supabaseNetwork.joinRoom(code, name);
    
    if (!room) {
        updateStatus('❌ Sala no encontrada o llena', '#ff0000');
        return;
    }
    
    // Actualizar UI
    roomCodeEl.textContent = room.code;
    
    // Spawn jugador local con color asignado
    const playerData = room.players.find(p => p.name === name);
    const playerIndex = room.players.findIndex(p => p.name === name);
    playerData.color = lobby.playerColors[playerIndex];
    playerData.isLocal = true;
    lobby.spawnPlayer(playerData, playerIndex);
    lobby.canMove = true;
    
    playerNameInput.disabled = true;
    roomCodeInput.disabled = true;
    createRoomBtn.disabled = true;
    joinBtn.disabled = true;
    
    updatePlayerCount(room.players.length);
    updateStatus(`✔️ Unido a sala: ${room.code}`, '#00ff00');
    
    // Inicializar voz
    await voiceChat.init(supabaseNetwork.localPlayerId);
    const micEnabled = await voiceChat.enableMicrophone();
    
    if (micEnabled) {
        micBtn.style.display = 'flex';
    }
    
    // Escuchar cambios en la sala
    listenToRoomChanges(room.code);
});

// Mic button - Toggle mute
micBtn.addEventListener('click', () => {
    const muted = voiceChat.toggleMute();
    
    if (muted) {
        micBtn.classList.add('muted');
        micIcon.textContent = '🔇';
        updateStatus('🔇 Micrófono silenciado', '#ff6600');
    } else {
        micBtn.classList.remove('muted');
        micIcon.textContent = '🎤';
        updateStatus('🎤 Micrófono activo', '#00ff00');
    }
});

// Push-to-talk con tecla V
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyV' && !e.repeat && voiceChat.isEnabled) {
        voiceChat.unmute();
        micBtn.classList.remove('muted');
        micIcon.textContent = '🎤';
        micBtn.style.boxShadow = '0 0 20px #00ff00';
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyV' && voiceChat.isEnabled) {
        voiceChat.mute();
        micBtn.classList.add('muted');
        micIcon.textContent = '🔇';
        micBtn.style.boxShadow = '';
    }
});

// Start button (solo host)
startBtn.addEventListener('click', () => {
    if (!supabaseNetwork.isHost) {
        updateStatus('⚠️ Solo el host puede iniciar', '#ff6600');
        return;
    }
    
    updateStatus('🎮 Iniciando juego...', '#00ff00');
    
    // Broadcast a todos los jugadores
    supabaseNetwork.broadcastGameStart();
    
    setTimeout(() => {
        startGame();
    }, 1000);
});

// Update UI
function updatePlayerCount(count) {
    currentPlayersEl.textContent = count;
    
    // Habilitar botón solo si hay al menos 2 jugadores y eres el host
    if (count >= 2 && supabaseNetwork.isHost) {
        startBtn.disabled = false;
        updateStatus(`✔️ ${count}/8 jugadores - Listos para comenzar!`, '#00ff00');
    } else if (count >= 2 && !supabaseNetwork.isHost) {
        updateStatus(`✔️ ${count}/8 jugadores - Esperando al host...`, '#ffd700');
    } else if (count < 2 && supabaseNetwork.isHost) {
        startBtn.disabled = true;
        updateStatus(`⏳ ${count}/8 jugadores - Mínimo 2 para iniciar`, '#ffd700');
    }
}

function updateStatus(message, color, duration = 3000) {
    statusEl.textContent = message;
    statusEl.style.borderColor = color;
    statusEl.style.color = color;
    statusEl.style.opacity = '1';
    
    if (statusEl.timeout) clearTimeout(statusEl.timeout);
    
    statusEl.timeout = setTimeout(() => {
        statusEl.style.opacity = '0';
    }, duration);
}

// Escuchar cambios en la sala
function listenToRoomChanges(roomCode) {
    supabase
        .channel(`room_changes:${roomCode}`)
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
            (payload) => {
                const room = payload.new;
                updatePlayerCount(room.players.length);
                
                // Spawn nuevos jugadores
                room.players.forEach((playerData, index) => {
                    if (!playerManager.getPlayer(playerData.id)) {
                        playerData.color = lobby.playerColors[index];
                        lobby.spawnPlayer(playerData, index);
                        updateStatus(`👥 ${playerData.name} se unió!`, '#00ff00');
                        
                        // Conectar voz con el nuevo jugador
                        if (voiceChat.isEnabled && playerData.id !== supabaseNetwork.localPlayerId) {
                            setTimeout(() => {
                                voiceChat.callPeer(playerData.id);
                            }, 1000);
                        }
                    }
                });
            }
        )
        .subscribe();
}

// Start game
let gameStarting = false;
function startGame() {
    if (gameStarting) return;
    gameStarting = true;
    
    // Mostrar pantalla de carga
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';
    loadingScreen.style.opacity = '1';
    updateLoadingProgress(0, 'Preparando mapa...');
    
    setTimeout(() => {
        updateLoadingProgress(20, 'Limpiando lobby...');
        
        // Ocultar UI del lobby
        document.getElementById('ui').style.display = 'none';
        document.getElementById('controls').style.display = 'none';
        document.getElementById('status').style.display = 'none';
        
        // Mantener botón de mic visible
        if (voiceChat.isEnabled) {
            micBtn.style.bottom = '80px';
        }
        
        setTimeout(() => {
            updateLoadingProgress(40, 'Destruyendo lobby...');
            lobby.destroy();
            
            setTimeout(() => {
                updateLoadingProgress(60, 'Generando mapa...');
                game.init();
                
                setTimeout(() => {
                    updateLoadingProgress(80, 'Iniciando gameplay...');
                    
                    const localPlayer = playerManager.localPlayer;
                    if (localPlayer && localPlayer.userData) {
                        gameplay.init(localPlayer);
                        localPlayer.userData.tools = 0;
                        
                        // Resetear rotación de cámara del gameplay
                        gameplay.cameraRotation = { x: 0, y: 0 };
                    } else {
                        console.error('Local player not found or userData missing');
                    }
                    
                    setTimeout(() => {
                        updateLoadingProgress(100, '✔️ ¡Listo!');
                        gameState = 'game';
                        
                        // Ocultar completamente UI del lobby
                        const uiEl = document.getElementById('ui');
                        if (uiEl) uiEl.style.display = 'none';
                        
                        // Mostrar HUD del juego
                        document.getElementById('gameHUD').style.display = 'block';
                        
                        // Iniciar contador
                        startGameTimer();
                        
                        setTimeout(() => {
                            hideLoadingScreen();
                            console.log('Game started');
                            gameStarting = false;
                        }, 500);
                    }, 300);
                }, 300);
            }, 300);
        }, 300);
    }, 100);
}

// Animation loop
let lastTime = 0;
let frameCount = 0;
function animate(time) {
    requestAnimationFrame(animate);
    
    if (time - lastTime < 16.67) return;
    lastTime = time;
    
    const delta = engine.update();
    
    if (gameState === 'lobby') {
        lobby.update(delta);
        playerManager.update(delta);
        
        if (playerManager.localPlayer && frameCount % 6 === 0) {
            supabaseNetwork.broadcastPosition(playerManager.localPlayer.position);
        }
    } else if (gameState === 'game') {
        gameplay.update(delta);
        playerManager.update(delta);
        game.update(delta);
        
        if (frameCount % 10 === 0) updateMissionsUI();
        
        if (playerManager.localPlayer) {
            const player = playerManager.localPlayer;
            const px = player.position.x;
            const py = player.position.y;
            const pz = player.position.z;
            
            for (let i = 0; i < game.items.length; i++) {
                const item = game.items[i];
                if (!item.userData.collected) {
                    const dx = px - item.position.x;
                    const dz = pz - item.position.z;
                    if (dx * dx + dz * dz < 4) game.collectItem(player, item);
                }
            }
            
            for (let i = 0; i < game.fuses.length; i++) {
                const fuse = game.fuses[i];
                if (!fuse.userData.collected) {
                    const dx = px - fuse.position.x;
                    const dz = pz - fuse.position.z;
                    if (dx * dx + dz * dz < 4) game.collectFuse(player, fuse);
                }
            }
            
            if (gameplay.keys['KeyE']) {
                for (let i = 0; i < game.generators.length; i++) {
                    const gen = game.generators[i];
                    if (!gen.userData.repaired) {
                        const dx = px - gen.position.x;
                        const dz = pz - gen.position.z;
                        if (dx * dx + dz * dz < 9) game.repairGenerator(player, gen);
                    }
                }
                
                for (let i = 0; i < game.levers.length; i++) {
                    const lever = game.levers[i];
                    if (!lever.userData.activated) {
                        const dx = px - lever.position.x;
                        const dz = pz - lever.position.z;
                        if (dx * dx + dz * dz < 4) game.activateLever(player, lever);
                    }
                }
            }
            
            game.checkEscape(player);
        }
        
        if (playerManager.localPlayer && frameCount % 3 === 0) {
            supabaseNetwork.broadcastPosition(playerManager.localPlayer.position);
        }
    }
    
    engine.render();
    frameCount++;
}

// Start - Esperar a que todo cargue
let loadAttempts = 0;
const maxAttempts = 10;

function tryInit() {
    loadAttempts++;
    
    if (typeof THREE !== 'undefined') {
        console.log('THREE.js loaded, initializing...');
        init();
    } else if (loadAttempts < maxAttempts) {
        console.log(`Waiting for THREE.js... (${loadAttempts}/${maxAttempts})`);
        setTimeout(tryInit, 500);
    } else {
        console.error('Failed to load THREE.js after multiple attempts');
        updateStatus('❌ Error: No se pudo cargar THREE.js', '#ff0000');
    }
}

// Game timer (10 minutos regresivo)
let gameTimer = 600; // 10 minutos en segundos
let gameTimerInterval = null;

function startGameTimer() {
    gameTimer = 600;
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    
    const timerEl = document.getElementById('timer');
    
    gameTimerInterval = setInterval(() => {
        gameTimer--;
        const minutes = Math.floor(gameTimer / 60);
        const seconds = gameTimer % 60;
        document.getElementById('timerText').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Cambiar color según tiempo restante
        if (gameTimer <= 60) {
            timerEl.style.borderColor = '#ff0000';
            timerEl.querySelector('#timerText').style.color = '#ff0000';
        } else if (gameTimer <= 180) {
            timerEl.style.borderColor = '#ff6600';
            timerEl.querySelector('#timerText').style.color = '#ff6600';
        }
        
        // Game over si se acaba el tiempo
        if (gameTimer <= 0) {
            stopGameTimer();
            game.gameOver(false);
        }
    }, 1000);
}

function stopGameTimer() {
    if (gameTimerInterval) {
        clearInterval(gameTimerInterval);
        gameTimerInterval = null;
    }
}

// Update missions UI
function updateMissionsUI() {
    if (playerManager.localPlayer) {
        const tools = playerManager.localPlayer.userData.tools || 0;
        document.getElementById('toolsCount').textContent = tools;
    }
    
    if (game.generators) {
        const repaired = game.generators.filter(g => g.userData.repaired).length;
        document.getElementById('gensCount').textContent = repaired;
    }
    
    if (game.fuses) {
        document.getElementById('fusesCount').textContent = game.fusesCollected;
    }
    
    if (game.levers) {
        document.getElementById('leversCount').textContent = game.leversActivated;
    }
}

window.addEventListener('load', () => {
    console.log('Window loaded, starting initialization...');
    tryInit();
});
