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
    const playerIndex = room.players.length - 1;
    playerData.color = lobby.playerColors[playerIndex];
    lobby.spawnPlayer(playerData, playerIndex);
    
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
    const playerIndex = room.players.length - 1;
    playerData.color = lobby.playerColors[playerIndex];
    lobby.spawnPlayer(playerData, playerIndex);
    
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

// Start button
startBtn.addEventListener('click', () => {
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
    
    // Habilitar botón si hay al menos 2 jugadores
    if (count >= 2) {
        startBtn.disabled = false;
        updateStatus(`✔️ ${count}/8 jugadores - Listos para comenzar!`, '#00ff00');
    }
}

function updateStatus(message, color) {
    statusEl.textContent = message;
    statusEl.style.borderColor = color;
    statusEl.style.color = color;
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
function startGame() {
    gameState = 'game';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('status').style.display = 'none';
    
    // Mantener botón de mic visible
    if (voiceChat.isEnabled) {
        micBtn.style.bottom = '80px';
    }
    
    // Limpiar lobby
    lobby.destroy();
    
    // Iniciar juego
    game.init();
    
    // Iniciar gameplay
    const localPlayer = playerManager.localPlayer;
    if (localPlayer) {
        gameplay.init(localPlayer);
        localPlayer.userData.tools = 0;
        
        // Cambiar cámara a tercera persona
        engine.camera.position.copy(localPlayer.position);
        engine.camera.position.y += 5;
        engine.camera.position.z += 8;
    }
    
    console.log('Game started');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = engine.update();
    
    if (gameState === 'lobby') {
        lobby.update(delta);
        playerManager.update(delta);
        
        // Broadcast posición del jugador local
        if (playerManager.localPlayer && Date.now() % 100 < 16) {
            supabaseNetwork.broadcastPosition(playerManager.localPlayer.position);
        }
    } else if (gameState === 'game') {
        gameplay.update(delta);
        playerManager.update(delta);
        game.update(delta);
        
        // Interacción con items
        if (playerManager.localPlayer) {
            const player = playerManager.localPlayer;
            
            // Recoger items
            game.items.forEach(item => {
                if (!item.userData.collected && player.position.distanceTo(item.position) < 2) {
                    game.collectItem(player, item);
                }
            });
            
            // Reparar generadores (mantener E presionado)
            game.generators.forEach(gen => {
                if (!gen.userData.repaired && player.position.distanceTo(gen.position) < 3) {
                    if (gameplay.keys['KeyE']) {
                        game.repairGenerator(player, gen);
                    }
                }
            });
        }
        
        // Broadcast posición en juego
        if (playerManager.localPlayer && Date.now() % 50 < 16) {
            supabaseNetwork.broadcastPosition(playerManager.localPlayer.position);
        }
    }
    
    engine.render();
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

window.addEventListener('load', () => {
    console.log('Window loaded, starting initialization...');
    tryInit();
});
