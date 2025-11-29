// Chapter 3 - Cursed Castle (SNEAK PEEK)
class Chapter3 {
    constructor() {
        this.active = false;
        this.phase = 'cinematic';
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.velocity = new THREE.Vector3();
        this.dialogueTriggered = false;
        this.stepAudio = null;
        this.runAudio = null;
        this.runAudioPlaying = false;
        this.footstepTimer = 0;
        this.footstepInterval = 500;
    }

    start() {
        this.active = true;
        this.phase = 'cinematic';
        this.clearScene();
        this.setupControls();
        this.initAudio();
        this.startCinematic();
    }

    initAudio() {
        this.stepAudio = new Audio('stuff/castlestep.mp3');
        this.stepAudio.volume = 0.3;
        
        this.runAudio = new Audio('stuff/castlerun.mp3');
        this.runAudio.volume = 0.4;
        this.runAudio.loop = true;
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        document.addEventListener('mousemove', (e) => {
            if(document.pointerLockElement) {
                this.mouseX -= e.movementX * 0.002;
                this.mouseY -= e.movementY * 0.002;
                this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
            }
        });
    }

    clearScene() {
        while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }

    startCinematic() {
        // Fade desde negro
        const blackScreen = document.createElement('div');
        blackScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;';
        document.body.appendChild(blackScreen);

        this.createCastleHallway();

        // Cámara cinemática - vista exterior del castillo
        camera.position.set(0, 3, -15);
        camera.lookAt(0, 2, 0);

        // Fade in
        setTimeout(() => {
            blackScreen.style.transition = 'opacity 3s';
            blackScreen.style.opacity = '0';
            setTimeout(() => blackScreen.remove(), 3000);
        }, 500);

        // Diálogos cinemáticos
        setTimeout(() => {
            showMonologue('El Castillo Maldito...');
            setTimeout(() => {
                showMonologue('Las puertas se abren...');
                setTimeout(() => {
                    this.moveCameraInside();
                }, 3000);
            }, 3000);
        }, 2000);
    }

    moveCameraInside() {
        // Mover cámara hacia adentro del castillo
        let progress = 0;
        const moveInterval = setInterval(() => {
            progress += 0.01;
            camera.position.z += 0.2;
            camera.position.y = 3 - progress * 1.4;
            camera.lookAt(0, 1.6, camera.position.z + 10);

            if(camera.position.z >= 0) {
                clearInterval(moveInterval);
                camera.position.set(0, 1.6, 0);
                camera.lookAt(0, 1.6, 25);
                this.phase = 'entering';
                showMonologue('Entré al castillo...');
            }
        }, 16);
    }

    createCastleHallway() {
        // Iluminación mejorada
        const ambient = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambient);

        // Luz direccional dramática desde arriba
        const directional = new THREE.DirectionalLight(0x8b4513, 0.6);
        directional.position.set(0, 10, 10);
        scene.add(directional);

        // Suelo de piedra
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 50),
            new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = 25;
        scene.add(floor);

        // Paredes de piedra
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 50), wallMat);
        wallLeft.position.set(-4, 3, 25);
        scene.add(wallLeft);

        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 50), wallMat);
        wallRight.position.set(4, 3, 25);
        scene.add(wallRight);

        // Techo
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 50),
            new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 6, 25);
        scene.add(ceiling);

        // Antorchas en las paredes (cada 10m)
        for(let z = 5; z < 50; z += 10) {
            const torchLight = new THREE.PointLight(0xff6600, 1, 8);
            torchLight.position.set(-3.5, 3, z);
            scene.add(torchLight);

            const torchLight2 = new THREE.PointLight(0xff6600, 1, 8);
            torchLight2.position.set(3.5, 3, z);
            scene.add(torchLight2);
        }

        // Puerta misteriosa al final
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x1a0a0a })
        );
        doorFrame.position.set(0, 2, 48);
        scene.add(doorFrame);

        // Luz roja misteriosa en la puerta
        const doorLight = new THREE.PointLight(0xff0000, 2, 10);
        doorLight.position.set(0, 3, 47);
        scene.add(doorLight);

    }

    triggerDialogue() {
        this.dialogueTriggered = true;
        this.phase = 'dialogue';

        // Detener movimiento
        this.keys = {};

        showMonologue('Voces... detrás de la puerta...');
        setTimeout(() => {
            showMonologue('Voz 1: "El sujeto ha llegado..."');
            setTimeout(() => {
                showMonologue('Voz 2: "¿Está listo para la verdad?"');
                setTimeout(() => {
                    showMonologue('Voz 1: "Pronto lo sabremos..."');
                    setTimeout(() => {
                        showMonologue('Voz 2: "El Rey Oscuro espera..."');
                        setTimeout(() => {
                            this.showContinuara();
                        }, 3000);
                    }, 3000);
                }, 3000);
            }, 3000);
        }, 2000);
    }

    showContinuara() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:10000;opacity:0;transition:opacity 2s;';
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = '1';
            setTimeout(() => {
                overlay.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:#fff;font-family:Arial,sans-serif;text-align:center;">
                        <h1 style="font-size:100px;color:#8b0000;text-shadow:0 0 40px #ff0000;margin:0;animation:pulse 3s infinite;">CONTINUARÁ...</h1>
                        <h2 style="font-size:50px;color:#ffd700;margin:40px 0;text-shadow:0 0 20px #ffd700;">CAPÍTULO 3: EL CASTILLO MALDITO</h2>
                        <p style="font-size:35px;color:#ff6600;margin:20px 0;text-shadow:0 0 15px #ff6600;">📅 29-30 de Noviembre, 2025</p>
                        <p style="font-size:20px;color:#888;margin:40px 0;max-width:600px;line-height:1.6;">El Rey Oscuro espera... ¿Estás listo para descubrir la verdad sobre el Proyecto 666?</p>
                        <button onclick="location.reload()" style="padding:20px 50px;font-size:28px;background:linear-gradient(45deg,#8b0000,#ff0000);color:#fff;border:3px solid #ffd700;border-radius:15px;cursor:pointer;margin-top:40px;font-weight:bold;box-shadow:0 0 30px rgba(255,0,0,0.5);transition:all 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">🔙 Volver al Menú</button>
                    </div>
                    <style>
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                        }
                    </style>
                `;
            }, 2000);
        }, 100);
    }

    update(delta) {
        if(!this.active) return;
        if(this.phase !== 'entering') return;

        // Movimiento
        this.velocity.x = 0;
        this.velocity.z = 0;

        const isRunning = this.keys['shift'];
        const speed = isRunning ? 0.14 : 0.08;
        const isMoving = this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d'];
        
        if(this.keys['w']) this.velocity.z -= speed;
        if(this.keys['s']) this.velocity.z += speed;
        if(this.keys['a']) this.velocity.x -= speed;
        if(this.keys['d']) this.velocity.x += speed;

        // Rotación de cámara
        camera.rotation.order = 'YXZ';
        camera.rotation.y = this.mouseX;
        camera.rotation.x = this.mouseY;

        // Aplicar movimiento
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        camera.position.addScaledVector(direction, -this.velocity.z);
        camera.position.addScaledVector(right, -this.velocity.x);

        // Límites del pasillo
        camera.position.x = Math.max(-3.5, Math.min(3.5, camera.position.x));
        camera.position.z = Math.max(0, Math.min(45, camera.position.z));

        // Audio de correr
        if(isRunning && isMoving) {
            if(!this.runAudioPlaying && this.runAudio) {
                this.runAudioPlaying = true;
                this.runAudio.play().catch(() => {});
            }
        } else {
            if(this.runAudioPlaying && this.runAudio) {
                this.runAudioPlaying = false;
                this.runAudio.pause();
                this.runAudio.currentTime = 0;
            }
        }

        // Footsteps cuando NO está corriendo
        if(isMoving && !isRunning) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                if(this.stepAudio) {
                    this.stepAudio.currentTime = 0;
                    this.stepAudio.play().catch(() => {});
                }
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
        }

        // Trigger diálogo cerca de la puerta
        if(camera.position.z >= 40 && !this.dialogueTriggered) {
            this.triggerDialogue();
        }
    }
}

const chapter3 = new Chapter3();
