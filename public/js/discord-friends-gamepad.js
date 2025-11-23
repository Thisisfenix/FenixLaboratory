/**
 * Discord Friends - Gamepad Controller System
 * Maneja entrada de mandos/controles para el juego
 */

class GamepadController {
    constructor(game) {
        this.game = game;
        this.gamepadIndex = null;
        this.gamepadButtons = {};
        this.deadzone = 0.2;
        
        // Mapeo de botones (Xbox/PlayStation estándar)
        this.buttonMap = {
            0: 'space',   // A/Cross - Ataque
            1: 'q',       // B/Circle - Habilidad Q
            2: 'e',       // X/Square - Habilidad E
            3: 'r',       // Y/Triangle - Habilidad R
            4: 'c',       // LB/L1 - Rage Mode/Power Surge
            5: 'f',       // RB/R1 - Revivir/Interacción
            9: 'escape'   // Start - Pausa/Menú
        };
        
        this.init();
    }
    
    init() {
        // Detectar conexión de gamepad
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad conectado:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
            this.showGamepadNotification('Gamepad conectado');
        });
        
        // Detectar desconexión de gamepad
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 Gamepad desconectado');
            this.gamepadIndex = null;
            this.showGamepadNotification('Gamepad desconectado');
        });
    }
    
    update() {
        if (this.gamepadIndex === null) return;
        
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;
        
        // Stick izquierdo - Movimiento (axes 0,1)
        const leftX = Math.abs(gamepad.axes[0]) > this.deadzone ? gamepad.axes[0] : 0;
        const leftY = Math.abs(gamepad.axes[1]) > this.deadzone ? gamepad.axes[1] : 0;
        
        this.game.keys['a'] = leftX < -this.deadzone;
        this.game.keys['d'] = leftX > this.deadzone;
        this.game.keys['w'] = leftY < -this.deadzone;
        this.game.keys['s'] = leftY > this.deadzone;
        
        // Procesar botones
        Object.keys(this.buttonMap).forEach(buttonIndex => {
            const button = gamepad.buttons[buttonIndex];
            const key = this.buttonMap[buttonIndex];
            const wasPressed = this.gamepadButtons[buttonIndex];
            const isPressed = button && button.pressed;
            
            // Detectar presión (edge detection)
            if (isPressed && !wasPressed) {
                this.handleButtonPress(key);
            }
            
            this.gamepadButtons[buttonIndex] = isPressed;
        });
    }
    
    handleButtonPress(key) {
        if (key === 'space') {
            this.game.handleAttack();
        } else if (key === 'q') {
            this.game.useAbility('q');
        } else if (key === 'e') {
            this.game.useAbility('e');
        } else if (key === 'r') {
            this.game.useAbility('r');
        } else if (key === 'c') {
            this.game.activateRageMode();
        } else if (key === 'f') {
            // Revivir o interacción
            const player = this.game.players[this.game.myPlayerId];
            if (this.game.showRevivePrompt) {
                const downedPlayer = this.game.players[this.game.showRevivePrompt];
                if (downedPlayer && downedPlayer.downed) {
                    downedPlayer.beingRevived = true;
                    downedPlayer.reviveProgress = 0;
                    this.game.showRevivePrompt = null;
                }
            } else if (this.game.survivorInteractions && player && player.role === 'survivor' && player.alive && !player.downed) {
                // Solo interactuar si está vivo y no downed
                this.game.survivorInteractions.manualInteraction(player);
            }
        }
    }
    
    showGamepadNotification(message) {
        // Mostrar notificación temporal
        if (this.game.ctx) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 255, 0, 0.9);
                color: #000;
                padding: 10px 20px;
                border-radius: 5px;
                font-weight: bold;
                z-index: 10000;
                animation: fadeOut 2s forwards;
            `;
            notification.textContent = `🎮 ${message}`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        }
    }
    
    isConnected() {
        return this.gamepadIndex !== null;
    }
    
    getGamepadInfo() {
        if (this.gamepadIndex === null) return null;
        
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return null;
        
        return {
            id: gamepad.id,
            index: gamepad.index,
            buttons: gamepad.buttons.length,
            axes: gamepad.axes.length
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.GamepadController = GamepadController;
}
