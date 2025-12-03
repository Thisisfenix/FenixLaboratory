// Performance.js - Configuración de rendimiento adaptativo
class PerformanceManager {
    constructor() {
        this.settings = {
            targetFPS: 60,
            pixelRatio: 'auto',
            shadowQuality: 'medium',
            renderDistance: 50,
            particleCount: 100,
            antialiasing: false,
            postProcessing: false
        };
        
        this.autoDetected = false;
        this.performanceLevel = 'medium'; // low, medium, high
        this.frameTimeHistory = [];
        this.maxHistoryLength = 60;
        
        this.init();
    }
    
    init() {
        this.detectPerformance();
        this.loadSettings();
        this.createUI();
    }
    
    detectPerformance() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            this.performanceLevel = 'low';
            return;
        }
        
        // Detectar GPU
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        
        // Detectar memoria disponible
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        // Scoring system
        let score = 0;
        
        // GPU scoring
        if (renderer.includes('RTX') || renderer.includes('RX 6') || renderer.includes('RX 7')) {
            score += 40;
        } else if (renderer.includes('GTX') || renderer.includes('RX 5')) {
            score += 30;
        } else if (renderer.includes('Intel') && renderer.includes('Iris')) {
            score += 20;
        } else if (renderer.includes('Intel')) {
            score += 10;
        }
        
        // Memory scoring
        score += Math.min(memory * 5, 20);
        
        // CPU scoring
        score += Math.min(cores * 3, 15);
        
        // Mobile detection
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            score -= 15;
        }
        
        // Determine performance level
        if (score >= 60) {
            this.performanceLevel = 'high';
        } else if (score >= 35) {
            this.performanceLevel = 'medium';
        } else {
            this.performanceLevel = 'low';
        }
        
        this.applyPreset(this.performanceLevel);
        this.autoDetected = true;
        
        console.log(`Performance auto-detected: ${this.performanceLevel} (score: ${score})`);
    }
    
    applyPreset(level) {
        switch(level) {
            case 'low':
                this.settings = {
                    targetFPS: 30,
                    pixelRatio: 0.75,
                    shadowQuality: 'off',
                    renderDistance: 30,
                    particleCount: 25,
                    antialiasing: false,
                    postProcessing: false
                };
                break;
                
            case 'medium':
                this.settings = {
                    targetFPS: 60,
                    pixelRatio: 1,
                    shadowQuality: 'low',
                    renderDistance: 50,
                    particleCount: 50,
                    antialiasing: false,
                    postProcessing: false
                };
                break;
                
            case 'high':
                this.settings = {
                    targetFPS: Math.min(screen.refreshRate || 60, 120),
                    pixelRatio: Math.min(window.devicePixelRatio, 2),
                    shadowQuality: 'medium',
                    renderDistance: 75,
                    particleCount: 100,
                    antialiasing: true,
                    postProcessing: true
                };
                break;
        }
        
        this.applySettings();
    }
    
    applySettings() {
        if (typeof engine !== 'undefined' && engine.renderer) {
            // Aplicar pixel ratio
            const pixelRatio = this.settings.pixelRatio === 'auto' ? 
                Math.min(window.devicePixelRatio, 2) : this.settings.pixelRatio;
            engine.renderer.setPixelRatio(pixelRatio);
            
            // Aplicar sombras
            if (this.settings.shadowQuality === 'off') {
                engine.renderer.shadowMap.enabled = false;
            } else {
                engine.renderer.shadowMap.enabled = true;
                const shadowSize = this.settings.shadowQuality === 'low' ? 512 : 
                                 this.settings.shadowQuality === 'medium' ? 1024 : 2048;
                
                engine.lights.forEach(light => {
                    if (light.shadow) {
                        light.shadow.mapSize.width = shadowSize;
                        light.shadow.mapSize.height = shadowSize;
                    }
                });
            }
            
            // Aplicar niebla para render distance
            if (engine.scene && engine.scene.fog) {
                engine.scene.fog.far = this.settings.renderDistance;
            }
        }
        
        // Actualizar target FPS en engine
        if (typeof engine !== 'undefined') {
            engine.targetFPS = this.settings.targetFPS;
            engine.frameTime = 1000 / this.settings.targetFPS;
        }
    }
    
    trackFrameTime(deltaTime) {
        this.frameTimeHistory.push(deltaTime);
        if (this.frameTimeHistory.length > this.maxHistoryLength) {
            this.frameTimeHistory.shift();
        }
        
        // Auto-adjust si el rendimiento es malo
        if (this.frameTimeHistory.length >= this.maxHistoryLength) {
            const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
            const avgFPS = 1 / avgFrameTime;
            
            if (avgFPS < this.settings.targetFPS * 0.8 && this.performanceLevel !== 'low') {
                console.log('Performance degradation detected, lowering settings');
                this.lowerSettings();
            }
        }
    }
    
    lowerSettings() {
        if (this.performanceLevel === 'high') {
            this.performanceLevel = 'medium';
        } else if (this.performanceLevel === 'medium') {
            this.performanceLevel = 'low';
        }
        
        this.applyPreset(this.performanceLevel);
        this.updateUI();
    }
    
    createUI() {
        const perfButton = document.createElement('button');
        perfButton.innerHTML = '⚙️';
        perfButton.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 40px;
            height: 40px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #666;
            color: #fff;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            font-size: 18px;
        `;
        
        perfButton.addEventListener('click', () => this.showSettings());
        document.body.appendChild(perfButton);
    }
    
    showSettings() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: #222; padding: 30px; border-radius: 10px; color: #fff; max-width: 400px; width: 90%;">
                <h3 style="margin: 0 0 20px 0; color: #ff4444;">⚙️ Configuración de Rendimiento</h3>
                
                <div style="margin-bottom: 15px;">
                    <label>Preset:</label>
                    <select id="perfPreset" style="width: 100%; padding: 5px; margin-top: 5px;">
                        <option value="low">Bajo (30 FPS)</option>
                        <option value="medium">Medio (60 FPS)</option>
                        <option value="high">Alto (120 FPS)</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Calidad de Sombras:</label>
                    <select id="shadowQuality" style="width: 100%; padding: 5px; margin-top: 5px;">
                        <option value="off">Desactivadas</option>
                        <option value="low">Baja (512px)</option>
                        <option value="medium">Media (1024px)</option>
                        <option value="high">Alta (2048px)</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Distancia de Renderizado:</label>
                    <input type="range" id="renderDistance" min="20" max="100" value="${this.settings.renderDistance}" style="width: 100%;">
                    <span id="renderDistanceValue">${this.settings.renderDistance}m</span>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label>
                        <input type="checkbox" id="antialiasing" ${this.settings.antialiasing ? 'checked' : ''}> 
                        Antialiasing
                    </label>
                </div>
                
                <div style="text-align: center;">
                    <button id="applySettings" style="background: #ff4444; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">Aplicar</button>
                    <button id="closeSettings" style="background: #666; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cerrar</button>
                </div>
                
                <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: center;">
                    Auto-detectado: ${this.performanceLevel.toUpperCase()}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set current values
        document.getElementById('perfPreset').value = this.performanceLevel;
        document.getElementById('shadowQuality').value = this.settings.shadowQuality;
        
        // Event listeners
        document.getElementById('renderDistance').addEventListener('input', (e) => {
            document.getElementById('renderDistanceValue').textContent = e.target.value + 'm';
        });
        
        document.getElementById('applySettings').addEventListener('click', () => {
            this.performanceLevel = document.getElementById('perfPreset').value;
            this.settings.shadowQuality = document.getElementById('shadowQuality').value;
            this.settings.renderDistance = parseInt(document.getElementById('renderDistance').value);
            this.settings.antialiasing = document.getElementById('antialiasing').checked;
            
            this.applyPreset(this.performanceLevel);
            this.saveSettings();
            modal.remove();
        });
        
        document.getElementById('closeSettings').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    updateUI() {
        // Update any existing UI elements
    }
    
    saveSettings() {
        localStorage.setItem('ankaroPerformance', JSON.stringify({
            level: this.performanceLevel,
            settings: this.settings
        }));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('ankaroPerformance');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.performanceLevel = data.level;
                this.settings = { ...this.settings, ...data.settings };
                this.applySettings();
            } catch (e) {
                console.warn('Failed to load performance settings');
            }
        }
    }
}

// Instancia global
const performanceManager = new PerformanceManager();