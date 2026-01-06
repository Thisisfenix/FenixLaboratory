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
            if (this.canMove && !document.pointerLockElement) {
                document.body.requestPointerLock().catch(() => {
                    // Silently ignore pointer lock errors
                });
            }
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
            const mat = new THREE.MeshBasicMaterial({ color: this.playerColors[i] });
            const geo = new THREE.BoxGeometry(1.5, 0.2, 1.5);
            const box = new THREE.Mesh(geo, mat);
            box.position.set(pos.x, 0.1, pos.z);
            box.matrixAutoUpdate = false;
            box.updateMatrix();
            engine.addObject(box);
        });

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
        if (!this.canMove || !playerManager.localPlayer) return;
        
        this.updateGamepad();
        
        let moveX = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
        let moveZ = (this.keys['KeyS'] ? 1 : 0) - (this.keys['KeyW'] ? 1 : 0);
        
        if (Math.abs(this.joystickX) > 0.1) moveX += this.joystickX;
        if (Math.abs(this.joystickY) > 0.1) moveZ += this.joystickY;
        
        if (moveX !== 0 || moveZ !== 0) {
            const angle = this.cameraRotation.y;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            const player = playerManager.localPlayer;
            const newX = Math.max(-9, Math.min(9, player.position.x + (moveX * cos + moveZ * sin) * this.moveSpeed));
            const newZ = Math.max(-9, Math.min(9, player.position.z + (-moveX * sin + moveZ * cos) * this.moveSpeed));
            
            player.setPosition(newX, player.position.y, newZ);
            player.setRotation(Math.atan2(moveX * cos + moveZ * sin, -moveX * sin + moveZ * cos));
        }
        
        const player = playerManager.localPlayer;
        const sinY = Math.sin(this.cameraRotation.y);
        const cosY = Math.cos(this.cameraRotation.y);
        const sinX = Math.sin(this.cameraRotation.x);
        
        engine.camera.position.set(
            player.position.x + sinY * 5,
            player.position.y + 3 + sinX * 2,
            player.position.z + cosY * 5
        );
        engine.camera.lookAt(player.position);
    }

    destroy() {
        this.isActive = false;
        this.canMove = false;
        
        // Guardar referencias de jugadores
        const playerMeshes = new Set();
        playerManager.players.forEach(player => {
            if (player.mesh) {
                playerMeshes.add(player.mesh);
            }
        });
        
        // Limpiar escena excepto jugadores y luces
        const toRemove = [];
        engine.scene.children.forEach(child => {
            if (!playerMeshes.has(child) && 
                child.type !== 'DirectionalLight' && 
                child.type !== 'AmbientLight' &&
                child.type !== 'HemisphereLight' &&
                !child.isCamera) {
                toRemove.push(child);
            }
        });
        toRemove.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            engine.scene.remove(obj);
        });
        
        if (document.pointerLockElement) document.exitPointerLock();
        
        console.log('Lobby destroyed, players preserved');
    }
}

const lobby = new Lobby();
