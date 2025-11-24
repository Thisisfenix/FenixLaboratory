// Lobby.js - Lógica del lobby 3D
class Lobby {
    constructor() {
        this.isActive = true;
        this.spawnPoints = [
            new THREE.Vector3(-6, 1, -6),
            new THREE.Vector3(6, 1, -6),
            new THREE.Vector3(-6, 1, 0),
            new THREE.Vector3(6, 1, 0),
            new THREE.Vector3(-6, 1, 6),
            new THREE.Vector3(6, 1, 6),
            new THREE.Vector3(0, 1, -6),
            new THREE.Vector3(0, 1, 6)
        ];
        this.playerColors = [
            0xff0000, // Rojo
            0x00ff00, // Verde
            0x0000ff, // Azul
            0xffff00, // Amarillo
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xff8800, // Naranja
            0x8800ff  // Morado
        ];
        this.keys = {};
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 0.08;
        this.canMove = false;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        this.joystickX = 0;
        this.joystickY = 0;
        this.cameraRotation = { x: 0, y: 0 };
        this.mouseSensitivity = 0.002;
        this.setupControls();
        if (this.isMobile) this.setupMobileControls();
        this.setupGamepad();
        this.setupMouseCamera();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.canMove) return;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupMouseCamera() {
        document.addEventListener('mousemove', (e) => {
            if (!this.canMove || !document.pointerLockElement) return;
            this.cameraRotation.x -= e.movementY * this.mouseSensitivity;
            this.cameraRotation.y -= e.movementX * this.mouseSensitivity;
            this.cameraRotation.x = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.cameraRotation.x));
        });
        
        document.addEventListener('click', () => {
            if (this.canMove) document.body.requestPointerLock();
        });
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
            if (!active || !this.canMove) return;
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
        
        document.getElementById('mobileControls').style.display = 'block';
    }
    
    setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
        });
    }
    
    updateGamepad() {
        const gamepads = navigator.getGamepads();
        if (!gamepads[0] || !this.canMove) return;
        
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

    create() {
        // Suelo
        engine.createFloor(20, 0x1a1a1a);

        // Paredes
        engine.createBox(20, 5, 0.5, 0x2a2a2a, 0, 2.5, -10);
        engine.createBox(20, 5, 0.5, 0x2a2a2a, 0, 2.5, 10);
        engine.createBox(0.5, 5, 20, 0x2a2a2a, -10, 2.5, 0);
        engine.createBox(0.5, 5, 20, 0x2a2a2a, 10, 2.5, 0);

        // Plataformas de spawn con colores
        this.spawnPoints.forEach((pos, i) => {
            engine.createBox(1.5, 0.2, 1.5, this.playerColors[i], pos.x, 0.1, pos.z);
            engine.addPointLight(this.playerColors[i], 0.8, 8, pos.x, 3, pos.z);
        });

        // Decoración
        for (let i = 0; i < 5; i++) {
            const x = (Math.random() - 0.5) * 15;
            const z = (Math.random() - 0.5) * 15;
            engine.createBox(0.5, 2, 0.5, 0x444444, x, 1, z);
        }

        console.log('Lobby created');
    }

    spawnPlayer(playerData, index) {
        const spawnPos = this.spawnPoints[index] || this.spawnPoints[0];
        const player = playerManager.addPlayer(
            playerData.id,
            playerData.name,
            playerData.color,
            playerData.isLocal
        );
        player.setPosition(spawnPos.x, spawnPos.y, spawnPos.z);
        
        if (playerData.isLocal) {
            this.canMove = true;
        }
        
        return player;
    }

    update(delta) {
        // Actualizar gamepad
        this.updateGamepad();
        
        // Movimiento del jugador local
        if (this.canMove && playerManager.localPlayer) {
            this.velocity.set(0, 0, 0);
            let moved = false;
            
            // Teclado
            if (this.keys['KeyW']) {
                this.velocity.z -= this.moveSpeed;
                moved = true;
            }
            if (this.keys['KeyS']) {
                this.velocity.z += this.moveSpeed;
                moved = true;
            }
            if (this.keys['KeyA']) {
                this.velocity.x -= this.moveSpeed;
                moved = true;
            }
            if (this.keys['KeyD']) {
                this.velocity.x += this.moveSpeed;
                moved = true;
            }
            
            // Joystick (móvil/gamepad)
            if (Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1) {
                this.velocity.x += this.joystickX * this.moveSpeed;
                this.velocity.z += this.joystickY * this.moveSpeed;
                moved = true;
            }
            
            const player = playerManager.localPlayer;
            const newPos = player.position.clone().add(this.velocity);
            
            // Límites del lobby
            newPos.x = Math.max(-9, Math.min(9, newPos.x));
            newPos.z = Math.max(-9, Math.min(9, newPos.z));
            
            player.setPosition(newPos.x, newPos.y, newPos.z);
            
            // Cámara tercera persona con rotación
            const distance = 5;
            const height = 3;
            const camX = player.position.x + Math.sin(this.cameraRotation.y) * distance;
            const camZ = player.position.z + Math.cos(this.cameraRotation.y) * distance;
            const camY = player.position.y + height + Math.sin(this.cameraRotation.x) * 2;
            
            engine.camera.position.set(camX, camY, camZ);
            engine.camera.lookAt(player.position);
        } else {
            // Cámara rotatoria si no hay jugador local
            const time = Date.now() * 0.0003;
            engine.camera.position.x = Math.sin(time) * 12;
            engine.camera.position.z = Math.cos(time) * 12;
            engine.camera.position.y = 6;
            engine.camera.lookAt(0, 1, 0);
        }
    }

    destroy() {
        this.isActive = false;
        playerManager.clear();
        if (document.pointerLockElement) document.exitPointerLock();
    }
}

const lobby = new Lobby();
