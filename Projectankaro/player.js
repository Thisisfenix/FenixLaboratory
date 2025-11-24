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
        // Cuerpo del jugador (cápsula simple)
        const group = new THREE.Group();
        
        // Cuerpo
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: this.color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        group.add(body);
        
        // Cabeza
        const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: this.color });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1;
        head.castShadow = true;
        group.add(head);
        
        group.position.copy(this.position);
        this.mesh = group;
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
        this.rotation = y;
        if (this.mesh) {
            this.mesh.rotation.y = this.rotation;
        }
    }

    update(delta) {
        // Animación idle (respiración)
        if (this.mesh) {
            this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.002) * 0.05;
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
        this.players.forEach(player => player.update(delta));
    }

    clear() {
        this.players.forEach(player => player.remove());
        this.players.clear();
        this.localPlayer = null;
    }
}

const playerManager = new PlayerManager();
