// Game.js - Mecánicas principales del juego
class Game {
    constructor() {
        this.timeLimit = 600; // 10 minutos en segundos
        this.timeRemaining = this.timeLimit;
        this.isRunning = false;
        this.items = [];
        this.generators = [];
        this.generatorsRepaired = 0;
        this.totalGenerators = 5;
        this.entity = null;
        this.entityActive = false;
        this.entityTarget = null;
        this.entitySpeed = 0.06;
        this.entityChaseSpeed = 0.12;
        this.entityVisionRange = 15;
        this.entityLoseRange = 25;
    }

    init() {
        this.createMap();
        this.spawnItems();
        this.spawnGenerators();
        this.spawnEntity();
        this.createUI();
        this.startTimer();
        
        // Posicionar jugadores en el mapa
        const spawnPositions = [
            { x: -20, z: -20 },
            { x: 20, z: -20 },
            { x: -20, z: 20 },
            { x: 20, z: 20 },
            { x: 0, z: -25 },
            { x: 0, z: 25 },
            { x: -25, z: 0 },
            { x: 25, z: 0 }
        ];
        
        playerManager.players.forEach((player, i) => {
            const pos = spawnPositions[i] || spawnPositions[0];
            player.setPosition(pos.x, 1, pos.z);
        });
    }

    createMap() {
        // Suelo grande
        engine.createFloor(100, 0x1a1a1a);

        // Paredes exteriores
        engine.createBox(100, 5, 1, 0x2a2a2a, 0, 2.5, -50);
        engine.createBox(100, 5, 1, 0x2a2a2a, 0, 2.5, 50);
        engine.createBox(1, 5, 100, 0x2a2a2a, -50, 2.5, 0);
        engine.createBox(1, 5, 100, 0x2a2a2a, 50, 2.5, 0);

        // Obstáculos/edificios (reducido a 8)
        for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const w = Math.random() * 5 + 3;
            const h = Math.random() * 4 + 2;
            const d = Math.random() * 5 + 3;
            engine.createBox(w, h, d, 0x3a3a3a, x, h/2, z);
        }

        // Solo 1 luz central (optimizado)
        engine.addPointLight(0xff0000, 1.5, 40, 0, 8, 0);
    }

    spawnItems() {
        // Items para recoger (herramientas) - sin luces individuales
        for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 70;
            const z = (Math.random() - 0.5) * 70;
            
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.5
            });
            const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const item = new THREE.Mesh(geo, mat);
            item.position.set(x, 0.5, z);
            item.castShadow = false;
            item.receiveShadow = false;
            item.userData.type = 'tool';
            item.userData.collected = false;
            engine.addObject(item);
            
            this.items.push(item);
        }
    }

    spawnGenerators() {
        // Generadores para reparar - sin luces individuales
        const positions = [
            { x: -30, z: -30 },
            { x: 30, z: -30 },
            { x: -30, z: 30 },
            { x: 30, z: 30 },
            { x: 0, z: 0 }
        ];

        positions.forEach((pos, i) => {
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                emissive: 0xff0000,
                emissiveIntensity: 0.3
            });
            const geo = new THREE.BoxGeometry(2, 1.5, 1);
            const gen = new THREE.Mesh(geo, mat);
            gen.position.set(pos.x, 0.75, pos.z);
            gen.castShadow = false;
            gen.receiveShadow = true;
            gen.userData.type = 'generator';
            gen.userData.repaired = false;
            gen.userData.progress = 0;
            gen.userData.requiredTools = 2;
            engine.addObject(gen);
            
            this.generators.push(gen);
        });
    }

    spawnEntity() {
        const group = new THREE.Group();
        
        // Cuerpo oscuro (geometría simplificada)
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.4, 2.5, 6),
            new THREE.MeshStandardMaterial({ 
                color: 0x0a0a0a, 
                emissive: 0x330000,
                emissiveIntensity: 0.5
            })
        );
        body.castShadow = false;
        group.add(body);
        
        // Cabeza (geometría simplificada)
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 6, 6),
            new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.8
            })
        );
        head.position.y = 1.5;
        head.castShadow = false;
        group.add(head);
        
        // Ojos (geometría simplificada)
        const eye1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        eye1.position.set(-0.25, 1.6, 0.5);
        group.add(eye1);
        
        const eye2 = eye1.clone();
        eye2.position.set(0.25, 1.6, 0.5);
        group.add(eye2);
        
        // Spawn más lejos de los jugadores
        group.position.set(-45, 1.25, -45);
        engine.addObject(group);
        
        this.entity = group;
        this.entityActive = true;
        
        // Inicializar sistema de patrullaje
        this.entity.userData.patrolWaypoints = [
            { x: -40, z: -40 },
            { x: 40, z: -40 },
            { x: 40, z: 40 },
            { x: -40, z: 40 },
            { x: 0, z: -40 },
            { x: 40, z: 0 },
            { x: 0, z: 40 },
            { x: -40, z: 0 }
        ];
        this.entity.userData.currentWaypoint = 0;
        this.entity.userData.patrolTarget = null;
    }

    createUI() {
        // UI ya está en el HTML (gameHUD)
    }

    startTimer() {
        this.isRunning = true;
        // Timer manejado por main.js
    }

    updateEntity(delta) {
        if (!this.entity || !this.entityActive) return;

        // Buscar jugador más cercano (optimizado - solo cada 5 frames)
        if (!this.entity.userData.updateCounter) this.entity.userData.updateCounter = 0;
        this.entity.userData.updateCounter++;
        
        if (this.entity.userData.updateCounter % 5 === 0) {
            let closestPlayer = null;
            let closestDist = Infinity;

            playerManager.players.forEach(player => {
                const dist = this.entity.position.distanceTo(player.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestPlayer = player;
                }
            });
            
            this.entity.userData.cachedClosestPlayer = closestPlayer;
            this.entity.userData.cachedClosestDist = closestDist;
        }
        
        const closestPlayer = this.entity.userData.cachedClosestPlayer;
        const closestDist = this.entity.userData.cachedClosestDist || Infinity;

        if (!closestPlayer) return;

        // Verificar si el jugador está en rango de visión
        const inVision = closestDist < this.entityVisionRange;
        const lostVision = closestDist > this.entityLoseRange;

        if (inVision) {
            this.entityTarget = closestPlayer;
        } else if (lostVision) {
            this.entityTarget = null;
        }

        // Mover hacia el objetivo
        if (this.entityTarget) {
            const direction = new THREE.Vector3()
                .subVectors(this.entityTarget.position, this.entity.position)
                .normalize();
            
            const speed = this.entityChaseSpeed;
            this.entity.position.add(direction.multiplyScalar(speed));
            
            // Rotar hacia el objetivo
            this.entity.lookAt(this.entityTarget.position);
            
            // Animación de persecución (más agresiva)
            this.entity.position.y = 1.25 + Math.sin(Date.now() * 0.015) * 0.4;
            this.entity.rotation.y += Math.sin(Date.now() * 0.01) * 0.02;
        } else {
            // Patrullar por waypoints
            if (!this.entity.userData.patrolTarget) {
                const waypoint = this.entity.userData.patrolWaypoints[this.entity.userData.currentWaypoint];
                this.entity.userData.patrolTarget = new THREE.Vector3(waypoint.x, 1.25, waypoint.z);
            }
            
            const direction = new THREE.Vector3()
                .subVectors(this.entity.userData.patrolTarget, this.entity.position)
                .normalize();
            
            const distToWaypoint = this.entity.position.distanceTo(this.entity.userData.patrolTarget);
            
            // Si llegó al waypoint, ir al siguiente
            if (distToWaypoint < 2) {
                this.entity.userData.currentWaypoint = (this.entity.userData.currentWaypoint + 1) % this.entity.userData.patrolWaypoints.length;
                this.entity.userData.patrolTarget = null;
            } else {
                this.entity.position.add(direction.multiplyScalar(this.entitySpeed));
                
                // Rotar suavemente hacia el waypoint
                const targetRotation = Math.atan2(direction.x, direction.z);
                this.entity.rotation.y += (targetRotation - this.entity.rotation.y) * 0.05;
            }
            
            // Animación de patrullaje (más calmada)
            this.entity.position.y = 1.25 + Math.sin(Date.now() * 0.005) * 0.15;
        }

        // Verificar captura
        if (closestDist < 2) {
            this.capturePlayer(closestPlayer);
        }
    }

    capturePlayer(player) {
        console.log('Player captured!');
        audioManager.playDeath();
        this.gameOver(false);
    }

    collectItem(player, item) {
        if (item.userData.collected) return;
        
        item.userData.collected = true;
        engine.removeObject(item);
        
        if (item.userData.light) {
            engine.scene.remove(item.userData.light);
        }
        
        player.userData.tools = (player.userData.tools || 0) + 1;
        
        const inv = document.getElementById('inventory');
        if (inv) inv.textContent = `🔧 Herramientas: ${player.userData.tools}`;
    }

    repairGenerator(player, generator) {
        if (generator.userData.repaired) return;
        if ((player.userData.tools || 0) < generator.userData.requiredTools) return;
        
        generator.userData.repaired = true;
        player.userData.tools -= generator.userData.requiredTools;
        this.generatorsRepaired++;
        
        // Cambiar color a verde
        generator.material.color.setHex(0x00ff00);
        generator.material.emissive.setHex(0x00ff00);
        generator.material.emissiveIntensity = 0.5;
        
        if (generator.userData.light) {
            generator.userData.light.color.setHex(0x00ff00);
        }
        
        const progress = document.getElementById('gameProgress');
        if (progress) {
            progress.textContent = `Generadores: ${this.generatorsRepaired}/${this.totalGenerators}`;
        }
        
        const inv = document.getElementById('inventory');
        if (inv) inv.textContent = `🔧 Herramientas: ${player.userData.tools}`;
        
        if (this.generatorsRepaired >= this.totalGenerators) {
            this.gameOver(true);
        }
    }

    gameOver(won) {
        this.isRunning = false;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const title = document.createElement('div');
        title.textContent = won ? '¡VICTORIA!' : 'TIEMPO AGOTADO';
        title.style.cssText = `
            font-size: 64px;
            color: ${won ? '#00ff00' : '#ff0000'};
            text-shadow: 0 0 30px ${won ? '#00ff00' : '#ff0000'};
            font-family: 'Courier New', monospace;
            margin-bottom: 30px;
        `;
        overlay.appendChild(title);
        
        const btn = document.createElement('button');
        btn.textContent = 'Volver al Lobby';
        btn.className = 'btn btn-join';
        btn.onclick = () => location.reload();
        overlay.appendChild(btn);
        
        document.body.appendChild(overlay);
    }

    update(delta) {
        this.updateEntity(delta);
    }
}

const game = new Game();
