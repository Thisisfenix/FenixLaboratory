// Sistema de Plushies escondidos en la página
class PlushieSystem {
  constructor() {
    this.progress = this.loadProgress();
    this.init();
  }

  init() {
    document.getElementById('plushie-btn')?.addEventListener('click', () => this.showPanel());
    this.spawnPlushies();
    this.updateCounter();
  }

  loadProgress() {
    const saved = localStorage.getItem('plushie-progress');
    return saved ? JSON.parse(saved) : { gissel: 0, molly: 0 };
  }

  saveProgress() {
    localStorage.setItem('plushie-progress', JSON.stringify(this.progress));
  }

  spawnPlushies() {
    const collected = JSON.parse(localStorage.getItem('plushie-collected') || '[]');
    
    // Posiciones estratégicas y troll por sección
    const positions = [
      // Hero - 3 Gissel, 2 Molly
      { section: 'hero', type: 'gissel', left: '5%', top: '15%', size: '25px', behavior: 'shy' },
      { section: 'hero', type: 'gissel', left: '92%', top: '80%', size: '20px' },
      { section: 'hero', type: 'gissel', left: '50%', top: '5%', size: '15px', behavior: 'runner' },
      { section: 'hero', type: 'molly', left: '15%', top: '85%', size: '30px' },
      { section: 'hero', type: 'molly', left: '88%', top: '12%', size: '18px', behavior: 'shy' },
      
      // Proyectos - 5 Gissel, 4 Molly
      { section: 'proyectos', type: 'gissel', left: '3%', top: '25%', size: '22px', behavior: 'runner' },
      { section: 'proyectos', type: 'gissel', left: '95%', top: '45%', size: '28px' },
      { section: 'proyectos', type: 'gissel', left: '48%', top: '8%', size: '16px', behavior: 'invisible' },
      { section: 'proyectos', type: 'gissel', left: '70%', top: '75%', size: '24px', behavior: 'shy' },
      { section: 'proyectos', type: 'gissel', left: '25%', top: '92%', size: '20px' },
      { section: 'proyectos', type: 'molly', left: '10%', top: '60%', size: '26px', behavior: 'runner' },
      { section: 'proyectos', type: 'molly', left: '85%', top: '20%', size: '19px', behavior: 'invisible' },
      { section: 'proyectos', type: 'molly', left: '55%', top: '88%', size: '23px' },
      { section: 'proyectos', type: 'molly', left: '2%', top: '5%', size: '17px', behavior: 'shy' },
      
      // Comentarios - 4 Gissel, 3 Molly
      { section: 'comentarios', type: 'gissel', left: '8%', top: '30%', size: '25px', behavior: 'runner' },
      { section: 'comentarios', type: 'gissel', left: '90%', top: '65%', size: '21px', behavior: 'invisible' },
      { section: 'comentarios', type: 'gissel', left: '45%', top: '15%', size: '18px' },
      { section: 'comentarios', type: 'gissel', left: '65%', top: '82%', size: '27px', behavior: 'shy' },
      { section: 'comentarios', type: 'molly', left: '20%', top: '70%', size: '24px', behavior: 'runner' },
      { section: 'comentarios', type: 'molly', left: '93%', top: '25%', size: '20px' },
      { section: 'comentarios', type: 'molly', left: '35%', top: '90%', size: '16px', behavior: 'invisible' },
      
      // Guestbook - 2 Gissel, 2 Molly (link a otra página)
      { section: 'guestbook', type: 'gissel', left: '12%', top: '40%', size: '23px', link: 'guessbook/guestbook-new.html' },
      { section: 'guestbook', type: 'gissel', left: '87%', top: '55%', size: '26px' },
      { section: 'guestbook', type: 'molly', left: '60%', top: '45%', size: '25px', link: 'guessbook/guestbook-new.html' },
      { section: 'guestbook', type: 'molly', left: '25%', top: '65%', size: '21px' },
      
      // Deadly Pursuer - 2 Gissel, 3 Molly (link a otra página)
      { section: 'deadly-pursuer', type: 'gissel', left: '42%', top: '50%', size: '16px', link: 'public/index.html' },
      { section: 'deadly-pursuer', type: 'gissel', left: '78%', top: '88%', size: '15px' },
      { section: 'deadly-pursuer', type: 'molly', left: '52%', top: '30%', size: '18px', link: 'public/index.html' },
      { section: 'deadly-pursuer', type: 'molly', left: '18%', top: '70%', size: '15px', link: 'public/index.html' },
      { section: 'deadly-pursuer', type: 'molly', left: '88%', top: '15%', size: '16px' },
      
      // Páginas externas - 6 Gissel, 8 Molly
      { page: 'guessbook/guestbook-new.html', type: 'gissel', selector: 'body', left: '5%', top: '20%', size: '22px', behavior: 'runner' },
      { page: 'guessbook/guestbook-new.html', type: 'gissel', selector: 'body', left: '92%', top: '60%', size: '18px', behavior: 'invisible' },
      { page: 'guessbook/guestbook-new.html', type: 'gissel', selector: 'body', left: '45%', top: '85%', size: '20px' },
      { page: 'guessbook/guestbook-new.html', type: 'gissel', selector: 'body', left: '70%', top: '10%', size: '16px', behavior: 'shy' },
      { page: 'guessbook/guestbook-new.html', type: 'molly', selector: 'body', left: '15%', top: '75%', size: '24px', behavior: 'runner' },
      { page: 'guessbook/guestbook-new.html', type: 'molly', selector: 'body', left: '85%', top: '35%', size: '19px' },
      { page: 'guessbook/guestbook-new.html', type: 'molly', selector: 'body', left: '30%', top: '50%', size: '21px', behavior: 'invisible' },
      { page: 'guessbook/guestbook-new.html', type: 'molly', selector: 'body', left: '60%', top: '90%', size: '17px', behavior: 'shy' },
      
      { page: 'public/index.html', type: 'gissel', selector: 'body', left: '8%', top: '30%', size: '20px', behavior: 'runner' },
      { page: 'public/index.html', type: 'gissel', selector: 'body', left: '88%', top: '70%', size: '16px', behavior: 'invisible' },
      { page: 'public/index.html', type: 'molly', selector: 'body', left: '25%', top: '55%', size: '22px', behavior: 'shy' },
      { page: 'public/index.html', type: 'molly', selector: 'body', left: '75%', top: '25%', size: '18px', behavior: 'runner' },
      { page: 'public/index.html', type: 'molly', selector: 'body', left: '50%', top: '80%', size: '19px' },
      { page: 'public/index.html', type: 'molly', selector: 'body', left: '10%', top: '10%', size: '15px', behavior: 'invisible' },
      
      { page: 'Projectankaro/index.html', type: 'molly', selector: 'body', left: '95%', top: '50%', size: '14px', behavior: 'runner' },
      { page: 'Projectankaro/index.html', type: 'molly', selector: 'body', left: '5%', top: '90%', size: '13px', behavior: 'invisible' }
    ];
    
    positions.forEach((pos, index) => {
      if (collected.includes(index)) return;
      
      // Verificar si es para esta página o para página externa
      if (pos.page && !window.location.pathname.includes(pos.page)) return;
      if (pos.page && pos.selector) {
        const container = document.querySelector(pos.selector);
        if (!container) return;
        this.createPlushie(pos, index, container);
        return;
      }
      
      const section = document.getElementById(pos.section);
      if (!section) return;
      this.createPlushie(pos, index, section);
    });
  }

  createPlushie(pos, index, container) {
    const basePath = pos.page ? '../' : '';
    const plushie = document.createElement('img');
    plushie.src = basePath + (pos.type === 'gissel' ? 'placeholder/gisselplushie.png' : 'placeholder/molly plushie.png');
    plushie.className = 'hidden-plushie';
    plushie.dataset.type = pos.type;
    plushie.dataset.index = index;
    plushie.dataset.behavior = pos.behavior || 'normal';
    
    const initialOpacity = pos.behavior === 'invisible' ? '0.3' : '0.85';
    plushie.style.cssText = `
      position: absolute;
      width: ${pos.size};
      height: ${pos.size};
      cursor: pointer;
      z-index: 10000;
      transition: all 0.3s;
      left: ${pos.left};
      top: ${pos.top};
      opacity: ${initialOpacity};
    `;
    
    if (pos.link) {
      plushie.style.cursor = 'pointer';
      plushie.title = '¡Click para ir a otra página!';
    }
    
    const handleInteraction = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (pos.link) {
        window.location.href = pos.link;
      } else {
        this.collectPlushie(pos.type, plushie, index);
      }
    };
    
    plushie.addEventListener('click', handleInteraction);
    plushie.addEventListener('touchend', handleInteraction);
    
    // Comportamientos especiales
    if (pos.behavior === 'runner') {
      this.makeRunner(plushie, container);
    } else if (pos.behavior === 'shy') {
      this.makeShy(plushie);
    } else if (pos.behavior === 'invisible') {
      this.makeInvisible(plushie);
    }
    
    const handleHoverStart = () => {
      if (pos.behavior !== 'runner') {
        plushie.style.transform = 'scale(1.3) rotate(15deg)';
        plushie.style.opacity = '1';
      }
    };
    
    const handleHoverEnd = () => {
      if (pos.behavior !== 'runner') {
        plushie.style.transform = '';
        plushie.style.opacity = pos.behavior === 'invisible' ? '0.3' : '0.85';
      }
    };
    
    plushie.addEventListener('mouseenter', handleHoverStart);
    plushie.addEventListener('touchstart', handleHoverStart, { passive: true });
    plushie.addEventListener('mouseleave', handleHoverEnd);
    plushie.addEventListener('touchcancel', handleHoverEnd);
    
    container.style.position = 'relative';
    container.appendChild(plushie);
  }

  makeRunner(plushie, container) {
    let clicks = 0;
    const originalHandler = plushie.onclick;
    
    plushie.addEventListener('mouseenter', () => {
      if (clicks < 3) {
        const rect = container.getBoundingClientRect();
        const newLeft = Math.random() * 80 + 5;
        const newTop = Math.random() * 70 + 10;
        plushie.style.left = newLeft + '%';
        plushie.style.top = newTop + '%';
        plushie.style.transform = 'scale(0.8)';
        setTimeout(() => plushie.style.transform = '', 200);
      }
    });
    
    const originalClick = plushie.onclick;
    plushie.onclick = (e) => {
      clicks++;
      if (clicks >= 3) {
        plushie.style.animation = 'shake 0.3s';
        setTimeout(() => originalClick?.call(plushie, e), 300);
      }
    };
  }
  
  makeShy(plushie) {
    let hoverCount = 0;
    plushie.addEventListener('mouseenter', () => {
      hoverCount++;
      if (hoverCount < 5) {
        plushie.style.opacity = '0.2';
        plushie.style.transform = 'scale(0.7)';
      } else {
        plushie.style.opacity = '1';
        plushie.style.transform = 'scale(1.2)';
      }
    });
  }
  
  makeInvisible(plushie) {
    let visible = false;
    setInterval(() => {
      visible = !visible;
      plushie.style.opacity = visible ? '0.85' : '0.1';
    }, 2000);
  }

  collectPlushie(type, element, index) {
    if (this.progress[type] < 20) {
      this.progress[type]++;
      this.saveProgress();
      
      const collected = JSON.parse(localStorage.getItem('plushie-collected') || '[]');
      collected.push(index);
      localStorage.setItem('plushie-collected', JSON.stringify(collected));
      
      this.updateCounter();
      
      element.style.animation = 'plushieCollect 0.5s ease-out';
      setTimeout(() => element.remove(), 500);
      
      if (this.progress[type] === 20) {
        this.showNotification(`¡Encontraste los 20 peluches de ${type === 'gissel' ? 'Gissel' : 'Molly'}! 🎉`);
      }
      
      if (this.progress.gissel === 20 && this.progress.molly === 20) {
        this.showNotification('¡Colección completa! 🏆');
        if (typeof checkAchievement === 'function') checkAchievement('plushie-collector');
      }
    }
  }

  updateCounter() {
    const total = this.progress.gissel + this.progress.molly;
    document.getElementById('plushie-progress').textContent = `${total}/40`;
  }

  showPanel() {
    const basePath = window.location.pathname.includes('guessbook') || window.location.pathname.includes('public') || window.location.pathname.includes('Projectankaro') ? '../' : '';
    const panel = document.createElement('div');
    panel.className = 'plushie-panel';
    panel.innerHTML = `
      <div class="plushie-panel-content">
        <button class="close-panel" onclick="this.parentElement.parentElement.remove()">&times;</button>
        <h3>🧸 Búsqueda de Peluches</h3>
        <p>¡Oh no! Gissel y Molly perdieron sus peluches por toda la página.</p>
        <div style="margin: 1rem 0;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
            <img src="${basePath}placeholder/gisselplushie.png" style="width: 40px; height: 40px;">
            <div>
              <strong>Gissel:</strong> ${this.progress.gissel}/20 encontrados
              <div style="background: var(--bg-light); height: 8px; border-radius: 4px; width: 200px; margin-top: 4px;">
                <div style="background: var(--primary); height: 100%; width: ${(this.progress.gissel/20)*100}%; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${basePath}placeholder/molly plushie.png" style="width: 40px; height: 40px;">
            <div>
              <strong>Molly:</strong> ${this.progress.molly}/20 encontrados
              <div style="background: var(--bg-light); height: 8px; border-radius: 4px; width: 200px; margin-top: 4px;">
                <div style="background: var(--secondary); height: 100%; width: ${(this.progress.molly/20)*100}%; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin: 1rem 0; padding: 0.75rem; background: rgba(255,107,53,0.1); border-left: 3px solid var(--primary); border-radius: 4px;">
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">🔍 Pistas:</div>
          <div style="font-size: 0.8rem; line-height: 1.6;">
            • Explora todas las páginas del laboratorio<br>
            • Algunos son más difíciles de encontrar<br>
            • Hay diferentes comportamientos<br>
            • Algunos te llevan a otras páginas<br>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem; font-style: italic;">
            🎯 ¡Buena suerte en la búsqueda!
          </div>
        </div>
        <button onclick="localStorage.removeItem('plushie-progress'); localStorage.removeItem('plushie-collected'); location.reload();" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Resetear Progreso</button>
      </div>
    `;
    panel.style.cssText = `
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
    document.body.appendChild(panel);
    panel.addEventListener('click', (e) => {
      if (e.target === panel) panel.remove();
    });
  }

  showNotification(message) {
    const notification = document.getElementById('achievement-notification');
    const notificationText = document.getElementById('notification-text');
    if (notification && notificationText) {
      notificationText.textContent = message;
      notification.classList.add('show');
      setTimeout(() => notification.classList.remove('show'), 3000);
    }
  }
}

// Estilos para animación
const style = document.createElement('style');
style.textContent = `
  @keyframes plushieCollect {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5) rotate(360deg); }
    100% { transform: scale(0); opacity: 0; }
  }
  .plushie-panel-content {
    background: var(--bg-dark);
    padding: 2rem;
    border-radius: 12px;
    border: 2px solid var(--primary);
    max-width: 550px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }
  .hidden-plushie:hover {
    filter: drop-shadow(0 0 10px var(--primary));
  }
`;
document.head.appendChild(style);

let plushieSystem;
document.addEventListener('DOMContentLoaded', () => {
  plushieSystem = new PlushieSystem();
});
