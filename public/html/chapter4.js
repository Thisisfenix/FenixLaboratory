// Chapter 4 - C̴̢̛O̷̧͝R̶̨̛R̷̢͝U̸̧̕P̷̨̛T̸̢̕Ȩ̷͝D̶̨̛
class Chapter4 {
    constructor() {
        this.active = false;
        this.phase = 'glitch_intro';
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.velocity = new THREE.Vector3();
        this.glitchIntensity = 0;
        this.corruptionLevel = 0;
        this.realityShifts = 0;
        this.glitchObjects = [];
        this.stamina = 100;
        this.maxStamina = 100;
        this.sanity = 100;
        this.maxSanity = 100;
        this.glitchEnemies = [];
        this.collectibles = [];
        this.collectedItems = 0;
        this.totalItems = 5;
        this.randomEvents = [];
        this.monologuesShown = {};
        
        // Limitador de framerate para 144Hz
        this.maxDelta = 1/60; // Limitar a 60 FPS equivalente
    }

    start() {
        this.active = true;
        this.phase = 'glitch_intro';
        
        // Detener capítulos anteriores
        if(typeof chapter3 !== 'undefined' && chapter3) {
            chapter3.active = false;
            if(chapter3.cleanup) chapter3.cleanup();
        }
        
        this.clearScene();
        this.setupControls();
        this.startGlitchIntro();
    }

    setupControls() {
        this.keydownHandler = (e) => {
            if(!this.active) return;
            this.keys[e.key.toLowerCase()] = true;
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
    }

    startGlitchIntro() {
        // Pantalla de glitch
        const glitchScreen = document.createElement('div');
        glitchScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:10000;';
        glitchScreen.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:#fff;font-family:monospace;">
                <h1 style="font-size:80px;color:#ff0000;animation:glitch 0.3s infinite;text-shadow:2px 2px #00ff00,-2px -2px #ff00ff;">
                    C̴̢̛O̷̧͝R̶̨̛R̷̢͝U̸̧̕P̷̨̛T̸̢̕Ȩ̷͝D̶̨̛
                </h1>
                <p style="font-size:24px;color:#0f0;margin:20px;">ERROR: REALITY.EXE HAS STOPPED WORKING</p>
                <p style="font-size:18px;color:#f00;">SANITY: <span id="sanityText">100%</span></p>
            </div>
            <style>
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
            </style>
        `;
        document.body.appendChild(glitchScreen);

        setTimeout(() => {
            glitchScreen.style.transition = 'opacity 1s';
            glitchScreen.style.opacity = '0';
            setTimeout(() => {
                glitchScreen.remove();
                this.createCorruptedWorld();
            }, 1000);
        }, 3000);
    }

    createCorruptedWorld() {
        this.phase = 'exploring';
        
        // Niebla glitcheada
        scene.fog = new THREE.Fog(0x0a0a0a, 5, 30);
        
        // Luz ambiente corrupta
        const ambient = new THREE.AmbientLight(0xff00ff, 0.2);
        scene.add(ambient);

        // Suelo glitcheado (100x100m)
        for(let x = -50; x < 50; x += 5) {
            for(let z = -50; z < 50; z += 5) {
                const tile = new THREE.Mesh(
                    new THREE.PlaneGeometry(5, 5),
                    new THREE.MeshStandardMaterial({ 
                        color: Math.random() > 0.5 ? 0xff0000 : 0x00ff00,
                        emissive: Math.random() > 0.5 ? 0xff0000 : 0x00ff00,
                        emissiveIntensity: 0.3,
                        roughness: 0.8
                    })
                );
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(x, Math.random() * 0.5, z);
                scene.add(tile);
                this.glitchObjects.push(tile);
            }
        }

        // Paredes imposibles
        for(let i = 0; i < 20; i++) {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(
                    Math.random() * 5 + 1,
                    Math.random() * 10 + 5,
                    Math.random() * 5 + 1
                ),
                new THREE.MeshStandardMaterial({ 
                    color: 0x000000,
                    emissive: Math.random() > 0.5 ? 0xff0000 : 0x0000ff,
                    emissiveIntensity: 0.5,
                    wireframe: Math.random() > 0.5
                })
            );
            wall.position.set(
                (Math.random() - 0.5) * 80,
                Math.random() * 5 + 2.5,
                (Math.random() - 0.5) * 80
            );
            wall.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            scene.add(wall);
            this.glitchObjects.push(wall);
        }

        // Luces parpadeantes corruptas
        for(let i = 0; i < 15; i++) {
            const light = new THREE.PointLight(
                Math.random() > 0.5 ? 0xff0000 : 0x00ff00,
                2,
                15
            );
            light.position.set(
                (Math.random() - 0.5) * 80,
                Math.random() * 8 + 2,
                (Math.random() - 0.5) * 80
            );
            scene.add(light);
            this.glitchObjects.push(light);
        }

        // Enemigos glitcheados
        for(let i = 0; i < 5; i++) {
            const enemy = new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, 1),
                new THREE.MeshStandardMaterial({ 
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.8,
                    wireframe: true
                })
            );
            enemy.position.set(
                (Math.random() - 0.5) * 60,
                1,
                (Math.random() - 0.5) * 60
            );
            enemy.userData.speed = 0.03 + Math.random() * 0.02;
            scene.add(enemy);
            this.glitchEnemies.push(enemy);
        }
        
        // Coleccionables (fragmentos de realidad)
        for(let i = 0; i < this.totalItems; i++) {
            const item = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.5),
                new THREE.MeshStandardMaterial({ 
                    color: 0x00ffff,
                    emissive: 0x00ffff,
                    emissiveIntensity: 1
                })
            );
            item.position.set(
                (Math.random() - 0.5) * 70,
                1,
                (Math.random() - 0.5) * 70
            );
            scene.add(item);
            this.collectibles.push(item);
        }
        
        // Portal de salida (bloqueado hasta recoger items)
        const portal = new THREE.Mesh(
            new THREE.TorusGeometry(3, 0.5, 16, 32),
            new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                emissive: 0x666666,
                emissiveIntensity: 0.3
            })
        );
        portal.position.set(0, 3, -40);
        portal.rotation.x = Math.PI / 2;
        scene.add(portal);
        this.portal = portal;
        this.portalActive = false;

        camera.position.set(0, 1.6, 40);
        
        // HUD corrupto
        this.createCorruptedHUD();
        
        if(!this.monologuesShown['intro1']) {
            this.monologuesShown['intro1'] = true;
            showMonologue('¿D̴ó̶n̷d̸e̵.̶.̷.̸ ̵e̶s̷t̸o̵y̶?̸');
            setTimeout(() => {
                if(!this.monologuesShown['intro2']) {
                    this.monologuesShown['intro2'] = true;
                    showMonologue('L̴a̶ ̵r̶e̷a̸l̵i̶d̷a̸d̵.̶.̷.̸ ̵s̶e̷ ̸d̵e̶s̷m̸o̵r̶o̷n̸a̵.̶.̷.̸');
                }
            }, 3000);
        }
    }

    createCorruptedHUD() {
        const ui = document.getElementById('ui');
        if(ui) {
            ui.style.display = 'block';
            ui.innerHTML = `
                <div style="font-family:monospace;color:#f00;text-shadow:0 0 10px #f00;margin-bottom:15px;font-size:14px;animation:glitch 0.5s infinite;">
                    ⚠️ S̴Y̷S̶T̸E̵M̶ ̷C̸O̵R̶R̷U̸P̵T̶E̷D̸ ⚠️
                </div>
                <div id="sanityBar" style="background:rgba(0,0,0,0.7);padding:8px;border-left:3px solid #ff0000;margin-bottom:10px;">
                    <span style="color:#ff0000;">🧠 CORDURA:</span> <span id="sanityValue">100%</span>
                </div>
                <div id="distance" style="background:rgba(0,0,0,0.7);padding:8px;border-left:3px solid #0f0;color:#0f0;">
                    📍 R̴E̷A̶L̸I̵D̶A̷D̸: <span id="realityValue">???</span>
                </div>
            `;
        }
    }

    update(delta) {
        if(!this.active || this.phase !== 'exploring') return;
        
        // Limitar delta para monitores de alta frecuencia
        delta = Math.min(delta, this.maxDelta);

        // Movimiento
        this.velocity.x = 0;
        this.velocity.z = 0;

        const speed = 0.1;
        
        if(this.keys['w']) this.velocity.z -= speed;
        if(this.keys['s']) this.velocity.z += speed;
        if(this.keys['a']) this.velocity.x -= speed;
        if(this.keys['d']) this.velocity.x += speed;

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

        // Límites
        camera.position.x = Math.max(-45, Math.min(45, camera.position.x));
        camera.position.z = Math.max(-45, Math.min(45, camera.position.z));

        // Efectos de corrupción
        this.glitchIntensity += delta * 0.5;
        this.corruptionLevel = Math.sin(this.glitchIntensity) * 0.5 + 0.5;

        // Glitch de objetos
        this.glitchObjects.forEach(obj => {
            if(Math.random() > 0.98) {
                obj.visible = !obj.visible;
            }
            if(obj.material && obj.material.color) {
                if(Math.random() > 0.95) {
                    obj.material.color.setHex(Math.random() > 0.5 ? 0xff0000 : 0x00ff00);
                }
            }
        });
        
        // Enemigos persiguen al jugador
        this.glitchEnemies.forEach(enemy => {
            const dir = new THREE.Vector3();
            dir.subVectors(camera.position, enemy.position).normalize();
            enemy.position.add(dir.multiplyScalar(enemy.userData.speed));
            enemy.rotation.y += delta * 5;
            
            // Colisión con jugador
            const dist = camera.position.distanceTo(enemy.position);
            if(dist < 2) {
                const key = 'enemy_hit_' + Math.floor(Date.now() / 2000);
                if(!this.monologuesShown[key]) {
                    this.monologuesShown[key] = true;
                    this.sanity -= 10;
                    enemy.position.set(
                        (Math.random() - 0.5) * 60,
                        1,
                        (Math.random() - 0.5) * 60
                    );
                    showMonologue('¡T̴E̷ ̶A̸T̵R̶A̷P̸Ó̶!');
                }
            }
        });
        
        // Recoger coleccionables
        for(let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            item.rotation.y += delta * 3;
            item.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.3;
            
            const dist = camera.position.distanceTo(item.position);
            if(dist < 2) {
                scene.remove(item);
                this.collectibles.splice(i, 1);
                this.collectedItems++;
                this.sanity = Math.min(this.maxSanity, this.sanity + 20);
                
                const key = 'fragment_' + this.collectedItems;
                if(!this.monologuesShown[key]) {
                    this.monologuesShown[key] = true;
                    showMonologue(`Fragmento ${this.collectedItems}/${this.totalItems} recogido`);
                }
                
                if(this.collectedItems >= this.totalItems && !this.monologuesShown['all_fragments']) {
                    this.monologuesShown['all_fragments'] = true;
                    this.activatePortal();
                }
            }
        }
        
        // Eventos aleatorios
        if(Math.random() > 0.995) {
            this.triggerRandomEvent();
        }

        // Rotar portal
        if(this.portal) {
            this.portal.rotation.z += delta * 2;
        }

        // Pérdida de cordura
        this.sanity -= delta * 2;
        if(this.sanity < 0) this.sanity = 0;

        // Actualizar HUD
        const sanityValue = document.getElementById('sanityValue');
        if(sanityValue) {
            sanityValue.textContent = Math.floor(this.sanity) + '%';
            sanityValue.style.color = this.sanity < 30 ? '#ff0000' : '#ffaa00';
        }

        const realityValue = document.getElementById('realityValue');
        if(realityValue) {
            const glitchText = ['???', 'ERROR', 'NULL', '666', 'HELP', '---'];
            realityValue.textContent = glitchText[Math.floor(Math.random() * glitchText.length)];
        }

        // Efecto de cámara glitch
        if(Math.random() > 0.97) {
            camera.position.y = 1.6 + (Math.random() - 0.5) * 0.3;
        }

        // Llegar al portal (solo si está activo)
        if(this.portalActive) {
            const distToPortal = camera.position.distanceTo(this.portal.position);
            if(distToPortal < 5) {
                this.enterPortal();
            }
        }

        // Game over por cordura
        if(this.sanity <= 0) {
            this.corruptedGameOver();
        }
    }

    activatePortal() {
        this.portalActive = true;
        this.portal.material.color.setHex(0xffffff);
        this.portal.material.emissive.setHex(0xffffff);
        this.portal.material.emissiveIntensity = 1;
        if(!this.monologuesShown['portal_activated']) {
            this.monologuesShown['portal_activated'] = true;
            showMonologue('¡Portal activado! Dirígete a la salida');
        }
    }
    
    triggerRandomEvent() {
        const key = 'random_event_' + Math.floor(Date.now() / 10000);
        if(this.monologuesShown[key]) return;
        this.monologuesShown[key] = true;
        
        const events = [
            () => {
                showMonologue('R̴E̷A̶L̸I̵D̶A̷D̸ ̶D̷I̵S̶T̸O̵R̶S̸I̵O̶N̷A̸D̶A̷');
                camera.position.y = 1.6 + (Math.random() - 0.5) * 2;
            },
            () => {
                showMonologue('T̴E̷M̶P̸O̵R̶A̷L̸ ̶G̷L̸I̵T̶C̸H̷');
                this.glitchIntensity += 10;
            },
            () => {
                showMonologue('E̴N̷E̶M̸I̵G̶O̷S̸ ̶M̷U̸L̵T̶I̷P̸L̵I̶C̶A̷D̸O̵S̷');
                const enemy = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 2, 1),
                    new THREE.MeshStandardMaterial({ 
                        color: 0xff0000,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.8,
                        wireframe: true
                    })
                );
                enemy.position.set(
                    (Math.random() - 0.5) * 60,
                    1,
                    (Math.random() - 0.5) * 60
                );
                enemy.userData.speed = 0.05;
                scene.add(enemy);
                this.glitchEnemies.push(enemy);
            },
            () => {
                showMonologue('C̴O̷R̶D̸U̵R̶A̷ ̶R̷E̸S̵T̶A̷U̸R̵A̶D̷A̸');
                this.sanity = Math.min(this.maxSanity, this.sanity + 30);
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        event();
    }
    
    enterPortal() {
        if(this.phase === 'portal') return;
        this.phase = 'portal';
        
        if(!this.monologuesShown['portal_enter']) {
            this.monologuesShown['portal_enter'] = true;
            showMonologue('E̴l̶ ̷p̸o̵r̶t̷a̸l̵.̶.̷.̸');
        }
        
        setTimeout(() => {
            this.finishChapter();
        }, 2000);
    }

    corruptedGameOver() {
        this.phase = 'gameover';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:10000;';
        overlay.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:#f00;font-family:monospace;animation:glitch 0.3s infinite;">
                <h1 style="font-size:100px;">C̴O̷R̶R̷U̸P̷T̸E̷D̶</h1>
                <p style="font-size:30px;margin:40px 0;">SANITY: 0%</p>
                <button onclick="location.reload()" style="padding:20px 50px;font-size:24px;background:#f00;color:#000;border:none;cursor:pointer;margin-top:40px;">REINICIAR</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    finishChapter() {
        this.phase = 'finished';
        localStorage.setItem('chapter4Completed', 'true');
        
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:10000;opacity:0;transition:opacity 2s;';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
            setTimeout(() => {
                overlay.style.background = '#000';
                overlay.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;color:#fff;font-family:Arial,sans-serif;text-align:center;">
                        <h1 style="font-size:80px;color:#0f0;text-shadow:0 0 40px #0f0;margin:0;">CAPÍTULO 4 COMPLETADO</h1>
                        <p style="font-size:30px;color:#fff;margin:40px 0;">Escapaste de la realidad corrupta</p>
                        <p style="font-size:20px;color:#888;margin:20px;">Cordura final: ${Math.floor(this.sanity)}%</p>
                        <button onclick="location.reload()" style="padding:20px 50px;font-size:28px;background:#0f0;color:#000;border:none;border-radius:15px;cursor:pointer;margin-top:40px;font-weight:bold;">🔙 Volver al Menú</button>
                    </div>
                `;
            }, 2000);
        }, 100);
    }

    cleanup() {
        this.active = false;
        if(this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
        if(this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
        if(this.mousemoveHandler) document.removeEventListener('mousemove', this.mousemoveHandler);
        if(this.clickHandler && renderer && renderer.domElement) {
            renderer.domElement.removeEventListener('click', this.clickHandler);
        }
    }
}

const chapter4 = new Chapter4();
