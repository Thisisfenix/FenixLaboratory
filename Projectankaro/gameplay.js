// Gameplay.js - Mecánicas del juego
class Gameplay {
    constructor() {
        this.localPlayer = null;
        this.stamina = 100;
        this.maxStamina = 100;
        this.isRunning = false;
        this.isMoving = false;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.onGround = true;
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 0.05;
        this.runSpeed = 0.1;
        this.jumpForce = 0.15;
        this.gravity = 0.008;
        this.keys = {};
        this.surfaceType = 'floor';
        this.inRainZone = false;
        this.cameraRotation = { x: 0, y: 0 };
        this.mouseSensitivity = 0.002;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.joystickX = 0;
        this.joystickY = 0;
    }

    init(player) {
        this.localPlayer = player;
        this.setupControls();
        this.createUI();
        audioManager.init();
        audioManager.startAmbient();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space' && this.onGround) {
                this.jump();
            }
            
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.isRunning = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.isRunning = false;
                audioManager.stopRunning();
            }
        });
        
        // Mouse camera
        document.addEventListener('mousemove', (e) => {
            if (!document.pointerLockElement) return;
            this.cameraRotation.x -= e.movementY * this.mouseSensitivity;
            this.cameraRotation.y -= e.movementX * this.mouseSensitivity;
            this.cameraRotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraRotation.x));
        });
        
        document.addEventListener('click', () => {
            if (this.localPlayer) document.body.requestPointerLock();
        });
        
        // Mobile controls
        if (this.isMobile) this.setupMobileControls();
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const stick = document.getElementById('stick');
        let active = false;
        
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            active = true;
        });
        
        joystick.addEventListener('touchmove', (e) => {
            if (!active) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            this.joystickX = (touch.clientX - centerX) / 35;
            this.joystickY = (touch.clientY - centerY) / 35;
            this.joystickX = Math.max(-1, Math.min(1, this.joystickX));
            this.joystickY = Math.max(-1, Math.min(1, this.joystickY));
            
            stick.style.left = (35 + this.joystickX * 35) + 'px';
            stick.style.top = (35 + this.joystickY * 35) + 'px';
        });
        
        joystick.addEventListener('touchend', () => {
            active = false;
            this.joystickX = 0;
            this.joystickY = 0;
            stick.style.left = '35px';
            stick.style.top = '35px';
        });
    }

    createUI() {
        // Barra de stamina
        const staminaBar = document.createElement('div');
        staminaBar.id = 'staminaBar';
        staminaBar.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 200px;
            height: 20px;
            background: #222;
            border: 2px solid #00ff00;
            z-index: 100;
        `;
        
        const staminaFill = document.createElement('div');
        staminaFill.id = 'staminaFill';
        staminaFill.style.cssText = `
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, #00ff00, #88ff88);
            transition: width 0.1s;
        `;
        
        staminaBar.appendChild(staminaFill);
        document.body.appendChild(staminaBar);
    }

    jump() {
        if (!this.onGround || this.isJumping) return;
        
        this.isJumping = true;
        this.jumpVelocity = this.jumpForce;
        this.onGround = false;
        audioManager.play('jump');
    }

    updateMovement(delta) {
        // Gamepad
        this.updateGamepad();
        
        this.velocity.set(0, 0, 0);
        
        const speed = (this.isRunning && this.stamina > 0) ? this.runSpeed : this.moveSpeed;
        this.isMoving = false;
        
        // Movimiento relativo a la cámara (estilo Roblox)
        let moveX = 0;
        let moveZ = 0;
        
        if (this.keys['KeyW']) {
            moveZ -= 1;
            this.isMoving = true;
        }
        if (this.keys['KeyS']) {
            moveZ += 1;
            this.isMoving = true;
        }
        if (this.keys['KeyA']) {
            moveX -= 1;
            this.isMoving = true;
        }
        if (this.keys['KeyD']) {
            moveX += 1;
            this.isMoving = true;
        }
        
        // Joystick (móvil/gamepad)
        if (Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1) {
            moveX += this.joystickX;
            moveZ += this.joystickY;
            this.isMoving = true;
        }
        
        // Aplicar rotación de cámara al movimiento (dirección exacta de la cámara)
        if (this.isMoving) {
            const forward = new THREE.Vector3(
                Math.sin(this.cameraRotation.y),
                -Math.sin(this.cameraRotation.x),
                Math.cos(this.cameraRotation.y)
            ).normalize();
            
            const right = new THREE.Vector3(
                Math.cos(this.cameraRotation.y),
                0,
                -Math.sin(this.cameraRotation.y)
            ).normalize();
            
            this.velocity.x = (right.x * moveX + forward.x * -moveZ) * speed;
            this.velocity.y = (forward.y * -moveZ) * speed;
            this.velocity.z = (right.z * moveX + forward.z * -moveZ) * speed;
        }

        // Stamina
        if (this.isRunning && this.isMoving && this.stamina > 0) {
            this.stamina -= 0.5;
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.isRunning = false;
                audioManager.play('exhausted');
                audioManager.stopRunning();
            }
        } else if (this.stamina < this.maxStamina) {
            this.stamina += 0.2;
        }

        // Audio de movimiento
        if (this.isMoving && this.onGround) {
            if (this.isRunning && this.stamina > 0) {
                audioManager.playRunning(this.surfaceType === 'grass');
            } else {
                audioManager.stopRunning();
                audioManager.footstepTimer += delta * 1000;
                if (audioManager.footstepTimer >= audioManager.footstepInterval) {
                    audioManager.playFootstep(this.surfaceType === 'grass');
                    audioManager.footstepTimer = 0;
                }
            }
        } else {
            audioManager.stopRunning();
            audioManager.footstepTimer = 0;
        }

        // Aplicar movimiento
        if (this.localPlayer) {
            const newPos = this.localPlayer.position.clone();
            newPos.add(this.velocity);
            this.localPlayer.setPosition(newPos.x, newPos.y, newPos.z);
        }

        // Gravedad y salto
        if (this.isJumping || !this.onGround) {
            if (this.localPlayer) {
                const newY = this.localPlayer.position.y + this.jumpVelocity;
                this.localPlayer.setPosition(
                    this.localPlayer.position.x,
                    newY,
                    this.localPlayer.position.z
                );
            }
            this.jumpVelocity -= this.gravity;
            
            if (this.localPlayer && this.localPlayer.position.y <= 1) {
                this.localPlayer.setPosition(
                    this.localPlayer.position.x,
                    1,
                    this.localPlayer.position.z
                );
                this.isJumping = false;
                this.onGround = true;
                this.jumpVelocity = 0;
            }
        }

        // Actualizar UI
        this.updateUI();
    }

    updateUI() {
        const staminaFill = document.getElementById('staminaFill');
        if (staminaFill) {
            staminaFill.style.width = (this.stamina / this.maxStamina * 100) + '%';
            
            const staminaBar = document.getElementById('staminaBar');
            if (this.stamina < 30) {
                staminaBar.style.borderColor = '#ff0000';
                staminaFill.style.background = 'linear-gradient(90deg, #ff0000, #ff8888)';
            } else {
                staminaBar.style.borderColor = '#00ff00';
                staminaFill.style.background = 'linear-gradient(90deg, #00ff00, #88ff88)';
            }
        }
    }

    setSurfaceType(type) {
        this.surfaceType = type;
    }

    setRainZone(inRain) {
        if (inRain && !this.inRainZone) {
            this.inRainZone = true;
            audioManager.startRain();
        } else if (!inRain && this.inRainZone) {
            this.inRainZone = false;
            audioManager.stopRain();
        }
    }

    updateGamepad() {
        const gamepads = navigator.getGamepads();
        if (!gamepads[0]) return;
        
        const gp = gamepads[0];
        const deadzone = 0.2;
        
        if (Math.abs(gp.axes[0]) > deadzone) this.joystickX = gp.axes[0];
        else this.joystickX = 0;
        
        if (Math.abs(gp.axes[1]) > deadzone) this.joystickY = gp.axes[1];
        else this.joystickY = 0;
        
        // Joystick derecho para cámara
        if (Math.abs(gp.axes[2]) > deadzone) {
            this.cameraRotation.y -= gp.axes[2] * 0.05;
        }
        if (Math.abs(gp.axes[3]) > deadzone) {
            this.cameraRotation.x -= gp.axes[3] * 0.05;
            this.cameraRotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraRotation.x));
        }
    }
    
    updateCamera() {
        if (!this.localPlayer) return;
        
        const distance = 8;
        const height = 5;
        const camX = this.localPlayer.position.x + Math.sin(this.cameraRotation.y) * distance;
        const camZ = this.localPlayer.position.z + Math.cos(this.cameraRotation.y) * distance;
        const camY = this.localPlayer.position.y + height + Math.sin(this.cameraRotation.x) * 3;
        
        engine.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1);
        engine.camera.lookAt(this.localPlayer.position);
    }

    update(delta) {
        this.updateMovement(delta);
        this.updateCamera();
    }
}

const gameplay = new Gameplay();
