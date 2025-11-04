// Gestión de interfaz y modales
export class UIManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupThemes();
    this.setupModals();
    this.addThemeStyles();
  }
  
  addThemeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      [data-theme="neon"] {
        --text-primary: #00ff88;
        --text-secondary: #00cc66;
      }
      [data-theme="retro"] {
        --text-primary: #ffd700;
        --text-secondary: #ffb347;
      }
      [data-theme="hacker"] {
        --text-primary: #00ff00;
        --text-secondary: #00cc00;
      }
      [data-theme="ocean"] {
        --text-primary: #e8f4fd;
        --text-secondary: #b8dff0;
      }
      [data-theme="sunset"] {
        --text-primary: #fed7aa;
        --text-secondary: #fdba74;
      }
      [data-theme="forest"] {
        --text-primary: #ecfdf5;
        --text-secondary: #bbf7d0;
      }
      [data-theme="cyberpunk"] {
        --text-primary: #ff0080;
        --text-secondary: #c9d1d9;
      }
      [data-theme="gold"] {
        --text-primary: #fef3c7;
        --text-secondary: #fbbf24;
      }
      [data-theme="ice"] {
        --text-primary: #e0f6ff;
        --text-secondary: #87ceeb;
      }
      [data-theme="funky"] {
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
      }
    `;
    document.head.appendChild(style);
  }
  
  setupThemes() {
    const themes = {
      default: { name: '🎨 Clásico', primary: '#ff6b35', bgDark: '#1a1a1a', bgLight: '#2d2d2d' },
      neon: { name: '💚 Neón', primary: '#00ff88', bgDark: '#0a0a0a', bgLight: '#1a1a1a' },
      retro: { name: '💜 Retro', primary: '#ff6b9d', bgDark: '#2d1b69', bgLight: '#3e2a7a' },
      hacker: { name: '💻 Hacker', primary: '#00ff00', bgDark: '#000000', bgLight: '#0d1117' },
      ocean: { name: '🌊 Océano', primary: '#00d4ff', bgDark: '#0f3460', bgLight: '#16537e' },
      sunset: { name: '🌅 Atardecer', primary: '#f97316', bgDark: '#7c2d12', bgLight: '#9a3412' },
      forest: { name: '🌲 Bosque', primary: '#4ade80', bgDark: '#1a3d2e', bgLight: '#2d5a47' },
      cyberpunk: { name: '🤖 Cyberpunk', primary: '#ff0080', bgDark: '#0d1117', bgLight: '#161b22' },
      gold: { name: '✨ Dorado', primary: '#fbbf24', bgDark: '#451a03', bgLight: '#78350f' },
      ice: { name: '❄️ Hielo', primary: '#4682b4', bgDark: '#001133', bgLight: '#003366' },
      funky: { name: '🌈 Funky Atlas', primary: '#ff4444', bgDark: '#0f0f1a', bgLight: '#2b1055' }
    };
    
    const themeContainer = document.createElement('div');
    themeContainer.className = 'd-flex align-items-center gap-2 mb-3';
    themeContainer.innerHTML = `
      <label class="form-label text-light small mb-0">🎨 Tema:</label>
      <select id="themeSelector" class="form-select form-select-sm" style="width: 150px; background: var(--bg-light); border: 1px solid var(--primary); color: var(--text-primary);">
        ${Object.entries(themes).map(([key, theme]) => 
          `<option value="${key}">${theme.name}</option>`
        ).join('')}
      </select>
    `;
    
    const selector = themeContainer.querySelector('#themeSelector');
    
    selector.addEventListener('change', (e) => {
      const theme = e.target.value;
      this.applyTheme(theme, themes[theme]);
      localStorage.setItem('guestbook-theme', theme);
      this.saveUserTheme(theme);
    });
    
    // Añadir al panel de control
    const controlPanel = document.querySelector('.card-body');
    if (controlPanel) {
      const firstSection = controlPanel.querySelector('.control-section');
      if (firstSection) {
        firstSection.parentNode.insertBefore(themeContainer, firstSection);
      }
    }
    
    // Cargar tema guardado
    this.loadUserTheme(themes, selector);
  }
  
  applyTheme(themeName, theme) {
    const root = document.documentElement;
    
    if (themeName === 'default') {
      root.removeAttribute('data-theme');
      // Restaurar colores por defecto
      root.style.setProperty('--primary', '#ff6b35');
      root.style.setProperty('--bg-dark', '#1a1a1a');
      root.style.setProperty('--bg-light', '#2d2d2d');
    } else {
      root.setAttribute('data-theme', themeName);
      // Aplicar colores del tema
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--bg-dark', theme.bgDark);
      root.style.setProperty('--bg-light', theme.bgLight);
    }
  }
  
  saveUserTheme(theme) {
    localStorage.setItem('guestbook-user-theme', theme);
  }
  
  loadUserTheme(themes, selector) {
    const savedTheme = localStorage.getItem('guestbook-user-theme') || 'default';
    if (themes[savedTheme]) {
      selector.value = savedTheme;
      this.applyTheme(savedTheme, themes[savedTheme]);
    }
  }
  
  setupModals() {
    // No sobrescribir viewImage - se maneja en gallery.js
    console.log('UI Manager: Modales configurados (viewImage se maneja en gallery.js)');
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 15px 20px; border-radius: 8px; color: white;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
  
  createConfetti() {
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed; left: ${Math.random() * window.innerWidth}px; top: -10px;
          width: 8px; height: 8px; border-radius: 50%; pointer-events: none; z-index: 9999;
          background: ${['#ff6b35', '#00ff88', '#ff6b9d', '#00ff00'][Math.floor(Math.random() * 4)]};
        `;
        document.body.appendChild(confetti);
        
        confetti.animate([
          { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
          { transform: `translateY(${window.innerHeight + 100}px) rotate(360deg)`, opacity: 0 }
        ], { duration: 2000 }).onfinish = () => confetti.remove();
      }, i * 50);
    }
  }
}