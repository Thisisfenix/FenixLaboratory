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
        
        // Detener TODOS los audios del Chapter 1
        if(typeof stopAllChapter1Audio === 'function') stopAllChapter1Audio();
        
        // Configurar renderer con fondo negro
        if(typeof renderer !== 'undefined') {
            renderer.setClearColor(0x000000);
        }
        
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
        // Niebla oscura
        scene.fog = new THREE.Fog(0x0a0a0a, 5, 35);
        
        // Iluminación tenue
        const ambient = new THREE.AmbientLight(0x1a1a2a, 0.15);
        scene.add(ambient);

        // Materiales con textura de piedra
        const stoneMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a, 
            roughness: 0.95, 
            metalness: 0.05,
            flatShading: true
        });
        const darkStoneMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 1, 
            metalness: 0,
            flatShading: true
        });

        // Suelo de piedra con bloques
        for(let z = -20; z < 50; z += 4) {
            for(let x = -4; x < 4; x += 2) {
                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 0.2, 4),
                    Math.random() > 0.5 ? stoneMat : darkStoneMat
                );
                tile.position.set(x, -0.1, z);
                scene.add(tile);
            }
        }

        // Paredes de piedra con profundidad
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2520, 
            roughness: 0.9, 
            metalness: 0.1,
            flatShading: true
        });
        
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 70), wallMat);
        wallLeft.position.set(-4.5, 4, 15);
        scene.add(wallLeft);

        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 70), wallMat);
        wallRight.position.set(4.5, 4, 15);
        scene.add(wallRight);

        // Techo arqueado oscuro
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(9, 70),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, side: THREE.DoubleSide })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 7.5, 15);
        scene.add(ceiling);

        // Columnas de piedra
        for(let z = -10; z < 50; z += 15) {
            const pillarL = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 7, 0.8),
                new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
            );
            pillarL.position.set(-3.8, 3.5, z);
            scene.add(pillarL);
            
            const pillarR = pillarL.clone();
            pillarR.position.set(3.8, 3.5, z);
            scene.add(pillarR);
        }

        // Antorchas con fuego
        for(let z = 0; z < 50; z += 12) {
            // Izquierda
            const torchHolderL = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.15, 0.8, 6),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 })
            );
            torchHolderL.position.set(-4, 3.5, z);
            scene.add(torchHolderL);
            
            const fireL = new THREE.PointLight(0xff4400, 1.5, 12);
            fireL.position.set(-4, 4, z);
            scene.add(fireL);
            
            // Derecha
            const torchHolderR = torchHolderL.clone();
            torchHolderR.position.set(4, 3.5, z);
            scene.add(torchHolderR);
            
            const fireR = new THREE.PointLight(0xff4400, 1.5, 12);
            fireR.position.set(4, 4, z);
            scene.add(fireR);
        }
        
        // Ventanas con luz de luna
        for(let z = 5; z < 45; z += 20) {
            const windowLight = new THREE.PointLight(0x6666ff, 0.3, 8);
            windowLight.position.set(Math.random() > 0.5 ? -4.3 : 4.3, 5, z);
            scene.add(windowLight);
        }

        // Puerta del castillo al final
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a0a0a, 
            roughness: 0.8,
            emissive: 0x330000,
            emissiveIntensity: 0.2
        });
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 5, 0.5),
            doorMat
        );
        door.position.set(0, 2.5, 48);
        scene.add(door);
        
        // Marco de puerta
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
        const frameTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, 0.6), frameMat);
        frameTop.position.set(0, 5.25, 48);
        scene.add(frameTop);

        // Luz roja siniestra en la puerta
        const doorLight = new THREE.PointLight(0xff0000, 3, 15);
        doorLight.position.set(0, 3.5, 47);
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
        // Permitir update durante cinemática también
        if(this.phase === 'cinematic') return;
        if(this.phase === 'dialogue') return;
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

        // Límites del pasillo del castillo
        camera.position.x = Math.max(-3.5, Math.min(3.5, camera.position.x));
        camera.position.z = Math.max(0, Math.min(47, camera.position.z));
        
        // Mostrar distancia en HUD
        const distEl = document.getElementById('distance');
        if(distEl) distEl.textContent = `Castillo: ${Math.floor(camera.position.z)}m / 47m`;

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
