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
        this.totalIcons = 6;
        this.blockedDoor = null;
        this.gisselCyber = null;
        this.gisselTriggered = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    start() {
        this.active = true;
        this.phase = 'falling';
        this.clearScene();
        this.initAudio();
        this.createFallingCinematic();
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if(e.key.toLowerCase() === 'e') this.handleInteract();
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
        
        // Soporte táctil
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if(isMobile) {
            this.setupTouchControls();
        }
    }
    
    setupTouchControls() {
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
        
        // Control de cámara táctil
        const cameraControl = document.getElementById('cameraControl');
        if(cameraControl) {
            cameraControl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            });
            
            cameraControl.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const deltaX = e.touches[0].clientX - this.touchStartX;
                const deltaY = e.touches[0].clientY - this.touchStartY;
                
                this.mouseX -= deltaX * 0.005;
                this.mouseY -= deltaY * 0.005;
                this.mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseY));
                
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            });
        }
        
        // Botón de sprint
        const sprintBtn = document.getElementById('sprintBtn');
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
        // Lógica de interacción centralizada
        if(this.phase === 'exploring') {
            const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
            
            for(let note of this.notes) {
                const dx = playerPos.x - note.position.x;
                const dz = playerPos.z - note.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if(note.userData.type === 'icon' && !note.userData.collected && dist < 1.5) {
                    this.collectIcon(note);
                    return;
                } else if(note.userData.type === 'note' && !note.userData.read && dist < 1.5) {
                    this.readNote(note);
                    note.userData.read = true;
                    this.notesRead++;
                    return;
                }
            }
            
            // Verificar puerta
            if(this.collectedIcons.length >= this.totalIcons) {
                const doorDist = Math.sqrt(
                    Math.pow(playerPos.x - 0, 2) + 
                    Math.pow(playerPos.z - 14, 2)
                );
                if(doorDist < 2) {
                    this.openDoor();
                }
            }
        }
    }

    initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.ambientSound = this.createDroneSound(60, 0.2);
        
        this.footstepAudio = new Audio('stuff/stepsound.mp3');
        this.footstepAudio.volume = 0.25;
        
        for(let i = 0; i < 3; i++) {
            const audio = new Audio('stuff/stepsound.mp3');
            audio.volume = 0.25;
            this.footstepPool.push(audio);
        }
        
        this.runAudio = new Audio('stuff/correr.mp3');
        this.runAudio.volume = 0.4;
        this.runAudio.loop = true;
        
        this.exhaustedAudio = new Audio('stuff/exhausted.mp3');
        this.exhaustedAudio.volume = 0.5;
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
    }

    createPitBottom() {
        // Suelo laboratorio GRANDE 60x60m
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60),
            new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Paredes exteriores
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        this.walls = [];
        
        const outerWalls = [
            new THREE.Mesh(new THREE.BoxGeometry(60, 6, 0.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(60, 6, 0.5), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 60), wallMat),
            new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 60), wallMat)
        ];
        outerWalls[0].position.set(0, 3, -30);
        outerWalls[1].position.set(0, 3, 30);
        outerWalls[2].position.set(-30, 3, 0);
        outerWalls[3].position.set(30, 3, 0);
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
        this.spawnGisselCyber();
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
        ctx.fillText(`0/${this.totalIcons} ICONOS`, 256, 160);
        const texture = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(2.5, 1.5),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true })
        );
        sign.position.set(0, 1.5, 14.4);
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
            { path: '../assets/icons/MollyNormalIcon.png', name: 'Molly' }
        ];
        
        // Habitaciones disponibles (aleatorias cada partida)
        const availableRooms = [
            { x: -20, z: -20, name: 'Storage' },
            { x: -20, z: -8, name: 'Office' },
            { x: 20, z: -20, name: 'Lab' },
            { x: 20, z: -8, name: 'Medical' },
            { x: 0, z: -18, name: 'Main' },
            { x: -12, z: 0, name: 'Research' },
            { x: 12, z: 0, name: 'Testing' },
            { x: -20, z: 20, name: 'Containment' },
            { x: -20, z: 8, name: 'Security' },
            { x: 20, z: 20, name: 'Server' },
            { x: 20, z: 8, name: 'Archive' },
            { x: 0, z: 18, name: 'Observation' }
        ];
        
        // Mezclar habitaciones aleatoriamente
        const shuffledRooms = availableRooms.sort(() => Math.random() - 0.5);
        const iconPositions = shuffledRooms.slice(0, 6);
        
        icons.forEach((data, i) => {
            const pos = iconPositions[i];
            const x = pos.x + (Math.random() - 0.5) * 4;
            const z = pos.z + (Math.random() - 0.5) * 4;
            const y = 0.86;
            
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
                iconLight.position.set(x, y + 1, z);
                scene.add(iconLight);
            };
            img.src = data.path;
        });
    }
    
    updateDoorSign() {
        if(!this.blockedDoor) return;
        
        const { ctx, canvas, texture, sign } = this.blockedDoor;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if(this.collectedIcons.length >= this.totalIcons) {
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
            ctx.fillText(`${this.collectedIcons.length}/${this.totalIcons} ICONOS`, 256, 160);
        }
        
        texture.needsUpdate = true;
    }

    spawnGisselCyber() {
        const x = (Math.random() - 0.5) * 24; // -12 a 12
        const z = (Math.random() - 0.5) * 24; // -12 a 12
        
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
        
        // 12 habitaciones estratégicamente distribuidas
        const rooms = [
            // Esquina superior izquierda
            { x: -20, z: -20, w: 8, d: 8, door: 'south', type: 'storage' },
            { x: -20, z: -8, w: 8, d: 6, door: 'east', type: 'office' },
            
            // Esquina superior derecha
            { x: 20, z: -20, w: 8, d: 8, door: 'south', type: 'lab' },
            { x: 20, z: -8, w: 8, d: 6, door: 'west', type: 'medical' },
            
            // Centro superior
            { x: 0, z: -18, w: 10, d: 6, door: 'south', type: 'main' },
            
            // Centro
            { x: -12, z: 0, w: 6, d: 8, door: 'east', type: 'research' },
            { x: 12, z: 0, w: 6, d: 8, door: 'west', type: 'testing' },
            
            // Esquina inferior izquierda
            { x: -20, z: 20, w: 8, d: 8, door: 'north', type: 'containment' },
            { x: -20, z: 8, w: 8, d: 6, door: 'east', type: 'security' },
            
            // Esquina inferior derecha
            { x: 20, z: 20, w: 8, d: 8, door: 'north', type: 'server' },
            { x: 20, z: 8, w: 8, d: 6, door: 'west', type: 'archive' },
            
            // Centro inferior
            { x: 0, z: 18, w: 10, d: 6, door: 'north', type: 'observation' }
        ];
        
        rooms.forEach(room => {
            // Paredes de habitación
            const walls = [
                { w: room.w, h: 3, d: 0.3, x: 0, z: room.d/2, side: 'north' },
                { w: room.w, h: 3, d: 0.3, x: 0, z: -room.d/2, side: 'south' },
                { w: 0.3, h: 3, d: room.d, x: room.w/2, z: 0, side: 'east' },
                { w: 0.3, h: 3, d: room.d, x: -room.w/2, z: 0, side: 'west' }
            ];
            
            walls.forEach(wall => {
                if(wall.side === room.door) {
                    // Crear marco de puerta
                    const doorWidth = 2;
                    const sideWidth = (wall.w - doorWidth) / 2;
                    
                    if(wall.side === 'north' || wall.side === 'south') {
                        // Paredes laterales de puerta
                        const leftWall = new THREE.Mesh(
                            new THREE.BoxGeometry(sideWidth, wall.h, wall.d),
                            wallMat
                        );
                        leftWall.position.set(room.x + wall.x - doorWidth/2 - sideWidth/2, 1.5, room.z + wall.z);
                        scene.add(leftWall);
                        this.walls.push(leftWall);
                        
                        const rightWall = new THREE.Mesh(
                            new THREE.BoxGeometry(sideWidth, wall.h, wall.d),
                            wallMat
                        );
                        rightWall.position.set(room.x + wall.x + doorWidth/2 + sideWidth/2, 1.5, room.z + wall.z);
                        scene.add(rightWall);
                        this.walls.push(rightWall);
                        
                        // Marco superior
                        const topFrame = new THREE.Mesh(
                            new THREE.BoxGeometry(doorWidth, 0.3, wall.d),
                            doorMat
                        );
                        topFrame.position.set(room.x + wall.x, 2.85, room.z + wall.z);
                        scene.add(topFrame);
                    } else {
                        // Paredes laterales de puerta (vertical)
                        const leftWall = new THREE.Mesh(
                            new THREE.BoxGeometry(wall.w, wall.h, sideWidth),
                            wallMat
                        );
                        leftWall.position.set(room.x + wall.x, 1.5, room.z + wall.z - doorWidth/2 - sideWidth/2);
                        scene.add(leftWall);
                        this.walls.push(leftWall);
                        
                        const rightWall = new THREE.Mesh(
                            new THREE.BoxGeometry(wall.w, wall.h, sideWidth),
                            wallMat
                        );
                        rightWall.position.set(room.x + wall.x, 1.5, room.z + wall.z + doorWidth/2 + sideWidth/2);
                        scene.add(rightWall);
                        this.walls.push(rightWall);
                        
                        // Marco superior
                        const topFrame = new THREE.Mesh(
                            new THREE.BoxGeometry(wall.w, 0.3, doorWidth),
                            doorMat
                        );
                        topFrame.position.set(room.x + wall.x, 2.85, room.z + wall.z);
                        scene.add(topFrame);
                    }
                } else {
                    // Pared completa
                    const wallMesh = new THREE.Mesh(
                        new THREE.BoxGeometry(wall.w, wall.h, wall.d),
                        wallMat
                    );
                    wallMesh.position.set(room.x + wall.x, 1.5, room.z + wall.z);
                    scene.add(wallMesh);
                    this.walls.push(wallMesh);
                }
            });
            
            // Luz en habitación según tipo
            let lightColor = 0x404040;
            if(room.type === 'containment') lightColor = 0xff0000;
            else if(room.type === 'medical') lightColor = 0x00ff00;
            else if(room.type === 'server') lightColor = 0x0000ff;
            
            const roomLight = new THREE.PointLight(lightColor, 0.5, room.w);
            roomLight.position.set(room.x, 2.5, room.z);
            scene.add(roomLight);
        });
        
        // Pasillos principales (sin paredes para permitir movimiento)
        const corridorLights = [
            { x: 0, z: -10 }, { x: 0, z: 0 }, { x: 0, z: 10 },
            { x: -10, z: 0 }, { x: 10, z: 0 }
        ];
        corridorLights.forEach(pos => {
            const light = new THREE.PointLight(0x606060, 0.4, 12);
            light.position.set(pos.x, 2.5, pos.z);
            scene.add(light);
        });
    }

    createLaboratory() {
        const labMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a });
        const metalMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
        const glassMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 });

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
            { pos: [0, 0.86, 1.5], text: 'ADVERTENCIA FINAL: El Sujeto 666 escapó del contenedor. Dios nos perdone por lo que hemos creado.', title: '⚠️ ADVERTENCIA' }
        ];

        notePositions.forEach((data, i) => {
            const note = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 0.4),
                noteMat
            );
            note.position.set(data.pos[0], data.pos[1], data.pos[2]);
            note.rotation.x = -Math.PI / 2;
            note.userData = { type: 'note', text: data.text, title: data.title, id: i, read: false };
            scene.add(note);
            this.notes.push(note);

            // Luz amarilla sobre nota
            const noteLight = new THREE.PointLight(0xffff00, 0.4, 2);
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
            this.createStaminaBar();
            
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

    update(delta) {
        if(!this.active) return;

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
        // Actualizar gamepad
        this.updateGamepad();
        
        // Actualizar isRunning ANTES de calcular movimiento
        if(!this.isRunning) this.isRunning = this.keys['shift'];
        
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

        // Límites del laboratorio (60x60m)
        camera.position.x = Math.max(-29, Math.min(29, camera.position.x));
        camera.position.z = Math.max(-29, Math.min(29, camera.position.z));
        
        // Colisión con paredes
        if(this.walls) {
            const playerBox = new THREE.Box3(
                new THREE.Vector3(camera.position.x - 0.3, 0, camera.position.z - 0.3),
                new THREE.Vector3(camera.position.x + 0.3, 2, camera.position.z + 0.3)
            );
            
            for(let wall of this.walls) {
                const wallBox = new THREE.Box3().setFromObject(wall);
                if(playerBox.intersectsBox(wallBox)) {
                    camera.position.addScaledVector(direction, velocity.z * 2);
                    camera.position.addScaledVector(right, velocity.x * 2);
                    break;
                }
            }
        }

        const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        let nearNote = null;
        
        // Sistema de stamina
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
            }
        }
        
        // Footsteps solo cuando NO está corriendo
        if(isMoving && !this.isRunning) {
            this.footstepTimer += delta * 1000;
            if(this.footstepTimer >= this.footstepInterval) {
                this.playFootstep();
                this.footstepTimer = 0;
            }
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
        
        for(let note of this.notes) {
            const dx = playerPos.x - note.position.x;
            const dz = playerPos.z - note.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if(note.userData.type === 'icon' && !note.userData.collected && dist < 1.5) {
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
        
        // Verificar puerta desbloqueada
        if(this.collectedIcons.length >= this.totalIcons && this.phase === 'exploring') {
            const doorDist = Math.sqrt(
                Math.pow(playerPos.x - 0, 2) + 
                Math.pow(playerPos.z - 14, 2)
            );
            
            if(doorDist < 2) {
                if(!document.getElementById('doorPrompt')) {
                    const prompt = document.createElement('div');
                    prompt.id = 'doorPrompt';
                    prompt.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,255,0,0.8);color:#000;padding:15px 30px;border-radius:10px;font-size:18px;z-index:1000;font-weight:bold;';
                    prompt.textContent = 'Presiona E para abrir puerta';
                    document.body.appendChild(prompt);
                }
                
                if(this.keys['e']) {
                    this.handleInteract();
                    const prompt = document.getElementById('doorPrompt');
                    if(prompt) prompt.remove();
                }
            } else {
                const prompt = document.getElementById('doorPrompt');
                if(prompt) prompt.remove();
            }
        }
    }

    startEscapePhase() {
        this.phase = 'escaping';
        this.clearScene();
        this.createEscapeTunnel();
        camera.position.set(0, 1.6, -50);
        showMonologue('Un túnel... debo seguir la luz...');
        vibrateGamepad(300, 0.5, 0.5);
    }

    createEscapeTunnel() {
        // Suelo con diferentes texturas por zonas
        const floorZones = [
            { start: 0, end: 400, color: 0x050505 },
            { start: 400, end: 800, color: 0x0a0a0a },
            { start: 800, end: 1200, color: 0x1a0a0a },
            { start: 1200, end: 1500, color: 0x0a0a1a }
        ];
        
        floorZones.forEach(zone => {
            const length = zone.end - zone.start;
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(15, length),
                new THREE.MeshBasicMaterial({ color: zone.color })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.z = zone.start + length / 2;
            scene.add(floor);
        });

        // Paredes con variaciones
        const wallMat1 = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const wallMat2 = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        
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
        
        // Tuberías y cables en paredes con variaciones
        const pipeMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
        const rustPipeMat = new THREE.MeshBasicMaterial({ color: 0x4a2a1a });
        for(let i = 0; i < 30; i++) {
            const z = i * 50;
            const mat = i % 3 === 0 ? rustPipeMat : pipeMat;
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 15, 8), mat);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, 3.5, z);
            scene.add(pipe);
            
            // Cables colgantes
            if(i % 5 === 0) {
                const cable = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 2, 4),
                    new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
                );
                cable.position.set((Math.random() - 0.5) * 10, 4, z);
                scene.add(cable);
            }
        }
        
        // Salas laterales cada 300m
        for(let i = 1; i <= 4; i++) {
            const z = i * 300;
            const side = i % 2 === 0 ? -7.5 : 7.5;
            
            // Abertura en pared
            const opening = new THREE.Mesh(
                new THREE.BoxGeometry(3, 3, 0.5),
                new THREE.MeshBasicMaterial({ color: 0x000000 })
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
                new THREE.CircleGeometry(data.radius, 12),
                new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: 0.2 })
            );
            lightCircle.rotation.x = -Math.PI / 2;
            lightCircle.position.set(data.x, 0.01, data.z);
            scene.add(lightCircle);

            const light = new THREE.PointLight(data.color, 1.5, data.radius * 2.5);
            light.position.set(data.x, 2.5, data.z);
            scene.add(light);

            this.lightZones.push({ position: new THREE.Vector3(data.x, 0, data.z), radius: data.radius });
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

        // Obstáculos variados
        const obstacleMat = new THREE.MeshBasicMaterial({ color: 0x2a0000 });
        const barrelMat = new THREE.MeshBasicMaterial({ color: 0x4a4a2a });
        for(let i = 0; i < 60; i++) {
            const z = Math.random() * 1470 - 40;
            const x = (Math.random() - 0.5) * 12;
            
            const type = Math.floor(Math.random() * 3);
            let obstacle;
            if(type === 0) {
                obstacle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), obstacleMat);
            } else if(type === 1) {
                obstacle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 8), barrelMat);
            } else {
                obstacle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1), obstacleMat);
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
        // Actualizar gamepad
        this.updateGamepad();
        
        // Actualizar isRunning ANTES de calcular movimiento
        if(!this.isRunning) this.isRunning = this.keys['shift'];
        
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
                    this.ia666Spawned = false;
                }
            }
        }, 50);
        
        if(wasSpawned) {
            showMonologue('Huyó de la luz...');
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
                camera.position.set(0, 1.6, -50);
                if(this.ia666) {
                    scene.remove(this.ia666);
                    this.ia666 = null;
                    this.ia666Spawned = false;
                }
                this.timeInDarkness = 0;
                glitchOverlay.style.opacity = '0';
                setTimeout(() => glitchOverlay.remove(), 1000);
                showMonologue('Desperté... debo intentarlo de nuevo...');
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
        this.lightZones = [];
        this.ia666 = null;
        this.ia666Spawned = false;
        this.timeInDarkness = 0;
        this.clearScene();
        
        // Sala 30x30m más grande
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        
        // Patrón de cuadrícula en el suelo
        for(let i = -15; i <= 15; i += 3) {
            for(let j = -15; j <= 15; j += 3) {
                const tile = new THREE.Mesh(
                    new THREE.PlaneGeometry(2.8, 2.8),
                    new THREE.MeshBasicMaterial({ color: i % 6 === 0 || j % 6 === 0 ? 0x1a1a1a : 0x0f0f0f })
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
                new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.3 })
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
            new THREE.MeshBasicMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8 })
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
            new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
        );
        exitDoor.position.set(0, 2.5, 14.8);
        scene.add(exitDoor);
        
        const exitLight = new THREE.PointLight(0xffffff, 3, 15);
        exitLight.position.set(0, 4, 14.5);
        scene.add(exitLight);
        
        // Marco de puerta brillante
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(4.5, 5.5, 0.2),
            new THREE.MeshBasicMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.7 })
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
        this.clearScene();
        
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
        
        // Luz ambiental intensa
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambient);
        
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
        this.notes = [];
        this.rainParticles = [];
        this.clearScene();
        
        // Pasillo largo 10x100m con pasto
        const grassFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 100),
            new THREE.MeshBasicMaterial({ color: 0x2d5016 })
        );
        grassFloor.rotation.x = -Math.PI / 2;
        grassFloor.position.z = 50;
        scene.add(grassFloor);
        
        // Paredes del pasillo
        const wallMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 100), wallMat);
        wallLeft.position.set(-5, 3, 50);
        scene.add(wallLeft);
        
        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 100), wallMat);
        wallRight.position.set(5, 3, 50);
        scene.add(wallRight);
        
        // Vegetación a los lados (30 árboles)
        const treeMat = new THREE.MeshBasicMaterial({ color: 0x3a2a1a });
        const leavesMat = new THREE.MeshBasicMaterial({ color: 0x1a4a1a });
        for(let i = 0; i < 30; i++) {
            const side = Math.random() > 0.5 ? -4 : 4;
            const z = i * 3.3;
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 2, 4),
                treeMat
            );
            trunk.position.set(side, 1, z);
            scene.add(trunk);
            
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1, 4, 4),
                leavesMat
            );
            leaves.position.set(side, 2.5, z);
            scene.add(leaves);
        }
        
        // Iconos de personajes en las paredes (12 frases)
        const characterIcons = [
            { path: '../assets/icons/GisselInactiveIcon.png', pos: [-4.8, 2, 10], whisper: 'Gissel: "No te rindas..."' },
            { path: '../assets/icons/IA777NormalIcon.png', pos: [4.8, 2, 15], whisper: 'iA777: "Sistema... alerta..."' },
            { path: '../assets/icons/LunaNormalIcon.png', pos: [-4.8, 2, 20], whisper: 'Luna: "Sigue adelante..."' },
            { path: '../assets/icons/AngelNormalIcon.png', pos: [4.8, 2, 25], whisper: 'Angel: "La luz te guía..."' },
            { path: '../assets/icons/IrisNormalIcon.png', pos: [-4.8, 2, 30], whisper: 'Iris: "Puedo sentirte..."' },
            { path: '../assets/icons/MollyNormalIcon.png', pos: [4.8, 2, 35], whisper: 'Molly: "Confía en ti..."' },
            { path: '../assets/icons/GisselInactiveIcon.png', pos: [-4.8, 2, 40], whisper: 'Gissel: "¡Eres fuerte!"' },
            { path: '../assets/icons/IA777NormalIcon.png', pos: [4.8, 2, 45], whisper: 'iA777: "Continuar... misión..."' },
            { path: '../assets/icons/LunaNormalIcon.png', pos: [-4.8, 2, 50], whisper: 'Luna: "Ya casi..."' },
            { path: '../assets/icons/AngelNormalIcon.png', pos: [4.8, 2, 55], whisper: 'Angel: "Bendiciones..."' },
            { path: '../assets/icons/IrisNormalIcon.png', pos: [-4.8, 2, 60], whisper: 'Iris: "Estás cerca..."' },
            { path: '../assets/icons/MollyNormalIcon.png', pos: [4.8, 2, 65], whisper: 'Molly: "No pares ahora..."' }
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
        
        // Lluvia (150 partículas)
        this.rainParticles = [];
        for(let i = 0; i < 150; i++) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([0, 0, 0, 0, -0.3, 0]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const material = new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
            const rain = new THREE.Line(geometry, material);
            
            rain.position.set(
                (Math.random() - 0.5) * 30,
                Math.random() * 10 + 5,
                (Math.random() - 0.5) * 30
            );
            
            rain.userData.velocity = Math.random() * 0.3 + 0.2;
            scene.add(rain);
            this.rainParticles.push(rain);
        }
        
        // Castillo al final del pasillo
        const castleWall = new THREE.Mesh(
            new THREE.BoxGeometry(10, 8, 1),
            new THREE.MeshBasicMaterial({ color: 0x4a4a4a })
        );
        castleWall.position.set(0, 4, 99);
        scene.add(castleWall);
        
        // Torres del castillo
        for(let x of [-4, 4]) {
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1.2, 10, 8),
                new THREE.MeshBasicMaterial({ color: 0x3a3a3a })
            );
            tower.position.set(x, 5, 99);
            scene.add(tower);
            
            const towerTop = new THREE.Mesh(
                new THREE.ConeGeometry(1.5, 2, 8),
                new THREE.MeshBasicMaterial({ color: 0x8b0000 })
            );
            towerTop.position.set(x, 11, 99);
            scene.add(towerTop);
        }
        
        // Puerta del castillo
        const castleDoor = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x2a1a0a })
        );
        castleDoor.position.set(0, 2, 98.5);
        scene.add(castleDoor);
        
        // Luz dorada sobre castillo
        const castleLight = new THREE.PointLight(0xffd700, 3, 20);
        castleLight.position.set(0, 6, 98);
        scene.add(castleLight);
        
        // Luz ambiental tenue
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambient);
        
        camera.position.set(0, 1.6, 5);
        camera.lookAt(0, 1.6, 10);
        showMonologue('Un pasillo... con pasto...');
        
        setTimeout(() => {
            showMonologue('Escucho... susurros...');
            setTimeout(() => {
                showMonologue('Al final... ¿un castillo?');
            }, 3000);
        }, 3000);
    }
    
    updateCourtyard(delta) {
        // Actualizar gamepad
        this.updateGamepad();
        
        // Actualizar isRunning ANTES de calcular movimiento
        if(!this.isRunning) this.isRunning = this.keys['shift'];
        
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

        // Límites del pasillo (10x100m)
        camera.position.x = Math.max(-4.5, Math.min(4.5, camera.position.x));
        camera.position.z = Math.max(5, Math.min(95, camera.position.z));
        
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
        
        // Verificar si llegó al castillo
        if(camera.position.z >= 93) {
            this.finishChapter();
        }
    }

    finishChapter() {
        this.phase = 'finished';
        
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
                    showMonologue('Proyecto 666... ¿Qué han creado?');
                    setTimeout(() => {
                        // Texto "CONTINUARÁ" con efecto dramático
                        const continueText = document.createElement('div');
                        continueText.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#ff0000;font-size:64px;font-weight:bold;text-shadow:0 0 30px #ff0000;z-index:10000;opacity:0;transition:opacity 1s;letter-spacing:10px;';
                        continueText.textContent = 'CONTINUARÁ...';
                        document.body.appendChild(continueText);
                        setTimeout(() => continueText.style.opacity = '1', 100);
                        
                        setTimeout(() => {
                            this.active = false;
                            const bar = document.getElementById('ch2StaminaBar');
                            if(bar) bar.remove();
                            location.reload();
                        }, 3000);
                    }, 3000);
                }, 3000);
            }, 3000);
        }, 2000);
    }

    playWhisper() {
        if(!this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 + Math.random() * 100, this.audioContext.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 2);
    }
    
    readNote(note) {
        // Sonido de papel
        this.playPaperSound();
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;color:#fff;padding:30px;border:3px solid #ff0000;border-radius:10px;max-width:500px;z-index:2000;font-family:monospace;box-shadow:0 0 30px rgba(255,0,0,0.5);';
        modal.innerHTML = `
            <h2 style="color:#ff0000;margin:0 0 15px 0;text-align:center;">${note.userData.title}</h2>
            <p style="margin:0;line-height:1.8;font-size:16px;">${note.userData.text}</p>
            <button onclick="this.parentElement.remove()" style="margin-top:20px;padding:10px 20px;background:#ff0000;color:#fff;border:none;border-radius:5px;cursor:pointer;width:100%;font-size:16px;">Cerrar [E]</button>
        `;
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
        
        if(this.collectedIcons.length >= this.totalIcons) {
            setTimeout(() => {
                showMonologue('¡Todos los iconos recolectados! La puerta está desbloqueada.');
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
}

const chapter2 = new Chapter2();
