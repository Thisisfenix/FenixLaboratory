// Network.js - Sistema de red (simulado por ahora)
class Network {
    constructor() {
        this.roomCode = this.generateRoomCode();
        this.players = [];
        this.maxPlayers = 2;
        this.isHost = false;
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    joinRoom(playerName) {
        if (this.players.length >= this.maxPlayers) {
            return { success: false, message: 'Sala llena' };
        }

        const playerId = Date.now();
        const playerColor = this.players.length === 0 ? 0x00ff00 : 0xff0000;
        
        const playerData = {
            id: playerId,
            name: playerName,
            color: playerColor,
            isLocal: true
        };

        this.players.push(playerData);
        
        if (this.players.length === 1) {
            this.isHost = true;
        }

        return { 
            success: true, 
            playerData: playerData,
            roomCode: this.roomCode
        };
    }

    simulateSecondPlayer() {
        if (this.players.length >= this.maxPlayers) return;

        const botNames = ['Ankush', 'Shadow', 'Ghost', 'Phantom'];
        const botName = botNames[Math.floor(Math.random() * botNames.length)];
        
        const playerData = {
            id: Date.now() + 1,
            name: botName,
            color: 0xff0000,
            isLocal: false
        };

        this.players.push(playerData);
        
        return playerData;
    }

    getPlayerCount() {
        return this.players.length;
    }

    isRoomFull() {
        return this.players.length >= this.maxPlayers;
    }

    canStartGame() {
        return this.isRoomFull() && this.isHost;
    }
}

const network = new Network();
