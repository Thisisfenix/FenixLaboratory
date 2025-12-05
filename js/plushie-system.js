// Sistema de Plushies escondidos en la página
class PlushieSystem {
  constructor() {
    // Fechas en UTC para que sean iguales para todos
    this.startDate = new Date('2025-12-02T06:00:00Z'); // 2 dic 2025 00:00 hora México (UTC-6)
    this.endDate = new Date('2026-01-01T06:00:00Z'); // 1 ene 2026 00:00 hora México (UTC-6)
    this.progress = this.loadProgress();
    this.init();
  }

  isEventActive() {
    const now = new Date();
    return now >= this.startDate && now < this.endDate;
  }

  init() {
    if (!this.isEventActive()) {
      const btn = document.getElementById('plushie-btn');
      if (btn) btn.style.display = 'none';
      return;
    }
    document.getElementById('plushie-btn')?.addEventListener('click', () => this.showPanel());
    this.spawnPlushies();
    this.updateCounter();
  }

  loadProgress() {
    const saved = localStorage.getItem('plushie-progress');
    return saved ? JSON.parse(saved) : { gissel: 0, molly: 0 };
  }

  showDialogue(text, plushie) {
    const bubble = document.createElement('div');
    bubble.textContent = text;
    bubble.style.cssText = `
      position: absolute;
      background: white;
      color: black;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      pointer-events: none;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-5px);
    `;
    plushie.appendChild(bubble);
    setTimeout(() => bubble.remove(), 2500);
  }

  saveProgress() {
    localStorage.setItem('plushie-progress', JSON.stringify(this.progress));
  }

  spawnPlushies() {
    if (!this.isEventActive()) return;
    const collected = JSON.parse(localStorage.getItem('plushie-collected') || '[]');
    
    // 40 Plushies: 20 Gissel + 20 Molly con diálogos
    const positions = [
      // Hero - 4 Gissel, 4 Molly
      { section: 'hero', type: 'gissel', left: '5%', top: '15%', size: '25px', behavior: 'shy', dialogue: '¡Hola! 💜' },
      { section: 'hero', type: 'gissel', left: '92%', top: '80%', size: '20px', dialogue: '¿Me encontraste?' },
      { section: 'hero', type: 'gissel', left: '50%', top: '5%', size: '15px', behavior: 'runner', dialogue: '¡No me atrapes!' },
      { section: 'hero', type: 'gissel', left: '75%', top: '50%', size: '22px', dialogue: 'Descuido gogog se le ve todo' },
      { section: 'hero', type: 'molly', left: '15%', top: '85%', size: '30px', dialogue: 'Hey qué haces baboso', sound: 'ahhh.m4a' },
      { section: 'hero', type: 'molly', left: '88%', top: '12%', size: '18px', behavior: 'shy', dialogue: 'Te estoy vigilando...' },
      { section: 'hero', type: 'molly', left: '35%', top: '65%', size: '24px', dialogue: '💀' },
      { section: 'hero', type: 'molly', left: '60%', top: '30%', size: '20px', dialogue: 'Qué miras' },
      
      // Proyectos - 5 Gissel, 5 Molly
      { section: 'proyectos', type: 'gissel', left: '3%', top: '25%', size: '22px', behavior: 'runner', dialogue: '¡Corre corre!' },
      { section: 'proyectos', type: 'gissel', left: '95%', top: '45%', size: '28px', dialogue: 'Mira estos proyectos 😍' },
      { section: 'proyectos', type: 'gissel', left: '48%', top: '8%', size: '16px', behavior: 'invisible', dialogue: '¿Me ves?' },
      { section: 'proyectos', type: 'gissel', left: '70%', top: '75%', size: '24px', behavior: 'shy', dialogue: 'Soy tímida...' },
      { section: 'proyectos', type: 'gissel', left: '25%', top: '92%', size: '20px', dialogue: '¡Aquí abajo!' },
      { section: 'proyectos', type: 'molly', left: '10%', top: '60%', size: '26px', behavior: 'runner', dialogue: 'No me toques', sound: 'ahhh.m4a' },
      { section: 'proyectos', type: 'molly', left: '85%', top: '20%', size: '19px', behavior: 'invisible', dialogue: 'Modo stealth activado' },
      { section: 'proyectos', type: 'molly', left: '55%', top: '88%', size: '23px', dialogue: 'Qué miras' },
      { section: 'proyectos', type: 'molly', left: '2%', top: '5%', size: '17px', behavior: 'shy', dialogue: 'Zzz...' },
      { section: 'proyectos', type: 'molly', left: '40%', top: '50%', size: '21px', dialogue: 'Hey baboso', sound: 'ahhh.m4a' },
      
      // Comentarios - 4 Gissel, 4 Molly
      { section: 'comentarios', type: 'gissel', left: '8%', top: '30%', size: '25px', behavior: 'runner', dialogue: '¡Weee!' },
      { section: 'comentarios', type: 'gissel', left: '90%', top: '65%', size: '21px', behavior: 'invisible', dialogue: 'Boo!' },
      { section: 'comentarios', type: 'gissel', left: '45%', top: '15%', size: '18px', dialogue: 'Lee los comentarios 💬' },
      { section: 'comentarios', type: 'gissel', left: '65%', top: '82%', size: '27px', behavior: 'shy', dialogue: 'Ehehe...' },
      { section: 'comentarios', type: 'molly', left: '20%', top: '70%', size: '24px', behavior: 'runner', dialogue: 'Atrápame si puedes' },
      { section: 'comentarios', type: 'molly', left: '93%', top: '25%', size: '20px', dialogue: 'Qué onda', sound: 'ahhh.m4a' },
      { section: 'comentarios', type: 'molly', left: '35%', top: '90%', size: '16px', behavior: 'invisible', dialogue: 'Invisible mode' },
      { section: 'comentarios', type: 'molly', left: '55%', top: '45%', size: '22px', dialogue: 'Gogog' },
      
      // Guestbook - 3 Gissel, 3 Molly
      { section: 'guestbook', type: 'gissel', left: '12%', top: '40%', size: '23px', behavior: 'shy', dialogue: 'Dibuja algo bonito 🎨' },
      { section: 'guestbook', type: 'gissel', left: '87%', top: '55%', size: '26px', dialogue: '¡Firma el guestbook!' },
      { section: 'guestbook', type: 'gissel', left: '45%', top: '20%', size: '19px', dialogue: 'Arte everywhere' },
      { section: 'guestbook', type: 'molly', left: '60%', top: '45%', size: '25px', behavior: 'runner', dialogue: 'No toques mis dibujos' },
      { section: 'guestbook', type: 'molly', left: '25%', top: '65%', size: '21px', dialogue: 'Baboso detected', sound: 'ahhh.m4a' },
      { section: 'guestbook', type: 'molly', left: '75%', top: '80%', size: '20px', dialogue: 'Zzz...', sound: 'ahhh.m4a' },
      
      // Deadly Pursuer - 4 Gissel, 4 Molly
      { section: 'deadly-pursuer', type: 'gissel', left: '42%', top: '50%', size: '16px', behavior: 'invisible', dialogue: 'Survivor mode ON' },
      { section: 'deadly-pursuer', type: 'gissel', left: '78%', top: '88%', size: '15px', dialogue: '¡Juega conmigo!' },
      { section: 'deadly-pursuer', type: 'gissel', left: '15%', top: '25%', size: '18px', dialogue: 'Escapé de Molly 🏃' },
      { section: 'deadly-pursuer', type: 'gissel', left: '65%', top: '60%', size: '17px', dialogue: 'Ayuda!' },
      { section: 'deadly-pursuer', type: 'molly', left: '52%', top: '30%', size: '18px', behavior: 'runner', dialogue: 'Te voy a atrapar' },
      { section: 'deadly-pursuer', type: 'molly', left: '18%', top: '70%', size: '15px', behavior: 'shy', dialogue: 'Killer mode' },
      { section: 'deadly-pursuer', type: 'molly', left: '88%', top: '15%', size: '16px', dialogue: 'Rage activado 🔥' },
      { section: 'deadly-pursuer', type: 'molly', left: '30%', top: '45%', size: '19px', dialogue: 'Ven aquí baboso', sound: 'ahhh.m4a' },
      
      // Páginas externas - Guestbook (2 Gissel, 2 Molly), Deadly Pursuer (2 Gissel, 2 Molly)
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
    plushie.posData = pos;
    
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
    
    const handleInteraction = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.collectPlushie(pos.type, plushie, index, pos.sound);
    };
    
    plushie.addEventListener('click', handleInteraction);
    plushie.addEventListener('touchend', handleInteraction);
    
    const handleHoverStart = () => {
      if (pos.behavior !== 'runner') {
        plushie.style.transform = 'scale(1.3) rotate(15deg)';
        plushie.style.opacity = '1';
      }
      if (pos.dialogue) {
        this.showDialogue(pos.dialogue, plushie);
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
    
    // Comportamientos especiales
    if (pos.behavior === 'runner') {
      this.makeRunner(plushie, container);
    } else if (pos.behavior === 'shy') {
      this.makeShy(plushie);
    } else if (pos.behavior === 'invisible') {
      this.makeInvisible(plushie);
    }
    
    container.style.position = 'relative';
    container.appendChild(plushie);
  }

  makeRunner(plushie, container) {
    let stamina = 5;
    let tired = false;
    
    // Movimiento automático cada 3-5 segundos
    const autoMove = () => {
      if (!tired && stamina > 0) {
        const newLeft = Math.random() * 80 + 5;
        const newTop = Math.random() * 70 + 10;
        plushie.style.left = newLeft + '%';
        plushie.style.top = newTop + '%';
        plushie.style.transition = 'all 0.5s ease';
      }
      setTimeout(autoMove, Math.random() * 2000 + 3000);
    };
    autoMove();
    
    const runnerHover = () => {
      if (stamina > 0 && !tired) {
        stamina--;
        const newLeft = Math.random() * 80 + 5;
        const newTop = Math.random() * 70 + 10;
        plushie.style.left = newLeft + '%';
        plushie.style.top = newTop + '%';
        plushie.style.transform = 'scale(0.8)';
        setTimeout(() => plushie.style.transform = '', 200);
        
        if (plushie.posData?.dialogue) {
          this.showDialogue(plushie.posData.dialogue, plushie);
        }
        
        if (stamina === 0) {
          tired = true;
          plushie.style.filter = 'grayscale(0.5)';
          plushie.style.opacity = '0.6';
          setTimeout(() => {
            stamina = 5;
            tired = false;
            plushie.style.filter = '';
            plushie.style.opacity = '0.85';
          }, 5000);
        }
      }
    };
    
    plushie.addEventListener('mouseenter', runnerHover);
    
    const originalClick = plushie.onclick;
    plushie.onclick = (e) => {
      if (tired) {
        originalClick?.call(plushie, e);
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
      
      if (element.posData?.sound) {
        const audio = new Audio(`placeholder/${element.posData.sound}`);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
      
      this.updateCounter();
      
      element.style.animation = 'plushieCollect 0.5s ease-out';
      setTimeout(() => element.remove(), 500);
      
      if (this.progress[type] === 20) {
        this.showNotification(`¡Encontraste los 20 peluches de ${type === 'gissel' ? 'Gissel' : 'Molly'}! 🎉`);
      }
      
      if (this.progress.gissel === 20 && this.progress.molly === 20) {
        this.showNotification('¡Colección completa! 🏆');
        if (typeof checkAchievement === 'function') checkAchievement('plushie-collector');
        this.registerCompletion();
      }
    }
  }

  updateCounter() {
    const total = this.progress.gissel + this.progress.molly;
    document.getElementById('plushie-progress').textContent = `${total}/40`;
    this.updateEventBadge();
  }

  updateEventBadge() {
    const total = this.progress.gissel + this.progress.molly;
    const badgeContainer = document.getElementById('event-badge-container');
    if (!badgeContainer) return;
    
    const percentage = (total / 40) * 100;
    const isActive = this.isEventActive();
    const timeLeft = this.getTimeRemaining();
    const isComplete = total === 40;
    
    let badgeHTML = '';
    if (isComplete) {
      // Badge dorado especial cuando completas todo
      badgeHTML = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.3)); border: 2px solid #FFD700; border-radius: 12px; box-shadow: 0 0 20px rgba(255,215,0,0.4); animation: pulse 2s infinite;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem;">🏆</span>
            <div style="flex: 1;">
              <strong style="color: #FFD700; text-shadow: 0 0 10px rgba(255,215,0,0.5);">¡COLECCIÓN COMPLETA!</strong>
              <div style="font-size: 0.7rem; color: #FFA500;">${isActive ? '⏰ Evento activo' : '🎉 Evento finalizado'}</div>
            </div>
          </div>
          <div style="background: rgba(255,215,0,0.2); height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 0.5rem;">
            <div style="background: linear-gradient(90deg, #FFD700, #FFA500); height: 100%; width: 100%; box-shadow: 0 0 10px #FFD700;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #FFD700;">
            <span>💜 Gissel: 20/20 ✔️</span>
            <span>🔪 Molly: 20/20 ✔️</span>
            <span style="font-weight: bold;">40/40 🎉</span>
          </div>
        </div>
      `;
    } else if (isActive && timeLeft) {
      badgeHTML = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, rgba(255,107,53,0.2), rgba(247,147,30,0.2)); border: 2px solid var(--primary); border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem;">🧸</span>
            <div style="flex: 1;">
              <strong style="color: var(--primary);">Evento: Búsqueda de Peluches</strong>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">⏰ ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m restantes</div>
            </div>
          </div>
          <div style="background: var(--bg-light); height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 0.5rem;">
            <div style="background: linear-gradient(90deg, var(--primary), var(--secondary)); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
            <span>💜 Gissel: ${this.progress.gissel}/20</span>
            <span>🔪 Molly: ${this.progress.molly}/20</span>
            <span style="font-weight: bold; color: var(--primary);">${total}/40</span>
          </div>
        </div>
      `;
    } else if (!isActive && total > 0) {
      badgeHTML = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(128,128,128,0.1); border: 2px solid #666; border-radius: 12px; opacity: 0.7;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <span style="font-size: 1.5rem;">🧸</span>
            <div style="flex: 1;">
              <strong style="color: #999;">Evento Finalizado</strong>
              <div style="font-size: 0.7rem; color: var(--text-secondary);">2 dic - 1 ene 2026</div>
            </div>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            Tu progreso: ${total}/40 peluches (💜 ${this.progress.gissel} | 🔪 ${this.progress.molly})
          </div>
        </div>
      `;
    }
    
    badgeContainer.innerHTML = badgeHTML;
  }

  getTimeRemaining() {
    const now = new Date();
    const diff = this.endDate - now;
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }

  showPanel() {
    if (!this.isEventActive()) {
      alert('🧸 El evento de peluches finalizó el 1 de enero de 2026. ¡Gracias por participar!');
      return;
    }
    
    // Remover panel existente si hay
    const existingPanel = document.querySelector('.plushie-panel');
    if (existingPanel) existingPanel.remove();
    
    const savedName = localStorage.getItem('plushie-hunter-name') || '';
    
    const basePath = window.location.pathname.includes('guessbook') || window.location.pathname.includes('public') || window.location.pathname.includes('Projectankaro') ? '../' : '';
    const panel = document.createElement('div');
    panel.className = 'plushie-panel';
    panel.setAttribute('data-timestamp', Date.now());
    
    const timeLeft = this.getTimeRemaining();
    const timerHTML = timeLeft ? `
      <div style="margin: 1rem 0; padding: 0.75rem; background: rgba(255,107,53,0.2); border: 2px solid var(--primary); border-radius: 8px; text-align: center;">
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">⏰ Evento termina en:</div>
        <div id="plushie-timer" style="font-size: 1.2rem; font-weight: bold; color: var(--primary);">
          ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s
        </div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.5rem;">
          📅 Inicio: 2 dic 2025 | Fin: 1 ene 2026
        </div>
        <a href="https://funkyatlas.abelitogamer.com/Hope/Hope.html" target="_blank" style="display: block; margin-top: 0.5rem;">
          <img id="meditating-dog" src="${basePath}placeholder/perromeditando.png" style="width: 80px; height: 80px; opacity: 0; transition: opacity 5s ease; cursor: pointer; margin: 0 auto; display: block;" alt="Perro meditando">
        </a>
      </div>
    ` : '';
    
    panel.innerHTML = `
      <div class="plushie-panel-content">
        <button class="close-panel" onclick="this.parentElement.parentElement.remove()">&times;</button>
        <h3>🧸 Búsqueda de Peluches</h3>
        <p>¡Oh no! Gissel y Molly perdieron sus peluches por toda la página.</p>
        ${savedName ? `<div style="margin: 1rem 0; padding: 0.75rem; background: rgba(34,197,94,0.2); border: 2px solid #22c55e; border-radius: 8px; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">✅</span>
          <div style="flex: 1;">
            <div style="font-size: 0.85rem; color: #22c55e; font-weight: bold;">Nombre registrado: ${savedName}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">🏆 Aparecerás en el ranking global al completar</div>
          </div>
        </div>` : `<div style="margin: 1rem 0; padding: 0.75rem; background: rgba(255,107,53,0.2); border: 2px solid var(--primary); border-radius: 8px;">
          <label style="font-size: 0.85rem; color: var(--primary); display: block; margin-bottom: 0.5rem; font-weight: bold;">⚠️ IMPORTANTE: Tu nombre para el leaderboard</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="plushie-name-input" placeholder="Ingresa tu nombre" maxlength="20" required style="flex: 1; padding: 0.5rem; border: 2px solid var(--primary); border-radius: 6px; background: var(--bg-dark); color: var(--text-primary); font-family: inherit;">
            <button onclick="const name = document.getElementById('plushie-name-input').value.trim(); if(name) { localStorage.setItem('plushie-hunter-name', name); this.closest('.plushie-panel').remove(); plushieSystem.showPanel(); }" style="padding: 0.5rem 1rem; background: #22c55e; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">✅ OK</button>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">🏆 Si completas los 40 peluches, aparecerás en el ranking global</div>
        </div>`}
        ${timerHTML}
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
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button onclick="plushieSystem.showLeaderboard()" style="flex: 1; padding: 0.5rem 1rem; background: var(--secondary); color: white; border: none; border-radius: 6px; cursor: pointer;">🏆 Leaderboard</button>
          <button onclick="localStorage.removeItem('plushie-progress'); localStorage.removeItem('plushie-collected'); localStorage.removeItem('plushie-hunter-name'); location.reload();" style="flex: 1; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Reset</button>
        </div>
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
    
    // Actualizar temporizador cada segundo
    const timerElement = document.getElementById('plushie-timer');
    if (timerElement) {
      const updateTimer = () => {
        const timeLeft = this.getTimeRemaining();
        if (timeLeft) {
          timerElement.textContent = `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
        } else {
          clearInterval(timerInterval);
          panel.remove();
          alert('🧸 El evento de peluches ha finalizado. ¡Gracias por participar!');
        }
      };
      const timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Fade in del perro meditando
    const dogImg = document.getElementById('meditating-dog');
    if (dogImg) {
      setTimeout(() => {
        dogImg.style.opacity = '1';
      }, 100);
    }
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

  async registerCompletion() {
    let hunterName = localStorage.getItem('plushie-hunter-name') || gameData?.leaderboardName || '';
    
    if (!hunterName.trim()) {
      hunterName = prompt('🏆 ¡Felicidades! Completaste los 40 peluches.\n\nIngresa tu nombre para el leaderboard global:', '');
      if (hunterName) {
        localStorage.setItem('plushie-hunter-name', hunterName);
      }
    }
    
    const completionData = {
      name: hunterName?.trim() || 'Anónimo',
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    
    try {
      const response = await fetch('https://obvuetxkfodulfdbjhri.supabase.co/rest/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(completionData)
      });
      
      if (response.ok) {
        const firstCompleter = await this.getFirstCompleter();
        if (firstCompleter) {
          this.showNotification(`🏆 Primer completador: ${firstCompleter.name}`);
        }
      }
    } catch (error) {
      console.log('Error registrando completación:', error);
    }
  }

  async getFirstCompleter() {
    try {
      const response = await fetch('https://obvuetxkfodulfdbjhri.supabase.co/rest/v1/completions?order=timestamp.asc&limit=1', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data[0] || null;
      }
    } catch (error) {
      console.log('Error obteniendo primer completador:', error);
    }
    return null;
  }

  async showLeaderboard() {
    const panel = document.createElement('div');
    panel.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10001;';
    
    panel.innerHTML = `
      <div class="plushie-panel-content">
        <button class="close-panel" onclick="this.parentElement.parentElement.remove()">&times;</button>
        <h3>🏆 Leaderboard Global</h3>
        <div id="leaderboard-content" style="text-align: center; padding: 2rem;">
          <div style="font-size: 2rem;">⏳</div>
          <div>Cargando...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    panel.addEventListener('click', (e) => {
      if (e.target === panel) panel.remove();
    });
    
    try {
      const response = await fetch('https://obvuetxkfodulfdbjhri.supabase.co/rest/v1/completions?order=timestamp.asc&limit=10', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idnVldHhrZm9kdWxmZGJqaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNDU4OTksImV4cCI6MjA3NzYyMTg5OX0.DANmzSkPqCjOuIylHLXCYw8B0VU7b14THBf8V4Kdz_M'
        }
      });
      
      const content = document.getElementById('leaderboard-content');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.length === 0) {
          content.innerHTML = '<div style="padding: 2rem; color: var(--text-secondary);">👀 Aún no hay completadores.<br>¡Sé el primero!</div>';
        } else {
          let html = '<div style="text-align: left;">';
          data.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const date = new Date(entry.timestamp).toLocaleString('es-MX');
            const bgColor = index === 0 ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.2))' : 'var(--bg-light)';
            const borderColor = index === 0 ? '#FFD700' : 'var(--primary)';
            html += `
              <div style="padding: 0.75rem; margin-bottom: 0.5rem; background: ${bgColor}; border-radius: 8px; border-left: 3px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 1.2rem; margin-right: 0.5rem;">${medal}</span>
                    <strong>${entry.name}</strong>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">${date}</div>
                </div>
              </div>
            `;
          });
          html += '</div>';
          content.innerHTML = html;
        }
      } else {
        content.innerHTML = '<div style="padding: 2rem; color: #ff6666;">❌ Error al cargar leaderboard</div>';
      }
    } catch (error) {
      document.getElementById('leaderboard-content').innerHTML = '<div style="padding: 2rem; color: #ff6666;">❌ Error de conexión</div>';
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

// Sistema de alertas de errores para móviles
if (/Mobi|Android/i.test(navigator.userAgent)) {
  window.addEventListener('error', (e) => {
    alert(`❌ Error: ${e.message}\nArchivo: ${e.filename}\nLínea: ${e.lineno}`);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    alert(`❌ Promise Error: ${e.reason}`);
  });
}

let plushieSystem;
document.addEventListener('DOMContentLoaded', () => {
  plushieSystem = new PlushieSystem();
});
