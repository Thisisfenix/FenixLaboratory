// Optimizaciones específicas para dispositivos móviles
class MobileOptimizations {
  constructor() {
    this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    this.isLowEnd = this.detectLowEndDevice();
    this.performanceMode = this.isLowEnd ? 'low' : 'normal';
    
    if (this.isMobile) {
      this.init();
    }
  }

  detectLowEndDevice() {
    // Detectar dispositivos de gama baja basado en memoria y cores
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    return memory <= 2 || cores <= 2;
  }

  init() {
    this.optimizeCanvas();
    this.setupTouchOptimizations();
    this.adjustGameSettings();
    
    console.log(`📱 Optimizaciones móviles activadas - Modo: ${this.performanceMode}`);
  }

  optimizeCanvas() {
    // Reducir resolución en dispositivos de gama baja
    if (this.isLowEnd) {
      const canvas = document.getElementById('gameCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Reducir resolución pero mantener aspecto visual
        const scale = 0.75;
        canvas.style.imageRendering = 'pixelated';
        canvas.style.transform = `scale(${1/scale})`;
        canvas.style.transformOrigin = 'top left';
      }
    }
  }

  setupTouchOptimizations() {
    // Mejorar respuesta táctil
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Prevenir zoom accidental
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('gesturechange', e => e.preventDefault());
    document.addEventListener('gestureend', e => e.preventDefault());
  }

  handleTouchStart(e) {
    // Mejorar precisión del toque
    e.preventDefault();
    
    // Feedback háptico si está disponible
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    
    // Throttle para mejorar performance
    if (this.lastTouchMove && Date.now() - this.lastTouchMove < 16) {
      return;
    }
    this.lastTouchMove = Date.now();
  }

  handleTouchEnd(e) {
    e.preventDefault();
  }

  adjustGameSettings() {
    // Configuraciones específicas para móviles
    this.settings = {
      maxParticles: this.isLowEnd ? 10 : 20,
      maxBullets: this.isLowEnd ? 30 : 50,
      shadowEffects: !this.isLowEnd,
      screenShake: !this.isLowEnd,
      complexAnimations: !this.isLowEnd,
      audioEnabled: true,
      hapticFeedback: true
    };
  }

  // Optimizar partículas para móviles
  optimizeParticles(particles) {
    if (!this.isMobile) return particles;
    
    const maxParticles = this.settings.maxParticles;
    if (particles.length > maxParticles) {
      return particles.slice(-maxParticles);
    }
    return particles;
  }

  // Optimizar bullets para móviles
  optimizeBullets(bullets) {
    if (!this.isMobile) return bullets;
    
    const maxBullets = this.settings.maxBullets;
    if (bullets.length > maxBullets) {
      return bullets.slice(-maxBullets);
    }
    return bullets;
  }

  // Controles táctiles mejorados
  createMobileControls(canvas) {
    if (!this.isMobile) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1000;
    `;

    // Joystick virtual para movimiento
    const joystick = this.createVirtualJoystick();
    controlsContainer.appendChild(joystick);

    // Botones de acción
    const actionButtons = this.createActionButtons();
    controlsContainer.appendChild(actionButtons);

    document.body.appendChild(controlsContainer);
  }

  createVirtualJoystick() {
    const joystick = document.createElement('div');
    joystick.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 120px;
      height: 120px;
      background: rgba(255,255,255,0.1);
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      pointer-events: auto;
    `;

    const knob = document.createElement('div');
    knob.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.8);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease;
    `;

    joystick.appendChild(knob);

    // Lógica del joystick
    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    joystick.addEventListener('touchstart', (e) => {
      isDragging = true;
      const rect = joystick.getBoundingClientRect();
      startPos.x = rect.left + rect.width / 2;
      startPos.y = rect.top + rect.height / 2;
      
      if (navigator.vibrate) navigator.vibrate(5);
    });

    joystick.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startPos.x;
      const deltaY = touch.clientY - startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 40;

      if (distance <= maxDistance) {
        knob.style.transform = `translate(${deltaX - 20}px, ${deltaY - 20}px)`;
      } else {
        const angle = Math.atan2(deltaY, deltaX);
        const x = Math.cos(angle) * maxDistance;
        const y = Math.sin(angle) * maxDistance;
        knob.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
      }

      // Emitir evento personalizado para el juego
      window.dispatchEvent(new CustomEvent('joystickMove', {
        detail: { x: deltaX / maxDistance, y: deltaY / maxDistance }
      }));
    });

    joystick.addEventListener('touchend', () => {
      isDragging = false;
      knob.style.transform = 'translate(-50%, -50%)';
      
      window.dispatchEvent(new CustomEvent('joystickMove', {
        detail: { x: 0, y: 0 }
      }));
    });

    return joystick;
  }

  createActionButtons() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      pointer-events: auto;
    `;

    const buttons = [
      { label: '🔫', action: 'shoot', color: '#ff4444' },
      { label: '💨', action: 'dash', color: '#44ff44' },
      { label: '⏰', action: 'slow', color: '#4444ff' },
      { label: '💚', action: 'heal', color: '#44ff44' }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('div');
      button.style.cssText = `
        width: 60px;
        height: 60px;
        background: ${btn.color};
        border: 3px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        user-select: none;
        transition: all 0.1s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      `;

      button.textContent = btn.label;

      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(0.9)';
        
        if (navigator.vibrate) navigator.vibrate(10);
        
        window.dispatchEvent(new CustomEvent('mobileAction', {
          detail: { action: btn.action, type: 'start' }
        }));
      });

      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        button.style.transform = 'scale(1)';
        
        window.dispatchEvent(new CustomEvent('mobileAction', {
          detail: { action: btn.action, type: 'end' }
        }));
      });

      container.appendChild(button);
    });

    return container;
  }

  // Optimizar audio para móviles
  optimizeAudio(audio) {
    if (!this.isMobile) return audio;

    // Reducir calidad de audio en dispositivos de gama baja
    if (this.isLowEnd) {
      audio.volume = Math.min(audio.volume, 0.7);
    }

    return audio;
  }

  // Gestión de memoria mejorada
  cleanupMemory() {
    if (!this.isMobile) return;

    // Limpiar referencias no utilizadas
    if (window.gc && this.isLowEnd) {
      window.gc();
    }

    // Reducir cache de imágenes
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        img.src = '';
      }
    });
  }

  // Detectar orientación y ajustar UI
  handleOrientationChange() {
    if (!this.isMobile) return;

    const orientation = screen.orientation?.angle || window.orientation || 0;
    const isLandscape = Math.abs(orientation) === 90;

    document.body.classList.toggle('landscape', isLandscape);
    document.body.classList.toggle('portrait', !isLandscape);

    // Reajustar controles según orientación
    setTimeout(() => {
      const controls = document.getElementById('mobile-controls');
      if (controls) {
        controls.style.display = 'none';
        controls.offsetHeight; // Force reflow
        controls.style.display = 'block';
      }
    }, 100);
  }

  // Optimizar rendering
  optimizeRendering(ctx) {
    if (!this.isMobile) return;

    // Desactivar antialiasing en dispositivos de gama baja
    if (this.isLowEnd) {
      ctx.imageSmoothingEnabled = false;
    }

    // Usar composición más eficiente
    ctx.globalCompositeOperation = 'source-over';
  }

  // Throttle para eventos frecuentes
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Debounce para eventos de resize
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Configurar eventos de optimización
  setupOptimizationEvents() {
    // Limpiar memoria periódicamente
    setInterval(() => {
      this.cleanupMemory();
    }, 30000); // Cada 30 segundos

    // Manejar cambios de orientación
    window.addEventListener('orientationchange', 
      this.debounce(() => this.handleOrientationChange(), 250)
    );

    // Pausar juego cuando la app va a background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.dispatchEvent(new CustomEvent('gamePause'));
      } else {
        window.dispatchEvent(new CustomEvent('gameResume'));
      }
    });

    // Optimizar cuando la batería está baja
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2) {
            this.performanceMode = 'low';
            console.log('🔋 Batería baja - Activando modo de ahorro');
          }
        });
      });
    }
  }

  // Obtener configuraciones optimizadas
  getOptimizedSettings() {
    return {
      ...this.settings,
      performanceMode: this.performanceMode,
      isMobile: this.isMobile,
      isLowEnd: this.isLowEnd
    };
  }
}

// Inicializar automáticamente
const mobileOptimizations = new MobileOptimizations();

// Exponer globalmente
window.mobileOptimizations = mobileOptimizations;

// Integrar con el sistema de boss fight
if (window.BossFightEnhancements) {
  const originalCreateParticles = BossFightEnhancements.prototype.createParticles;
  BossFightEnhancements.prototype.createParticles = function(x, y, count, color) {
    const optimizedCount = mobileOptimizations.isMobile ? 
      Math.min(count, mobileOptimizations.settings.maxParticles) : count;
    return originalCreateParticles.call(this, x, y, optimizedCount, color);
  };
}

console.log('📱 Sistema de optimizaciones móviles cargado');