// Player.js - Sistema de jugadores
class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.mesh = null;
        this.nameTag = null;
        this.position = new THREE.Vector3(0, 1, 0);
        this.rotation = 0;
        this.isLocal = false;
    }

    create() {
        const group = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: this.color });
        
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), mat);
        torso.position.y = 0.4;
        group.add(torso);
        
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
        head.position.y = 1.15;
        group.add(head);
        
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.12, 1.2, 0.23);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.12, 1.2, 0.23);
        group.add(eyeR);
        
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), mat);
        armL.position.set(-0.4, 0.3, 0);
        group.add(armL);
        this.armL = armL;
        
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), mat);
        armR.position.set(0.4, 0.3, 0);
        group.add(armR);
        this.armR = armR;
        
        const flashlight = new THREE.Group();
        const flashBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        flashBody.rotation.x = Math.PI / 2;
        flashlight.add(flashBody);
        
        const flashGlass = new THREE.Mesh(
            new THREE.CircleGeometry(0.09, 6),
            new THREE.MeshBasicMaterial({ color: 0x444444 })
        );
        flashGlass.position.z = 0.21;
        flashlight.add(flashGlass);
        this.flashGlass = flashGlass;
        
        flashlight.position.set(0.4, -0.1, 0.3);
        flashlight.rotation.x = -Math.PI / 6;
        group.add(flashlight);
        this.flashlight = flashlight;
        
        this.flashSpotLight = new THREE.SpotLight(0xffffaa, 0, 12, Math.PI / 7, 0.5);
        this.flashSpotLight.position.set(0, 0, 0.3);
        this.flashSpotLight.target.position.set(0, 0, 10);
        flashlight.add(this.flashSpotLight);
        flashlight.add(this.flashSpotLight.target);
        
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), mat);
        legL.position.set(-0.15, -0.35, 0);
        group.add(legL);
        this.legL = legL;
        
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), mat);
        legR.position.set(0.15, -0.35, 0);
        group.add(legR);
        this.legR = legR;
        
        group.position.copy(this.position);
        group.matrixAutoUpdate = true;
        this.mesh = group;
        this.walkCycle = 0;
        engine.addObject(this.mesh);
        
        return this.mesh;
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    setRotation(y) {
        this.targetRotation = y;
    }

    update(delta, isRunning = false) {
        if (!this.mesh) return;
        
        if (this.targetRotation !== undefined) {
            let diff = this.targetRotation - this.mesh.rotation.y;
            if (diff > Math.PI) diff -= Math.PI * 2;
            else if (diff < -Math.PI) diff += Math.PI * 2;
            this.mesh.rotation.y += diff * 0.15;
        }
        
        if (!this.lastPos) this.lastPos = new THREE.Vector3();
        const dx = this.position.x - this.lastPos.x;
        const dz = this.position.z - this.lastPos.z;
        const moving = dx * dx + dz * dz > 0.0001;
        
        if (moving) {
            this.walkCycle += delta * (isRunning ? 15 : 10);
            const swing = Math.sin(this.walkCycle) * (isRunning ? 0.5 : 0.3);
            
            this.armL.rotation.x = swing;
            this.armR.rotation.x = -swing * 0.5;
            this.legL.rotation.x = -swing;
            this.legR.rotation.x = swing;
            
            this.mesh.position.y = this.position.y + Math.abs(Math.sin(this.walkCycle)) * (isRunning ? 0.08 : 0.05);
        } else {
            this.mesh.position.y = this.position.y;
        }
        
        this.lastPos.copy(this.position);
    }

    setFlashlightOn(on) {
        if (this.flashGlass) {
            this.flashGlass.material.color.setHex(on ? 0xffff00 : 0x444444);
        }
        if (this.flashSpotLight) {
            this.flashSpotLight.intensity = on ? 1.2 : 0;
        }
    }
    
    remove() {
        if (this.mesh) {
            engine.removeObject(this.mesh);
            this.mesh = null;
        }
    }
}

// Manager de jugadores
class PlayerManager {
    constructor() {
        this.players = new Map();
        this.localPlayer = null;
    }

    addPlayer(id, name, color, isLocal = false) {
        const player = new Player(id, name, color);
        player.isLocal = isLocal;
        player.create();
        this.players.set(id, player);
        
        if (isLocal) {
            this.localPlayer = player;
        }
        
        return player;
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            player.remove();
            this.players.delete(id);
        }
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    update(delta) {
        this.players.forEach(player => {
            const isRunning = player.isLocal && gameplay.isRunning;
            player.update(delta, isRunning);
        });
    }

    clear() {
        this.players.forEach(player => player.remove());
        this.players.clear();
        this.localPlayer = null;
    }
}

const playerManager = new PlayerManager();
