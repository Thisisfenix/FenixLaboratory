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
    }

    createMap() {
        // Suelo grande
        engine.createFloor(100, 0x1a1a1a);

        // Paredes exteriores
        engine.createBox(100, 5, 1, 0x2a2a2a, 0, 2.5, -50);
        engine.createBox(100, 5, 1, 0x2a2a2a, 0, 2.5, 50);
        engine.createBox(1, 5, 100, 0x2a2a2a, -50, 2.5, 0);
        engine.createBox(1, 5, 100, 0x2a2a2a, 50, 2.5, 0);

        // Obstáculos/edificios
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const w = Math.random() * 5 + 3;
            const h = Math.random() * 4 + 2;
            const d = Math.random() * 5 + 3;
            engine.createBox(w, h, d, 0x3a3a3a, x, h/2, z);
        }

        // Luces
        engine.addPointLight(0xff0000, 1, 30, 0, 5, 0);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 30;
            const z = Math.sin(angle) * 30;
            engine.addPointLight(0xffffff, 0.5, 20, x, 4, z);
        }
    }

    spawnItems() {
        // Items para recoger (herramientas)
        for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 70;
            const z = (Math.random() - 0.5) * 70;
            
            const item = engine.createBox(0.5, 0.5, 0.5, 0xffd700, x, 0.5, z);
            item.userData.type = 'tool';
            item.userData.collected = false;
            
            const light = engine.addPointLight(0xffd700, 0.8, 5, x, 1, z);
            item.userData.light = light;
            
            this.items.push(item);
        }
    }

    spawnGenerators() {
        // Generadores para reparar
        const positions = [
            { x: -30, z: -30 },
            { x: 30, z: -30 },
            { x: -30, z: 30 },
            { x: 30, z: 30 },
            { x: 0, z: 0 }
        ];

        positions.forEach((pos, i) => {
            const gen = engine.createBox(2, 1.5, 1, 0x444444, pos.x, 0.75, pos.z);
            gen.userData.type = 'generator';
            gen.userData.repaired = false;
            gen.userData.progress = 0;
            gen.userData.requiredTools = 2;
            
            const light = engine.addPointLight(0xff0000, 1, 8, pos.x, 2, pos.z);
            gen.userData.light = light;
            
            this.generators.push(gen);
        });
    }

    spawnEntity() {
        const group = new THREE.Group();
        
        // Cuerpo oscuro
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.4, 2.5, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0x0a0a0a, 
                emissive: 0x330000,
                emissiveIntensity: 0.5
            })
        );
        group.add(body);
        
        // Cabeza
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.8
            })
        );
        head.position.y = 1.5;
        group.add(head);
        
        // Ojos
        const eye1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        eye1.position.set(-0.25, 1.6, 0.5);
        group.add(eye1);
        
        const eye2 = eye1.clone();
        eye2.position.set(0.25, 1.6, 0.5);
        group.add(eye2);
        
        // Luz roja
        const light = new THREE.PointLight(0xff0000, 2, 15);
        light.position.y = 1.5;
        group.add(light);
        
        group.position.set(0, 1.25, -40);
        engine.addObject(group);
        
        this.entity = group;
        this.entityActive = true;
    }

    createUI() {
        // Timer
        const timer = document.createElement('div');
        timer.id = 'gameTimer';
        timer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            color: #ff0000;
            text-shadow: 0 0 30px #ff0000, 0 0 60px #ff0000;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            z-index: 100;
            pointer-events: none;
        `;
        document.body.appendChild(timer);

        // Progreso
        const progress = document.createElement('div');
        progress.id = 'gameProgress';
        progress.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 24px;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            font-family: 'Courier New', monospace;
            z-index: 100;
        `;
        progress.textContent = `Generadores: 0/${this.totalGenerators}`;
        document.body.appendChild(progress);

        // Inventario
        const inventory = document.createElement('div');
        inventory.id = 'inventory';
        inventory.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 20px;
            color: #ffd700;
            text-shadow: 0 0 10px #ffd700;
            font-family: 'Courier New', monospace;
            z-index: 100;
        `;
        inventory.textContent = '🔧 Herramientas: 0';
        document.body.appendChild(inventory);
    }

    startTimer() {
        this.isRunning = true;
        
        setInterval(() => {
            if (!this.isRunning) return;
            
            this.timeRemaining--;
            
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            const timerEl = document.getElementById('gameTimer');
            
            if (timerEl) {
                timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Cambiar color según tiempo
                if (this.timeRemaining < 60) {
                    timerEl.style.color = '#ff0000';
                    timerEl.style.animation = 'pulse 1s infinite';
                } else if (this.timeRemaining < 180) {
                    timerEl.style.color = '#ff6600';
                }
            }
            
            if (this.timeRemaining <= 0) {
                this.gameOver(false);
            }
        }, 1000);
    }

    updateEntity(delta) {
        if (!this.entity || !this.entityActive) return;

        // Buscar jugador más cercano
        let closestPlayer = null;
        let closestDist = Infinity;

        playerManager.players.forEach(player => {
            const dist = this.entity.position.distanceTo(player.position);
            if (dist < closestDist) {
                closestDist = dist;
                closestPlayer = player;
            }
        });

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
            
            // Animación de persecución
            this.entity.position.y = 1.25 + Math.sin(Date.now() * 0.01) * 0.3;
        } else {
            // Patrullar aleatoriamente
            if (!this.entity.userData.patrolTarget || Math.random() < 0.01) {
                this.entity.userData.patrolTarget = new THREE.Vector3(
                    (Math.random() - 0.5) * 80,
                    1.25,
                    (Math.random() - 0.5) * 80
                );
            }
            
            const direction = new THREE.Vector3()
                .subVectors(this.entity.userData.patrolTarget, this.entity.position)
                .normalize();
            
            this.entity.position.add(direction.multiplyScalar(this.entitySpeed));
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
