// Sistema de sonido con advertencias anti-spam
export class SoundSystem {
  constructor() {
    this.clickCount = 0;
    this.lastClickTime = 0;
    this.warningCount = 0;
    this.isExploded = false;
    this.resetTimeout = null;
    
    this.init();
  }
  
  init() {
    this.createSoundButton();
    this.loadSounds();
  }
  
  createSoundButton() {
    const soundBtn = document.createElement('div');
    soundBtn.id = 'sound-button';
    soundBtn.className = 'sound-system-button';
    soundBtn.innerHTML = '';
    
    this.attachButtonEvents(soundBtn);
    document.body.appendChild(soundBtn);
  }
  
  attachButtonEvents(button) {
    button.addEventListener('click', () => this.handleClick());
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleClick();
    });
  }
  
  loadSounds() {
    // Cargar archivo de audio
    this.sounds = {
      normal: this.createAudioFile('./damn.mp3'),
      warning: this.createAudioFile('./damn.mp3', 1.5), 
      explosion: this.createAudioFile('./explosion.mp3')
    };
  }
  
  createTone(frequency, duration) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      return {
        play: () => {
          try {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            osc.start();
            osc.stop(audioContext.currentTime + duration);
          } catch (e) {
            console.log('Audio not supported');
          }
        }
      };
    } catch (e) {
      return { play: () => {} }; // Fallback silencioso
    }
  }
  
  createAudioFile(src, playbackRate = 1.0, customDistortion = null) {
    return {
      play: () => {
        try {
          const audio = new Audio(src);
          audio.volume = 0.7;
          audio.playbackRate = playbackRate;
          
          // Agregar distorsión progresiva
          const distortion = customDistortion !== null ? customDistortion : (playbackRate > 1.0 ? (playbackRate - 1.0) * 0.3 : 0);
          
          if (distortion > 0) {
            audio.addEventListener('loadeddata', () => {
              if (audio.webkitAudioContext || audio.AudioContext) {
                try {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  const source = audioContext.createMediaElementSource(audio);
                  
                  // Filtro de distorsión más agresivo
                  const filter = audioContext.createBiquadFilter();
                  filter.type = 'highpass';
                  filter.frequency.value = 1000 + (distortion * 3000);
                  filter.Q.value = 1 + (distortion * 10);
                  
                  // Añadir compresión para más distorsión
                  const compressor = audioContext.createDynamicsCompressor();
                  compressor.threshold.value = -20 - (distortion * 30);
                  compressor.ratio.value = 12 + (distortion * 8);
                  
                  source.connect(filter);
                  filter.connect(compressor);
                  compressor.connect(audioContext.destination);
                } catch (e) {
                  // Fallback sin distorsión
                }
              }
            });
          }
          
          audio.play().catch(e => console.log('Audio play failed'));
        } catch (e) {
          console.log('Audio not available');
        }
      }
    };
  }
  
  handleClick() {
    if (this.isExploded) return;
    
    const now = Date.now();
    const timeDiff = now - this.lastClickTime;
    
    // Reset contador si han pasado más de 3 segundos
    if (timeDiff > 3000) {
      this.clickCount = 0;
      this.warningCount = 0;
    }
    
    this.clickCount++;
    this.lastClickTime = now;
    
    if (this.clickCount <= 5) {
      // Clicks normales
      this.playSound('normal');
      this.animateButton('normal');
    } else if (this.clickCount <= 15) {
      // Primera advertencia
      if (this.warningCount === 0) {
        this.showWarning('⚠️ ¡Cuidado! No hagas spam o algo malo pasará...');
        this.warningCount = 1;
      }
      this.playSound('warning');
      this.animateButton('warning');
    } else if (this.clickCount <= 25) {
      // Segunda advertencia con más velocidad y distorsión
      if (this.warningCount === 1) {
        this.showWarning('🚨 ¡ÚLTIMA ADVERTENCIA! Deja de hacer spam...');
        this.warningCount = 2;
      }
      // Calcular intensidad basada en proximidad a la explosión (clicks 15-25)
      const intensity = (this.clickCount - 15) / 10; // 0 a 1
      this.playCustomWarning(2.0 + intensity * 1.5, intensity * 0.8); // Velocidad 2.0-3.5x, distorsión 0-0.8
      this.animateButton('warning');
    } else {
      // Tercera advertencia y explosión
      if (this.warningCount === 2) {
        this.showWarning('💥 ¡YA TE ADVERTÍ! ¡BOOM!');
        this.warningCount = 3;
      }
      this.explode();
    }
  }
  
  playSound(type) {
    if (!this.sounds || !this.sounds[type]) return;
    try {
      this.sounds[type].play();
    } catch (e) {
      console.log('Audio not available');
    }
  }
  
  playCustomWarning(playbackRate, distortion) {
    try {
      const customAudio = this.createAudioFile('./damn.mp3', playbackRate, distortion);
      customAudio.play();
    } catch (e) {
      console.log('Audio not available');
    }
  }
  
  animateButton(type) {
    const btn = document.getElementById('sound-button');
    if (!btn) return;
    
    if (type === 'normal') {
      btn.style.transform = 'scale(1.2)';
      btn.style.filter = 'brightness(1.2)';
    } else if (type === 'warning') {
      btn.style.transform = 'scale(1.3)';
      btn.style.filter = 'brightness(1.5) hue-rotate(45deg)';
      btn.style.animation = 'shake 0.5s ease-in-out';
    }
    
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
      btn.style.filter = 'brightness(1)';
      btn.style.animation = '';
    }, 300);
  }
  
  showWarning(message) {
    const isMobile = window.innerWidth <= 768;
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: ${isMobile ? '15px' : '20px'};
      border-radius: 10px;
      font-size: ${isMobile ? '16px' : '18px'};
      font-weight: bold;
      z-index: 10000;
      text-align: center;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
      animation: warningPulse 0.5s ease-in-out;
      max-width: ${isMobile ? '90vw' : 'auto'};
    `;
    
    warning.textContent = message;
    document.body.appendChild(warning);
    
    setTimeout(() => {
      warning.style.opacity = '0';
      warning.style.transition = 'opacity 0.3s ease';
      setTimeout(() => warning.remove(), 300);
    }, 2000);
  }
  
  explode() {
    this.isExploded = true;
    this.playSound('explosion');
    
    const btn = document.getElementById('sound-button');
    if (btn) {
      btn.style.animation = 'explode 1s ease-out forwards';
      btn.style.pointerEvents = 'none';
      
      // Crear partículas de explosión
      this.createExplosionParticles();
      
      setTimeout(() => {
        btn.style.visibility = 'hidden';
        btn.style.opacity = '0';
        this.showExplosionMessage();
      }, 1000);
    }
  }
  
  createExplosionParticles() {
    const btn = document.getElementById('sound-button');
    if (!btn) return;
    
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: ${8 + Math.random() * 8}px;
        height: ${8 + Math.random() * 8}px;
        background: url('./cementful.png') center/cover;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        z-index: 10001;
        pointer-events: none;
      `;
      
      document.body.appendChild(particle);
      
      const angle = (Math.PI * 2 * i) / 25;
      const distance = 80 + Math.random() * 120;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;
      
      particle.animate([
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'ease-out'
      }).onfinish = () => particle.remove();
    }
  }
  
  showExplosionMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: #ff0000;
      padding: 30px;
      border-radius: 15px;
      font-size: 24px;
      font-weight: bold;
      z-index: 10000;
      text-align: center;
      box-shadow: 0 0 30px rgba(255, 0, 0, 0.7);
      border: 3px solid #ff0000;
    `;
    
    message.innerHTML = `
      <div style="font-size: 3em; margin-bottom: 10px;">💥</div>
      <div>¡BOTÓN DESTRUIDO!</div>
      <div style="font-size: 16px; margin-top: 10px; color: #ccc;">
        Te advertimos que no hicieras spam...
      </div>
      <button onclick="this.parentElement.remove(); if(window.soundSystem) { window.soundSystem.reset(); window.soundSystem.createSoundButton(); }" 
              style="margin-top: 15px; padding: 10px 20px; background: #ff0000; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Revivir Botón
      </button>
    `;
    
    document.body.appendChild(message);
  }
  
  reset() {
    this.clickCount = 0;
    this.warningCount = 0;
    this.isExploded = false;
    this.lastClickTime = 0;
    
    const btn = document.getElementById('sound-button');
    if (btn) {
      // Animación de revivir
      btn.style.animation = 'revive 0.8s ease-out forwards';
      btn.style.visibility = 'visible';
      btn.style.opacity = '1';
      btn.style.display = 'flex';
      btn.style.pointerEvents = 'auto';
      
      setTimeout(() => {
        btn.style.animation = '';
        btn.style.transform = 'scale(1)';
        btn.style.filter = 'brightness(1)';
      }, 800);
    }
  }
}

// Estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = `
  .sound-system-button {
    position: fixed;
    bottom: 220px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: url('./cementful.png') center/cover;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    .sound-system-button {
      bottom: 220px;
      right: 15px;
      width: 48px;
      height: 48px;
      font-size: 18px;
    }
  }
  
  @media (max-width: 480px) {
    .sound-system-button {
      bottom: 210px;
      right: 10px;
      width: 44px;
      height: 44px;
      font-size: 16px;
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0) scale(1.3); }
    25% { transform: translateX(-5px) scale(1.3); }
    75% { transform: translateX(5px) scale(1.3); }
  }
  
  @keyframes warningPulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
  }
  
  @keyframes explode {
    0% { transform: scale(1) rotate(0deg); opacity: 1; }
    50% { transform: scale(1.5) rotate(180deg); opacity: 0.5; }
    100% { transform: scale(0) rotate(360deg); opacity: 0; }
  }
  
  @keyframes revive {
    0% { transform: scale(0) rotate(360deg); opacity: 0; }
    50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.soundSystem = new SoundSystem();
  });
} else {
  window.soundSystem = new SoundSystem();
}

export default SoundSystem;