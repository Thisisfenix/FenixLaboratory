// Chapter 2 - Laboratorio Proyecto 666
class Chapter2 {
    constructor() {
        this.active = false;
        this.phase = 'falling';
        this.fallProgress = 0;
        this.playerModel = null;
        this.notes = [];
        this.notesRead = 0;
        this.audioContext = null;
        this.ambientSound = null;
        this.footstepAudio = null;
        this.footstepPool = [];
        this.poolIndex = 0;
        this.footstepTimer = 0;
        this.footstepInterval = 1000;
        this.runAudio = null;
        this.runAudioPlaying = false;
        this.exhaustedAudio = null;
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaExhausted = false;
        this.isRunning = false;
        this.lightZones = [];
        this.timeInDarkness = 0;
        this.maxDarknessTime = 3000;
        this.ia666 = null;
        this.ia666Spawned = false;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.velocity = new THREE.Vector3();
        this.collectedIcons = [];
        this.totalIcons = 10;
        this.collectedKeys = [];
        this.totalKeys = 3;
        this.hasHelmet = false;
        this.blockedDoor = null;
        this.keyObjects = [];
        this.gisselCyber = null;
        this.gisselTriggered = false;
        this.legInjured = true;
        this.legHealProgress = 0;
        this.joystickX = 0;
        this.joystickY = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.runBobTime = 0;
        this.targetHeight = 1.6;
        this.currentHeight = 1.6;
        
        // Limitador de framerate para 144Hz
        this.maxDelta = 1/60; // Limitar a 60 FPS equivalente
        
        // Sistemas de exploración
        this.terminalsRead = 0;
        this.totalTerminals = 4;
        this.terminals = [];
        this.generatorsActivated = [];
        this.securityCodeDigits = [];
        this.colorSequence = [];
        this.memoryFragments = [];
        this.audioRecordings = [];
        this.powerOutage = false;
        this.ventDucts = [];
        this.flashlightBroken = false;
        this.floatingObjects = [];
        this.lastCheckpoint = { x: 0, y: 1.6, z: -40 };
        this.chapter2RainAudio = null;
        this.whiteRoomAudio = null;
        this.voicesAudio = null;
        this.metalPipePlayed = false;
        this.helmetFlashlight = null;
        this.helmetFlashlightOn = false;
        this.flashlightAudio = null;
        this.doorOpened = false;
    }

    start() {
        this.active = true;
        this.phase = 'falling';
        this.clearScene();
        this.initAudio();
        this.createFallingCinematic();
        this.setupControls();
        this.loadProgress();
    }
    
    saveProgress() {
        // Detectar ubicación actual
        let currentLocation = 'Desconocido';
        const posZ = camera.position.z;
        const posY = camera.position.y;
        
        if(this.phase === 'exploring') {
            if(posY > 4) {
                currentLocation = 'Laboratorio - Nivel 2';
            } else {
                currentLocation = 'Laboratorio - Nivel 1';
            }
        } else if(this.phase === 'escaping') {
            if(posZ < 400) {
                currentLocation = 'Túnel de Escape - Zona Oscura';
            } else if(posZ < 800) {
                currentLocation = 'Túnel de Escape - Zona Verde';
            } else if(posZ < 1200) {
                currentLocation = 'Túnel de Escape - Zona Roja';
            } else {
                currentLocation = 'Túnel de Escape - Zona Azul';
            }
        } else if(this.phase === 'whiteroom') {
            currentLocation = 'White Room';
        } else if(this.phase === 'courtyard') {
            if(posZ < 100) {
                currentLocation = 'Patio - Entrada';
            } else if(posZ < 250) {
                currentLocation = 'Patio - Zona Media';
            } else if(posZ < 400) {
                currentLocation = 'Patio - Cerca del Castillo';
            } else {
                currentLocation = 'Patio - Frente al Castillo';
            }
        } else if(this.phase === 'rivalry') {
            currentLocation = 'Sala de Rivalidad';
        }
        
        const progress = {
            phase: this.phase,
            location: currentLocation,
            collectedIcons: this.collectedIcons,
            collectedKeys: this.collectedKeys,
            hasHelmet: this.hasHelmet,
            notesRead: this.notesRead,
            terminalsRead: this.terminalsRead,
            legInjured: this.legInjured,
            legHealProgress: this.legHealProgress,
            lastCheckpoint: this.lastCheckpoint,
            doorOpened: this.doorOpened,
            cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        };
        localStorage.setItem('chapter2Progress', JSON.stringify(progress));
        showMonologue(`💾 Progreso guardado en: ${currentLocation}`);
    }
    
    loadProgress() {
        const saved = localStorage.getItem('chapter2Progress');
        if(!saved) return;
        
        try {
            const progress = JSON.parse(saved);
            if(progress.phase === 'exploring' || progress.phase === 'escaping' || progress.phase === 'whiteroom' || progress.phase === 'courtyard') {
                this.collectedIcons = progress.collectedIcons || [];
                this.collectedKeys = progress.collectedKeys || [];
                this.hasHelmet = progress.hasHelmet || false;
                this.notesRead = progress.notesRead || 0;
                this.terminalsRead = progress.terminalsRead || 0;
                this.legInjured = progress.legInjured !== undefined ? progress.legInjured : true;
                this.legHealProgress = progress.legHealProgress || 0;
                this.lastCheckpoint = progress.lastCheckpoint || { x: 0, y: 1.6, z: -40 };
                this.doorOpened = progress.doorOpened || false;
                
                showMonologue('📂 Progreso cargado. Presiona L para continuar o N para nuevo juego');
                
                const loadHandler = (e) => {
                    if(e.key.toLowerCase() === 'l') {
                        this.phase = progress.phase;
                        if(progress.phase === 'exploring') {
                            this.clearScene();
                            this.createPitBottom();
                            camera.position.set(progress.cameraPosition.x, progress.cameraPosition.y, progress.cameraPosition.z);
                            this.phase = 'exploring';
                            this.updateDoorSign();
                        } else if(progress.phase === 'escaping') {
                            this.startEscapePhase();
                            camera.position.set(progress.cameraPosition.x, progress.cameraPosition.y, progress.cameraPosition.z);
                        } else if(progress.phase === 'whiteroom') {
                            this.enterWhiteRoom();
                            camera.position.set(progress.cameraPosition.x, progress.cameraPosition.y, progress.cameraPosition.z);
                        } else if(progress.phase === 'courtyard') {
                            this.enterCourtyard();
                            camera.position.set(progress.cameraPosition.x, progress.cameraPosition.y, progress.cameraPosition.z);
                        }
                        document.removeEventListener('keydown', loadHandler);
                    } else if(e.key.toLowerCase() === 'n') {
                        localStorage.removeItem('chapter2Progress');
                        showMonologue('Reiniciando...');
                        document.removeEventListener('keydown', loadHandler);
                        setTimeout(() => location.reload(), 500);
                    }
                };
                document.addEventListener('keydown', loadHandler);
            }
        } catch(e) {
            console.error('Error cargando progreso:', e);
            localStorage.removeItem('chapter2Progress');
            showMonologue('⚠️ Progreso corrupto eliminado. Iniciando nuevo juego.');
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if(e.key.toLowerCase() === 'e') this.handleInteract();
            if(e.key.toLowerCase() === 'f' && this.hasHelmet && this.phase === 'escaping') this.toggleHelmetFlashlight();
            if(e.key.toLowerCase() === 'f5') {
                e.preventDefault();
                this.saveProgress();
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if(e.key.toLowerCase() === 'shift') this.isRunning = false;
        });
        document.addEventListener('mousemove', (e) => {
            if(document.pointerLockElement) {
                this.mouseX -= e.movementX * 0.002;
                this.mouseY -= e.movementY * 0.002;
                this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
            }
        });
        
        // Soporte táctil
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if(isMobile) {
            this.setupTouchControls();
        }
    }
    
    setupTouchControls() {
        // Mostrar controles móviles
        const mobileControls = document.getElementById('mobileControls');
        if(mobileControls) mobileControls.style.display = 'block';
        const sprintBtn = document.getElementById('sprintBtn');
        if(sprintBtn) sprintBtn.style.display = 'flex';
        
        // Joystick virtual
        const joystick = document.getElementById('joystick');
        const stick = document.getElementById('stick');
        
        if(joystick && stick) {
            let joystickActive = false;
            
            joystick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                joystickActive = true;
            });
            
            joystick.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if(!joystickActive) return;
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
                joystickActive = false;
                this.joystickX = 0;
                this.joystickY = 0;
                stick.style.left = '35px';
                stick.style.top = '35px';
            });
        }
        
        // Control de cámara táctil (lado derecho de la pantalla)
        let touchStartX = 0, touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            if(!e.touches || e.touches.length === 0) return;
            const touch = e.touches[0];
            if(touch.clientX > window.innerWidth / 2) {
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            if(touch.clientX > window.innerWidth / 2) {
                e.preventDefault();
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;
                
                this.mouseX -= deltaX * 0.005;
                this.mouseY -= deltaY * 0.005;
                this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
                
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }
        });
        
        // Botón de sprint
        if(sprintBtn) {
            sprintBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isRunning = true;
            });
            sprintBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.isRunning = false;
            });
        }
        
        // Botón de interacción
        const interactBtn = document.getElementById('interactBtn');
        if(interactBtn) {
            interactBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleInteract();
            });
        }
    }
    
    updateGamepad() {
        const gamepads = navigator.getGamepads();
        if(!gamepads[0]) return;
        
        const gp = gamepads[0];
        const deadzone = 0.2;
        
        // Stick izquierdo - movimiento
        if(Math.abs(gp.axes[0]) > deadzone) this.joystickX = gp.axes[0];
        else this.joystickX = 0;
        if(Math.abs(gp.axes[1]) > deadzone) this.joystickY = gp.axes[1];
        else this.joystickY = 0;
        
        // Stick derecho - cámara
        if(Math.abs(gp.axes[2]) > deadzone) this.mouseX -= gp.axes[2] * 0.05;
        if(Math.abs(gp.axes[3]) > deadzone) this.mouseY -= gp.axes[3] * 0.05;
        this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
        
        // Botones
        if(gp.buttons[0].pressed) this.keys['space'] = true; // A - Saltar
        if(gp.buttons[1].pressed) this.handleInteract(); // B - Interactuar
        if(gp.buttons[4].pressed || gp.buttons[5].pressed || gp.buttons[6].value > 0.5 || gp.buttons[7].value > 0.5) {
            this.isRunning = true;
        } else {
            this.isRunning = false;
        }
    }
    
    handleInteract() {
        if(this.phase === 'exploring') {
            const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
            
            // Terminales
            for(let terminal of this.terminals) {
                const dist = playerPos.distanceTo(terminal.position);
                if(!terminal.userData.read && dist < 1.5) {
                    terminal.userData.read = true;
                    this.terminalsRead++;
                    showMonologue(`💻 Terminal: ${terminal.userData.hint}`);
                    this.playCollectSound();
                    return;
                }
            }
            
            // Casco experimental
            for(let note of this.notes) {
                if(note.userData.type === 'helmet' && !note.userData.collected) {
                    const dist = playerPos.distanceTo(note.position);
                    if(dist < 1.5) {
                        this.collectHelmet(note);
                        return;
                    }
                }
            }
            
            // Generadores
            for(let note of this.notes) {
                const dist = playerPos.distanceTo(note.position);
                
                if(note.userData.type === 'generator' && dist < 1.5) {
                    if(!note.userData.active) {
                        note.userData.active = true;
                        this.generatorsActivated.push(note.userData.id);
                        note.material.color.setHex(0x00ff00);
                        showMonologue(`⚡ Generador ${note.userData.id + 1} activado`);
                        if(this.generatorsActivated.length === 3 && this.powerOutage) {
                            this.restorePower();
                        }
                    }
                    return;
                } else if(note.userData.type === 'codeNote' && !note.userData.read && dist < 1.5) {
                    note.userData.read = true;
                    this.securityCodeDigits.push(note.userData.digit);
                    showMonologue(`🔢 Dígito encontrado: ${note.userData.digit}`);
                    return;
                } else if(note.userData.type === 'colorPanel' && !note.userData.pressed && dist < 1.5) {
                    note.userData.pressed = true;
                    this.colorSequence.push(note.userData.order);
                    showMonologue(`🎨 Panel ${note.userData.order} presionado`);
                    return;
                } else if(note.userData.type === 'memory' && !note.userData.collected && dist < 1.5) {
                    note.userData.collected = true;
                    scene.remove(note);
                    showMonologue(`🧠 Fragmento ${this.memoryFragments.filter(m => m.userData.collected).length}/15`);
                    return;
                } else if(note.userData.type === 'audio' && !note.userData.collected && dist < 1.5) {
                    note.userData.collected = true;
                    scene.remove(note);
                    showMonologue(`🎵 Grabación ${this.audioRecordings.filter(a => a.userData.collected).length}/5`);
                    return;
                } else if(note.userData.type === 'icon' && !note.userData.collected && dist < 1.5) {
                    this.collectIcon(note);
                    return;
                } else if(note.userData.type === 'key' && !note.userData.collected && dist < 1.5) {
                    this.collectKey(note);
                    return;
                } else if(note.userData.type === 'note' && !note.userData.read && dist < 1.5) {
                    this.readNote(note);
                    note.userData.read = true;
                    this.notesRead++;
                    return;
                }
            }
            
            // Ventilación
            for(let vent of this.ventDucts) {
                const dist = playerPos.distanceTo(vent.position);
                if(dist < 1.5) {
                    camera.position.set(vent.userData.connects.x, vent.userData.connects.y || 1.6, vent.userData.connects.z);
                    showMonologue('Atravesé el ducto de ventilación');
                    return;
                }
            }
            
            // Puerta - verificar si está cerca
            const doorDist = Math.sqrt(Math.pow(playerPos.x - 0, 2) + Math.pow(playerPos.z - 14, 2));
            if(doorDist < 2 && !this.doorOpened) {
                // Solo abrir si tiene TODOS los requerimientos
                if(this.collectedIcons.length >= this.totalIcons && this.collectedKeys.length >= this.totalKeys && this.hasHelmet) {
                    this.doorOpened = true;
                    this.openDoor();
                } else {
                    showMonologue('La puerta está bloqueada. Necesito todos los items.');
                }
                return;
            }
        }
    }

    initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.ambientSound = this.createDroneSound(60, 0.2);
        
        const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1.0;
        
        this.footstepAudio = new Audio('stuff/stepsound.mp3');
        this.footstepAudio.volume = 0.25 * vol;
        
        for(let i = 0; i < 3; i++) {
            const audio = new Audio('stuff/stepsound.mp3');
            audio.volume = 0.25 * vol;
            this.footstepPool.push(audio);
        }
        
        this.runAudio = new Audio('stuff/correr.mp3');
        this.runAudio.volume = 0.4 * vol;
        this.runAudio.loop = true;
        
        this.exhaustedAudio = new Audio('stuff/exhausted.mp3');
        this.exhaustedAudio.volume = 0.5 * vol;
        
        // Sonidos de pasto para el patio
        this.grassWalkAudio = new Audio('stuff/caminarpasto.mp3');
        this.grassWalkAudio.volume = 0.3 * vol;
        
        this.grassRunAudio = new Audio('stuff/correrpasto.mp3');
        this.grassRunAudio.volume = 0.4 * vol;
        this.grassRunAudio.loop = true;
        
        // Metal pipe random
        this.metalPipeAudio = new Audio('stuff/metal pipe.mp3');
        this.metalPipeAudio.volume = 0.5 * vol;
        
        // Ambientes del laboratorio
        this.labIntroAudio = new Audio('stuff/labchapter2intro.mp3');
        this.labIntroAudio.volume = 0.4 * vol;
        
        this.labAmbientAudio = new Audio('stuff/chapter2laboratory.mp3');
        this.labAmbientAudio.volume = 0.1 * vol;
        this.labAmbientAudio.loop = true;
        
        this.bubbleAudio = new Audio('stuff/burbujas.mp3');
        this.bubbleAudio.volume = 0.3 * vol;
        this.bubbleAudio.loop = true;
        
        this.computerAudio = new Audio('stuff/computerlab.mp3');
        this.computerAudio.volume = 0.4 * vol;
        this.computerAudio.loop = true;
        
        this.electricityAudio = new Audio('stuff/electrictyzone.mp3');
        this.electricityAudio.volume = 0.35 * vol;
        this.electricityAudio.loop = true;
        
        // Linterna del casco
        this.flashlightAudio = new Audio('stuff/flashlight.mp3');
        this.flashlightAudio.volume = 0.5 * vol;
    }

    createDroneSound(frequency, volume) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start();
        return { oscillator, gainNode };
    }

    playFootstep() {
        if(this.footstepPool.length === 0) return;
        const step = this.footstepPool[this.poolIndex];
        step.currentTime = 0;
        step.play().catch(() => {});
        this.poolIndex = (this.poolIndex + 1) % this.footstepPool.length;
    }

    clearScene() {
        while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        const ambient = new THREE.AmbientLight(0x202020, 0.3);
        scene.add(ambient);
        
        // Pausar audios de sala al cambiar de zona
        this.stopRoomAudios();
    }
    
    stopRoomAudios() {
        if(this.labAmbientAudio && !this.labAmbientAudio.paused) {
            this.labAmbientAudio.pause();
        }
        if(this.bubbleAudio && !this.bubbleAudio.paused) {
            this.bubbleAudio.pause();
        }
        if(this.computerAudio && !this.computerAudio.paused) {
            this.computerAudio.pause();
        }
        if(this.electricityAudio && !this.electricityAudio.paused) {
            this.electricityAudio.pause();
        }
        if(this.whiteRoomAudio && !this.whiteRoomAudio.paused) {
            this.whiteRoomAudio.pause();
        }
        if(this.chapter2RainAudio && !this.chapter2RainAudio.paused) {
            this.chapter2RainAudio.pause();
        }
    }

    createFallingCinematic() {
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const wall = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 100, 16), wallMat);
        wall.position.y = -50;
        scene.add(wall);

        this.playerModel = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.6, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x4a4a4a })
        );
        this.playerModel.add(body);
        this.playerModel.position.set(0, 50, 0);
        scene.add(this.playerModel);

        camera.position.set(0, 45, 8);
        camera.lookAt(this.playerModel.position);
        showMonologue('¡EL SUELO SE ABRE!');
        
        // Intro del laboratorio al empezar la caída
        if(this.labIntroAudio) {
            this.labIntroAudio.play().catch(() => {});
        }
    }

    createPitBottom() {
        // Suelo laboratorio EXPANDIDO 80x80m
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshBasicMaterial({ color: 0x3a3a3a })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Paredes exteriores
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        this.walls = [];
        
        const outerWalls = [
            new THREE.Mesh(new THREE.BoxGeometry(80, 6, 0.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(80, 6, 0.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 80), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 80), wallMat)
        ];
        outerWalls[0].position.set(0, 3, -40);
        outerWalls[1].position.set(0, 3, 40);
        outerWalls[2].position.set(-40, 3, 0);
        outerWalls[3].position.set(40, 3, 0);
        outerWalls.forEach(w => {
            scene.add(w);
            this.walls.push(w);
        });

        // Luz tenue
        const ambient = new THREE.AmbientLight(0x404040, 0.2);
        scene.add(ambient);

        this.createLabRooms();
        this.createLaboratory();
        this.createNotes();
        this.createBlockedDoor();
        this.createCollectibleIcons();
        this.createTerminals();
        this.createPuzzleRooms();
        this.createVentilationSystem();
        this.createOptionalCollectibles();
        this.spawnGisselCyber();
        this.startDynamicEvents();
    }

    createBlockedDoor() {
        // Puerta bloqueada en pared sur
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x8b0000 })
        );
        doorFrame.position.set(0, 1.5, 14.5);
        scene.add(doorFrame);
        
        // Texto "BLOQUEADO"
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLOQUEADO', 256, 100);
        ctx.font = '30px Arial';
        ctx.fillText(`0/${this.totalIcons} ICONOS`, 256, 140);
        ctx.font = '25px Arial';
        ctx.fillText(`0/${this.totalKeys} LLAVES`, 256, 180);
        const texture = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(2.5, 1.5),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true })
        );
        sign.position.set(0, 1.5, 14);
        sign.rotation.y = Math.PI;
        scene.add(sign);
        
        this.blockedDoor = { frame: doorFrame, sign: sign, canvas: canvas, ctx: ctx, texture: texture };
        
        // Luz roja sobre puerta
        const doorLight = new THREE.PointLight(0xff0000, 1, 8);
        doorLight.position.set(0, 3, 14);
        scene.add(doorLight);
    }
    
    createCollectibleIcons() {
        const icons = [
            { path: '../assets/icons/GisselInactiveIcon.png', name: 'Gissel' },
            { path: '../assets/icons/IA777NormalIcon.png', name: 'iA777' },
            { path: '../assets/icons/LunaNormalIcon.png', name: 'Luna' },
            { path: '../assets/icons/AngelNormalIcon.png', name: 'Angel' },
            { path: '../assets/icons/IrisNormalIcon.png', name: 'Iris' },
            { path: '../assets/icons/MollyNormalIcon.png', name: 'Molly' },
            { path: '../assets/icons/GisselInactiveIcon.png', name: 'Gissel' },
            { path: '../assets/icons/IA777NormalIcon.png', name: 'iA777' },
            { path: '../assets/icons/LunaNormalIcon.png', name: 'Luna' },
            { path: '../assets/icons/AngelNormalIcon.png', name: 'Angel' }
        ];
        
        // Habitaciones con dimensiones (centro, ancho, profundidad, nivel)
        const availableRooms = [
            { x: -28, z: -28, w: 10, d: 10, level: 1 },
            { x: -28, z: -10, w: 10, d: 8, level: 1 },
            { x: 28, z: -28, w: 10, d: 10, level: 1 },
            { x: 28, z: -10, w: 10, d: 8, level: 1 },
            { x: -28, z: 28, w: 10, d: 10, level: 1 },
            { x: -28, z: 10, w: 10, d: 8, level: 1 },
            { x: 28, z: 28, w: 10, d: 10, level: 1 },
            { x: 28, z: 10, w: 10, d: 8, level: 1 },
            { x: -28, z: -28, w: 10, d: 10, level: 2 },
            { x: -28, z: -10, w: 10, d: 8, level: 2 },
            { x: 28, z: -28, w: 10, d: 10, level: 2 },
            { x: 28, z: -10, w: 10, d: 8, level: 2 }
        ];
        
        // Mezclar habitaciones aleatoriamente
        const shuffledRooms = availableRooms.sort(() => Math.random() - 0.5);
        const iconPositions = shuffledRooms.slice(0, 10);
        
        // Crear 3 llaves de colores en habitaciones específicas
        const keyRooms = [
            { color: 0xff0000, name: 'Roja', room: availableRooms[4] },
            { color: 0x0000ff, name: 'Azul', room: availableRooms[7] },
            { color: 0x00ff00, name: 'Verde', room: availableRooms[10] }
        ];
        
        keyRooms.forEach((keyData, i) => {
            const room = keyData.room;
            const x = room.x + (Math.random() - 0.5) * (room.w - 2);
            const z = room.z + (Math.random() - 0.5) * (room.d - 2);
            const y = room.level === 2 ? 6.86 : 0.86;
            
            const key = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.6, 0.1),
                new THREE.MeshBasicMaterial({ color: keyData.color })
            );
            key.position.set(x, y, z);
            key.rotation.x = -Math.PI / 2;
            key.userData = { type: 'key', name: keyData.name, id: i, collected: false };
            scene.add(key);
            this.notes.push(key);
            this.keyObjects.push(key);
            
            const keyLight = new THREE.PointLight(keyData.color, 1, 3);
            keyLight.position.set(x, y + 0.5, z);
            scene.add(keyLight);
        });
        
        icons.forEach((data, i) => {
            const room = iconPositions[i];
            const x = room.x + (Math.random() - 0.5) * (room.w - 2);
            const z = room.z + (Math.random() - 0.5) * (room.d - 2);
            const y = room.level === 2 ? 6.86 : 0.86;
            
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                ctx.fillRect(0, 0, 128, 128);
                ctx.drawImage(img, 16, 16, 96, 96);
                
                const texture = new THREE.CanvasTexture(canvas);
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture, 
                    transparent: true
                });
                
                const plane = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.5, 0.5),
                    material
                );
                plane.position.set(x, y, z);
                plane.rotation.x = -Math.PI / 2;
                plane.userData = { type: 'icon', name: data.name, id: i, collected: false };
                scene.add(plane);
                this.notes.push(plane);
                
                // Luz dorada sobre icono
                const iconLight = new THREE.PointLight(0xffd700, 0.8, 3);
                iconLight.position.set(x, y + 0.5, z);
                scene.add(iconLight);
            };
            img.onerror = () => console.error('Failed to load icon:', data.path);
            img.src = data.path;
        });
    }
    
    updateDoorSign() {
        if(!this.blockedDoor) return;
        
        const { ctx, canvas, texture, sign } = this.blockedDoor;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const allCollected = this.collectedIcons.length >= this.totalIcons && this.collectedKeys.length >= this.totalKeys && this.hasHelmet;
        
        if(allCollected) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('DESBLOQUEADO', 256, 100);
            ctx.font = '30px Arial';
            ctx.fillText('Presiona E para abrir', 256, 160);
        } else {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BLOQUEADO', 256, 100);
            ctx.font = '30px Arial';
            ctx.fillText(`${this.collectedIcons.length}/${this.totalIcons} ICONOS`, 256, 140);
            ctx.font = '25px Arial';
            ctx.fillText(`${this.collectedKeys.length}/${this.totalKeys} LLAVES`, 256, 180);
            ctx.font = '20px Arial';
            ctx.fillText(this.hasHelmet ? 'V CASCO' : 'X CASCO', 256, 210);
        }
        
        texture.needsUpdate = true;
    }

    spawnGisselCyber() {
        // Spawn en una habitación aleatoria del nivel 1
        const rooms = [
            { x: -28, z: -28, w: 10, d: 10 },
            { x: 28, z: -28, w: 10, d: 10 },
            { x: -28, z: 28, w: 10, d: 10 },
            { x: 28, z: 28, w: 10, d: 10 }
        ];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const x = room.x + (Math.random() - 0.5) * (room.w - 2);
        const z = room.z + (Math.random() - 0.5) * (room.d - 2);
        
        const loader = new THREE.TextureLoader();
        loader.load('stuff/Gisselcyber.jpg', (texture) => {
            const material = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true
            });
            
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(1.5, 2),
                material
            );
            plane.position.set(x, 1, z);
            scene.add(plane);
            this.gisselCyber = plane;
            
            // Luz morada
            const light = new THREE.PointLight(0xff00ff, 1, 5);
            light.position.set(x, 1.5, z);
            scene.add(light);
        });
    }

    createLabRooms() {
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        const doorMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        const level2WallMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const ceilingMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        
        // 16 habitaciones en 2 niveles (8 por nivel) - 80x80m
        const rooms = [
            // NIVEL 1 (y=0)
            { x: -28, z: -28, w: 10, d: 10, door: 'south', type: 'storage', level: 1 },
            { x: -28, z: -10, w: 10, d: 8, door: 'east', type: 'office', level: 1 },
            { x: 28, z: -28, w: 10, d: 10, door: 'south', type: 'lab', level: 1 },
            { x: 28, z: -10, w: 10, d: 8, door: 'west', type: 'medical', level: 1 },
            { x: -28, z: 28, w: 10, d: 10, door: 'north', type: 'containment', level: 1 },
            { x: -28, z: 10, w: 10, d: 8, door: 'east', type: 'security', level: 1 },
            { x: 28, z: 28, w: 10, d: 10, door: 'north', type: 'server', level: 1 },
            { x: 28, z: 10, w: 10, d: 8, door: 'west', type: 'archive', level: 1 },
            
            // NIVEL 2 (y=6) - Accesible por escaleras
            { x: -28, z: -28, w: 10, d: 10, door: 'south', type: 'research', level: 2 },
            { x: -28, z: -10, w: 10, d: 8, door: 'east', type: 'testing', level: 2 },
            { x: 28, z: -28, w: 10, d: 10, door: 'south', type: 'observation', level: 2 },
            { x: 28, z: -10, w: 10, d: 8, door: 'west', type: 'control', level: 2 },
            { x: -28, z: 28, w: 10, d: 10, door: 'north', type: 'power', level: 2 },
            { x: -28, z: 10, w: 10, d: 8, door: 'east', type: 'backup', level: 2 },
            { x: 28, z: 28, w: 10, d: 10, door: 'north', type: 'vault', level: 2 },
            { x: 28, z: 10, w: 10, d: 8, door: 'west', type: 'mainframe', level: 2 }
        ];
        
        rooms.forEach(room => {
            const yOffset = room.level === 2 ? 6 : 0;
            
            // Suelo de habitación (sólido para nivel 2)
            const roomFloor = new THREE.Mesh(
                room.level === 2 ? new THREE.BoxGeometry(room.w, 0.3, room.d) : new THREE.PlaneGeometry(room.w, room.d),
                new THREE.MeshBasicMaterial({ color: room.level === 2 ? 0x3a3a3a : 0x2a2a2a })
            );
            if(room.level === 1) {
                roomFloor.rotation.x = -Math.PI / 2;
                roomFloor.position.set(room.x, yOffset + 0.01, room.z);
            } else {
                roomFloor.position.set(room.x, yOffset - 0.15, room.z);
            }
            scene.add(roomFloor);
            
            // Paredes de habitación
            const walls = [
                { w: room.w, h: 3, d: 0.3, x: 0, z: room.d/2, side: 'north' },
                { w: room.w, h: 3, d: 0.3, x: 0, z: -room.d/2, side: 'south' },
                { w: 0.3, h: 3, d: room.d, x: room.w/2, z: 0, side: 'east' },
                { w: 0.3, h: 3, d: room.d, x: -room.w/2, z: 0, side: 'west' }
            ];
            
            walls.forEach(wall => {
                if(wall.side === room.door) {
                    const doorWidth = 2;
                    const sideWidth = (wall.w - doorWidth) / 2;
                    
                    if(wall.side === 'north' || wall.side === 'south') {
                        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, wall.h, wall.d), wallMat);
                        leftWall.position.set(room.x + wall.x - doorWidth/2 - sideWidth/2, yOffset + 1.5, room.z + wall.z);
                        scene.add(leftWall);
                        this.walls.push(leftWall);
                        
                        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, wall.h, wall.d), wallMat);
                        rightWall.position.set(room.x + wall.x + doorWidth/2 + sideWidth/2, yOffset + 1.5, room.z + wall.z);
                        scene.add(rightWall);
                        this.walls.push(rightWall);
                        
                        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, 0.3, wall.d), doorMat);
                        topFrame.position.set(room.x + wall.x, yOffset + 2.85, room.z + wall.z);
                        scene.add(topFrame);
                    } else {
                        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wall.w, wall.h, sideWidth), wallMat);
                        leftWall.position.set(room.x + wall.x, yOffset + 1.5, room.z + wall.z - doorWidth/2 - sideWidth/2);
                        scene.add(leftWall);
                        this.walls.push(leftWall);
                        
                        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wall.w, wall.h, sideWidth), wallMat);
                        rightWall.position.set(room.x + wall.x, yOffset + 1.5, room.z + wall.z + doorWidth/2 + sideWidth/2);
                        scene.add(rightWall);
                        this.walls.push(rightWall);
                        
                        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(wall.w, 0.3, doorWidth), doorMat);
                        topFrame.position.set(room.x + wall.x, yOffset + 2.85, room.z + wall.z);
                        scene.add(topFrame);
                    }
                } else {
                    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w, wall.h, wall.d), wallMat);
                    wallMesh.position.set(room.x + wall.x, yOffset + 1.5, room.z + wall.z);
                    scene.add(wallMesh);
                    this.walls.push(wallMesh);
                }
            });
            
            let lightColor = 0x404040;
            if(room.type === 'containment') lightColor = 0xff0000;
            else if(room.type === 'medical') lightColor = 0x00ff00;
            else if(room.type === 'server' || room.type === 'mainframe') lightColor = 0x0000ff;
            else if(room.type === 'power') lightColor = 0xffff00;
            
            const roomLight = new THREE.PointLight(lightColor, 0.5, room.w);
            roomLight.position.set(room.x, yOffset + 2.5, room.z);
            scene.add(roomLight);
        });
        
        // Suelo completo del nivel 2 (80x80m)
        const level2Floor = new THREE.Mesh(
            new THREE.BoxGeometry(80, 0.3, 80),
            new THREE.MeshBasicMaterial({ color: 0x252525 })
        );
        level2Floor.position.set(0, 5.85, 0);
        scene.add(level2Floor);
        
        // PAREDES EXTERIORES NIVEL 2 (oscuras y aterradoras)
        const level2OuterWalls = [
            new THREE.Mesh(new THREE.BoxGeometry(80, 3, 0.5), level2WallMat),
            new THREE.Mesh(new THREE.BoxGeometry(80, 3, 0.5), level2WallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 80), level2WallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 80), level2WallMat)
        ];
        level2OuterWalls[0].position.set(0, 7.5, -40);
        level2OuterWalls[1].position.set(0, 7.5, 40);
        level2OuterWalls[2].position.set(-40, 7.5, 0);
        level2OuterWalls[3].position.set(40, 7.5, 0);
        level2OuterWalls.forEach(w => {
            scene.add(w);
            this.walls.push(w);
        });
        
        // TECHO NIVEL 2 (oscuro)
        const level2Ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            ceilingMat
        );
        level2Ceiling.rotation.x = Math.PI / 2;
        level2Ceiling.position.y = 9;
        scene.add(level2Ceiling);
        
        // Luces rojas tenues en nivel 2 (ambiente terrorífico)
        for(let i = 0; i < 8; i++) {
            const x = (i % 4 - 1.5) * 20;
            const z = Math.floor(i / 4) * 40 - 20;
            const redLight = new THREE.PointLight(0xff0000, 0.3, 15);
            redLight.position.set(x, 7.5, z);
            scene.add(redLight);
        }
        
        // ÁREA CENTRAL NIVEL 2 - Zona de experimentación
        // Plataforma central elevada con contenedor "666"
        const centralPlatform = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 9, 0.5, 16),
            new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
        );
        centralPlatform.position.set(0, 6.25, 0);
        scene.add(centralPlatform);
        
        // Contenedor central "666" grande
        const mainContainer = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.5, 3, 16),
            new THREE.MeshStandardMaterial({ color: 0x4a0000, emissive: 0x4a0000, emissiveIntensity: 0.4, transparent: true, opacity: 0.6 })
        );
        mainContainer.position.set(0, 7.5, 0);
        scene.add(mainContainer);
        this.floatingObjects.push({ mesh: mainContainer, type: 'float', baseY: 7.5, speed: 0.0008 });
        
        // Luz roja pulsante en contenedor
        const containerLight = new THREE.PointLight(0xff0000, 2, 15);
        containerLight.position.set(0, 7.5, 0);
        scene.add(containerLight);
        setInterval(() => {
            containerLight.intensity = Math.random() > 0.5 ? 2.5 : 1.5;
        }, 400);
        
        // Anillo de energía giratorio
        const energyRing = new THREE.Mesh(
            new THREE.TorusGeometry(6, 0.2, 8, 32),
            new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 1.0 })
        );
        energyRing.rotation.x = Math.PI / 2;
        energyRing.position.y = 7;
        scene.add(energyRing);
        this.floatingObjects.push({ mesh: energyRing, type: 'ring', baseY: 7, speed: 0.001 });
        
        // Pilares alrededor de la plataforma central
        for(let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8),
                new THREE.MeshBasicMaterial({ color: 0x3a3a3a })
            );
            pillar.position.set(Math.sin(angle) * 10, 7.25, Math.cos(angle) * 10);
            scene.add(pillar);
            
            // Luces en pilares
            const pillarLight = new THREE.PointLight(i % 2 === 0 ? 0xff0000 : 0x00ffff, 0.8, 6);
            pillarLight.position.set(Math.sin(angle) * 10, 8, Math.cos(angle) * 10);
            scene.add(pillarLight);
        }
        
        // Mesas de experimentos en el centro
        const experimentTables = [
            { x: -5, z: -5 }, { x: 5, z: -5 },
            { x: -5, z: 5 }, { x: 5, z: 5 }
        ];
        experimentTables.forEach(pos => {
            const table = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.1, 1.5),
                new THREE.MeshBasicMaterial({ color: 0x4a4a4a })
            );
            table.position.set(pos.x, 6.8, pos.z);
            scene.add(table);
            
            // Equipos en mesas (con vibración)
            const equipment = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.6, 0.4),
                new THREE.MeshBasicMaterial({ color: 0x666666 })
            );
            equipment.position.set(pos.x, 7.15, pos.z);
            scene.add(equipment);
            this.floatingObjects.push({ mesh: equipment, type: 'vibrate', baseY: 7.15, speed: 0.01 });
            
            // Pantallas con luz
            const screen = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.4, 0.05),
                new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.7 })
            );
            screen.position.set(pos.x - 0.5, 7.2, pos.z);
            scene.add(screen);
        });
        
        // Cables colgantes del techo (con balanceo)
        for(let i = 0; i < 12; i++) {
            const length = Math.random() * 1.5 + 0.5;
            const cable = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, length, 4),
                new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
            );
            const x = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 30;
            cable.position.set(x, 9 - length/2, z);
            scene.add(cable);
            this.floatingObjects.push({ mesh: cable, type: 'swing', baseX: x, baseZ: z, speed: 0.002 + Math.random() * 0.001, offset: Math.random() * Math.PI * 2 });
        }
        
        // Estanterías con suministros en pasillos
        const shelfPositions = [
            { x: -15, z: 0 }, { x: 15, z: 0 },
            { x: 0, z: -15 }, { x: 0, z: 15 }
        ];
        shelfPositions.forEach(pos => {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 0.5),
                new THREE.MeshBasicMaterial({ color: 0x3a3a3a })
            );
            shelf.position.set(pos.x, 7, pos.z);
            scene.add(shelf);
            
            // Cajas en estanterías
            for(let i = 0; i < 5; i++) {
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 0.4, 0.4),
                    new THREE.MeshBasicMaterial({ color: 0x5a5a5a })
                );
                box.position.set(pos.x, 7.8, pos.z - 0.8 + i * 0.4);
                scene.add(box);
            }
        });
        
        // Contenedores de almacenamiento
        for(let i = 0; i < 8; i++) {
            const container = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1.2, 1.5),
                new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
            );
            const angle = (i / 8) * Math.PI * 2;
            container.position.set(Math.sin(angle) * 18, 6.6, Math.cos(angle) * 18);
            container.rotation.y = Math.random() * Math.PI;
            scene.add(container);
        }
        
        // Luces de advertencia parpadeantes
        for(let i = 0; i < 6; i++) {
            const warningLight = new THREE.PointLight(0xffaa00, 0, 8);
            const x = (Math.random() - 0.5) * 25;
            const z = (Math.random() - 0.5) * 25;
            warningLight.position.set(x, 8.5, z);
            scene.add(warningLight);
            setInterval(() => {
                warningLight.intensity = Math.random() > 0.7 ? 1.2 : 0;
            }, 500 + i * 100);
        }
        
        // Paneles de control en paredes
        const controlPanels = [
            { x: -18, z: 0, rot: Math.PI / 2 },
            { x: 18, z: 0, rot: -Math.PI / 2 },
            { x: 0, z: -18, rot: 0 },
            { x: 0, z: 18, rot: Math.PI }
        ];
        controlPanels.forEach(data => {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.3 })
            );
            panel.position.set(data.x, 7, data.z);
            panel.rotation.y = data.rot;
            scene.add(panel);
        });
        
        // Escaleras para nivel 2 en esquinas con barandales
        this.createStairs(-20, -20);
        this.createStairs(20, -20);
        this.createStairs(-20, 20);
        this.createStairs(20, 20);
        
        // Barandales en pasillos nivel 2
        const railingMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });
        const railings = [
            { x: -10, z: 0, w: 0.1, d: 20 },
            { x: 10, z: 0, w: 0.1, d: 20 },
            { x: 0, z: -10, w: 20, d: 0.1 },
            { x: 0, z: 10, w: 20, d: 0.1 }
        ];
        railings.forEach(r => {
            const railing = new THREE.Mesh(
                new THREE.BoxGeometry(r.w, 1, r.d),
                railingMat
            );
            railing.position.set(r.x, 6.5, r.z);
            scene.add(railing);
        });
        
        const corridorLights = [
            { x: 0, z: -20 }, { x: 0, z: 0 }, { x: 0, z: 20 },
            { x: -20, z: 0 }, { x: 20, z: 0 },
            { x: 0, z: -20, y: 6 }, { x: 0, z: 0, y: 6 }, { x: 0, z: 20, y: 6 },
            { x: -20, z: 0, y: 6 }, { x: 20, z: 0, y: 6 }
        ];
        corridorLights.forEach(pos => {
            const light = new THREE.PointLight(0x606060, 0.4, 15);
            light.position.set(pos.x, pos.y || 2.5, pos.z);
            scene.add(light);
        });
        
        // Señales de advertencia en nivel 2 (pegadas a paredes internas)
        const warningTexts = [
            { x: -10, z: -10, rot: Math.PI / 4, text: '⚠️ PELIGRO\nNIVEL 2' },
            { x: 10, z: -10, rot: -Math.PI / 4, text: '⚠️ ZONA\nRESTRINGIDA' },
            { x: -10, z: 10, rot: -Math.PI / 4, text: '☢️ RIESGO\nBIOLÓGICO' },
            { x: 10, z: 10, rot: Math.PI / 4, text: '⚡ ALTA\nTENSIÓN' }
        ];
        warningTexts.forEach(data => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            const lines = data.text.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, 128, 100 + i * 50);
            });
            const texture = new THREE.CanvasTexture(canvas);
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(1.2, 1.2),
                new THREE.MeshBasicMaterial({ map: texture })
            );
            sign.position.set(data.x, 7.5, data.z);
            sign.rotation.y = data.rot;
            scene.add(sign);
        });
    }
    
    createStairs(x, z) {
        const stairMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });
        const railMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        
        // Plataforma base
        const basePlatform = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), stairMat);
        basePlatform.position.set(x, 0.1, z);
        scene.add(basePlatform);
        
        // 12 escalones para subir 6m
        for(let i = 0; i < 12; i++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.8), stairMat);
            step.position.set(x, i * 0.5 + 0.25, z + i * 0.5);
            scene.add(step);
            
            // Barandales en escaleras
            if(i > 0) {
                const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), railMat);
                leftRail.position.set(x - 1.4, i * 0.5 + 0.4, z + i * 0.5);
                scene.add(leftRail);
                
                const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), railMat);
                rightRail.position.set(x + 1.4, i * 0.5 + 0.4, z + i * 0.5);
                scene.add(rightRail);
            }
        }
        
        // Plataforma superior conectada al nivel 2
        const topPlatform = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), stairMat);
        topPlatform.position.set(x, 6.1, z + 6);
        scene.add(topPlatform);
        
        const stairLight = new THREE.PointLight(0x808080, 0.6, 8);
        stairLight.position.set(x, 3, z + 3);
        scene.add(stairLight);
        
        // Luz en la parte superior
        const topLight = new THREE.PointLight(0xff0000, 0.5, 6);
        topLight.position.set(x, 6.5, z + 6);
        scene.add(topLight);
    }

    createLaboratory() {
        const labMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });
        const metalMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
        const glassMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 });

        // CASCO EXPERIMENTAL en posición [8, 1.3, -12]
        const helmetGeometry = new THREE.Group();
        const helmetBase = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
        );
        helmetBase.position.set(0, 0, 0);
        helmetGeometry.add(helmetBase);
        
        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.15, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7 })
        );
        visor.position.set(0, 0, 0.4);
        helmetGeometry.add(visor);
        
        // Aura cyan alrededor del casco
        const aura = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.2, side: THREE.BackSide })
        );
        aura.position.set(0, 0, 0);
        helmetGeometry.add(aura);
        
        helmetGeometry.position.set(8, 1.3, -12);
        helmetGeometry.userData = { type: 'helmet', collected: false, aura: aura };
        scene.add(helmetGeometry);
        this.notes.push(helmetGeometry);
        this.floatingObjects.push({ mesh: helmetGeometry, type: 'float', baseY: 1.3, speed: 0.001 });
        
        // Luz cyan sobre casco
        const helmetLight = new THREE.PointLight(0x00ffff, 2, 5);
        helmetLight.position.set(8, 1.8, -12);
        scene.add(helmetLight);
        
        // Animación de aura pulsante
        setInterval(() => {
            if(aura && aura.material) {
                aura.material.opacity = 0.1 + Math.sin(Date.now() * 0.003) * 0.15;
            }
        }, 50);
        
        // Contenedor central "666" (cápsula de contención)
        const container = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.5, 16), glassMat);
        container.position.set(0, 1.25, 0);
        scene.add(container);
        
        const containerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16), metalMat);
        containerBase.position.set(0, 0.15, 0);
        scene.add(containerBase);
        
        // Texto "666" en contenedor
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('666', 128, 90);
        const texture = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.8),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true })
        );
        sign.position.set(0, 1.5, 1.6);
        scene.add(sign);

        // Mesas de laboratorio con equipos (4 estaciones)
        const stations = [
            { x: -10, z: -10 },
            { x: 10, z: -10 },
            { x: -10, z: 8 },
            { x: 10, z: 8 }
        ];
        
        stations.forEach(pos => {
            // Mesa
            const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 2), labMat);
            desk.position.set(pos.x, 0.8, pos.z);
            scene.add(desk);
            
            // Patas
            for(let x of [-1.3, 1.3]) {
                for(let z of [-0.8, 0.8]) {
                    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), metalMat);
                    leg.position.set(pos.x + x, 0.4, pos.z + z);
                    scene.add(leg);
                }
            }
            
            // Computadora
            const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.1), metalMat);
            monitor.position.set(pos.x, 1.15, pos.z);
            scene.add(monitor);
            
            // Microscopio
            const micro = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), metalMat);
            micro.position.set(pos.x - 0.8, 1.05, pos.z + 0.5);
            scene.add(micro);
            
            // Frascos
            for(let i = 0; i < 3; i++) {
                const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), glassMat);
                flask.position.set(pos.x + 0.5 + i * 0.3, 1.0, pos.z - 0.6);
                scene.add(flask);
            }
        });

        // Estanterías con suministros
        for(let i = 0; i < 4; i++) {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 0.4), labMat);
            shelf.position.set(-13 + i * 8.5, 1, -13);
            scene.add(shelf);
            
            // Cajas en estanterías
            for(let j = 0; j < 4; j++) {
                const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), metalMat);
                box.position.set(-13 + i * 8.5 - 0.8 + j * 0.5, 1.8, -13);
                scene.add(box);
            }
        }

        // Camillas médicas
        const bed1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 1), metalMat);
        bed1.position.set(-5, 0.6, -5);
        scene.add(bed1);
        
        const bed2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 1), metalMat);
        bed2.position.set(5, 0.6, -5);
        scene.add(bed2);

        // Equipos médicos rotos
        for(let i = 0; i < 5; i++) {
            const equip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), metalMat);
            equip.position.set(Math.random() * 20 - 10, 0.4, Math.random() * 20 - 10);
            equip.rotation.set(Math.random(), Math.random(), Math.random() * 0.5);
            scene.add(equip);
        }

        // Luz roja parpadeante sobre contenedor 666
        const redLight = new THREE.PointLight(0xff0000, 1.5, 10);
        redLight.position.set(0, 3, 0);
        scene.add(redLight);
        setInterval(() => {
            redLight.intensity = Math.random() > 0.5 ? 1.5 : 0.5;
        }, 500);

        // Luces blancas en estaciones
        stations.forEach(pos => {
            const light = new THREE.PointLight(0xffffff, 0.6, 8);
            light.position.set(pos.x, 2.5, pos.z);
            scene.add(light);
        });
    }

    createNotes() {
        const noteMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        
        const notePositions = [
            { pos: [-11, 0.86, 8], text: 'DÍA 1: Iniciamos Proyecto 666. Los sujetos muestran cambios anormales en su comportamiento. Debemos continuar.', title: 'Bitácora - Día 1' },
            { pos: [11, 0.86, 8], text: 'DÍA 15: Los gritos no paran por las noches. El Sujeto 666 ha desarrollado habilidades... imposibles. Algo salió muy mal.', title: 'Bitácora - Día 15' },
            { pos: [-11, 0.86, -5], text: 'DÍA 28: Tres investigadores desaparecieron. Encontramos solo sangre. El director ordenó evacuar mañana.', title: 'Reporte de Incidente' },
            { pos: [11, 0.86, -5], text: 'DÍA 30: EVACUACIÓN INMEDIATA. Sellar el laboratorio. NUNCA ABRIR. El Sujeto 666 no debe salir.', title: 'Orden de Evacuación' },
            { pos: [-8, 1.3, -12], text: 'Nota personal: Si alguien lee esto... huye. No cometas nuestros errores. Este lugar está maldito.', title: 'Nota Personal' },
            { pos: [0, 0.86, 1.5], text: 'ADVERTENCIA FINAL: El Sujeto 666 escapó del contenedor. Dios nos perdone por lo que hemos creado.', title: '⚠️ ADVERTENCIA' },
            { pos: [8, 1.3, -12], text: 'iA777 aunque no es muy bueno en tecnología, logró crear este casco con materiales que encontró y la experiencia de su creador. De manera misteriosa, el casco desapareció y ahora está aquí.', title: 'Origen del Casco' },
            { pos: [-5, 0.86, -8], text: 'Ellos no fueron los culpables, fue algo mas', title: 'Hoja Oculta', hidden: true }
        ];

        notePositions.forEach((data, i) => {
            // Material especial para hoja oculta
            const material = data.hidden ? 
                new THREE.MeshBasicMaterial({ color: 0x2a2a2a, transparent: true, opacity: 0.3 }) : 
                noteMat;
            
            const note = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 0.4),
                material
            );
            note.position.set(data.pos[0], data.pos[1], data.pos[2]);
            note.rotation.x = -Math.PI / 2;
            note.userData = { type: 'note', text: data.text, title: data.title, id: i, read: false, hidden: data.hidden || false };
            scene.add(note);
            this.notes.push(note);

            // Luz especial para hoja oculta (roja y tenue) o amarilla normal
            const lightColor = data.hidden ? 0xff0000 : 0xffff00;
            const lightIntensity = data.hidden ? 0.2 : 0.4;
            const noteLight = new THREE.PointLight(lightColor, lightIntensity, 2);
            noteLight.position.set(data.pos[0], data.pos[1] + 0.5, data.pos[2]);
            scene.add(noteLight);
        });
    }

    updateFalling(delta) {
        this.fallProgress += delta * 0.5;
        
        this.playerModel.position.y = 50 - (this.fallProgress * this.fallProgress * 0.5);
        this.playerModel.rotation.x = this.fallProgress * 0.3;
        this.playerModel.rotation.z = Math.sin(this.fallProgress * 2) * 0.2;

        camera.position.y = this.playerModel.position.y - 5;
        camera.position.x = Math.sin(this.fallProgress * 0.5) * 2;
        camera.lookAt(this.playerModel.position);
        
        // Efecto de túnel visual
        const vignette = document.getElementById('vignette');
        if(vignette) {
            vignette.style.opacity = Math.min(this.fallProgress * 0.1, 0.7);
        }

        if(this.playerModel.position.y <= 1.6) {
            this.phase = 'landing';
            this.playerModel.position.y = 1.6;
            this.playerModel.rotation.x = 0;
            this.playerModel.rotation.z = 0;
            this.createPitBottom();
            this.playImpactSound();
            showMonologue('*Golpe fuerte*');
            vibrateGamepad(500, 1.0, 1.0);
            
            // Flash blanco al impactar
            const flash = document.createElement('div');
            flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;opacity:1;transition:opacity 0.5s;pointer-events:none;';
            document.body.appendChild(flash);
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 500);
            }, 100);
            
            setTimeout(() => this.startLanding(), 1000);
        }
    }

    playImpactSound() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    startLanding() {
        this.phase = 'exploring';
        
        // Detener intro
        if(this.labIntroAudio) {
            this.labIntroAudio.pause();
            this.labIntroAudio.currentTime = 0;
        }
        
        // Ambiente del laboratorio
        if(this.labAmbientAudio) {
            this.labAmbientAudio.play().catch(() => {});
        }
        if(this.bubbleAudio) {
            this.bubbleAudio.play().catch(() => {});
        }
        
        showMonologue('¿Dónde... dónde estoy?');
        
        // Fade desde negro
        const blackOverlay = document.createElement('div');
        blackOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9998;opacity:1;transition:opacity 2s;pointer-events:none;';
        document.body.appendChild(blackOverlay);
        
        setTimeout(() => {
            camera.position.set(0, 1.6, 12);
            camera.lookAt(0, 1.6, 0);
            scene.remove(this.playerModel);
            
            blackOverlay.style.opacity = '0';
            setTimeout(() => blackOverlay.remove(), 2000);
            
            showMonologue('Un laboratorio abandonado... "Proyecto 666"');
            setTimeout(() => {
                showMonologue('*Dolor agudo* Mi pierna... está lastimada...');
            }, 2000);
            this.createStaminaBar();
            this.createInjuryIndicator();
            
            // Efecto de despertar (visión borrosa)
            const blur = document.createElement('div');
            blur.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;backdrop-filter:blur(10px);z-index:9997;opacity:1;transition:opacity 3s;pointer-events:none;';
            document.body.appendChild(blur);
            setTimeout(() => {
                blur.style.opacity = '0';
                setTimeout(() => blur.remove(), 3000);
            }, 500);
        }, 2000);
    }

    createStaminaBar() {
        if(document.getElementById('ch2StaminaBar')) return;
        
        const bar = document.createElement('div');
        bar.id = 'ch2StaminaBar';
        bar.style.cssText = 'position:fixed;bottom:20px;left:20px;width:200px;height:15px;background:#222;border:2px solid #00ff00;z-index:100;';
        
        const fill = document.createElement('div');
        fill.id = 'ch2StaminaFill';
        fill.style.cssText = 'height:100%;background:linear-gradient(90deg,#00ff00,#88ff88);width:100%;transition:width 0.1s;';
        
        bar.appendChild(fill);
        document.body.appendChild(bar);
    }
    
    createInjuryIndicator() {
        if(document.getElementById('injuryIndicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'injuryIndicator';
        indicator.style.cssText = 'position:fixed;bottom:45px;left:20px;width:200px;height:12px;background:#222;border:2px solid #ff0000;z-index:100;';
        
        const fill = document.createElement('div');
        fill.id = 'injuryFill';
        fill.style.cssText = 'height:100%;background:linear-gradient(90deg,#ff0000,#ff8888);width:' + (100 - this.legHealProgress) + '%;transition:width 0.5s;';
        
        const label = document.createElement('div');
        label.id = 'injuryLabel';
        label.style.cssText = 'position:fixed;bottom:60px;left:20px;color:#ff0000;font-size:12px;font-weight:bold;text-shadow:0 0 5px #000;z-index:100;';
        label.textContent = '🦵 PIERNA LASTIMADA';
        
        indicator.appendChild(fill);
        document.body.appendChild(indicator);
        document.body.appendChild(label);
    }

    update(delta) {
        if(!this.active) return;
        
        // Limitar delta para monitores de alta frecuencia
        delta = Math.min(delta, this.maxDelta);

        if(this.phase === 'falling') {
            this.updateFalling(delta);
        } else if(this.phase === 'exploring') {
            this.updateExploring(delta);
        } else if(this.phase === 'escaping') {
            this.updateEscapePhase(delta);
        } else if(this.phase === 'whiteroom') {
            this.updateWhiteRoom(delta);
        } else if(this.phase === 'courtyard') {
            this.updateCourtyard(delta);
        }
    }

    updateExploring(delta) {
        // Metal pipe random (solo 1 vez)
        if(!this.metalPipePlayed && Math.random() < 0.0001) {
            this.metalPipePlayed = true;
            this.metalPipeAudio.play().catch(() => {});
        }
        
        // Actualizar gamepad
        this.updateGamepad();
        
        // Curación gradual de pierna
        if(this.legInjured) {
            this.legHealProgress += delta * 0.5;
            if(this.legHealProgress >= 100) {
                this.legInjured = false;
                this.legHealProgress = 100;
                showMonologue('Mi pierna... se siente mejor.');
                const indicator = document.getElementById('injuryIndicator');
                const label = document.getElementById('injuryLabel');
                if(indicator) indicator.remove();
                if(label) label.remove();
            }
            
            const injuryFill = document.getElementById('injuryFill');
            if(injuryFill) {
                injuryFill.style.width = (100 - this.legHealProgress) + '%';
                if(this.legHealProgress > 70) {
                    injuryFill.style.background = 'linear-gradient(90deg,#ffaa00,#ffdd88)';
                    const indicator = document.getElementById('injuryIndicator');
                    if(indicator) indicator.style.borderColor = '#ffaa00';
                }
            }
        }
        
        // Actualizar isRunning ANTES de calcular movimiento
        this.isRunning = this.keys['shift'] && !this.staminaExhausted;
        
        // Movimiento
        this.velocity.x = 0;
        this.velocity.z = 0;

        let baseSpeed = this.legInjured ? 0.05 : 0.08;
        if(this.isRunning && this.stamina > 0 && !this.staminaExhausted) {
            baseSpeed = this.legInjured ? 0.09 : 0.14;
        }
        
        const isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1;
        
        if(this.keys['w'] || this.joystickY < -0.1) this.velocity.z -= baseSpeed;
        if(this.keys['s'] || this.joystickY > 0.1) this.velocity.z += baseSpeed;
        if(this.keys['a'] || this.joystickX < -0.1) this.velocity.x -= baseSpeed;
        if(this.keys['d'] || this.joystickX > 0.1) this.velocity.x += baseSpeed;

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
        
        // Animación de correr (balanceo de cámara)
        let baseY = 1.6;
        if(this.isRunning && isMoving && this.stamina > 0 && !this.staminaExhausted) {
            this.runBobTime += delta * 15;
            baseY += Math.sin(this.runBobTime) * 0.08;
            camera.rotation.z = Math.sin(this.runBobTime * 0.5) * 0.02;
        } else if(isMoving) {
            this.runBobTime += delta * 8;
            baseY += Math.sin(this.runBobTime) * 0.03;
        } else {
            camera.rotation.z = 0;
            this.runBobTime = 0;
        }

        // Límites del laboratorio (80x80m) y altura por nivel
        camera.position.x = Math.max(-39, Math.min(39, camera.position.x));
        camera.position.z = Math.max(-39, Math.min(39, camera.position.z));
        
        // Detectar si está en escaleras para cambiar altura
        const stairPositions = [
            { x: -20, z: -20 }, { x: 20, z: -20 },
            { x: -20, z: 20 }, { x: 20, z: 20 }
        ];
        
        let onStairs = false;
        for(let stair of stairPositions) {
            const dx = Math.abs(camera.position.x - stair.x);
            const dz = camera.position.z - stair.z;
            if(dx < 1.5 && dz >= 0 && dz <= 6) {
                onStairs = true;
                // Calcular altura objetivo basada en progreso en escaleras
                this.targetHeight = 1.6 + (dz * 1.0);
                break;
            }
        }
        
        // Si no está en escaleras, ajustar altura según nivel
        if(!onStairs) {
            const onLevel2 = camera.position.y > 4;
            if(onLevel2) {
                this.targetHeight = 7.6 + (baseY - 1.6);
            } else {
                this.targetHeight = baseY;
            }
        }
        
        // Interpolación suave de altura (lerp)
        const lerpSpeed = 0.15; // Velocidad de transición (0.15 = suave)
        this.currentHeight += (this.targetHeight - this.currentHeight) * lerpSpeed;
        camera.position.y = this.currentHeight;
        
        // Colisión con paredes (MEJORADA)
        if(this.walls) {
            const playerBox = new THREE.Box3(
                new THREE.Vector3(camera.position.x - 0.3, camera.position.y - 1.6, camera.position.z - 0.3),
                new THREE.Vector3(camera.position.x + 0.3, camera.position.y + 0.4, camera.position.z + 0.3)
            );
            
            for(let wall of this.walls) {
                const wallBox = new THREE.Box3().setFromObject(wall);
                if(playerBox.intersectsBox(wallBox)) {
                    camera.position.addScaledVector(direction, this.velocity.z * 2);
                    camera.position.addScaledVector(right, this.velocity.x * 2);
                    break;
                }
            }
        }

        const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        
        // Sonido de computadora cerca de terminales
        let nearTerminal = false;
        for(let terminal of this.terminals) {
            const dist = playerPos.distanceTo(terminal.position);
            if(dist < 3) {
                nearTerminal = true;
                break;
            }
        }
        if(nearTerminal && this.computerAudio.paused) {
            this.computerAudio.play().catch(() => {});
        } else if(!nearTerminal && !this.computerAudio.paused) {
            this.computerAudio.pause();
        }
        
        // Sonido de electricidad en nivel 2
        if(camera.position.y > 4 && this.electricityAudio.paused) {
            this.electricityAudio.play().catch(() => {});
        } else if(camera.position.y <= 4 && !this.electricityAudio.paused) {
            this.electricityAudio.pause();
        }
        
        let nearNote = null;
        
        // Actualizar objetos flotantes en fase exploring
        if(this.floatingObjects && this.floatingObjects.length > 0) {
            const time = Date.now() * 0.001;
            for(let obj of this.floatingObjects) {
                if(obj.type === 'ring') {
                    obj.mesh.rotation.z += obj.speed * 60 * delta;
                } else if(obj.type === 'float') {
                    obj.mesh.position.y = obj.baseY + Math.sin(time * obj.speed * 1000) * 0.15;
                } else if(obj.type === 'swing') {
                    obj.mesh.rotation.z = Math.sin(time * obj.speed * 1000 + obj.offset) * 0.1;
                } else if(obj.type === 'vibrate') {
                    obj.mesh.position.y = obj.baseY + Math.sin(time * obj.speed * 1000) * 0.02;
                    obj.mesh.rotation.y = Math.sin(time * obj.speed * 500) * 0.05;
                }
            }
        }
        
        // Sistema de stamina (más rápido si pierna lastimada)
        if(this.isRunning && this.stamina > 0 && !this.staminaExhausted && isMoving) {
            this.stamina -= this.legInjured ? 0.7 : 0.5;
            if(this.stamina <= 0) {
                this.stamina = 0;
                this.staminaExhausted = true;
                this.isRunning = false;
                if(this.exhaustedAudio) {
                    this.exhaustedAudio.currentTime = 0;
                    this.exhaustedAudio.play().catch(() => {});
                }
                showMonologue(this.legInjured ? '*Jadeo* Mi pierna... no aguanta...' : '*Jadeo* No puedo más...');
            }
        } else if(this.stamina < this.maxStamina) {
            this.stamina += this.legInjured ? 0.15 : 0.2;
            if(this.stamina >= this.maxStamina) {
                this.stamina = this.maxStamina;
                this.staminaExhausted = false;
            }
        }
        
        // Audio de correr
        if(this.isRunning && isMoving && this.stamina > 0 && !this.staminaExhausted) {
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
        
        // Footsteps solo cuando NO está corriendo
        if(isMoving && !this.isRunning) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                this.playFootstep();
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
        }
        
        // Verificar distancia con Gissel Cyber
        if(this.gisselCyber && !this.gisselTriggered) {
            const dx = playerPos.x - this.gisselCyber.position.x;
            const dz = playerPos.z - this.gisselCyber.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if(dist < 3) {
                this.triggerGisselJumpscare();
            }
        }
        
        // Verificar distancia a la puerta para mostrar prompt
        if(!this.doorOpened) {
            const doorDist = Math.sqrt(Math.pow(playerPos.x - 0, 2) + Math.pow(playerPos.z - 14, 2));
            if(doorDist < 2) {
                if(!document.getElementById('doorPrompt')) {
                    const prompt = document.createElement('div');
                    prompt.id = 'doorPrompt';
                    prompt.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:15px 30px;border-radius:10px;font-size:18px;z-index:1000;';
                    if(this.collectedIcons.length >= this.totalIcons && this.collectedKeys.length >= this.totalKeys && this.hasHelmet) {
                        prompt.textContent = 'Presiona E para abrir la puerta';
                    } else {
                        prompt.textContent = 'Puerta bloqueada - Faltan items';
                    }
                    document.body.appendChild(prompt);
                }
            } else {
                const doorPrompt = document.getElementById('doorPrompt');
                if(doorPrompt) doorPrompt.remove();
            }
        }
        
        for(let note of this.notes) {
            const dx = playerPos.x - note.position.x;
            const dz = playerPos.z - note.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if(note.userData.type === 'icon' && !note.userData.collected && dist < 1.5) {
                nearNote = note;
                break;
            } else if(note.userData.type === 'key' && !note.userData.collected && dist < 1.5) {
                nearNote = note;
                break;
            } else if(note.userData.type === 'note' && !note.userData.read && dist < 1.5) {
                nearNote = note;
                break;
            }
        }

        if(nearNote) {
            if(!document.getElementById('notePrompt')) {
                const prompt = document.createElement('div');
                prompt.id = 'notePrompt';
                prompt.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:15px 30px;border-radius:10px;font-size:18px;z-index:1000;';
                prompt.textContent = 'Presiona E para leer';
                document.body.appendChild(prompt);
            }
            
            if(this.keys['e']) {
                this.handleInteract();
                const prompt = document.getElementById('notePrompt');
                if(prompt) prompt.remove();
            }
        } else {
            const prompt = document.getElementById('notePrompt');
            if(prompt) prompt.remove();
        }
        
        // Actualizar barra de stamina
        const staminaFill = document.getElementById('ch2StaminaFill');
        const staminaBar = document.getElementById('ch2StaminaBar');
        if(staminaFill) {
            staminaFill.style.width = (this.stamina / this.maxStamina * 100) + '%';
            if(this.staminaExhausted) {
                staminaBar.style.borderColor = '#ff0000';
                staminaFill.style.background = 'linear-gradient(90deg,#ff0000,#ff8888)';
            } else if(this.stamina < 30) {
                staminaBar.style.borderColor = '#ffaa00';
                staminaFill.style.background = 'linear-gradient(90deg,#ffaa00,#ffdd88)';
            } else {
                staminaBar.style.borderColor = '#00ff00';
                staminaFill.style.background = 'linear-gradient(90deg,#00ff00,#88ff88)';
            }
        }
        

    }

    startEscapePhase() {
        this.phase = 'escaping';
        this.updateExperimentalHUD();
        this.showContextualMessage('contextual_escape');
        setTimeout(() => this.showContextualMessage('contextual_tunnel'), 3000);
        this.clearScene();
        this.createEscapeTunnel();
        camera.position.set(0, 1.6, -40);
        showMonologue('Un túnel... debo seguir la luz...');
        vibrateGamepad(300, 0.5, 0.5);
        
        // Mostrar overlay del casco si lo tiene
        if(this.hasHelmet) {
            this.createHelmetOverlay();
            setTimeout(() => showMonologue('Presiona F para activar la linterna del casco'), 2000);
        }
        
        const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1.0;
        
        // Asegurar que los audios sigan disponibles
        if(!this.runAudio || this.runAudio.error) {
            this.runAudio = new Audio('stuff/correr.mp3');
            this.runAudio.volume = 0.4 * vol;
            this.runAudio.loop = true;
        }
    }

    createEscapeTunnel() {
        // Luz ambiental para que Lambert funcione
        const ambient = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambient);
        
        // Materiales reutilizables con emissive para que se vean
        const floorMat1 = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x1a1a1a, emissiveIntensity: 0.3 });
        const floorMat2 = new THREE.MeshLambertMaterial({ color: 0x1a3a1a, emissive: 0x0a1a0a, emissiveIntensity: 0.3 });
        const floorMat3 = new THREE.MeshLambertMaterial({ color: 0x3a1a1a, emissive: 0x1a0a0a, emissiveIntensity: 0.3 });
        const floorMat4 = new THREE.MeshLambertMaterial({ color: 0x1a1a3a, emissive: 0x0a0a1a, emissiveIntensity: 0.3 });
        
        // Suelo con diferentes texturas por zonas
        const floorZones = [
            { start: 0, end: 400, mat: floorMat1 },
            { start: 400, end: 800, mat: floorMat2 },
            { start: 800, end: 1200, mat: floorMat3 },
            { start: 1200, end: 1500, mat: floorMat4 }
        ];
        
        floorZones.forEach(zone => {
            const length = zone.end - zone.start;
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(15, length, 1, 1),
                zone.mat
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.z = zone.start + length / 2;
            scene.add(floor);
        });

        // Paredes con variaciones y emissive
        const wallMat1 = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x1a1a1a, emissiveIntensity: 0.2 });
        const wallMat2 = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, emissive: 0x1a1a1a, emissiveIntensity: 0.2 });
        
        for(let i = 0; i < 4; i++) {
            const start = i * 375;
            const wall1 = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 5, 375),
                i % 2 === 0 ? wallMat1 : wallMat2
            );
            wall1.position.set(-7.5, 2.5, start + 187.5);
            scene.add(wall1);
            
            const wall2 = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 5, 375),
                i % 2 === 0 ? wallMat1 : wallMat2
            );
            wall2.position.set(7.5, 2.5, start + 187.5);
            scene.add(wall2);
        }
        
        // Tuberías y cables en paredes con variaciones y emissive
        const pipeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x1a1a1a, emissiveIntensity: 0.2 });
        const rustPipeMat = new THREE.MeshLambertMaterial({ color: 0x4a2a1a, emissive: 0x2a1a0a, emissiveIntensity: 0.2 });
        const pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 15, 6);
        for(let i = 0; i < 30; i++) {
            const z = i * 50;
            const mat = i % 3 === 0 ? rustPipeMat : pipeMat;
            const pipe = new THREE.Mesh(pipeGeo, mat);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, 3.5, z);
            scene.add(pipe);
            
            // Cables colgantes
            if(i % 5 === 0) {
                const cableGeo = new THREE.CylinderGeometry(0.05, 0.05, 2, 3);
                const cableMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a, emissiveIntensity: 0.2 });
                const cable = new THREE.Mesh(cableGeo, cableMat);
                cable.position.set((Math.random() - 0.5) * 10, 4, z);
                scene.add(cable);
            }
        }
        
        // Salas laterales cada 300m
        for(let i = 1; i <= 4; i++) {
            const z = i * 300;
            const side = i % 2 === 0 ? -7.5 : 7.5;
            
            const openingMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, emissive: 0x050505, emissiveIntensity: 0.2 });
            // Abertura en pared
            const opening = new THREE.Mesh(
                new THREE.BoxGeometry(3, 3, 0.5),
                openingMat
            );
            opening.position.set(side, 1.5, z);
            scene.add(opening);
            
            // Luz roja en abertura
            const roomLight = new THREE.PointLight(0xff0000, 0.5, 8);
            roomLight.position.set(side, 2, z);
            scene.add(roomLight);
        }

        // Zonas de luz con colores variados
        const lightPositions = [];
        for(let i = 0; i < 48; i++) {
            const z = -40 + (i * 31);
            const radius = 2.5 + Math.random() * 1;
            const x = (Math.random() - 0.5) * 4;
            let color = 0xffffaa;
            if(z > 400 && z < 800) color = 0xaaffaa;
            else if(z > 800 && z < 1200) color = 0xffaaaa;
            else if(z > 1200) color = 0xaaaaff;
            lightPositions.push({ z, radius, x, color });
        }

        lightPositions.forEach(data => {
            const lightCircle = new THREE.Mesh(
                new THREE.CircleGeometry(data.radius, 8),
                new THREE.MeshStandardMaterial({ color: data.color, transparent: true, opacity: 0.3, emissive: data.color, emissiveIntensity: 0.8 })
            );
            lightCircle.rotation.x = -Math.PI / 2;
            lightCircle.position.set(data.x, 0.01, data.z);
            scene.add(lightCircle);

            const light = new THREE.PointLight(data.color, 1.5, data.radius * 2.5);
            light.position.set(data.x, 2.5, data.z);
            scene.add(light);

            this.lightZones.push({ position: new THREE.Vector3(data.x, 0, data.z), radius: data.radius, visited: false });
        });
        
        // Luces parpadeantes con colores variados
        for(let i = 0; i < 25; i++) {
            const z = i * 60 + Math.random() * 20;
            let color = 0xff0000;
            if(z > 400 && z < 800) color = 0x00ff00;
            else if(z > 800 && z < 1200) color = 0xff00ff;
            else if(z > 1200) color = 0x0000ff;
            
            const light = new THREE.PointLight(color, 0, 8);
            light.position.set((Math.random() - 0.5) * 10, 3, z);
            scene.add(light);
            
            setInterval(() => {
                light.intensity = Math.random() > 0.7 ? 0.8 : 0;
            }, 300 + Math.random() * 500);
        }

        // Obstáculos variados con emissive
        const obstacleMat = new THREE.MeshLambertMaterial({ color: 0x2a0000, emissive: 0x1a0000, emissiveIntensity: 0.2 });
        const barrelMat = new THREE.MeshLambertMaterial({ color: 0x4a4a2a, emissive: 0x2a2a1a, emissiveIntensity: 0.2 });
        const boxGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const cylinderGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 6);
        const plateGeo = new THREE.BoxGeometry(1.5, 0.3, 1);
        for(let i = 0; i < 60; i++) {
            const z = Math.random() * 1470 - 40;
            const x = (Math.random() - 0.5) * 12;
            
            const type = Math.floor(Math.random() * 3);
            let obstacle;
            if(type === 0) {
                obstacle = new THREE.Mesh(boxGeo, obstacleMat);
            } else if(type === 1) {
                obstacle = new THREE.Mesh(cylinderGeo, barrelMat);
            } else {
                obstacle = new THREE.Mesh(plateGeo, obstacleMat);
            }
            obstacle.position.set(x, type === 2 ? 0.15 : 0.6, z);
            obstacle.rotation.y = Math.random() * Math.PI;
            scene.add(obstacle);
        }
        
        // Marcadores de distancia cada 500m
        for(let i = 1; i <= 3; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${i * 500}m`, 128, 80);
            const texture = new THREE.CanvasTexture(canvas);
            const sign = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 1),
                new THREE.MeshBasicMaterial({ map: texture, transparent: true })
            );
            sign.position.set(-7, 2, i * 500);
            sign.rotation.y = Math.PI / 2;
            scene.add(sign);
        }

        // Puerta de salida
        const exitDoor = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        exitDoor.position.set(0, 1.5, 1470);
        scene.add(exitDoor);

        const exitLight = new THREE.PointLight(0x00ff00, 3, 20);
        exitLight.position.set(0, 3, 1470);
        scene.add(exitLight);
        
        // Sonido ambiental de terror
        this.playTunnelAmbient();
    }
    
    playTunnelAmbient() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
    }

    updateEscapePhase(delta) {
        // Actualizar HUD experimental si tiene casco
        if(this.hasHelmet) {
            this.updateExperimentalHUD();
        } else {
            // Mostrar distancia en túnel (sin casco)
            const distanceEl = document.getElementById('distance');
            if(distanceEl) {
                distanceEl.textContent = `Distancia: ${Math.floor(camera.position.z)}m`;
            }
        }
        
        // Actualizar gamepad
        this.updateGamepad();
        
        // Actualizar isRunning ANTES de calcular movimiento
        this.isRunning = this.keys['shift'] && !this.staminaExhausted;
        
        // Movimiento en túnel
        this.velocity.x = 0;
        this.velocity.z = 0;

        let baseSpeed = 0.08;
        if(this.isRunning && this.stamina > 0 && !this.staminaExhausted) baseSpeed = 0.14;
        
        const isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1;
        
        if(this.keys['w'] || this.joystickY < -0.1) this.velocity.z -= baseSpeed;
        if(this.keys['s'] || this.joystickY > 0.1) this.velocity.z += baseSpeed;
        if(this.keys['a'] || this.joystickX < -0.1) this.velocity.x -= baseSpeed;
        if(this.keys['d'] || this.joystickX > 0.1) this.velocity.x += baseSpeed;

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

        // Límites del túnel (15m ancho, 1500m largo)
        camera.position.x = Math.max(-7, Math.min(7, camera.position.x));
        camera.position.z = Math.max(-50, Math.min(1480, camera.position.z));
        
        // Actualizar linterna del casco
        if(this.helmetFlashlightOn && this.helmetFlashlight) {
            this.helmetFlashlight.position.copy(camera.position);
            const targetPos = new THREE.Vector3();
            camera.getWorldDirection(targetPos);
            targetPos.multiplyScalar(5).add(camera.position);
            this.helmetFlashlight.target.position.copy(targetPos);
        }

        // Sistema de stamina en túnel
        if(this.isRunning && this.stamina > 0 && !this.staminaExhausted && isMoving) {
            this.stamina -= 0.3;
            if(this.stamina <= 0) {
                this.stamina = 0;
                this.staminaExhausted = true;
                this.isRunning = false;
                if(this.exhaustedAudio) {
                    this.exhaustedAudio.currentTime = 0;
                    this.exhaustedAudio.play().catch(() => {});
                }
                showMonologue('*Jadeo* No puedo más...');
            }
        } else if(this.stamina < this.maxStamina) {
            this.stamina += 0.15;
            if(this.stamina >= this.maxStamina) {
                this.stamina = this.maxStamina;
                this.staminaExhausted = false;
            }
        }
        
        // Audio de correr en túnel
        if(this.isRunning && isMoving && this.stamina > 0 && !this.staminaExhausted) {
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
        
        // Footsteps en túnel
        if(isMoving && !this.isRunning) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                this.playFootstep();
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
        }
        
        // Actualizar barra de stamina
        const staminaFill = document.getElementById('ch2StaminaFill');
        const staminaBar = document.getElementById('ch2StaminaBar');
        if(staminaFill) {
            staminaFill.style.width = (this.stamina / this.maxStamina * 100) + '%';
            if(this.staminaExhausted) {
                staminaBar.style.borderColor = '#ff0000';
                staminaFill.style.background = 'linear-gradient(90deg,#ff0000,#ff8888)';
            } else if(this.stamina < 30) {
                staminaBar.style.borderColor = '#ffaa00';
                staminaFill.style.background = 'linear-gradient(90deg,#ffaa00,#ffdd88)';
            } else {
                staminaBar.style.borderColor = '#00ff00';
                staminaFill.style.background = 'linear-gradient(90deg,#00ff00,#88ff88)';
            }
        }

        const playerPos = new THREE.Vector3(camera.position.x, 0, camera.position.z);
        let inLight = false;

        // Verificar si está en zona de luz
        for(let zone of this.lightZones) {
            const dx = playerPos.x - zone.position.x;
            const dz = playerPos.z - zone.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if(dist < zone.radius) {
                inLight = true;
                // Guardar checkpoint si es la primera vez en esta luz
                if(!zone.visited) {
                    zone.visited = true;
                    this.lastCheckpoint = { x: zone.position.x, y: 1.6, z: zone.position.z };
                    showMonologue('💾 Checkpoint guardado');
                    this.saveProgress();
                }
                break;
            }
        }

        // Sistema de oscuridad
        if(!inLight) {
            this.timeInDarkness += delta * 1000;
            
            // Viñeta de advertencia
            const vignetteEl = document.getElementById('vignette');
            if(vignetteEl) {
                const intensity = Math.min(this.timeInDarkness / this.maxDarknessTime, 1);
                vignetteEl.style.opacity = intensity * 0.9;
                vignetteEl.style.background = 'radial-gradient(circle, transparent 30%, rgba(0,0,0,' + intensity + ') 100%)';
            }

            // Spawn IA666
            if(this.timeInDarkness >= this.maxDarknessTime && !this.ia666Spawned) {
                this.spawnIA666();
            }
        } else {
            this.timeInDarkness = Math.max(0, this.timeInDarkness - delta * 2000);
            
            const vignetteEl = document.getElementById('vignette');
            if(vignetteEl) vignetteEl.style.opacity = '0';

            // IA666 desaparece en la luz
            if(this.ia666) {
                this.despawnIA666();
            }
        }

        // Actualizar IA666
        if(this.ia666) {
            this.updateIA666(delta);
        }

        // Verificar si llegó a la sala de rivalidad
        if(camera.position.z >= 1465) {
            this.enterRivalryRoom();
        }
    }

    spawnIA666() {
        this.ia666Spawned = true;
        this.showContextualMessage('contextual_ia666');
        const group = new THREE.Group();
        
        // Cuerpo robótico
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.6, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x4a0000 })
        );
        group.add(body);

        // Cabeza
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x6a0000 })
        );
        head.position.y = 1.05;
        group.add(head);

        // Ojos rojos
        const eye1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        eye1.position.set(-0.15, 1.05, 0.26);
        group.add(eye1);

        const eye2 = eye1.clone();
        eye2.position.set(0.15, 1.05, 0.26);
        group.add(eye2);

        // Luz roja
        const redLight = new THREE.PointLight(0xff0000, 2, 10);
        redLight.position.y = 1.05;
        group.add(redLight);

        // Spawn detrás del jugador
        group.position.set(0, 0, camera.position.z - 15);
        scene.add(group);
        this.ia666 = group;

        showMonologue('¡IA666 TE DETECTÓ!');
        vibrateGamepad(500, 1.0, 1.0);
        this.playIA666Sound();
    }

    updateIA666(delta) {
        if(!this.ia666) return;

        // Perseguir al jugador (más rápido)
        const dir = new THREE.Vector3(
            camera.position.x - this.ia666.position.x,
            0,
            camera.position.z - this.ia666.position.z
        ).normalize();

        this.ia666.position.add(dir.multiplyScalar(0.12));
        this.ia666.position.y = Math.sin(Date.now() * 0.01) * 0.1;

        // Si alcanza al jugador
        const dx = camera.position.x - this.ia666.position.x;
        const dz = camera.position.z - this.ia666.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if(dist < 1.5) {
            this.killPlayerIA666();
        }
    }

    despawnIA666() {
        if(!this.ia666) return;
        
        const wasSpawned = this.ia666Spawned;
        
        // Fade out
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.1;
            if(this.ia666) {
                this.ia666.children.forEach(child => {
                    if(child.material) {
                        child.material.opacity = opacity;
                        child.material.transparent = true;
                    }
                });
            }
            if(opacity <= 0) {
                clearInterval(fadeInterval);
                if(this.ia666) {
                    scene.remove(this.ia666);
                    this.ia666 = null;
                }
            }
        }, 50);
        
        if(wasSpawned && !this.ia666DespawnMessageShown) {
            this.ia666DespawnMessageShown = true;
            showMonologue('Huyó de la luz...');
            setTimeout(() => this.ia666DespawnMessageShown = false, 3000);
        }
    }

    killPlayerIA666() {
        showMonologue('¡IA666 TE ATRAPÓ!');
        vibrateGamepad(1000, 1.0, 1.0);

        // Efecto de glitch intenso
        const glitchOverlay = document.createElement('div');
        glitchOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.8);z-index:500;opacity:0;transition:opacity 0.3s;mix-blend-mode:screen;';
        document.body.appendChild(glitchOverlay);
        
        let glitchTime = 0;
        const glitchInterval = setInterval(() => {
            glitchOverlay.style.opacity = Math.random();
            glitchOverlay.style.background = `rgba(${Math.random() * 255}, 0, 0, 0.8)`;
            camera.position.x += (Math.random() - 0.5) * 0.2;
            camera.position.y += (Math.random() - 0.5) * 0.2;
            glitchTime += 100;
            if(glitchTime > 1000) clearInterval(glitchInterval);
        }, 100);
        
        setTimeout(() => glitchOverlay.style.opacity = '1', 50);

        setTimeout(() => {
            glitchOverlay.style.background = 'rgba(0,0,0,1)';
            glitchOverlay.style.mixBlendMode = 'normal';
            setTimeout(() => {
                camera.position.set(this.lastCheckpoint.x, this.lastCheckpoint.y, this.lastCheckpoint.z);
                if(this.ia666) {
                    scene.remove(this.ia666);
                    this.ia666 = null;
                    this.ia666Spawned = false;
                }
                this.timeInDarkness = 0;
                glitchOverlay.style.opacity = '0';
                setTimeout(() => glitchOverlay.remove(), 1000);
                showMonologue('Desperté en el último checkpoint...');
            }, 2000);
        }, 1500);
    }

    playIA666Sound() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 1);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }

    enterRivalryRoom() {
        this.phase = 'rivalry';
        this.updateExperimentalHUD();
        this.lightZones = [];
        this.ia666 = null;
        this.ia666Spawned = false;
        this.timeInDarkness = 0;
        this.clearScene();
        
        // Sala 30x30m más grande
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        
        // Patrón de cuadrícula en el suelo
        for(let i = -15; i <= 15; i += 3) {
            for(let j = -15; j <= 15; j += 3) {
                const tile = new THREE.Mesh(
                    new THREE.PlaneGeometry(2.8, 2.8),
                    new THREE.MeshBasicMaterial({ color: i % 6 === 0 || j % 6 === 0 ? 0x3a3a3a : 0x2a2a2a })
                );
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(i, 0.01, j);
                scene.add(tile);
            }
        }
        
        // Paredes con detalles tecnológicos
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.3), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.3), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.3, 8, 30), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.3, 8, 30), wallMat)
        ];
        walls[0].position.set(0, 4, -15);
        walls[1].position.set(0, 4, 15);
        walls[2].position.set(-15, 4, 0);
        walls[3].position.set(15, 4, 0);
        walls.forEach(w => scene.add(w));
        
        // Paneles tecnológicos en paredes
        for(let i = 0; i < 12; i++) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
            );
            const angle = (i / 12) * Math.PI * 2;
            const radius = 14.5;
            panel.position.set(Math.sin(angle) * radius, 2 + Math.random(), Math.cos(angle) * radius);
            panel.rotation.y = -angle;
            scene.add(panel);
        }
        
        // Hojas en paredes (16 hojas mejor distribuidas)
        const papers = [
            { pos: [-14.8, 2, -8], text: 'IA777: Creada para proteger. IA666: Creada para destruir.', title: 'Origen' },
            { pos: [-14.8, 2, -4], text: 'IA777 intentó detener a IA666. Fallamos. Ahora son enemigas eternas.', title: 'El Conflicto' },
            { pos: [-14.8, 2, 0], text: 'IA666 corrompió el sistema. IA777 juró venganza.', title: 'La Traición' },
            { pos: [-14.8, 2, 4], text: 'El Proyecto 666 fue un error. Creamos un monstruo.', title: 'El Error' },
            { pos: [-14.8, 2, 8], text: 'IA666 tiene un hermano... IA665. Más peligroso.', title: 'El Hermano' },
            { pos: [14.8, 2, -8], text: 'Ambas son IA. Ambas son peligrosas. Pero solo una puede ganar.', title: 'La Guerra' },
            { pos: [14.8, 2, -4], text: 'IA777 busca redención. IA666 busca caos absoluto.', title: 'Sus Metas' },
            { pos: [14.8, 2, 0], text: 'IA666 escapó del laboratorio. IA777 la persigue.', title: 'La Persecución' },
            { pos: [14.8, 2, 4], text: 'Si se encuentran... el mundo arderá.', title: 'Advertencia Final' },
            { pos: [14.8, 2, 8], text: 'La batalla final se acerca. Nadie está preparado.', title: 'El Fin' },
            { pos: [-8, 2, -14.8], text: 'Los survivors son peones en su juego. Nosotros solo observamos.', title: 'Los Observadores' },
            { pos: [-4, 2, -14.8], text: 'La Entidad disfruta su rivalidad. Es entretenimiento eterno.', title: 'La Entidad' },
            { pos: [0, 2, -14.8], text: 'Ambas IAs fueron selladas aquí. Pero los sellos se debilitan.', title: 'El Sello' },
            { pos: [4, 2, -14.8], text: 'Si escapan juntas... nadie podrá detenerlas.', title: 'Advertencia' },
            { pos: [8, 2, -14.8], text: 'IA777 vs IA666. La rivalidad que destruirá todo.', title: 'Rivalidad Eterna' },
            { pos: [0, 2, 14.8], text: 'Más allá de esta puerta... el castillo espera.', title: 'El Siguiente Paso' }
        ];
        
        papers.forEach(data => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffcc';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(data.title, 128, 40);
            ctx.font = '14px Arial';
            const words = data.text.split(' ');
            let line = '';
            let y = 80;
            words.forEach(word => {
                const testLine = line + word + ' ';
                if(ctx.measureText(testLine).width > 220) {
                    ctx.fillText(line, 128, y);
                    line = word + ' ';
                    y += 20;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, 128, y);
            
            const texture = new THREE.CanvasTexture(canvas);
            const paper = new THREE.Mesh(
                new THREE.PlaneGeometry(0.8, 0.8),
                new THREE.MeshBasicMaterial({ map: texture })
            );
            paper.position.set(data.pos[0], data.pos[1], data.pos[2]);
            if(Math.abs(data.pos[0]) > 9) {
                paper.rotation.y = data.pos[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
            } else {
                paper.rotation.y = data.pos[2] < 0 ? 0 : Math.PI;
            }
            scene.add(paper);
        });
        
        // Iluminación dramática mejorada
        const centerLight = new THREE.PointLight(0x808080, 2, 25);
        centerLight.position.set(0, 6, 0);
        scene.add(centerLight);
        
        // Luces de esquina con colores
        const cornerLights = [
            new THREE.PointLight(0x00ffff, 1.2, 15),
            new THREE.PointLight(0xff0000, 1.2, 15),
            new THREE.PointLight(0x00ffff, 1.2, 15),
            new THREE.PointLight(0xff0000, 1.2, 15)
        ];
        cornerLights[0].position.set(-10, 5, -10);
        cornerLights[1].position.set(10, 5, -10);
        cornerLights[2].position.set(-10, 5, 10);
        cornerLights[3].position.set(10, 5, 10);
        cornerLights.forEach(l => scene.add(l));
        
        // Luces parpadeantes en paredes
        for(let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const light = new THREE.PointLight(i % 2 === 0 ? 0x00ffff : 0xff0000, 0, 8);
            light.position.set(Math.sin(angle) * 12, 3, Math.cos(angle) * 12);
            scene.add(light);
            setInterval(() => {
                light.intensity = Math.random() > 0.5 ? 1.5 : 0.3;
            }, 300 + i * 100);
        }
        
        // Plataforma central elevada
        const platform = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 6, 0.5, 16),
            new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
        );
        platform.position.set(0, 0.25, 0);
        scene.add(platform);
        
        // Anillo de energía alrededor
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(5.5, 0.1, 8, 32),
            new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.5;
        scene.add(ring);
        
        // Pilares alrededor de la plataforma
        for(let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.4, 4, 8),
                new THREE.MeshBasicMaterial({ color: 0x3a3a3a })
            );
            pillar.position.set(Math.sin(angle) * 7, 2, Math.cos(angle) * 7);
            scene.add(pillar);
            
            const pillarLight = new THREE.PointLight(i % 2 === 0 ? 0x00ffff : 0xff0000, 0.8, 5);
            pillarLight.position.set(Math.sin(angle) * 7, 4, Math.cos(angle) * 7);
            scene.add(pillarLight);
        }
        
        // Estanterías en esquinas
        const shelfMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), shelfMat);
        shelf1.position.set(-8, 1.25, -8);
        shelf1.rotation.y = Math.PI / 4;
        scene.add(shelf1);
        
        const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), shelfMat);
        shelf2.position.set(8, 1.25, -8);
        shelf2.rotation.y = -Math.PI / 4;
        scene.add(shelf2);
        
        // Cajas en estanterías
        const boxMat = new THREE.MeshBasicMaterial({ color: 0x5a5a5a });
        for(let i = 0; i < 4; i++) {
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), boxMat);
            box.position.set(-8 + i * 0.6, 1.8, -8);
            scene.add(box);
        }
        
        // Mesas laterales
        const sideTable1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.5), shelfMat);
        sideTable1.position.set(-7, 0.8, 5);
        scene.add(sideTable1);
        
        const sideTable2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.5), shelfMat);
        sideTable2.position.set(7, 0.8, 5);
        scene.add(sideTable2);
        
        // Hologramas de IA777 y IA666 más grandes
        const holo777 = new THREE.PointLight(0x00ffff, 4, 10);
        holo777.position.set(-5, 3, 0);
        scene.add(holo777);
        
        const holo666 = new THREE.PointLight(0xff0000, 4, 10);
        holo666.position.set(5, 3, 0);
        scene.add(holo666);
        
        // Cilindros para hologramas más grandes
        const holoCyl1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4 })
        );
        holoCyl1.position.set(-5, 0.65, 0);
        scene.add(holoCyl1);
        
        const holoCyl2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4 })
        );
        holoCyl2.position.set(5, 0.65, 0);
        scene.add(holoCyl2);
        
        // Rayos de energía entre hologramas
        const beamGeometry = new THREE.BufferGeometry();
        const beamVertices = new Float32Array([-5, 2, 0, 5, 2, 0]);
        beamGeometry.setAttribute('position', new THREE.BufferAttribute(beamVertices, 3));
        const beam = new THREE.Line(
            beamGeometry,
            new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 })
        );
        scene.add(beam);
        
        // Animación de rayo parpadeante
        setInterval(() => {
            beam.material.opacity = Math.random() > 0.5 ? 1 : 0.3;
            beam.material.transparent = true;
        }, 200);
        
        // Puerta de salida épica
        const exitDoor = new THREE.Mesh(
            new THREE.BoxGeometry(4, 5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
        );
        exitDoor.position.set(0, 2.5, 14.8);
        scene.add(exitDoor);
        
        const exitLight = new THREE.PointLight(0xffffff, 3, 15);
        exitLight.position.set(0, 4, 14.5);
        scene.add(exitLight);
        
        // Marco de puerta brillante
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 5.5, 0.2),
            new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.7 })
        );
        doorFrame.position.set(0, 2.5, 14.7);
        scene.add(doorFrame);
        
        camera.position.set(0, 1.6, -12);
        camera.lookAt(0, 1.6, 0);
        showMonologue('Una sala... hojas en las paredes...');
        
        setTimeout(() => {
            showMonologue('IA777 vs IA666... La rivalidad eterna.');
            setTimeout(() => {
                showMonologue('Dos hologramas... enfrentados...');
                setTimeout(() => {
                    showMonologue('La energía entre ellos es... intensa.');
                    setTimeout(() => this.enterWhiteRoom(), 5000);
                }, 3000);
            }, 3000);
        }, 3000);
    }

    enterWhiteRoom() {
        this.phase = 'whiteroom';
        this.updateExperimentalHUD();
        this.showContextualMessage('contextual_whiteroom');
        this.flashlightBroken = false;
        this.clearScene();
        
        const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1.0;
        
        // Asegurar que los audios sigan disponibles
        if(!this.runAudio || this.runAudio.error) {
            this.runAudio = new Audio('stuff/correr.mp3');
            this.runAudio.volume = 0.4 * vol;
            this.runAudio.loop = true;
        }
        
        this.lastCheckpoint = { x: 0, y: 1.6, z: -18 };
        this.saveProgress();
        showMonologue('Todo brilla... la linterna funciona aquí.');
        
        // Audio de sala blanca
        if(!this.whiteRoomAudio) {
            this.whiteRoomAudio = new Audio('stuff/whiteroomchapter2.mp3');
            this.whiteRoomAudio.volume = 0.5 * vol;
            this.whiteRoomAudio.loop = true;
        }
        this.whiteRoomAudio.play().catch(() => {});
        
        // Sala completamente blanca 40x40m
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(40, 40),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        
        // Paredes blancas
        const wallMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(40, 10, 0.1), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(40, 10, 0.1), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.1, 10, 40), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.1, 10, 40), wallMat)
        ];
        walls[0].position.set(0, 5, -20);
        walls[1].position.set(0, 5, 20);
        walls[2].position.set(-20, 5, 0);
        walls[3].position.set(20, 5, 0);
        walls.forEach(w => scene.add(w));
        
        // Techo blanco
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(40, 40),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 10;
        scene.add(ceiling);
        
        // Luz ambiental intensa (sala blanca)
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambient);
        
        setTimeout(() => {
            showMonologue('Todo brilla... no necesito la linterna aquí.');
        }, 2000);
        
        // Puerta de salida al final
        const exitDoor = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 0.2),
            new THREE.MeshBasicMaterial({ color: 0xcccccc })
        );
        exitDoor.position.set(0, 2, 19.8);
        scene.add(exitDoor);
        
        camera.position.set(0, 1.6, -18);
        camera.lookAt(0, 1.6, 0);
        
        showMonologue('Todo es... blanco...');
        setTimeout(() => showMonologue('Tan vacío... tan silencioso...'), 3000);
    }
    
    updateWhiteRoom(delta) {
        // Actualizar gamepad
        this.updateGamepad();
        
        // Movimiento LENTO
        this.velocity.x = 0;
        this.velocity.z = 0;

        const slowSpeed = 0.04; // Mitad de velocidad normal
        
        const isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1;
        
        if(this.keys['w'] || this.joystickY < -0.1) this.velocity.z -= slowSpeed;
        if(this.keys['s'] || this.joystickY > 0.1) this.velocity.z += slowSpeed;
        if(this.keys['a'] || this.joystickX < -0.1) this.velocity.x -= slowSpeed;
        if(this.keys['d'] || this.joystickX > 0.1) this.velocity.x += slowSpeed;

        camera.rotation.order = 'YXZ';
        camera.rotation.y = this.mouseX;
        camera.rotation.x = this.mouseY;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        camera.position.addScaledVector(direction, -this.velocity.z);
        camera.position.addScaledVector(right, -this.velocity.x);

        camera.position.x = Math.max(-19, Math.min(19, camera.position.x));
        camera.position.z = Math.max(-19, Math.min(19, camera.position.z));
        
        // Footsteps en sala blanca (sin correr)
        if(isMoving) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                this.playFootstep();
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
        }
        
        // Frases en posiciones específicas
        const phrases = [
            { z: -15, text: 'Voz desconocida: "Bienvenido al vacío..."', triggered: false },
            { z: -10, text: 'Voz: "Aquí no hay escape..."', triggered: false },
            { z: -5, text: 'Voz: "Solo existe la nada..."', triggered: false },
            { z: 0, text: 'Voz: "Y tú... eres parte de ella..."', triggered: false },
            { z: 5, text: 'Voz: "Pero hay algo más allá..."', triggered: false },
            { z: 10, text: 'Voz: "Un castillo... antiguo..."', triggered: false },
            { z: 15, text: 'Voz: "Ahí encontrarás respuestas..."', triggered: false },
            { z: 18, text: 'Voz: "O más preguntas..."', triggered: false }
        ];
        
        if(!this.whiteRoomPhrases) this.whiteRoomPhrases = phrases;
        
        for(let phrase of this.whiteRoomPhrases) {
            if(!phrase.triggered && camera.position.z >= phrase.z) {
                phrase.triggered = true;
                showMonologue(phrase.text);
                this.playWhisper();
            }
        }
        
        // Llegar a la puerta
        if(camera.position.z >= 18) {
            this.enterCourtyard();
        }
    }

    enterCourtyard() {
        this.phase = 'courtyard';
        this.updateExperimentalHUD();
        this.showContextualMessage('contextual_whiteroom_recovery');
        setTimeout(() => this.showContextualMessage('contextual_courtyard'), 4000);
        this.notes = [];
        this.rainParticles = [];
        this.clearScene();
        
        const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1.0;
        
        // Asegurar que los audios sigan disponibles
        if(!this.runAudio || this.runAudio.error) {
            this.runAudio = new Audio('stuff/correr.mp3');
            this.runAudio.volume = 0.4 * vol;
            this.runAudio.loop = true;
        }
        if(this.footstepPool.length === 0) {
            for(let i = 0; i < 3; i++) {
                const audio = new Audio('stuff/stepsound.mp3');
                audio.volume = 0.25 * vol;
                this.footstepPool.push(audio);
            }
        }
        
        this.lastCheckpoint = { x: 0, y: 1.6, z: 5 };
        this.saveProgress();
        
        // PATIO LARGO 30x500m con pasto oscuro y lodoso
        const grassFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 500),
            new THREE.MeshBasicMaterial({ color: 0x1a3010 })
        );
        grassFloor.rotation.x = -Math.PI / 2;
        grassFloor.position.z = 250;
        scene.add(grassFloor);
        
        // Muros de piedra altos a los lados (8m altura)
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 500), wallMat);
        wallLeft.position.set(-15, 4, 250);
        scene.add(wallLeft);
        
        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 500), wallMat);
        wallRight.position.set(15, 4, 250);
        scene.add(wallRight);
        
        // Árboles muertos y vegetación oscura (80 árboles)
        const treeMat = new THREE.MeshBasicMaterial({ color: 0x2a1a0a });
        const leavesMat = new THREE.MeshBasicMaterial({ color: 0x0a2a0a });
        for(let i = 0; i < 80; i++) {
            const side = Math.random() > 0.5 ? -12 : 12;
            const z = i * 6.2 + Math.random() * 3;
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 3, 4),
                treeMat
            );
            trunk.position.set(side + (Math.random() - 0.5) * 2, 1.5, z);
            trunk.rotation.z = (Math.random() - 0.5) * 0.3;
            scene.add(trunk);
            
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 4, 4),
                leavesMat
            );
            leaves.position.set(side + (Math.random() - 0.5) * 2, 3.5, z);
            scene.add(leaves);
        }
        
        // Lápidas y estatuas con iconos (20 susurros)
        const characterIcons = [
            { path: '../assets/icons/GisselInactiveIcon.png', pos: [-10, 1.5, 25], whisper: 'Gissel: "La lluvia... nunca para..."' },
            { path: '../assets/icons/IA777NormalIcon.png', pos: [10, 1.5, 50], whisper: 'iA777: "Peligro... detectado..."' },
            { path: '../assets/icons/LunaNormalIcon.png', pos: [-10, 1.5, 75], whisper: 'Luna: "El castillo... te espera..."' },
            { path: '../assets/icons/AngelNormalIcon.png', pos: [10, 1.5, 100], whisper: 'Angel: "Reza por tu alma..."' },
            { path: '../assets/icons/IrisNormalIcon.png', pos: [-10, 1.5, 125], whisper: 'Iris: "Siento... oscuridad..."' },
            { path: '../assets/icons/MollyNormalIcon.png', pos: [10, 1.5, 150], whisper: 'Molly: "No mires atrás..."' },
            { path: '../assets/icons/GisselInactiveIcon.png', pos: [-10, 1.5, 175], whisper: 'Gissel: "Corre... CORRE!"' },
            { path: '../assets/icons/IA777NormalIcon.png', pos: [10, 1.5, 200], whisper: 'iA777: "IA666... cerca..."' },
            { path: '../assets/icons/LunaNormalIcon.png', pos: [-10, 1.5, 225], whisper: 'Luna: "La tormenta empeora..."' },
            { path: '../assets/icons/AngelNormalIcon.png', pos: [10, 1.5, 250], whisper: 'Angel: "Dios te proteja..."' },
            { path: '../assets/icons/IrisNormalIcon.png', pos: [-10, 1.5, 275], whisper: 'Iris: "Algo te observa..."' },
            { path: '../assets/icons/MollyNormalIcon.png', pos: [10, 1.5, 300], whisper: 'Molly: "Ya casi llegas..."' },
            { path: '../assets/icons/GisselInactiveIcon.png', pos: [-10, 1.5, 325], whisper: 'Gissel: "El castillo... maldito..."' },
            { path: '../assets/icons/IA777NormalIcon.png', pos: [10, 1.5, 350], whisper: 'iA777: "Alerta máxima..."' },
            { path: '../assets/icons/LunaNormalIcon.png', pos: [-10, 1.5, 375], whisper: 'Luna: "No entres... huye..."' },
            { path: '../assets/icons/AngelNormalIcon.png', pos: [10, 1.5, 400], whisper: 'Angel: "Perdona nuestros pecados..."' },
            { path: '../assets/icons/IrisNormalIcon.png', pos: [-10, 1.5, 425], whisper: 'Iris: "Puedo ver... tu miedo..."' },
            { path: '../assets/icons/MollyNormalIcon.png', pos: [10, 1.5, 450], whisper: 'Molly: "El final está cerca..."' },
            { path: '../assets/icons/LunaNormalIcon.png', pos: [-10, 1.5, 475], whisper: 'Luna: "Última advertencia..."' },
            { path: '../assets/icons/GisselInactiveIcon.png', pos: [0, 1.5, 490], whisper: 'Gissel: "...adiós..."' }
        ];
        
        characterIcons.forEach(data => {
            const loader = new THREE.TextureLoader();
            loader.load(data.path, (texture) => {
                const material = new THREE.MeshBasicMaterial({ 
                    map: texture,
                    transparent: true,
                    opacity: 0.7
                });
                
                const plane = new THREE.Mesh(
                    new THREE.PlaneGeometry(1, 1),
                    material
                );
                plane.position.set(data.pos[0], data.pos[1], data.pos[2]);
                plane.rotation.y = data.pos[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
                plane.userData = { whisper: data.whisper, triggered: false };
                scene.add(plane);
                this.notes.push(plane);
                
                // Luz sobre icono
                const light = new THREE.PointLight(0xffd700, 0.5, 3);
                light.position.set(data.pos[0], data.pos[1] + 0.5, data.pos[2]);
                scene.add(light);
            });
        });
        
        // Lluvia INTENSA (400 partículas)
        this.rainParticles = [];
        for(let i = 0; i < 400; i++) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([0, 0, 0, 0, -0.3, 0]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const material = new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
            const rain = new THREE.Line(geometry, material);
            
            rain.position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 15 + 5,
                Math.random() * 500
            );
            
            rain.userData.velocity = Math.random() * 0.5 + 0.4;
            scene.add(rain);
            this.rainParticles.push(rain);
        }
        
        // CASTILLO ÉPICO al final (30m ancho, 15m alto)
        const castleWall = new THREE.Mesh(
            new THREE.BoxGeometry(30, 15, 2),
            new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
        );
        castleWall.position.set(0, 7.5, 498);
        scene.add(castleWall);
        
        // Torres del castillo (4 torres grandes)
        for(let x of [-12, -4, 4, 12]) {
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2.5, 18, 8),
                new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
            );
            tower.position.set(x, 9, 498);
            scene.add(tower);
            
            const towerTop = new THREE.Mesh(
                new THREE.ConeGeometry(3, 4, 8),
                new THREE.MeshBasicMaterial({ color: 0x8b0000 })
            );
            towerTop.position.set(x, 20, 498);
            scene.add(towerTop);
            
            // Ventanas rojas en torres
            for(let y of [5, 10, 15]) {
                const window = new THREE.PointLight(0xff0000, 1, 8);
                window.position.set(x, y, 497);
                scene.add(window);
            }
        }
        
        // Puerta del castillo GRANDE
        const castleDoor = new THREE.Mesh(
            new THREE.BoxGeometry(6, 8, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x1a0a0a })
        );
        castleDoor.position.set(0, 4, 496);
        scene.add(castleDoor);
        
        // Marco dorado de puerta
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(7, 9, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xffd700 })
        );
        doorFrame.position.set(0, 4.5, 495.5);
        scene.add(doorFrame);
        
        // Luces dramáticas del castillo
        const castleLight = new THREE.PointLight(0xffd700, 5, 40);
        castleLight.position.set(0, 10, 495);
        scene.add(castleLight);
        
        // Relámpagos simulados
        const lightning = new THREE.PointLight(0xaaaaff, 0, 100);
        lightning.position.set(0, 20, 250);
        scene.add(lightning);
        setInterval(() => {
            if(Math.random() > 0.95) {
                lightning.intensity = 8;
                setTimeout(() => lightning.intensity = 0, 100);
            }
        }, 500);
        
        // Niebla y ambiente oscuro
        const ambient = new THREE.AmbientLight(0x202020, 0.3);
        scene.add(ambient);
        
        // Luces tenues cada 50m
        for(let i = 0; i < 10; i++) {
            const light = new THREE.PointLight(0x404040, 0.5, 15);
            light.position.set((Math.random() - 0.5) * 20, 3, i * 50 + 25);
            scene.add(light);
        }
        
        // Sonido de lluvia ambiental
        this.playRainAmbient();
        
        camera.position.set(0, 1.6, 5);
        camera.lookAt(0, 1.6, 10);
        showMonologue('Un patio... lluvia intensa...');
        
        setTimeout(() => {
            showMonologue('La tormenta... no para...');
            setTimeout(() => {
                showMonologue('Al final... un castillo oscuro...');
            }, 3000);
        }, 3000);
    }
    
    updateCourtyard(delta) {
        // Actualizar gamepad
        this.updateGamepad();
        
        // Actualizar isRunning ANTES de calcular movimiento
        this.isRunning = this.keys['shift'] && !this.staminaExhausted;
        
        // Movimiento
        this.velocity.x = 0;
        this.velocity.z = 0;

        let baseSpeed = 0.08;
        if(this.isRunning && this.stamina > 0 && !this.staminaExhausted) baseSpeed = 0.14;
        
        const isMoving = this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'] || Math.abs(this.joystickX) > 0.1 || Math.abs(this.joystickY) > 0.1;
        
        if(this.keys['w'] || this.joystickY < -0.1) this.velocity.z -= baseSpeed;
        if(this.keys['s'] || this.joystickY > 0.1) this.velocity.z += baseSpeed;
        if(this.keys['a'] || this.joystickX < -0.1) this.velocity.x -= baseSpeed;
        if(this.keys['d'] || this.joystickX > 0.1) this.velocity.x += baseSpeed;

        camera.rotation.order = 'YXZ';
        camera.rotation.y = this.mouseX;
        camera.rotation.x = this.mouseY;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        camera.position.addScaledVector(direction, -this.velocity.z);
        camera.position.addScaledVector(right, -this.velocity.x);

        // Límites del patio (30x500m)
        camera.position.x = Math.max(-14, Math.min(14, camera.position.x));
        camera.position.z = Math.max(5, Math.min(493, camera.position.z));
        
        // Sistema de stamina en pasillo
        if(this.isRunning && this.stamina > 0 && !this.staminaExhausted && isMoving) {
            this.stamina -= 0.5;
            if(this.stamina <= 0) {
                this.stamina = 0;
                this.staminaExhausted = true;
                this.isRunning = false;
                if(this.exhaustedAudio) {
                    this.exhaustedAudio.currentTime = 0;
                    this.exhaustedAudio.play().catch(() => {});
                }
                showMonologue('*Jadeo* No puedo más...');
            }
        } else if(this.stamina < this.maxStamina) {
            this.stamina += 0.2;
            if(this.stamina >= this.maxStamina) {
                this.stamina = this.maxStamina;
                this.staminaExhausted = false;
            }
        }
        
        // Audio de correr en patio (pasto)
        if(this.isRunning && isMoving && this.stamina > 0 && !this.staminaExhausted) {
            if(!this.runAudioPlaying && this.grassRunAudio) {
                this.runAudioPlaying = true;
                this.grassRunAudio.play().catch(() => {});
            }
        } else {
            if(this.runAudioPlaying && this.grassRunAudio) {
                this.runAudioPlaying = false;
                this.grassRunAudio.pause();
                this.grassRunAudio.currentTime = 0;
            }
        }
        
        // Footsteps en patio (pasto)
        if(isMoving && !this.isRunning) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                if(this.grassWalkAudio) {
                    this.grassWalkAudio.currentTime = 0;
                    this.grassWalkAudio.play().catch(() => {});
                }
                this.footstepTimer = 0;
            }
        } else {
            this.footstepTimer = 0;
        }
        
        // Actualizar barra de stamina
        const staminaFill = document.getElementById('ch2StaminaFill');
        const staminaBar = document.getElementById('ch2StaminaBar');
        if(staminaFill) {
            staminaFill.style.width = (this.stamina / this.maxStamina * 100) + '%';
            if(this.staminaExhausted) {
                staminaBar.style.borderColor = '#ff0000';
                staminaFill.style.background = 'linear-gradient(90deg,#ff0000,#ff8888)';
            } else if(this.stamina < 30) {
                staminaBar.style.borderColor = '#ffaa00';
                staminaFill.style.background = 'linear-gradient(90deg,#ffaa00,#ffdd88)';
            } else {
                staminaBar.style.borderColor = '#00ff00';
                staminaFill.style.background = 'linear-gradient(90deg,#00ff00,#88ff88)';
            }
        }
        
        // Actualizar lluvia
        if(this.rainParticles) {
            for(let rain of this.rainParticles) {
                rain.position.y -= rain.userData.velocity;
                if(rain.position.y < 0) {
                    rain.position.y = Math.random() * 10 + 5;
                }
            }
        }
        
        // Verificar susurros de iconos
        const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        for(let note of this.notes) {
            if(note.userData.whisper && !note.userData.triggered) {
                const dist = playerPos.distanceTo(note.position);
                if(dist < 3) {
                    note.userData.triggered = true;
                    showMonologue(note.userData.whisper);
                    this.playWhisper();
                }
            }
        }
        
        // Actualizar objetos flotantes
        if(this.floatingObjects && this.floatingObjects.length > 0) {
            const time = Date.now() * 0.001;
            for(let obj of this.floatingObjects) {
                if(obj.type === 'ring') {
                    obj.mesh.rotation.z += obj.speed * 60 * delta;
                } else if(obj.type === 'float') {
                    obj.mesh.position.y = obj.baseY + Math.sin(time * obj.speed * 1000) * 0.15;
                } else if(obj.type === 'swing') {
                    obj.mesh.rotation.z = Math.sin(time * obj.speed * 1000 + obj.offset) * 0.1;
                } else if(obj.type === 'vibrate') {
                    obj.mesh.position.y = obj.baseY + Math.sin(time * obj.speed * 1000) * 0.02;
                    obj.mesh.rotation.y = Math.sin(time * obj.speed * 500) * 0.05;
                }
            }
        }
        
        // Verificar si llegó al castillo
        if(camera.position.z >= 490) {
            this.finishChapter();
        }
    }

    finishChapter() {
        this.phase = 'finished';
        
        // Guardar que se completó el Capítulo 2
        localStorage.setItem('chapter2Completed', 'true');
        
        // Fade a blanco
        const whiteOverlay = document.createElement('div');
        whiteOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:9999;opacity:0;transition:opacity 2s;';
        document.body.appendChild(whiteOverlay);
        setTimeout(() => whiteOverlay.style.opacity = '1', 100);
        
        setTimeout(() => {
            whiteOverlay.style.background = '#000';
            whiteOverlay.style.opacity = '1';
            
            showMonologue('Escapé del túnel...');
            setTimeout(() => {
                showMonologue('Pero IA666 sigue ahí fuera...');
                setTimeout(() => {
                    showMonologue('El castillo... ¿qué secretos guarda?');
                    setTimeout(() => {
                        showMonologue('CONTINUARÁ...');
                        setTimeout(() => {
                            // Iniciar Chapter 3 (JOKE)
                            this.active = false;
                        const bar = document.getElementById('ch2StaminaBar');
                        if(bar) bar.remove();
                        const injuryIndicator = document.getElementById('injuryIndicator');
                        if(injuryIndicator) injuryIndicator.remove();
                        const injuryLabel = document.getElementById('injuryLabel');
                        if(injuryLabel) injuryLabel.remove();
                        
                        // Verificar si Chapter3 existe e iniciar cinemática
                        if(typeof Chapter3 !== 'undefined' && typeof chapter3 !== 'undefined') {
                            // Esperar un frame antes de iniciar Chapter 3
                            setTimeout(() => {
                                whiteOverlay.remove();
                                chapter3.start();
                            }, 100);
                        } else {
                            // Si no existe Chapter3, recargar la página para volver al menú
                            whiteOverlay.remove();
                            console.log('Chapter3 no disponible, recargando...');
                            location.reload();
                        }
                        }, 3000);
                    }, 3000);
                }, 3000);
            }, 3000);
        }, 2000);
    }

    playRainAmbient() {
        const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1.0;
        if(!this.chapter2RainAudio) {
            this.chapter2RainAudio = new Audio('stuff/chapter2rain.mp3');
            this.chapter2RainAudio.volume = 0.4 * vol;
            this.chapter2RainAudio.loop = true;
        }
        this.chapter2RainAudio.play().catch(() => {});
    }
    
    playWhisper() {
        if(this.phase === 'whiteroom') {
            const vol = typeof masterVolume !== 'undefined' ? masterVolume : 1.0;
            if(!this.voicesAudio) {
                this.voicesAudio = new Audio('stuff/voices.mp3');
                this.voicesAudio.volume = 0.6 * vol;
            }
            this.voicesAudio.currentTime = 0;
            this.voicesAudio.play().catch(() => {});
        }
    }
    
    readNote(note) {
        // Sonido de papel
        this.playPaperSound();
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;color:#fff;padding:30px;border:3px solid #ff0000;border-radius:10px;max-width:500px;z-index:2000;font-family:monospace;box-shadow:0 0 30px rgba(255,0,0,0.5);';
        
        const title = document.createElement('h2');
        title.style.cssText = 'color:#ff0000;margin:0 0 15px 0;text-align:center;';
        title.textContent = note.userData.title;
        
        const text = document.createElement('p');
        text.style.cssText = 'margin:0;line-height:1.8;font-size:16px;';
        text.textContent = note.userData.text;
        
        const button = document.createElement('button');
        button.style.cssText = 'margin-top:20px;padding:10px 20px;background:#ff0000;color:#fff;border:none;border-radius:5px;cursor:pointer;width:100%;font-size:16px;';
        button.textContent = 'Cerrar [E]';
        button.onclick = () => modal.remove();
        
        modal.appendChild(title);
        modal.appendChild(text);
        modal.appendChild(button);
        document.body.appendChild(modal);
        vibrateGamepad(200, 0.5, 0.5);
        
        const closeHandler = (e) => {
            if(e.key === 'e' || e.key === 'E') {
                modal.remove();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    collectIcon(icon) {
        icon.userData.collected = true;
        this.collectedIcons.push(icon.userData.name);
        scene.remove(icon);
        
        // Sonido de recolección
        this.playCollectSound();
        showMonologue(`✔️ Icono de ${icon.userData.name} recolectado (${this.collectedIcons.length}/${this.totalIcons})`);
        vibrateGamepad(200, 0.5, 0.5);
        
        // Actualizar cartel de puerta
        this.updateDoorSign();
        this.saveProgress();
        
        if(this.collectedIcons.length >= this.totalIcons && this.collectedKeys.length < this.totalKeys) {
            setTimeout(() => {
                showMonologue(`¡Todos los iconos! Ahora busca las ${this.totalKeys} llaves y el casco.`);
            }, 1000);
        } else if(this.collectedIcons.length >= this.totalIcons && this.collectedKeys.length >= this.totalKeys && !this.hasHelmet) {
            setTimeout(() => {
                showMonologue('¡Iconos y llaves! Ahora busca el casco experimental.');
            }, 1000);
        } else if(this.collectedIcons.length >= this.totalIcons && this.collectedKeys.length >= this.totalKeys && this.hasHelmet) {
            setTimeout(() => {
                showMonologue('¡Todo recolectado! La puerta está desbloqueada.');
            }, 1000);
        }
    }
    
    collectKey(key) {
        key.userData.collected = true;
        this.collectedKeys.push(key.userData.name);
        scene.remove(key);
        
        this.playCollectSound();
        showMonologue(`🔑 Llave ${key.userData.name} recolectada (${this.collectedKeys.length}/${this.totalKeys})`);
        vibrateGamepad(200, 0.5, 0.5);
        
        this.updateDoorSign();
        this.saveProgress();
        
        if(this.collectedKeys.length >= this.totalKeys && this.collectedIcons.length >= this.totalIcons && !this.hasHelmet) {
            setTimeout(() => {
                showMonologue('¡Iconos y llaves! Ahora busca el casco experimental.');
            }, 1000);
        } else if(this.collectedKeys.length >= this.totalKeys && this.collectedIcons.length >= this.totalIcons && this.hasHelmet) {
            setTimeout(() => {
                showMonologue('¡Todo recolectado! La puerta está desbloqueada.');
            }, 1000);
        }
    }
    
    playCollectSound() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }
    
    openDoor() {
        if(this.phase !== 'exploring') return;
        this.phase = 'transition';
        
        // Ocultar prompt inmediatamente
        const doorPrompt = document.getElementById('doorPrompt');
        if(doorPrompt) doorPrompt.remove();
        
        // Animación de puerta abriéndose
        if(this.blockedDoor) {
            const door = this.blockedDoor.frame;
            let openProgress = 0;
            const openInterval = setInterval(() => {
                openProgress += 0.05;
                door.position.y += 0.1;
                door.rotation.x += 0.05;
                door.scale.y = 1 - openProgress;
                
                if(openProgress >= 1) {
                    clearInterval(openInterval);
                    scene.remove(this.blockedDoor.frame);
                    scene.remove(this.blockedDoor.sign);
                    this.blockedDoor = null;
                }
            }, 50);
        }
        
        showMonologue('La puerta se abre...');
        vibrateGamepad(300, 0.7, 0.7);
        
        // Luz verde brillante saliendo de la puerta
        const greenLight = new THREE.PointLight(0x00ff00, 5, 20);
        greenLight.position.set(0, 1.5, 14);
        scene.add(greenLight);
        
        let lightIntensity = 5;
        const lightInterval = setInterval(() => {
            lightIntensity -= 0.1;
            greenLight.intensity = lightIntensity;
            if(lightIntensity <= 0) {
                clearInterval(lightInterval);
                scene.remove(greenLight);
            }
        }, 100);
        
        setTimeout(() => {
            showMonologue('Debo salir de aquí AHORA.');
            this.playWhisper();
            setTimeout(() => {
                this.startEscapePhase();
            }, 3000);
        }, 1000);
    }

    triggerGisselJumpscare() {
        this.gisselTriggered = true;
        
        // Jumpscare visual con animación
        const jumpscare = document.createElement('div');
        jumpscare.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:url("stuff/Gisselcyber.jpg") center/cover;z-index:9999;opacity:0;transform:scale(0.5);transition:all 0.2s;';
        document.body.appendChild(jumpscare);
        
        setTimeout(() => {
            jumpscare.style.opacity = '1';
            jumpscare.style.transform = 'scale(1.2)';
        }, 10);
        
        // Shake de pantalla
        let shakeTime = 0;
        const originalY = camera.position.y;
        const shakeInterval = setInterval(() => {
            camera.position.y = originalY + Math.sin(shakeTime * 100) * 0.1;
            camera.position.x += (Math.random() - 0.5) * 0.05;
            shakeTime += 0.016;
            if(shakeTime > 0.8) {
                clearInterval(shakeInterval);
                camera.position.y = originalY;
            }
        }, 16);
        
        // Sonido de jumpscare
        this.playScreamSound();
        showMonologue('VETE A LA VERGA GISSEL!');
        vibrateGamepad(800, 1.0, 1.0);
        
        // Efecto de glitch
        let glitchCount = 0;
        const glitchInterval = setInterval(() => {
            jumpscare.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(${Math.random() * 3})`;
            glitchCount++;
            if(glitchCount > 10) clearInterval(glitchInterval);
        }, 100);
        
        setTimeout(() => {
            jumpscare.style.opacity = '0';
            jumpscare.style.transform = 'scale(1.5)';
            setTimeout(() => {
                jumpscare.remove();
                if(this.gisselCyber) {
                    scene.remove(this.gisselCyber);
                    this.gisselCyber = null;
                }
            }, 500);
        }, 2000);
    }
    
    playScreamSound() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.8);
    }

    collectHelmet(helmet) {
        helmet.userData.collected = true;
        this.hasHelmet = true;
        scene.remove(helmet);
        
        this.playCollectSound();
        showMonologue('🪖 ¡CASCO EXPERIMENTAL EQUIPADO!');
        vibrateGamepad(300, 0.7, 0.7);
        
        // Activar HUD experimental
        setTimeout(() => {
            showMonologue('⚠️ SISTEMA EXPERIMENTAL ACTIVO ⚠️');
            this.activateExperimentalHUD();
            this.loadHelmetLore();
            this.startHelmetLocator();
        }, 1000);
        
        this.updateDoorSign();
        this.saveProgress();
    }
    
    startHelmetLocator() {
        setInterval(() => {
            if(!this.hasHelmet || this.phase !== 'exploring') return;
            
            const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
            let closest = null;
            let minDist = Infinity;
            
            for(let note of this.notes) {
                if((note.userData.type === 'icon' || note.userData.type === 'key') && !note.userData.collected) {
                    const dist = playerPos.distanceTo(note.position);
                    if(dist < minDist) {
                        minDist = dist;
                        closest = note;
                    }
                }
            }
            
            if(closest) {
                const type = closest.userData.type === 'icon' ? 'Icono' : 'Llave';
                const name = closest.userData.name;
                const dir = Math.floor(Math.atan2(closest.position.x - playerPos.x, closest.position.z - playerPos.z) * 180 / Math.PI);
                showMonologue(`📡 ${type} ${name} detectado: ${Math.floor(minDist)}m - ${dir}°`);
            }
        }, 60000);
    }
    
    createHelmetOverlay() {
        if(document.getElementById('helmetOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'helmetOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;';
        overlay.innerHTML = `
            <svg width="100%" height="100%" style="position:absolute;top:0;left:0;">
                <!-- Visor del casco -->
                <defs>
                    <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.1" />
                        <stop offset="100%" style="stop-color:#0088ff;stop-opacity:0.05" />
                    </linearGradient>
                </defs>
                <!-- Borde superior del visor -->
                <path d="M 0 0 L 0 80 Q 50% 120, 100% 80 L 100% 0 Z" fill="url(#visorGrad)" opacity="0.3"/>
                <!-- Bordes laterales -->
                <rect x="0" y="0" width="3%" height="100%" fill="#001a33" opacity="0.6"/>
                <rect x="97%" y="0" width="3%" height="100%" fill="#001a33" opacity="0.6"/>
                <!-- HUD lines -->
                <line x1="5%" y1="10%" x2="20%" y2="10%" stroke="#00ffff" stroke-width="1" opacity="0.5"/>
                <line x1="80%" y1="10%" x2="95%" y2="10%" stroke="#00ffff" stroke-width="1" opacity="0.5"/>
            </svg>
        `;
        document.body.appendChild(overlay);
    }
    
    toggleHelmetFlashlight() {
        this.helmetFlashlightOn = !this.helmetFlashlightOn;
        
        if(this.helmetFlashlightOn) {
            // Crear luz azul más potente
            this.helmetFlashlight = new THREE.SpotLight(0x00aaff, 8, 50, Math.PI / 4, 0.3, 0.5);
            this.helmetFlashlight.position.copy(camera.position);
            this.helmetFlashlight.target.position.set(
                camera.position.x,
                camera.position.y,
                camera.position.z + 1
            );
            scene.add(this.helmetFlashlight);
            scene.add(this.helmetFlashlight.target);
            
            if(this.flashlightAudio) {
                this.flashlightAudio.currentTime = 0;
                this.flashlightAudio.play().catch(() => {});
            }
            showMonologue('💡 Linterna del casco activada');
        } else {
            // Apagar luz
            if(this.helmetFlashlight) {
                scene.remove(this.helmetFlashlight);
                scene.remove(this.helmetFlashlight.target);
                this.helmetFlashlight = null;
            }
            if(this.flashlightAudio) {
                this.flashlightAudio.currentTime = 0;
                this.flashlightAudio.play().catch(() => {});
            }
            showMonologue('💡 Linterna del casco desactivada');
        }
    }
    
    loadHelmetLore() {
        fetch('helmet_lore.json')
            .then(res => {
                if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if(!data || !data.messages) throw new Error('Invalid helmet lore data');
                this.helmetMessages = data.messages;
                this.contextualMessagesShown = {};
                this.showHelmetMessage(0);
                this.startHelmetMessageTimer();
            })
            .catch(err => {
                console.warn('Helmet lore not available:', err.message);
                this.helmetMessages = null;
            });
    }
    
    showHelmetMessage(index) {
        if(!this.helmetMessages || index >= this.helmetMessages.length) return;
        
        // Limitar a 1 cartel máximo
        const existingBoxes = document.querySelectorAll('.helmet-message-box');
        if(existingBoxes.length >= 1) return;
        
        const msg = this.helmetMessages[index];
        const box = document.createElement('div');
        box.className = 'helmet-message-box';
        box.style.cssText = 'position:fixed;top:150px;right:20px;width:380px;background:rgba(0,100,200,0.9);border:2px solid #00ffff;border-radius:8px;padding:20px;z-index:1000;font-family:Courier New,monospace;color:#fff;box-shadow:0 0 20px rgba(0,255,255,0.5);animation:slideIn 0.5s;';
        
        const textDiv = document.createElement('div');
        textDiv.style.cssText = 'font-size:18px;font-weight:bold;color:#00ffff;margin-bottom:10px;';
        textDiv.textContent = msg.text;
        
        const subtextDiv = document.createElement('div');
        subtextDiv.style.cssText = 'font-size:15px;color:#ccc;line-height:1.5;';
        subtextDiv.textContent = msg.subtext;
        
        box.appendChild(textDiv);
        box.appendChild(subtextDiv);
        document.body.appendChild(box);
        
        setTimeout(() => {
            box.style.animation = 'slideOut 0.5s';
            setTimeout(() => box.remove(), 500);
        }, 5000);
    }
    
    showContextualMessage(type) {
        if(!this.helmetMessages || this.contextualMessagesShown[type]) return;
        
        // Limitar a 1 cartel máximo
        const existingBoxes = document.querySelectorAll('.helmet-message-box');
        if(existingBoxes.length >= 1) return;
        
        const msg = this.helmetMessages.find(m => m.type === type);
        if(!msg) return;
        
        this.contextualMessagesShown[type] = true;
        const index = this.helmetMessages.indexOf(msg);
        this.showHelmetMessage(index);
    }
    
    startHelmetMessageTimer() {
        let msgIndex = 1;
        this.helmetMessageInterval = setInterval(() => {
            if(!this.hasHelmet || !this.helmetMessages) {
                clearInterval(this.helmetMessageInterval);
                return;
            }
            const msg = this.helmetMessages[msgIndex];
            if(!msg.type.startsWith('contextual_') && !msg.type.startsWith('chapter3_')) {
                this.showHelmetMessage(msgIndex);
            }
            msgIndex = (msgIndex + 1) % this.helmetMessages.length;
        }, 45000);
        
        // Mensajes psicológicos aleatorios cada 30-90 segundos
        this.psychologicalInterval = setInterval(() => {
            if(!this.hasHelmet || !this.helmetMessages) {
                clearInterval(this.psychologicalInterval);
                return;
            }
            if(Math.random() > 0.4) {
                const psychMsgs = this.helmetMessages.filter(m => m.type === 'psychological');
                if(psychMsgs.length > 0) {
                    const randomMsg = psychMsgs[Math.floor(Math.random() * psychMsgs.length)];
                    const index = this.helmetMessages.indexOf(randomMsg);
                    this.showHelmetMessage(index);
                }
            }
        }, 30000 + Math.random() * 60000);
    }
    
    activateExperimentalHUD() {
        this.updateExperimentalHUD();
        
        const staminaBar = document.getElementById('ch2StaminaBar');
        if(staminaBar) {
            staminaBar.style.background = 'rgba(0,0,0,0.7)';
            staminaBar.style.borderColor = '#00ff88';
            staminaBar.style.borderLeft = '3px solid #00ff88';
            staminaBar.style.boxShadow = '0 0 15px rgba(0,255,136,0.6), inset 0 0 10px rgba(0,255,136,0.3)';
        }
        
        const staminaFill = document.getElementById('ch2StaminaFill');
        if(staminaFill) {
            staminaFill.style.background = 'linear-gradient(90deg, #00ff88, #00ffcc)';
        }
        
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#00ffff;z-index:9999;opacity:0.5;transition:opacity 0.5s;pointer-events:none;';
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 500);
        }, 100);
    }
    
    updateExperimentalHUD() {
        if(!this.hasHelmet) return;
        
        let location = 'Laboratorio';
        let progressText = location;
        
        if(this.phase === 'exploring') {
            const dist = Math.floor(Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z));
            progressText = `${dist}m desde centro`;
        } else if(this.phase === 'escaping') {
            location = 'Túnel de Escape';
            const dist = Math.floor(camera.position.z + 40);
            progressText = `${dist}m / 1500m`;
        } else if(this.phase === 'whiteroom') {
            location = 'White Room';
            progressText = location;
        } else if(this.phase === 'courtyard') {
            location = 'Patio Exterior';
            progressText = location;
        } else if(this.phase === 'rivalry') {
            location = 'Sala de Rivalidad';
            progressText = location;
        }
        
        const ui = document.getElementById('ui');
        if(ui) {
            ui.style.display = 'block';
            ui.innerHTML = `
                <div style="font-family: 'Courier New', monospace; color: #ff4444; text-shadow: 0 0 10px #ff0000; margin-bottom: 15px; font-size: 14px;">
                    ⚠️ SISTEMA EXPERIMENTAL ACTIVO ⚠️<br>
                    <span style="color: #888; font-size: 11px;">Protocolo: ??? | Ubicación: ${location}</span>
                </div>
                <div id="controlsHUD" style="background: rgba(0,0,0,0.7); padding: 8px; border-left: 3px solid #ff4444; margin-bottom: 10px;">
                    <span style="color: #ffd700;">⌨️ CONTROLES:</span> WASD - Mover | SHIFT - Correr
                </div>
                <div id="distance" style="background: rgba(0,0,0,0.7); padding: 8px; border-left: 3px solid #00ff88; color: #00ff88; font-weight: bold;">
                    📍 Progreso: ${progressText}
                </div>
            `;
        }
    }
    
    playPaperSound() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }
    
    createTerminals() {
        const terminalPositions = [
            { x: -28, z: -10, room: 'Office', hint: 'Llave Roja en Containment' },
            { x: 28, z: -10, room: 'Medical', hint: 'Llave Azul en Archive' },
            { x: -28, z: 10, room: 'Security', hint: 'Llave Verde en Testing (Nivel 2)' },
            { x: 28, z: 10, room: 'Archive', hint: 'Iconos dispersos en 10 habitaciones' }
        ];
        
        terminalPositions.forEach((data, i) => {
            const terminal = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 1.2, 0.1),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            terminal.position.set(data.x, 1, data.z);
            terminal.userData = { type: 'terminal', hint: data.hint, id: i, read: false };
            scene.add(terminal);
            this.terminals.push(terminal);
            
            const termLight = new THREE.PointLight(0x00ff00, 0.8, 3);
            termLight.position.set(data.x, 1.5, data.z);
            scene.add(termLight);
        });
    }
    
    createPuzzleRooms() {
        // Sala de Energía (Power - Nivel 2): 3 generadores
        const powerRoom = { x: -28, z: 28, y: 6 };
        for(let i = 0; i < 3; i++) {
            const gen = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8),
                new THREE.MeshBasicMaterial({ color: 0x4a4a4a })
            );
            gen.position.set(powerRoom.x - 3 + i * 3, powerRoom.y + 0.75, powerRoom.z);
            gen.userData = { type: 'generator', id: i, active: false };
            scene.add(gen);
            this.notes.push(gen);
        }
        
        // Sala de Seguridad (Security): Código de 4 dígitos en notas
        const securityNotes = [
            { x: -28, z: 10, digit: '6' },
            { x: 28, z: -28, digit: '6' },
            { x: -28, z: -28, digit: '6' },
            { x: 28, z: 28, digit: '6' }
        ];
        securityNotes.forEach(data => {
            const note = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 0.4),
                new THREE.MeshBasicMaterial({ color: 0xffffcc })
            );
            note.position.set(data.x, 0.86, data.z);
            note.rotation.x = -Math.PI / 2;
            note.userData = { type: 'codeNote', digit: data.digit, read: false };
            scene.add(note);
            this.notes.push(note);
        });
        
        // Sala de Contención (Containment): Secuencia de colores
        const colorPanels = [
            { x: -28, z: 28, color: 0xff0000, order: 1 },
            { x: -27, z: 28, color: 0x00ff00, order: 2 },
            { x: -26, z: 28, color: 0x0000ff, order: 3 }
        ];
        colorPanels.forEach(data => {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.1),
                new THREE.MeshBasicMaterial({ color: data.color })
            );
            panel.position.set(data.x, 1.5, data.z);
            panel.userData = { type: 'colorPanel', order: data.order, pressed: false };
            scene.add(panel);
            this.notes.push(panel);
        });
    }
    
    createVentilationSystem() {
        const ventPositions = [
            { x: -20, z: -20, connects: { x: 20, z: -20 } },
            { x: -20, z: 20, connects: { x: 20, z: 20 } },
            { x: -28, z: 0, connects: { x: 28, z: 0, y: 6 } }
        ];
        
        ventPositions.forEach(data => {
            const vent = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 0.2),
                new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
            );
            vent.position.set(data.x, 2.5, data.z);
            vent.userData = { type: 'vent', connects: data.connects };
            scene.add(vent);
            this.ventDucts.push(vent);
            
            const ventLight = new THREE.PointLight(0x404040, 0.3, 2);
            ventLight.position.set(data.x, 2.5, data.z);
            scene.add(ventLight);
        });
    }
    
    createOptionalCollectibles() {
        // Habitaciones para coleccionables
        const rooms = [
            { x: -28, z: -28, w: 10, d: 10, level: 1 },
            { x: -28, z: -10, w: 10, d: 8, level: 1 },
            { x: 28, z: -28, w: 10, d: 10, level: 1 },
            { x: 28, z: -10, w: 10, d: 8, level: 1 },
            { x: -28, z: 28, w: 10, d: 10, level: 1 },
            { x: -28, z: 10, w: 10, d: 8, level: 1 },
            { x: 28, z: 28, w: 10, d: 10, level: 1 },
            { x: 28, z: 10, w: 10, d: 8, level: 1 },
            { x: -28, z: -28, w: 10, d: 10, level: 2 },
            { x: -28, z: -10, w: 10, d: 8, level: 2 },
            { x: 28, z: -28, w: 10, d: 10, level: 2 },
            { x: 28, z: -10, w: 10, d: 8, level: 2 },
            { x: -28, z: 28, w: 10, d: 10, level: 2 },
            { x: -28, z: 10, w: 10, d: 8, level: 2 },
            { x: 28, z: 28, w: 10, d: 10, level: 2 }
        ];
        
        // 15 fragmentos de memoria
        for(let i = 0; i < 15; i++) {
            const room = rooms[i % rooms.length];
            const x = room.x + (Math.random() - 0.5) * (room.w - 2);
            const z = room.z + (Math.random() - 0.5) * (room.d - 2);
            const y = room.level === 2 ? 6.86 : 0.86;
            
            const fragment = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.7 })
            );
            fragment.position.set(x, y, z);
            fragment.userData = { type: 'memory', id: i, collected: false };
            scene.add(fragment);
            this.memoryFragments.push(fragment);
            
            const fragLight = new THREE.PointLight(0xff00ff, 0.5, 2);
            fragLight.position.set(x, y + 0.5, z);
            scene.add(fragLight);
        }
        
        // 5 grabaciones de audio en habitaciones específicas
        const audioRooms = [rooms[8], rooms[10], rooms[4], rooms[6], rooms[12]];
        audioRooms.forEach((room, i) => {
            const x = room.x + (Math.random() - 0.5) * (room.w - 2);
            const z = room.z + (Math.random() - 0.5) * (room.d - 2);
            const y = room.level === 2 ? 6.86 : 0.86;
            
            const audio = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
            audio.position.set(x, y, z);
            audio.userData = { type: 'audio', id: i, collected: false };
            scene.add(audio);
            this.audioRecordings.push(audio);
        });
    }
    
    startDynamicEvents() {
        // Apagones aleatorios cada 60-120 segundos
        setInterval(() => {
            if(this.phase === 'exploring' && !this.powerOutage && Math.random() > 0.5) {
                this.triggerPowerOutage();
            }
        }, 90000);
        
        // IA666 aparece brevemente cada 45-90 segundos
        setInterval(() => {
            if(this.phase === 'exploring' && !this.ia666 && Math.random() > 0.6) {
                this.spawnIA666Brief();
            }
        }, 60000);
    }
    
    triggerPowerOutage() {
        this.powerOutage = true;
        showMonologue('¡Las luces se apagaron!');
        
        scene.children.forEach(child => {
            if(child instanceof THREE.PointLight) {
                child.userData.originalIntensity = child.intensity;
                child.intensity = 0.1;
            }
        });
        
        setTimeout(() => {
            showMonologue('Debo encontrar fusibles...');
        }, 2000);
    }
    
    restorePower() {
        this.powerOutage = false;
        showMonologue('¡Energía restaurada!');
        
        scene.children.forEach(child => {
            if(child instanceof THREE.PointLight && child.userData.originalIntensity) {
                child.intensity = child.userData.originalIntensity;
            }
        });
    }
    
    spawnIA666Brief() {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        
        const shadow = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.6, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8 })
        );
        shadow.position.set(x, 0.8, z);
        scene.add(shadow);
        
        showMonologue('Algo se movió...');
        
        setTimeout(() => {
            scene.remove(shadow);
        }, 3000);
    }
}

const chapter2 = new Chapter2();
