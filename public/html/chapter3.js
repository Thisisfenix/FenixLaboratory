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
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaExhausted = false;
        this.hasHelmet = false;
        this.bossHP = 100;
        this.bossMaxHP = 100;
        this.bossAttacking = false;
        this.bossAttackTimer = 0;
        this.playerHP = 100;
        this.bullets = [];
        this.roomsCompleted = 0;
        this.totalRooms = 3;
        this.currentRoom = null;
        this.monologuesShown = {};
        
        // Limitador de framerate adaptativo
        this.maxFPS = Math.min(screen.refreshRate || 60, 120);
        this.maxDelta = 1/this.maxFPS;
    }

    start() {
        this.active = true;
        this.phase = 'cinematic';
        this.contextualMessagesShown = {};
        this.loadHelmetChip();
        
        // DETENER CHAPTER 2
        if(typeof chapter2 !== 'undefined' && chapter2) {
            chapter2.active = false;
            if(chapter2.stopRoomAudios) chapter2.stopRoomAudios();
            if(chapter2.runAudio) chapter2.runAudio.pause();
            if(chapter2.grassRunAudio) chapter2.grassRunAudio.pause();
            if(chapter2.chapter2RainAudio) chapter2.chapter2RainAudio.pause();
        }
        
        // DETENER CHAPTER 1 COMPLETAMENTE
        if(typeof stopAllChapter1Audio === 'function') stopAllChapter1Audio();
        window.escaped = true;
        window.cinematicPlaying = true;
        
        // Ocultar UI del Chapter 1 (excepto distance)
        ['interact', 'killerIndicator', 'staminaBar', 'jumpCooldown', 'deathCounter', 'vignette', 'distortion'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
        
        // Mostrar HUD del Chapter 3 con contexto del laboratorio
        const ui = document.getElementById('ui');
        if(ui) {
            ui.style.display = 'block';
            ui.innerHTML = `
                <div style="font-family: 'Courier New', monospace; color: #ff4444; text-shadow: 0 0 10px #ff0000; margin-bottom: 15px; font-size: 14px;">
                    ⚠️ SISTEMA EXPERIMENTAL ACTIVO ⚠️<br>
                    <span style="color: #888; font-size: 11px;">Protocolo: ??? | Ubicación: Castillo Maldito</span>
                </div>
                <div id="controlsHUD" style="background: rgba(0,0,0,0.7); padding: 8px; border-left: 3px solid #ff4444; margin-bottom: 10px;">
                    <span style="color: #ffd700;">⌨️ CONTROLES:</span> WASD - Mover | SHIFT - Correr
                </div>
                <div id="distance" style="background: rgba(0,0,0,0.7); padding: 8px; border-left: 3px solid #00ff88; color: #00ff88; font-weight: bold;">
                    📍 Progreso: 0m / 47m
                </div>
            `;
        }
        
        // Mostrar barra de stamina con estilo experimental
        const staminaBar = document.getElementById('staminaBar');
        if(staminaBar) {
            staminaBar.style.display = 'block';
            staminaBar.style.background = 'rgba(0,0,0,0.7)';
            staminaBar.style.borderColor = '#00ff88';
            staminaBar.style.borderLeft = '3px solid #00ff88';
            staminaBar.style.boxShadow = '0 0 15px rgba(0,255,136,0.6), inset 0 0 10px rgba(0,255,136,0.3)';
        }
        
        this.clearScene();
        this.setupControls();
        this.initAudio();
        this.startCinematic();
    }

    loadHelmetChip() {
        fetch('helmet_lore.json')
            .then(r => r.json())
            .then(data => {
                this.chipData = data.combat_chip;
                console.log('Chip cargado:', this.chipData.chip_name);
            })
            .catch(e => console.error('Error cargando chip:', e));
    }

    initAudio() {
        this.stepAudio = new Audio('stuff/castlestep.mp3');
        this.stepAudio.volume = 0.3;
        
        this.runAudio = new Audio('stuff/castlerun.mp3');
        this.runAudio.volume = 0.4;
        this.runAudio.loop = true;
    }

    setupControls() {
        this.keydownHandler = (e) => {
            if(!this.active) return;
            this.keys[e.key.toLowerCase()] = true;
            if(e.key.toLowerCase() === 'e' && this.hasHelmet && this.phase === 'battle') {
                this.shoot();
            }
        };
        this.keyupHandler = (e) => {
            if(!this.active) return;
            this.keys[e.key.toLowerCase()] = false;
        };
        this.mousemoveHandler = (e) => {
            if(!this.active || !document.pointerLockElement) return;
            this.mouseX -= e.movementX * 0.002;
            this.mouseY -= e.movementY * 0.002;
            this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        document.addEventListener('mousemove', this.mousemoveHandler);
        
        if(renderer && renderer.domElement) {
            this.clickHandler = () => {
                if(this.active) renderer.domElement.requestPointerLock();
            };
            renderer.domElement.addEventListener('click', this.clickHandler);
        }
    }

    clearScene() {
        // Limpiar COMPLETAMENTE la escena
        while(scene.children.length > 0) {
            const obj = scene.children[0];
            if(obj.geometry) obj.geometry.dispose();
            if(obj.material) {
                if(Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            scene.remove(obj);
        }
        
        // Limpiar variables globales del Chapter 1
        if(typeof window !== 'undefined') {
            window.flashlight = null;
            window.gisselPainting = null;
            window.obstacles = [];
            window.platforms = [];
        }
    }

    cleanup() {
        this.active = false;
        if(this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
        if(this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
        if(this.mousemoveHandler) document.removeEventListener('mousemove', this.mousemoveHandler);
        if(this.clickHandler && renderer && renderer.domElement) {
            renderer.domElement.removeEventListener('click', this.clickHandler);
        }
        if(this.stepAudio) this.stepAudio.pause();
        if(this.runAudio) this.runAudio.pause();
        this.keys = {};
        this.velocity.set(0, 0, 0);
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
        let progress = 0;
        const moveInterval = setInterval(() => {
            progress += 0.01;
            camera.position.z += 0.2;
            camera.position.y = 3 - progress * 1.4;
            camera.lookAt(0, 1.6, camera.position.z + 10);

            if(camera.position.z >= 0) {
                clearInterval(moveInterval);
                camera.position.set(0, 1.6, 0);
                camera.rotation.set(0, 0, 0);
                this.mouseX = 0;
                this.mouseY = 0;
                this.phase = 'entering';
                showMonologue('Entré al castillo...');
                this.showCastleMessage('chapter3_teaser', 0);
                setTimeout(() => this.showCastleMessage('chapter3_teaser', 1), 5000);
                
                // Forzar pointer lock
                setTimeout(() => {
                    if(renderer && renderer.domElement) {
                        renderer.domElement.requestPointerLock();
                    }
                }, 500);
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

        // Suelo de piedra con bloques (solo pasillo central)
        for(let z = -20; z < 50; z += 4) {
            for(let x = -4; x <= 4; x += 2) {
                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 0.2, 4),
                    Math.random() > 0.5 ? stoneMat : darkStoneMat
                );
                tile.position.set(x, -0.1, z);
                scene.add(tile);
            }
        }

        // Paredes de piedra con profundidad (divididas para crear aberturas)
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2520, 
            roughness: 0.9, 
            metalness: 0.1,
            flatShading: true
        });
        
        // Pared izquierda (aberturas en 13-17m y 33-37m)
        const wallL1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 11), wallMat);
        wallL1.position.set(-4.5, 4, 5.5);
        scene.add(wallL1);
        
        const wallL2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 14), wallMat);
        wallL2.position.set(-4.5, 4, 24);
        scene.add(wallL2);
        
        const wallL3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 9), wallMat);
        wallL3.position.set(-4.5, 4, 43);
        scene.add(wallL3);

        // Pared derecha (abertura en 23-27m)
        const wallR1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 21), wallMat);
        wallR1.position.set(4.5, 4, 10.5);
        scene.add(wallR1);
        
        const wallR2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 19), wallMat);
        wallR2.position.set(4.5, 4, 38);
        scene.add(wallR2);

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

        // Puertas laterales (3 salas)
        this.createSideRooms();
        
        // Puerta del castillo al final (bloqueada)
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a0a0a, 
            roughness: 0.8,
            emissive: this.roomsCompleted >= this.totalRooms ? 0x00ff00 : 0x330000,
            emissiveIntensity: 0.2
        });
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 5, 0.5),
            doorMat
        );
        door.position.set(0, 2.5, 48);
        scene.add(door);
        this.mainDoor = door;
        
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
        if(this.roomsCompleted < this.totalRooms) {
            showMonologue(`Debes completar las ${this.totalRooms} salas laterales primero`);
            showMonologue(`Progreso: ${this.roomsCompleted}/${this.totalRooms}`);
            return;
        }
        
        this.dialogueTriggered = true;
        this.phase = 'dialogue';

        showMonologue('Voces... detrás de la puerta...');
        setTimeout(() => {
            showMonologue('Voz 1: "El sujeto ha llegado..."');
            setTimeout(() => {
                showMonologue('Voz 2: "¿Está listo para la verdad?"');
                setTimeout(() => {
                    showMonologue('Voz 3: "La simulación está fallando..."');
                    setTimeout(() => {
                        this.showGlitchEffect();
                        setTimeout(() => this.enterThroneRoom(), 2000);
                    }, 3000);
                }, 3000);
            }, 3000);
        }, 2000);
    }
    
    showGlitchEffect() {
        const glitch = document.createElement('div');
        glitch.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,255,0.3);z-index:9000;pointer-events:none;';
        document.body.appendChild(glitch);
        
        let count = 0;
        const glitchInterval = setInterval(() => {
            glitch.style.background = count % 2 === 0 ? 'rgba(255,0,255,0.3)' : 'rgba(0,255,255,0.3)';
            count++;
            if(count >= 6) {
                clearInterval(glitchInterval);
                glitch.remove();
            }
        }, 100);
    }

    enterThroneRoom() {
        this.phase = 'throneroom';
        this.clearScene();
        
        // Sala del trono 40x40m
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(40, 40),
            new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 0.9 })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        
        // Paredes
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.9 });
        [[-20, 0], [20, 0], [0, -20], [0, 20]].forEach(([x, z], i) => {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(i < 2 ? 1 : 40, 15, i < 2 ? 40 : 1),
                wallMat
            );
            wall.position.set(x, 7.5, z);
            scene.add(wall);
        });
        
        // Trono
        const throne = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 2),
            new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7, emissive: 0x330000, emissiveIntensity: 0.3 })
        );
        throne.position.set(0, 2.5, -15);
        scene.add(throne);
        
        // Rey Oscuro
        this.boss = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 3, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff0000, emissiveIntensity: 0.5 })
        );
        this.boss.position.set(0, 3.5, -15);
        scene.add(this.boss);
        
        const kingLight = new THREE.PointLight(0xff0000, 5, 20);
        kingLight.position.set(0, 5, -15);
        scene.add(kingLight);
        
        // Casco en el suelo
        this.helmet = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8 })
        );
        this.helmet.position.set(3, 0.4, 10);
        scene.add(this.helmet);
        
        const helmetLight = new THREE.PointLight(0x00ffff, 2, 8);
        helmetLight.position.copy(this.helmet.position);
        scene.add(helmetLight);
        
        camera.position.set(0, 1.6, 15);
        camera.lookAt(0, 3, -15);
        
        setTimeout(() => {
            showMonologue('Rey Oscuro: "Bienvenido... al final."');
            setTimeout(() => {
                showMonologue('¡Toma el casco para disparar!');
                this.phase = 'exploring';
            }, 3000);
        }, 2000);
    }

    finalBattle() {
        this.phase = 'battle';
        this.bossAttacking = true;
        showMonologue('¡BATALLA FINAL! Presiona E para disparar');
        
        // Barra de HP del boss
        const bossHPBar = document.createElement('div');
        bossHPBar.id = 'bossHPBar';
        bossHPBar.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);width:400px;height:30px;background:#222;border:3px solid #ff0000;z-index:100;';
        bossHPBar.innerHTML = '<div id="bossHPFill" style="width:100%;height:100%;background:linear-gradient(90deg,#ff0000,#ff6666);transition:width 0.3s;"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:14px;font-weight:bold;">REY OSCURO</div>';
        document.body.appendChild(bossHPBar);
        
        // Barra de HP del jugador
        const playerHPBar = document.createElement('div');
        playerHPBar.id = 'playerHPBar';
        playerHPBar.style.cssText = 'position:fixed;bottom:80px;left:20px;width:200px;height:20px;background:#222;border:2px solid #00ff00;z-index:100;';
        playerHPBar.innerHTML = '<div id="playerHPFill" style="width:100%;height:100%;background:linear-gradient(90deg,#00ff00,#88ff88);transition:width 0.3s;"></div>';
        document.body.appendChild(playerHPBar);
        
        // Diálogo del boss
        setTimeout(() => {
            showMonologue('Rey Oscuro: "Crees que esto es real?"');
            setTimeout(() => {
                showMonologue('Rey Oscuro: "Todo es una mentira..."');
            }, 3000);
        }, 2000);
    }
    
    shoot() {
        const bullet = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );
        bullet.position.copy(camera.position);
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        bullet.userData.velocity = dir.multiplyScalar(0.8);
        scene.add(bullet);
        this.bullets.push(bullet);
    }

    finishChapter() {
        this.phase = 'finished';
        localStorage.setItem('chapter3Completed', 'true');
        
        // Remover barras de HP
        ['bossHPBar', 'playerHPBar'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.remove();
        });
        
        // Secuencia de revelación
        showMonologue('Rey Oscuro: "Has ganado... pero a qué costo?"');
        
        setTimeout(() => {
            showMonologue('Rey Oscuro: "Mira a tu alrededor... NADA ES REAL"');
            
            setTimeout(() => {
                // Glitches intensos
                this.startCorruptionSequence();
            }, 3000);
        }, 2000);
    }
    
    startCorruptionSequence() {
        let glitchCount = 0;
        const glitchInterval = setInterval(() => {
            this.showGlitchEffect();
            
            // Mensajes de corrupción
            const messages = [
                'ERROR: REALIDAD.EXE HA DEJADO DE FUNCIONAR',
                'ADVERTENCIA: SIMULACIÓN COMPROMETIDA',
                'SISTEMA: CARGANDO PROTOCOLO DE EMERGENCIA',
                'ALERTA: ENTRANDO A ZONA CORRUPTA'
            ];
            
            if(glitchCount < messages.length) {
                showMonologue(messages[glitchCount]);
            }
            
            glitchCount++;
            
            if(glitchCount >= 8) {
                clearInterval(glitchInterval);
                this.transitionToChapter4();
            }
        }, 800);
    }
    
    transitionToChapter4() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:10000;opacity:0;transition:opacity 2s;';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
            setTimeout(() => {
                showMonologue('Bienvenido al mundo corrupto...');
                setTimeout(() => this.startChapter4(), 2000);
            }, 2000);
        }, 100);
    }

    startChapter4() {
        this.cleanup();
        if(typeof chapter4 !== 'undefined') {
            chapter4.start();
        }
    }



    showCastleMessage(type, index) {
        if(!chapter2 || !chapter2.helmetMessages) return;
        
        const messages = chapter2.helmetMessages.filter(m => m.type === type);
        if(!messages[index] || this.contextualMessagesShown[type + index]) return;
        
        // Limitar a 1 cartel máximo
        const existingBoxes = document.querySelectorAll('.castle-message-box');
        if(existingBoxes.length >= 1) return;
        
        this.contextualMessagesShown[type + index] = true;
        const msg = messages[index];
        const box = document.createElement('div');
        box.className = 'castle-message-box';
        box.style.cssText = 'position:fixed;top:150px;right:20px;width:380px;background:rgba(0,100,200,0.9);border:2px solid #00ffff;border-radius:8px;padding:20px;z-index:1000;font-family:Courier New,monospace;color:#fff;box-shadow:0 0 20px rgba(0,255,255,0.5);animation:slideIn 0.5s;';
        box.innerHTML = `
            <div style="font-size:18px;font-weight:bold;color:#00ffff;margin-bottom:10px;">${msg.text}</div>
            <div style="font-size:15px;color:#ccc;line-height:1.5;">${msg.subtext}</div>
        `;
        document.body.appendChild(box);
        
        setTimeout(() => {
            box.style.animation = 'slideOut 0.5s';
            setTimeout(() => box.remove(), 500);
        }, 5000);
    }
    
    createSideRooms() {
        const roomMat = new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.9 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
        
        // SALA 1 - Izquierda 15m (Antorchas) - Tema: Templo de Fuego
        // Suelo con patrón
        for(let x = -13; x < -5; x += 2) {
            for(let z = 11; z < 19; z += 2) {
                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 0.2, 2),
                    (x + z) % 4 === 0 ? roomMat : darkMat
                );
                tile.position.set(x, -0.1, z);
                scene.add(tile);
            }
        }
        
        // Paredes (sin pared de entrada)
        const wall1a = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 0.5), roomMat);
        wall1a.position.set(-9, 4, 11);
        scene.add(wall1a);
        const wall1b = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 0.5), roomMat);
        wall1b.position.set(-9, 4, 19);
        scene.add(wall1b);
        const wall1c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 8), roomMat);
        wall1c.position.set(-13, 4, 15);
        scene.add(wall1c);
        
        // Techo
        const ceiling1 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), darkMat);
        ceiling1.rotation.x = Math.PI / 2;
        ceiling1.position.set(-9, 7.5, 15);
        scene.add(ceiling1);
        
        // Pedestales para antorchas CON NÚMEROS VISIBLES
        this.torches = [];
        const torchNumbers = ['1', '2', '3', '4'];
        [[-11, 17], [-7, 17], [-11, 13], [-7, 13]].forEach((pos, i) => {
            const pedestal = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8),
                new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 })
            );
            pedestal.position.set(pos[0], 0.4, pos[1]);
            scene.add(pedestal);
            
            const torch = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
            );
            torch.position.set(pos[0], 1.4, pos[1]);
            torch.userData.lit = false;
            torch.userData.index = i;
            scene.add(torch);
            this.torches.push(torch);
            
            // NÚMERO VISIBLE en el suelo
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff4400';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(torchNumbers[i], 64, 90);
            const texture = new THREE.CanvasTexture(canvas);
            const numberPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ map: texture, transparent: true })
            );
            numberPlane.rotation.x = -Math.PI / 2;
            numberPlane.position.set(pos[0], 0.02, pos[1]);
            scene.add(numberPlane);
        });
        
        // PISTA EN LA PARED: "Orden: 1-2-4-3"
        const hintCanvas = document.createElement('canvas');
        hintCanvas.width = 512;
        hintCanvas.height = 256;
        const hintCtx = hintCanvas.getContext('2d');
        hintCtx.fillStyle = '#ff4400';
        hintCtx.font = 'bold 60px Arial';
        hintCtx.textAlign = 'center';
        hintCtx.fillText('ORDEN:', 256, 80);
        hintCtx.font = 'bold 80px Arial';
        hintCtx.fillText('1 - 2 - 4 - 3', 256, 180);
        const hintTexture = new THREE.CanvasTexture(hintCanvas);
        const hintSign = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 2),
            new THREE.MeshBasicMaterial({ map: hintTexture })
        );
        hintSign.position.set(-12.8, 3, 15);
        hintSign.rotation.y = Math.PI / 2;
        scene.add(hintSign);
        
        // Luz naranja ambiente
        const light1 = new THREE.PointLight(0xff4400, 2, 15);
        light1.position.set(-9, 4, 15);
        scene.add(light1);
        
        // Indicador entrada
        const indicator1 = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.4),
            new THREE.MeshBasicMaterial({ color: 0xff4400 })
        );
        indicator1.position.set(-5, 3, 15);
        scene.add(indicator1);
        this.indicator1 = indicator1;
        
        // SALA 2 - Derecha 25m (Símbolos) - Tema: Cámara de Runas
        // Suelo con patrón de runas
        for(let x = 5.5; x < 15.5; x += 1.5) {
            for(let z = 20; z < 30; z += 1.5) {
                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 0.2, 1.5),
                    (x + z) % 3 === 0 ? new THREE.MeshStandardMaterial({ color: 0x2a1a3a, roughness: 0.9 }) : roomMat
                );
                tile.position.set(x, -0.1, z);
                scene.add(tile);
            }
        }
        
        // Paredes (sin pared de entrada)
        const wall2a = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 0.5), roomMat);
        wall2a.position.set(10.5, 4, 20);
        scene.add(wall2a);
        const wall2b = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 0.5), roomMat);
        wall2b.position.set(10.5, 4, 30);
        scene.add(wall2b);
        const wall2c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 10), roomMat);
        wall2c.position.set(15.5, 4, 25);
        scene.add(wall2c);
        
        // Techo
        const ceiling2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), darkMat);
        ceiling2.rotation.x = Math.PI / 2;
        ceiling2.position.set(10.5, 7.5, 25);
        scene.add(ceiling2);
        
        // 4 SÍMBOLOS INTERACTIVOS en pedestales
        this.symbols = [];
        const symbolShapes = ['◯', '△', '□', '✦'];
        const symbolPositions = [[8, 23], [13, 23], [8, 27], [13, 27]];
        symbolPositions.forEach((pos, i) => {
            const pedestal = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 1, 6),
                new THREE.MeshStandardMaterial({ color: 0x3a2a4a, roughness: 0.7 })
            );
            pedestal.position.set(pos[0], 0.5, pos[1]);
            scene.add(pedestal);
            
            // Símbolo flotante
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#aa44ff';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(symbolShapes[i], 64, 90);
            const texture = new THREE.CanvasTexture(canvas);
            const symbol = new THREE.Mesh(
                new THREE.PlaneGeometry(0.8, 0.8),
                new THREE.MeshBasicMaterial({ map: texture, transparent: true })
            );
            symbol.position.set(pos[0], 1.5, pos[1]);
            symbol.userData.activated = false;
            symbol.userData.index = i;
            scene.add(symbol);
            this.symbols.push(symbol);
        });
        
        // PISTA EN LA PARED: "Activa: ◯ → □ → ✦ → △"
        const symbolHintCanvas = document.createElement('canvas');
        symbolHintCanvas.width = 512;
        symbolHintCanvas.height = 256;
        const symbolHintCtx = symbolHintCanvas.getContext('2d');
        symbolHintCtx.fillStyle = '#aa44ff';
        symbolHintCtx.font = 'bold 50px Arial';
        symbolHintCtx.textAlign = 'center';
        symbolHintCtx.fillText('SECUENCIA:', 256, 80);
        symbolHintCtx.font = 'bold 70px Arial';
        symbolHintCtx.fillText('◯ → □ → ✦ → △', 256, 180);
        const symbolHintTexture = new THREE.CanvasTexture(symbolHintCanvas);
        const symbolHintSign = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 2),
            new THREE.MeshBasicMaterial({ map: symbolHintTexture })
        );
        symbolHintSign.position.set(15.3, 3, 25);
        symbolHintSign.rotation.y = -Math.PI / 2;
        scene.add(symbolHintSign);
        
        // Luces moradas
        for(let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(0xaa44ff, 1.5, 8);
            light.position.set(7 + i * 2, 5, 21 + i * 2);
            scene.add(light);
        }
        
        // Indicador entrada
        const indicator2 = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.4),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        indicator2.position.set(5, 3, 25);
        scene.add(indicator2);
        this.indicator2 = indicator2;
        
        // SALA 3 - Izquierda 35m (Gemas) - Tema: Cámara del Tesoro
        // Suelo con patrón de estrella
        for(let x = -14; x < -6; x += 1.5) {
            for(let z = 31; z < 39; z += 1.5) {
                const dist = Math.sqrt(Math.pow(x + 10, 2) + Math.pow(z - 35, 2));
                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 0.2, 1.5),
                    dist % 3 < 1.5 ? new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.8 }) : roomMat
                );
                tile.position.set(x, -0.1, z);
                scene.add(tile);
            }
        }
        
        // Paredes (sin pared de entrada)
        const wall3a = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 0.5), roomMat);
        wall3a.position.set(-10, 4, 31);
        scene.add(wall3a);
        const wall3b = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 0.5), roomMat);
        wall3b.position.set(-10, 4, 39);
        scene.add(wall3b);
        const wall3c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 8), roomMat);
        wall3c.position.set(-14, 4, 35);
        scene.add(wall3c);
        
        // Techo
        const ceiling3 = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), darkMat);
        ceiling3.rotation.x = Math.PI / 2;
        ceiling3.position.set(-10, 7.5, 35);
        scene.add(ceiling3);
        
        // Pedestales para gemas
        this.gems = [];
        const gemPositions = [[-12, 35], [-10, 33], [-10, 37], [-8, 33], [-8, 37]];
        gemPositions.forEach((pos, i) => {
            const pedestal = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 1, 6),
                new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.7, metalness: 0.3 })
            );
            pedestal.position.set(pos[0], 0.5, pos[1]);
            scene.add(pedestal);
            
            const gem = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.4),
                new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 })
            );
            gem.position.set(pos[0], 1.3, pos[1]);
            scene.add(gem);
            this.gems.push(gem);
            
            // Luz individual para cada gema
            const gemLight = new THREE.PointLight(0x00ff00, 1, 5);
            gemLight.position.set(pos[0], 1.5, pos[1]);
            scene.add(gemLight);
        });
        
        // Cofres decorativos vacíos
        for(let i = 0; i < 3; i++) {
            const chest = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.6, 0.6),
                new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
            );
            chest.position.set(-12 + i * 2, 0.3, 32 + i * 2);
            scene.add(chest);
        }
        
        // Luz verde ambiente
        const light3 = new THREE.PointLight(0x00ff00, 2, 15);
        light3.position.set(-10, 5, 35);
        scene.add(light3);
        
        // Indicador entrada
        const indicator3 = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.4),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        indicator3.position.set(-5, 3, 35);
        scene.add(indicator3);
        this.indicator3 = indicator3;
        
        this.torchSequence = [];
        this.correctSequence = [0, 1, 3, 2]; // 1-2-4-3
        this.symbolSequence = [];
        this.correctSymbolSequence = [0, 2, 3, 1]; // ◯ → □ → ✦ → △
        this.gemsCollected = 0;
    }
    
    checkRoomEntrance() {
        // Sala 1 (izquierda 15m)
        if(camera.position.x < -5 && camera.position.z > 11 && camera.position.z < 19 && this.phase === 'entering') {
            if(!this.monologuesShown['room1_enter']) {
                this.monologuesShown['room1_enter'] = true;
                showMonologue('Sala 1: Enciende las 4 antorchas en el orden correcto');
                setTimeout(() => showMonologue('💡 Pista: Mira la pared para ver el orden'), 2000);
            }
            this.phase = 'room1';
        }
        if(this.phase === 'room1' && camera.position.x > -5 && camera.position.z > 11 && camera.position.z < 19) {
            this.phase = 'entering';
            showMonologue('Saliste de la Sala 1');
        }
        
        // Sala 2 (derecha 25m)
        if(camera.position.x > 5 && camera.position.z > 20 && camera.position.z < 30 && this.phase === 'entering') {
            if(!this.monologuesShown['room2_enter']) {
                this.monologuesShown['room2_enter'] = true;
                showMonologue('Sala 2: Activa los símbolos en el orden correcto');
                setTimeout(() => showMonologue('🧩 Pista: Mira la pared para ver la secuencia'), 2000);
            }
            this.phase = 'room2';
        }
        if(this.phase === 'room2' && camera.position.x < 5 && camera.position.z > 20 && camera.position.z < 30) {
            this.phase = 'entering';
            showMonologue('Saliste de la Sala 2');
        }
        
        // Sala 3 (izquierda 35m)
        if(camera.position.x < -5 && camera.position.z > 31 && camera.position.z < 39 && this.phase === 'entering') {
            if(!this.monologuesShown['room3_enter']) {
                this.monologuesShown['room3_enter'] = true;
                showMonologue('Sala 3: Recoge las 5 gemas');
                setTimeout(() => showMonologue('💎 Pista: Explora toda la sala, las gemas brillan'), 2000);
            }
            this.phase = 'room3';
        }
        if(this.phase === 'room3' && camera.position.x > -5 && camera.position.z > 31 && camera.position.z < 39) {
            this.phase = 'entering';
            showMonologue('Saliste de la Sala 3');
        }
    }
    
    completeRoom(roomId) {
        if(this.monologuesShown['room' + roomId + '_complete']) return;
        this.monologuesShown['room' + roomId + '_complete'] = true;
        
        this.roomsCompleted++;
        showMonologue(`Sala ${roomId} completada! (${this.roomsCompleted}/${this.totalRooms})`);
        
        setTimeout(() => {
            camera.position.set(0, 1.6, 20);
            this.phase = 'entering';
            
            if(this.roomsCompleted >= this.totalRooms && this.mainDoor && !this.monologuesShown['all_rooms_complete']) {
                this.monologuesShown['all_rooms_complete'] = true;
                this.mainDoor.material.emissive.setHex(0x00ff00);
                showMonologue('¡Todas las salas completadas! Puedes avanzar');
            }
        }, 2000);
    }
    
    returnToMenu() {
        // Restaurar HUD del Chapter 1
        ['ui', 'staminaBar', 'deathCounter', 'distance'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'block';
        });
        
        // Recargar página
        location.reload();
    }

    update(delta) {
        if(!this.active) return;
        if(this.phase === 'cinematic') return;
        if(this.phase === 'dialogue') return;
        
        // Limitar delta para monitores de alta frecuencia
        delta = Math.min(delta, this.maxDelta);

        // Sistema de stamina
        const isMoving = this.keys['w'] || this.keys['s'] || this.keys['a'] || this.keys['d'];
        const wantsToRun = this.keys['shift'];
        const isRunning = wantsToRun && this.stamina > 0 && !this.staminaExhausted && isMoving;
        
        if(isRunning) {
            this.stamina -= 0.5;
            if(this.stamina <= 0) {
                this.stamina = 0;
                this.staminaExhausted = true;
            }
        } else if(this.stamina < this.maxStamina) {
            this.stamina += 0.2;
            if(this.stamina >= this.maxStamina) {
                this.stamina = this.maxStamina;
                this.staminaExhausted = false;
            }
        }
        
        // Actualizar barra de stamina con estilo experimental
        const staminaFill = document.getElementById('staminaFill');
        const staminaBar = document.getElementById('staminaBar');
        if(staminaFill) {
            staminaFill.style.width = (this.stamina / this.maxStamina * 100) + '%';
        }
        if(staminaBar) {
            if(this.staminaExhausted) {
                staminaBar.style.borderColor = '#ff0000';
                staminaBar.style.borderLeftColor = '#ff0000';
                staminaBar.style.boxShadow = '0 0 15px rgba(255,0,0,0.8), inset 0 0 10px rgba(255,0,0,0.4)';
                if(staminaFill) staminaFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            } else if(this.stamina < 30) {
                staminaBar.style.borderColor = '#ffaa00';
                staminaBar.style.borderLeftColor = '#ffaa00';
                staminaBar.style.boxShadow = '0 0 15px rgba(255,170,0,0.7), inset 0 0 10px rgba(255,170,0,0.3)';
                if(staminaFill) staminaFill.style.background = 'linear-gradient(90deg, #ffaa00, #ffdd00)';
            } else {
                staminaBar.style.borderColor = '#00ff88';
                staminaBar.style.borderLeftColor = '#00ff88';
                staminaBar.style.boxShadow = '0 0 15px rgba(0,255,136,0.6), inset 0 0 10px rgba(0,255,136,0.3)';
                if(staminaFill) staminaFill.style.background = 'linear-gradient(90deg, #00ff88, #00ffcc)';
            }
        }

        // Movimiento
        this.velocity.x = 0;
        this.velocity.z = 0;

        const speed = isRunning ? 0.14 : 0.08;
        
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

        // Límites del pasillo (sin restricciones en X para permitir entrada a salas)
        if(this.phase === 'entering') {
            // Sin límites en X para permitir entrada a salas laterales
            camera.position.z = Math.max(0, Math.min(47, camera.position.z));
        } else if(this.phase === 'room1' || this.phase === 'room2' || this.phase === 'room3') {
            // Límites de las salas laterales
            camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
            camera.position.z = Math.max(0, Math.min(47, camera.position.z));
        } else {
            camera.position.x = Math.max(-3.5, Math.min(3.5, camera.position.x));
            camera.position.z = Math.max(0, Math.min(47, camera.position.z));
        }
        
        // Mostrar distancia en HUD con estilo experimental
        const distEl = document.getElementById('distance');
        if(distEl) distEl.innerHTML = `📍 Progreso: ${Math.floor(camera.position.z)}m / 47m`;

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

        // Animar indicadores de puertas
        if(this.indicator1) this.indicator1.rotation.y += 0.05;
        if(this.indicator2) this.indicator2.rotation.y += 0.05;
        if(this.indicator3) this.indicator3.rotation.y += 0.05;
        
        // Footsteps cuando NO está corriendo
        if(isMoving && !isRunning) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                if(this.stepAudio) {
                    const step = this.stepAudio.cloneNode();
                    step.volume = 0.3;
                    step.play().catch(() => {});
                }
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
            if(this.stepAudio && !this.stepAudio.paused) {
                this.stepAudio.pause();
                this.stepAudio.currentTime = 0;
            }
        }

        // Trigger diálogo cerca de la puerta
        if(camera.position.z >= 40 && !this.dialogueTriggered && !this.monologuesShown['door_approach']) {
            this.monologuesShown['door_approach'] = true;
            this.showCastleMessage('chapter3_teaser', 2);
            setTimeout(() => this.triggerDialogue(), 3000);
        }
        
        // Detectar entrada a salas laterales
        this.checkRoomEntrance();
        
        // Actualizar fase throneroom/exploring
        if(this.phase === 'throneroom' || this.phase === 'exploring') {
            camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
            camera.position.z = Math.max(-18, Math.min(18, camera.position.z));
            
            // Recoger casco
            if(this.helmet && !this.hasHelmet && !this.monologuesShown['helmet_pickup']) {
                const dist = camera.position.distanceTo(this.helmet.position);
                if(dist < 2) {
                    this.monologuesShown['helmet_pickup'] = true;
                    this.hasHelmet = true;
                    scene.remove(this.helmet);
                    
                    // Mostrar info del chip
                    if(this.chipData) {
                        showMonologue(this.chipData.unlock_message);
                        setTimeout(() => {
                            showMonologue(this.chipData.abilities[0].description);
                        }, 2000);
                    } else {
                        showMonologue('¡Casco equipado! Presiona E para disparar');
                    }
                    
                    setTimeout(() => this.finalBattle(), 3000);
                }
            }
        }
        
        // Actualizar batalla
        if(this.phase === 'battle') {
            camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
            camera.position.z = Math.max(-18, Math.min(18, camera.position.z));
            
            // Actualizar balas
            for(let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                bullet.position.add(bullet.userData.velocity);
                
                // Colisión con boss
                if(this.boss && bullet.position.distanceTo(this.boss.position) < 1.5) {
                    this.bossHP -= 10;
                    scene.remove(bullet);
                    this.bullets.splice(i, 1);
                    
                    const bossHPFill = document.getElementById('bossHPFill');
                    if(bossHPFill) bossHPFill.style.width = (this.bossHP / this.bossMaxHP * 100) + '%';
                    
                    if(this.bossHP <= 0 && !this.monologuesShown['boss_defeated']) {
                        this.monologuesShown['boss_defeated'] = true;
                        scene.remove(this.boss);
                        this.boss = null;
                        this.bossAttacking = false;
                        showMonologue('¡Rey Oscuro derrotado!');
                        setTimeout(() => this.finishChapter(), 2000);
                    }
                    continue;
                }
                
                // Remover si está lejos
                if(bullet.position.length() > 50) {
                    scene.remove(bullet);
                    this.bullets.splice(i, 1);
                }
            }
            
            // Ataques del boss
            if(this.bossAttacking && this.boss) {
                this.bossAttackTimer += delta;
                
                // Animación de ataque
                this.boss.position.y = 3.5 + Math.sin(Date.now() * 0.005) * 0.3;
                this.boss.rotation.y += 0.02;
                
                // Ataque cada 3 segundos
                if(this.bossAttackTimer >= 3) {
                    this.bossAttackTimer = 0;
                    this.playerHP -= 15;
                    
                    const playerHPFill = document.getElementById('playerHPFill');
                    if(playerHPFill) playerHPFill.style.width = (this.playerHP / 100 * 100) + '%';
                    
                    const attacks = [
                        '¡El Rey Oscuro ataca!',
                        'Rey Oscuro: "Inútil resistir..."',
                        'Rey Oscuro: "Eres parte del experimento..."',
                        'Rey Oscuro: "La verdad te destruirá..."'
                    ];
                    showMonologue(attacks[Math.floor(Math.random() * attacks.length)]);
                    
                    if(this.playerHP <= 0 && !this.monologuesShown['player_defeated']) {
                        this.monologuesShown['player_defeated'] = true;
                        showMonologue('Has sido derrotado...');
                        setTimeout(() => location.reload(), 2000);
                    }
                }
                
                // Glitches cuando el boss está bajo de HP
                if(this.bossHP < 50 && Math.random() < 0.01 && !this.monologuesShown['boss_glitch_' + Date.now()]) {
                    const key = 'boss_glitch_' + Math.floor(Date.now() / 5000);
                    if(!this.monologuesShown[key]) {
                        this.monologuesShown[key] = true;
                        this.showGlitchEffect();
                        const glitchMessages = [
                            'ERROR: DATOS CORRUPTOS',
                            'ADVERTENCIA: REALIDAD INESTABLE',
                            'SISTEMA: FALLO EN LA MATRIZ'
                        ];
                        showMonologue(glitchMessages[Math.floor(Math.random() * glitchMessages.length)]);
                    }
                }
            }
        }
        
        // Lógica de Sala 1 (Antorchas)
        if(this.phase === 'room1' && this.torches) {
            camera.position.x = Math.max(-13, Math.min(-5, camera.position.x));
            camera.position.z = Math.max(11, Math.min(19, camera.position.z));
            
            // Interactuar con antorchas (tecla E)
            if(this.keys['e']) {
                this.torches.forEach(torch => {
                    const dist = camera.position.distanceTo(torch.position);
                    if(dist < 2 && !torch.userData.lit) {
                        torch.userData.lit = true;
                        torch.material.emissive.setHex(0xff4400);
                        torch.material.emissiveIntensity = 1;
                        this.torchSequence.push(torch.userData.index);
                        
                        if(this.torchSequence.length === 4) {
                            if(JSON.stringify(this.torchSequence) === JSON.stringify(this.correctSequence)) {
                                if(!this.monologuesShown['torch_correct']) {
                                    this.monologuesShown['torch_correct'] = true;
                                    showMonologue('¡Secuencia correcta!');
                                }
                                this.completeRoom(1);
                            } else {
                                if(!this.monologuesShown['torch_wrong_' + Date.now()]) {
                                    this.monologuesShown['torch_wrong_' + Math.floor(Date.now() / 2000)] = true;
                                    showMonologue('Secuencia incorrecta. Reiniciando...');
                                }
                                this.torches.forEach(t => {
                                    t.userData.lit = false;
                                    t.material.emissive.setHex(0x000000);
                                    t.material.emissiveIntensity = 0;
                                });
                                this.torchSequence = [];
                            }
                        }
                    }
                });
                this.keys['e'] = false;
            }
        }
        
        // Lógica de Sala 2 (Símbolos)
        if(this.phase === 'room2' && this.symbols) {
            camera.position.x = Math.max(5, Math.min(15, camera.position.x));
            camera.position.z = Math.max(20, Math.min(30, camera.position.z));
            
            // Rotar símbolos
            this.symbols.forEach(symbol => {
                symbol.rotation.y += 0.02;
            });
            
            // Interactuar con símbolos (tecla E)
            if(this.keys['e']) {
                this.symbols.forEach(symbol => {
                    const dist = camera.position.distanceTo(symbol.position);
                    if(dist < 2 && !symbol.userData.activated) {
                        symbol.userData.activated = true;
                        symbol.material.emissive = new THREE.Color(0xaa44ff);
                        symbol.material.emissiveIntensity = 1;
                        this.symbolSequence.push(symbol.userData.index);
                        
                        if(this.symbolSequence.length === 4) {
                            if(JSON.stringify(this.symbolSequence) === JSON.stringify(this.correctSymbolSequence)) {
                                if(!this.monologuesShown['symbol_correct']) {
                                    this.monologuesShown['symbol_correct'] = true;
                                    showMonologue('¡Secuencia correcta!');
                                }
                                this.completeRoom(2);
                            } else {
                                if(!this.monologuesShown['symbol_wrong_' + Date.now()]) {
                                    this.monologuesShown['symbol_wrong_' + Math.floor(Date.now() / 2000)] = true;
                                    showMonologue('Secuencia incorrecta. Reiniciando...');
                                }
                                this.symbols.forEach(s => {
                                    s.userData.activated = false;
                                    if(s.material.emissive) s.material.emissive.setHex(0x000000);
                                    s.material.emissiveIntensity = 0;
                                });
                                this.symbolSequence = [];
                            }
                        }
                    }
                });
                this.keys['e'] = false;
            }
        }
        
        // Lógica de Sala 3 (Gemas)
        if(this.phase === 'room3' && this.gems) {
            camera.position.x = Math.max(-14, Math.min(-5, camera.position.x));
            camera.position.z = Math.max(31, Math.min(39, camera.position.z));
            
            // Rotar gemas
            this.gems.forEach(gem => {
                gem.rotation.y += 0.05;
                gem.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
            });
            
            // Recoger gemas
            for(let i = this.gems.length - 1; i >= 0; i--) {
                const gem = this.gems[i];
                const dist = camera.position.distanceTo(gem.position);
                if(dist < 1.5) {
                    scene.remove(gem);
                    this.gems.splice(i, 1);
                    this.gemsCollected++;
                    if(!this.monologuesShown['gem_' + this.gemsCollected]) {
                        this.monologuesShown['gem_' + this.gemsCollected] = true;
                        showMonologue(`Gema ${this.gemsCollected}/5 recogida`);
                    }
                    
                    if(this.gemsCollected >= 5 && !this.monologuesShown['all_gems']) {
                        this.monologuesShown['all_gems'] = true;
                        showMonologue('¡Todas las gemas recogidas!');
                        this.completeRoom(3);
                    }
                }
            }
        }
    }
}

const chapter3 = new Chapter3();
