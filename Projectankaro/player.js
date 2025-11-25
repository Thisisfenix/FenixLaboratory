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
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            flatShading: true,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), mat);
        torso.position.y = 0.4;
        torso.castShadow = true;
        group.add(torso);
        
        // Cabeza
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
        head.position.y = 1.15;
        head.castShadow = true;
        group.add(head);
        
        // Ojos
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
        const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.12, 1.2, 0.23);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.12, 1.2, 0.23);
        group.add(eyeR);
        
        // Brazos
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), mat);
        armL.position.set(-0.4, 0.3, 0);
        armL.castShadow = true;
        group.add(armL);
        this.armL = armL;
        
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), mat);
        armR.position.set(0.4, 0.3, 0);
        armR.castShadow = true;
        group.add(armR);
        this.armR = armR;
        
        // Linterna en la mano
        const flashlight = new THREE.Group();
        const flashBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 })
        );
        flashBody.rotation.x = Math.PI / 2;
        flashlight.add(flashBody);
        
        const flashHead = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.08, 0.1, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
        );
        flashHead.rotation.x = Math.PI / 2;
        flashHead.position.z = 0.25;
        flashlight.add(flashHead);
        
        const flashGlass = new THREE.Mesh(
            new THREE.CircleGeometry(0.09, 8),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0 })
        );
        flashGlass.position.z = 0.26;
        flashlight.add(flashGlass);
        
        flashlight.position.set(0.4, -0.1, 0.3);
        flashlight.rotation.x = -Math.PI / 6;
        group.add(flashlight);
        this.flashlight = flashlight;
        this.flashGlass = flashGlass;
        
        // Luz de la linterna
        this.flashSpotLight = new THREE.SpotLight(0xffffaa, 0, 12, Math.PI / 7, 0.5);
        this.flashSpotLight.position.set(0, 0, 0.3);
        this.flashSpotLight.target.position.set(0, 0, 10);
        flashlight.add(this.flashSpotLight);
        flashlight.add(this.flashSpotLight.target);
        
        // Piernas
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), mat);
        legL.position.set(-0.15, -0.35, 0);
        legL.castShadow = true;
        group.add(legL);
        this.legL = legL;
        
        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), mat);
        legR.position.set(0.15, -0.35, 0);
        legR.castShadow = true;
        group.add(legR);
        this.legR = legR;
        
        group.position.copy(this.position);
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
        
        // Rotación suave
        if (this.targetRotation !== undefined) {
            let diff = this.targetRotation - this.mesh.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.mesh.rotation.y += diff * 0.15;
        }
        
        const moving = this.lastPos && this.position.distanceTo(this.lastPos) > 0.01;
        
        if (moving) {
            const speed = isRunning ? 15 : 10;
            const intensity = isRunning ? 0.5 : 0.3;
            this.walkCycle += delta * speed;
            const swing = Math.sin(this.walkCycle) * intensity;
            
            if (this.armL) this.armL.rotation.x = swing;
            if (this.armR) this.armR.rotation.x = -swing * 0.5;
            if (this.legL) this.legL.rotation.x = -swing;
            if (this.legR) this.legR.rotation.x = swing;
            
            const bobIntensity = isRunning ? 0.08 : 0.05;
            this.mesh.position.y = this.position.y + Math.abs(Math.sin(this.walkCycle)) * bobIntensity;
        } else {
            this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.002) * 0.02;
            
            if (this.armL) this.armL.rotation.x *= 0.9;
            if (this.armR) this.armR.rotation.x *= 0.9;
            if (this.legL) this.legL.rotation.x *= 0.9;
            if (this.legR) this.legR.rotation.x *= 0.9;
        }
        
        this.lastPos = this.position.clone();
    }

    setFlashlightOn(on) {
        if (this.flashGlass) {
            this.flashGlass.material.emissiveIntensity = on ? 1 : 0;
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
