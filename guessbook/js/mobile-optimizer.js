// Optimizador móvil simplificado
export class MobileOptimizer {
  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    this.init();
  }
  
  init() {
    if (this.isMobile) {
      this.setupMobileOptimizations();
      this.setupTouchEvents();
    }
  }
  
  setupMobileOptimizations() {
    // Prevenir zoom en double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Optimizar viewport
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
  }
  
  setupTouchEvents() {
    const canvas = document.getElementById('drawCanvas');
    if (canvas) {
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
      }, { passive: false });
      
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
      }, { passive: false });
    }
  }
  
  showDebugInfo() {
    const info = {
      isMobile: this.isMobile,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    };
    console.log('📱 Información del dispositivo:', info);
  }
}

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
  });
} else {
  window.mobileOptimizer = new MobileOptimizer();
}

export default MobileOptimizer;