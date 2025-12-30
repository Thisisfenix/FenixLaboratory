export class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.gamepadController = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.keydownHandler = null;
        this.keyupHandler = null;
        this.joystickState = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            touchId: null
        };
        this.debugTouches = [];
        this.init();
    }
    
    init() {
        this.setupKeyboardEvents();
        this.initGamepad();
    }
    
    setupGameEventListeners(game) {
        // Remove existing listeners if any
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
            document.removeEventListener('keyup', this.keyupHandler);
        }
        
        this.keydownHandler = (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            const player = game.players[game.myPlayerId];
            
            // Controles de espectador
            if (player && player.spectating) {
                const alivePlayers = Object.values(game.players).filter(p => p.alive && !p.spectating);
                if (alivePlayers.length > 0) {
                    if (key === 'arrowleft' || key === 'a') {
                        e.preventDefault();
                        game.spectatorIndex = (game.spectatorIndex - 1 + alivePlayers.length) % alivePlayers.length;
                    } else if (key === 'arrowright' || key === 'd') {
                        e.preventDefault();
                        game.spectatorIndex = (game.spectatorIndex + 1) % alivePlayers.length;
                    }
                }
                return;
            }
            
            // Abilities
            if (key === 'q') game.abilityManager.useAbility('q');
            if (key === 'e') game.abilityManager.useAbility('e');
            if (key === 'f') {
                if (game.showRevivePrompt) {
                    const downedPlayer = game.players[game.showRevivePrompt];
                    if (downedPlayer && downedPlayer.downed) {
                        downedPlayer.beingRevived = true;
                        downedPlayer.reviveProgress = 0;
                        game.showRevivePrompt = null;
                    }
                } else if (game.survivorInteractions && player && player.role === 'survivor' && player.alive && !player.downed) {
                    game.survivorInteractions.manualInteraction(player);
                }
            }
            if (key === 'r') game.abilityManager.useAbility('r');
            if (key === 'c') game.abilityManager.activateRageMode();
            if (key === ' ') {
                e.preventDefault();
                game.combatManager.handleAttack();
            }
        };
        
        this.keyupHandler = (e) => {
            if (e.key) this.keys[e.key.toLowerCase()] = false;
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
        // Mouse controls
        game.canvas.addEventListener('click', (e) => {
            const player = game.players[game.myPlayerId];
            
            if (player && player.spectating && game.spectatorButtons) {
                const rect = game.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                
                const alivePlayers = Object.values(game.players).filter(p => p.alive && !p.spectating);
                
                if (alivePlayers.length > 0) {
                    if (clickX >= game.spectatorButtons.prev.x && clickX <= game.spectatorButtons.prev.x + game.spectatorButtons.prev.width &&
                        clickY >= game.spectatorButtons.prev.y && clickY <= game.spectatorButtons.prev.y + game.spectatorButtons.prev.height) {
                        game.spectatorIndex = (game.spectatorIndex - 1 + alivePlayers.length) % alivePlayers.length;
                        return;
                    }
                    
                    if (clickX >= game.spectatorButtons.next.x && clickX <= game.spectatorButtons.next.x + game.spectatorButtons.next.width &&
                        clickY >= game.spectatorButtons.next.y && clickY <= game.spectatorButtons.next.y + game.spectatorButtons.next.height) {
                        game.spectatorIndex = (game.spectatorIndex + 1) % alivePlayers.length;
                        return;
                    }
                }
            }
            
            game.combatManager.handleAttack(e);
        });
        
        game.canvas.addEventListener('mousemove', (e) => {
            const rect = game.canvas.getBoundingClientRect();
            this.lastMouseX = e.clientX - rect.left + game.camera.x;
            this.lastMouseY = e.clientY - rect.top + game.camera.y;
            game.lastMouseX = this.lastMouseX;
            game.lastMouseY = this.lastMouseY;
        });
        
        if (this.isMobile()) {
            this.setupMobileControls();
        }
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key) this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key) this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupMobileControls() {
        if (!this.isMobile()) return;

        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, {passive: false});
        
        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, {passive: false});
        
        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, {passive: false});
    }
    
    initGamepad() {
        if (window.GamepadController) {
            this.gamepadController = new GamepadController();
        }
    }
    

    
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }
    
    handleTouchStart(e) {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const rect = this.game.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            if (this.game.mobileControls && this.game.mobileControls.joystick) {
                const joystick = this.game.mobileControls.joystick;
                const joyDist = Math.sqrt(
                    Math.pow(x - joystick.x, 2) + 
                    Math.pow(y - joystick.y, 2)
                );
                
                if (joyDist <= 45) {
                    this.joystickState.active = true;
                    this.joystickState.startX = joystick.x;
                    this.joystickState.startY = joystick.y;
                    this.joystickState.currentX = x;
                    this.joystickState.currentY = y;
                    this.joystickState.touchId = touch.identifier;
                    return;
                }
            }
            
            if (this.game.mobileControls && this.game.mobileControls.abilities) {
                for (const [key, button] of Object.entries(this.game.mobileControls.abilities)) {
                    const dist = Math.sqrt(
                        Math.pow(x - button.x, 2) + 
                        Math.pow(y - button.y, 2)
                    );
                    if (dist < button.touchRadius) {
                        if (key === 'c') {
                            this.game.abilityManager.activateRageMode();
                        } else {
                            this.game.abilityManager.useAbility(key);
                        }
                        return;
                    }
                }
            }
        }
    }
    
    handleTouchMove(e) {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            if (this.joystickState.active && touch.identifier === this.joystickState.touchId) {
                const rect = this.game.canvas.getBoundingClientRect();
                this.joystickState.currentX = touch.clientX - rect.left;
                this.joystickState.currentY = touch.clientY - rect.top;
                
                const dx = this.joystickState.currentX - this.joystickState.startX;
                const dy = this.joystickState.currentY - this.joystickState.startY;
                const threshold = 12;
                
                this.keys['w'] = dy < -threshold;
                this.keys['s'] = dy > threshold;
                this.keys['a'] = dx < -threshold;
                this.keys['d'] = dx > threshold;
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
                
                this.keys['w'] = false;
                this.keys['s'] = false;
                this.keys['a'] = false;
                this.keys['d'] = false;
                break;
            }
        }
    }
    
    drawMobileControls(player) {
        if (!this.isMobile() || !this.game.ctx) return;

        const canvasWidth = this.game.canvas.cssWidth || this.game.canvas.width;
        const canvasHeight = this.game.canvas.cssHeight || this.game.canvas.height;
        
        if (!this.game.mobileControls) {
            this.game.mobileControls = {
                joystick: { x: 80, y: canvasHeight - 80, size: 120 },
                abilities: {}
            };
        }
        
        this.game.ctx.save();
        this.game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Draw joystick
        const joystick = this.game.mobileControls.joystick;
        this.game.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.game.ctx.beginPath();
        this.game.ctx.arc(joystick.x, joystick.y, 45, 0, Math.PI * 2);
        this.game.ctx.fill();
        
        // Draw ability buttons
        const abilities = player && player.role === 'killer' ? ['q', 'e', 'r', 'c'] : ['q', 'e', 'r', 'f'];
        abilities.forEach((key, index) => {
            const x = canvasWidth - 60 - (index * 70);
            const y = canvasHeight - 60;
            
            this.game.mobileControls.abilities[key] = {
                x: x, y: y, size: 50, touchRadius: 35
            };
            
            this.game.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.game.ctx.beginPath();
            this.game.ctx.arc(x, y, 25, 0, Math.PI * 2);
            this.game.ctx.fill();
            
            this.game.ctx.fillStyle = '#fff';
            this.game.ctx.font = 'bold 16px Arial';
            this.game.ctx.textAlign = 'center';
            this.game.ctx.textBaseline = 'middle';
            this.game.ctx.fillText(key.toUpperCase(), x, y);
        });
        
        this.game.ctx.restore();
    }
    
    getMovementVector() {
        let x = 0, y = 0;
        
        if (this.isKeyPressed('a')) x -= 1;
        if (this.isKeyPressed('d')) x += 1;
        if (this.isKeyPressed('w')) y -= 1;
        if (this.isKeyPressed('s')) y += 1;
        
        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            x *= 0.707;
            y *= 0.707;
        }
        
        return { x, y };
    }
}