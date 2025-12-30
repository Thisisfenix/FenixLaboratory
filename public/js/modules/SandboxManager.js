export class SandboxManager {
    constructor(game) {
        this.game = game;
    }
    
    startSandboxMode() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) return alert('Por favor ingresa tu nombre');
        if (!this.game.selectedCharacter) return alert('Selecciona un personaje');
        
        this.game.sandboxMode = true;
        this.game.gameStarted = true;
        this.game.myPlayerId = 'sandbox_player';
        
        const player = {
            id: this.game.myPlayerId,
            name: playerName,
            x: 400,
            y: 300,
            alive: true,
            character: this.game.selectedCharacter,
            role: this.game.selectedRole,
            health: this.getCharacterHealth(this.game.selectedCharacter, this.game.selectedRole),
            maxHealth: this.getCharacterHealth(this.game.selectedCharacter, this.game.selectedRole),
            dodgeBar: this.game.selectedCharacter === 'iris' ? 75 : 0,
            maxDodgeBar: this.game.selectedCharacter === 'iris' ? 75 : 0,
            spectating: false
        };
        
        this.game.players[this.game.myPlayerId] = player;
        this.createSandboxDummies();
        this.game.abilityManager.setupAbilities();
        this.game.uiManager.showGameScreen();
    }
    
    getCharacterHealth(character, role) {
        if (role === 'survivor') {
            switch (character) {
                case 'iA777': return 120;
                case 'luna': return 85;
                case 'angel': return 90;
                case 'iris': return 100;
                case 'molly': return 95;
                default: return 100;
            }
        } else {
            return character === 'vortex' ? 700 : 600;
        }
    }
    
    createSandboxDummies() {
        const player = this.game.players[this.game.myPlayerId];
        const oppositeRole = player.role === 'killer' ? 'survivor' : 'killer';
        const characters = oppositeRole === 'killer' ? ['2019x', 'vortex'] : ['gissel', 'iA777', 'luna', 'angel', 'iris', 'molly'];
        
        for (let i = 0; i < 3; i++) {
            const character = characters[i % characters.length];
            const dummyId = `dummy_${i}`;
            
            this.game.players[dummyId] = {
                id: dummyId,
                name: `Dummy ${character}`,
                x: 200 + i * 300,
                y: 500 + i * 100,
                alive: true,
                character: character,
                role: oppositeRole,
                health: this.getCharacterHealth(character, oppositeRole),
                maxHealth: this.getCharacterHealth(character, oppositeRole),
                dodgeBar: character === 'iris' ? 75 : 0,
                maxDodgeBar: character === 'iris' ? 75 : 0,
                spectating: false,
                isDummy: true,
                aiMovement: {
                    moveTimer: 0,
                    direction: Math.random() * Math.PI * 2
                }
            };
        }
        
        if (player.role === 'survivor') {
            this.game.players.dummy_downed = {
                id: 'dummy_downed',
                name: 'Downed Dummy',
                x: 600,
                y: 400,
                alive: true,
                downed: true,
                reviveTimer: 1200,
                beingRevived: false,
                character: 'gissel',
                role: oppositeRole,
                health: 0,
                maxHealth: 100,
                spectating: false,
                isDummy: true
            };
        }
    }
    
    updateSandboxDummies() {
        if (!this.game.sandboxMode) return;
        
        Object.values(this.game.players).forEach(player => {
            if (!player.isDummy || !player.alive) return;
            
            player.aiMovement.moveTimer++;
            if (player.aiMovement.moveTimer >= 180) {
                player.aiMovement.direction = Math.random() * Math.PI * 2;
                player.aiMovement.moveTimer = 0;
            }
            
            const newX = Math.max(50, Math.min(this.game.worldSize.width - 80, 
                player.x + Math.cos(player.aiMovement.direction) * 2));
            const newY = Math.max(50, Math.min(this.game.worldSize.height - 80, 
                player.y + Math.sin(player.aiMovement.direction) * 2));
            
            player.x = newX;
            player.y = newY;
            
            if (player.x <= 50 || player.x >= this.game.worldSize.width - 80 || 
                player.y <= 50 || player.y >= this.game.worldSize.height - 80) {
                player.aiMovement.direction += Math.PI;
            }
        });
    }
    
    exitSandbox() {
        this.game.sandboxMode = false;
        this.game.gameStarted = false;
        this.game.players = {};
        this.game.particles = [];
        this.game.hitboxes = [];
        
        document.getElementById('lobby').classList.add('active');
        document.getElementById('game').classList.remove('active');
    }
}