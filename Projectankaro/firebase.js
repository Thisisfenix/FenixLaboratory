// Firebase.js - Configuración y cliente
const firebaseConfig = {
    apiKey: "AIzaSyD5SY2g03uTavWxAsHs57mdGF-yuvx7_AY",
    authDomain: "project-ankaro.firebaseapp.com",
    databaseURL: "https://project-ankaro-default-rtdb.firebaseio.com",
    projectId: "project-ankaro",
    storageBucket: "project-ankaro.firebasestorage.app",
    messagingSenderId: "906492025954",
    appId: "1:906492025954:web:c0e3a7d723e8efe485c53b",
    measurementId: "G-Q38C1KEDKL"
};

let firebaseApp;
let database;

// Initialize Firebase
function initFirebase() {
    if (typeof firebase !== 'undefined') {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log('Firebase initialized successfully');
        return true;
    } else {
        console.warn('Firebase library not loaded yet');
        return false;
    }
}

// Try to initialize immediately
setTimeout(() => {
    if (!initFirebase()) {
        setTimeout(() => {
            if (!initFirebase()) {
                console.error('Failed to initialize Firebase after retry');
            }
        }, 1000);
    }
}, 500);

// Firebase Network para sincronización de jugadores
class FirebaseNetwork {
    constructor() {
        this.roomCode = null;
        this.localPlayerId = null;
        this.roomRef = null;
        this.playersRef = null;
        this.isHost = false;
        this.offlineMode = false;
    }

    async createRoom(playerName) {
        if (!database) {
            console.error('Firebase not initialized');
            return this.createOfflineRoom(playerName);
        }
        
        this.roomCode = this.generateRoomCode();
        this.localPlayerId = Date.now().toString();
        this.isHost = true;

        try {
            this.roomRef = database.ref(`rooms/${this.roomCode}`);
            
            const roomData = {
                code: this.roomCode,
                host_id: this.localPlayerId,
                players: {
                    [this.localPlayerId]: {
                        id: this.localPlayerId,
                        name: playerName,
                        color: 0x00ff00,
                        position: { x: -3, y: 1, z: 0 },
                        timestamp: Date.now()
                    }
                },
                status: 'waiting',
                created: Date.now()
            };

            await this.roomRef.set(roomData);
            this.setupRealtimeListeners();
            
            return {
                code: this.roomCode,
                host_id: this.localPlayerId,
                players: [roomData.players[this.localPlayerId]],
                status: 'waiting'
            };
        } catch (err) {
            console.error('Network error, falling back to offline mode:', err);
            return this.createOfflineRoom(playerName);
        }
    }
    
    async joinRoom(roomCode, playerName) {
        if (!database) {
            console.error('Firebase not initialized');
            return null;
        }
        
        this.roomCode = roomCode;
        this.localPlayerId = Date.now().toString();
        this.isHost = false;

        try {
            this.roomRef = database.ref(`rooms/${roomCode}`);
            const snapshot = await this.roomRef.once('value');
            const room = snapshot.val();
            
            if (!room) {
                console.error('Room not found');
                return null;
            }

            const playerCount = Object.keys(room.players || {}).length;
            if (playerCount >= 8) {
                console.error('Room full');
                return null;
            }

            const playerData = {
                id: this.localPlayerId,
                name: playerName,
                color: 0xff0000,
                position: { x: 3, y: 1, z: 0 },
                timestamp: Date.now()
            };

            await this.roomRef.child(`players/${this.localPlayerId}`).set(playerData);
            this.setupRealtimeListeners();
            
            const players = Object.values(room.players || {});
            players.push(playerData);
            
            return {
                code: roomCode,
                host_id: room.host_id,
                players: players,
                status: room.status
            };
        } catch (err) {
            console.error('Error joining room:', err);
            return null;
        }
    }
    
    createOfflineRoom(playerName) {
        console.log('Creating offline room');
        this.roomCode = this.generateRoomCode();
        this.localPlayerId = Date.now().toString();
        this.isHost = true;
        this.offlineMode = true;
        
        return {
            code: this.roomCode,
            host_id: this.localPlayerId,
            players: [{
                id: this.localPlayerId,
                name: playerName,
                color: 0x00ff00,
                position: { x: -3, y: 1, z: 0 }
            }],
            status: 'waiting'
        };
    }

    setupRealtimeListeners() {
        if (!this.roomRef || this.offlineMode) {
            console.log('Skipping realtime listeners - offline mode or no firebase');
            return;
        }
        
        // Listen for player changes
        this.playersRef = this.roomRef.child('players');
        this.playersRef.on('child_added', (snapshot) => {
            const playerData = snapshot.val();
            if (playerData.id !== this.localPlayerId) {
                this.onPlayerJoined(playerData);
            }
        });
        
        this.playersRef.on('child_removed', (snapshot) => {
            const playerData = snapshot.val();
            if (playerData.id !== this.localPlayerId) {
                this.onPlayerLeft(playerData);
            }
        });
        
        // Listen for position updates
        this.playersRef.on('child_changed', (snapshot) => {
            const playerData = snapshot.val();
            if (playerData.id !== this.localPlayerId && playerData.position) {
                this.onPlayerMove({ payload: playerData });
            }
        });
        
        // Listen for game start
        this.roomRef.child('gameStarted').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                this.onGameStart();
            }
        });
    }

    broadcastPosition(position) {
        if (!this.playersRef || !position || this.offlineMode) return;

        this.playersRef.child(`${this.localPlayerId}/position`).set({
            x: position.x,
            y: position.y,
            z: position.z,
            timestamp: Date.now()
        }).catch(err => {
            console.error('Position broadcast error:', err);
        });
    }

    broadcastGameStart() {
        if (!this.roomRef || this.offlineMode) {
            console.log('Starting game in offline mode');
            return;
        }

        this.roomRef.child('gameStarted').set(true);
    }
    
    broadcastMicNoise(position, range) {
        if (!this.roomRef || !position || this.offlineMode) return;
        
        this.roomRef.child('micNoise').set({
            playerId: this.localPlayerId,
            position: { x: position.x, y: position.y, z: position.z },
            range: range,
            timestamp: Date.now()
        }).catch(err => {
            console.error('Mic noise broadcast error:', err);
        });
    }

    onPlayerJoined(playerData) {
        console.log('Player joined:', playerData.name);
        if (typeof updatePlayerCount === 'function') {
            // Get current player count from Firebase
            this.playersRef.once('value', (snapshot) => {
                const players = snapshot.val() || {};
                updatePlayerCount(Object.keys(players).length);
            });
        }
    }
    
    onPlayerLeft(playerData) {
        console.log('Player left:', playerData.name);
        if (typeof updatePlayerCount === 'function') {
            this.playersRef.once('value', (snapshot) => {
                const players = snapshot.val() || {};
                updatePlayerCount(Object.keys(players).length);
            });
        }
    }

    onPlayerMove(payload) {
        const { id, position } = payload.payload;
        if (id === this.localPlayerId) return;

        const player = playerManager.getPlayer(id);
        if (player && position) {
            const targetPos = new THREE.Vector3(position.x, position.y, position.z);
            const currentPos = player.position;
            const lerpFactor = 0.3;
            
            const newX = currentPos.x + (targetPos.x - currentPos.x) * lerpFactor;
            const newY = currentPos.y + (targetPos.y - currentPos.y) * lerpFactor;
            const newZ = currentPos.z + (targetPos.z - currentPos.z) * lerpFactor;
            
            player.setPosition(newX, newY, newZ);
        }
    }

    onGameStart() {
        if (typeof startGame === 'function') {
            startGame();
        }
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    async disconnect() {
        if (this.playersRef) {
            this.playersRef.off();
        }
        
        if (this.roomRef) {
            this.roomRef.off();
        }

        if (this.roomCode && this.localPlayerId && !this.offlineMode) {
            try {
                await this.roomRef.child(`players/${this.localPlayerId}`).remove();
                
                // Check if room is empty and delete it
                const snapshot = await this.roomRef.child('players').once('value');
                const players = snapshot.val();
                
                if (!players || Object.keys(players).length === 0) {
                    await this.roomRef.remove();
                }
            } catch (err) {
                console.error('Error disconnecting:', err);
            }
        }
    }
}

const firebaseNetwork = new FirebaseNetwork();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    firebaseNetwork.disconnect();
});