// Engine.js - Motor 3D Core
class Engine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.objects = [];
        this.lights = [];
    }

    init() {
        console.log('Initializing engine...');
        
        try {
            // Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0a0a0a);
            this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
            console.log('Scene created');

            // Camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
            console.log('Camera created');

            // Renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: false,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.BasicShadowMap;
            
            // Asegurar que el canvas se agregue al body
            const existingCanvas = document.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            document.body.appendChild(this.renderer.domElement);
            console.log('Renderer created and canvas added to DOM');

            // Lights
            this.addAmbientLight(0x404040, 0.5);
            this.addDirectionalLight(0xffffff, 0.8, 10, 10, 10);
            console.log('Lights added');

            // Resize
            window.addEventListener('resize', () => this.onResize());

            console.log('Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('Engine initialization error:', error);
            return false;
        }
    }

    addAmbientLight(color, intensity) {
        const light = new THREE.AmbientLight(color, intensity);
        this.scene.add(light);
        this.lights.push(light);
        return light;
    }

    addDirectionalLight(color, intensity, x, y, z) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        this.scene.add(light);
        this.lights.push(light);
        return light;
    }

    addPointLight(color, intensity, distance, x, y, z) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(x, y, z);
        light.castShadow = true;
        this.scene.add(light);
        this.lights.push(light);
        return light;
    }

    addObject(mesh) {
        this.scene.add(mesh);
        this.objects.push(mesh);
        return mesh;
    }

    removeObject(mesh) {
        this.scene.remove(mesh);
        const index = this.objects.indexOf(mesh);
        if (index > -1) this.objects.splice(index, 1);
    }

    createFloor(size, color) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.addObject(floor);
        return floor;
    }

    createBox(w, h, d, color, x, y, z) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(x, y, z);
        box.castShadow = true;
        box.receiveShadow = true;
        this.addObject(box);
        return box;
    }

    createSphere(radius, color, x, y, z) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        this.addObject(sphere);
        return sphere;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update() {
        const delta = this.clock.getDelta();
        // Update logic aquí
        return delta;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// Instancia global
const engine = new Engine();
