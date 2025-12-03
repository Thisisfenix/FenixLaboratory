// Engine.js - Motor 3D Core Optimizado
class Engine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        this.objects = [];
        this.lights = [];
        
        // Optimizaciones FPS
        this.targetFPS = Math.min(screen.refreshRate || 60, 120);
        this.frameTime = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        this.deltaAccumulator = 0;
        this.maxDelta = 1/30; // Limitar delta para evitar saltos
        
        // Pool de objetos para evitar GC
        this.objectPool = new Map();
        this.geometryCache = new Map();
        this.materialCache = new Map();
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

            // Renderer optimizado para FPS
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: false,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
                logarithmicDepthBuffer: false,
                precision: 'mediump'
            });
            
            // Ajustar pixel ratio según rendimiento
            const pixelRatio = this.getOptimalPixelRatio();
            this.renderer.setPixelRatio(pixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Sombras optimizadas
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.BasicShadowMap;
            this.renderer.shadowMap.autoUpdate = false;
            
            // Optimizaciones adicionales
            this.renderer.sortObjects = false;
            this.renderer.autoClear = true;
            this.renderer.info.autoReset = false;
            
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
        // Sombras de menor resolución para mejor rendimiento
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 50;
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
        const geometry = this.getCachedGeometry('plane', [size, size]);
        const material = this.getCachedMaterial('lambert', { 
            color: color,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floor.matrixAutoUpdate = false;
        floor.updateMatrix();
        this.addObject(floor);
        return floor;
    }

    createBox(w, h, d, color, x, y, z) {
        const geometry = this.getCachedGeometry('box', [w, h, d]);
        const material = this.getCachedMaterial('lambert', { color: color });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(x, y, z);
        box.castShadow = true;
        box.receiveShadow = true;
        box.matrixAutoUpdate = false;
        box.updateMatrix();
        this.addObject(box);
        return box;
    }

    createSphere(radius, color, x, y, z) {
        const geometry = this.getCachedGeometry('sphere', [radius, 12, 12]); // Menos segmentos
        const material = this.getCachedMaterial('lambert', { color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.matrixAutoUpdate = false;
        sphere.updateMatrix();
        this.addObject(sphere);
        return sphere;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getOptimalPixelRatio() {
        const deviceRatio = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 1;
        
        // Detectar GPU y ajustar pixel ratio
        const renderer = gl.getParameter(gl.RENDERER);
        const isLowEnd = renderer.includes('Intel') || renderer.includes('Mali') || renderer.includes('Adreno');
        
        if (isLowEnd) return Math.min(deviceRatio, 1);
        return Math.min(deviceRatio, 2);
    }
    
    update(currentTime) {
        // Control de framerate adaptativo
        if (currentTime - this.lastFrameTime < this.frameTime) {
            return null; // Skip frame
        }
        
        const rawDelta = this.clock.getDelta();
        const delta = Math.min(rawDelta, this.maxDelta);
        
        this.lastFrameTime = currentTime;
        this.deltaAccumulator += delta;
        
        // Limpiar info del renderer cada 60 frames
        if (this.clock.elapsedTime % 1 < delta) {
            this.renderer.info.reset();
        }
        
        return delta;
    }
    
    // Cache de geometrías para evitar recrear
    getCachedGeometry(type, params) {
        const key = `${type}_${JSON.stringify(params)}`;
        if (!this.geometryCache.has(key)) {
            let geometry;
            switch(type) {
                case 'box':
                    geometry = new THREE.BoxGeometry(...params);
                    break;
                case 'sphere':
                    geometry = new THREE.SphereGeometry(...params);
                    break;
                case 'plane':
                    geometry = new THREE.PlaneGeometry(...params);
                    break;
                default:
                    return null;
            }
            this.geometryCache.set(key, geometry);
        }
        return this.geometryCache.get(key);
    }
    
    // Cache de materiales
    getCachedMaterial(type, params) {
        const key = `${type}_${JSON.stringify(params)}`;
        if (!this.materialCache.has(key)) {
            let material;
            switch(type) {
                case 'standard':
                    material = new THREE.MeshStandardMaterial(params);
                    break;
                case 'basic':
                    material = new THREE.MeshBasicMaterial(params);
                    break;
                case 'lambert':
                    material = new THREE.MeshLambertMaterial(params);
                    break;
                default:
                    return null;
            }
            this.materialCache.set(key, material);
        }
        return this.materialCache.get(key);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// Instancia global
const engine = new Engine();
