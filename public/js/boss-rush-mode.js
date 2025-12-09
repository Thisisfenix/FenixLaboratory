// Boss Rush Mode - Sistema independiente
class BossRushMode {
  constructor(christmasTheme) {
    this.christmasTheme = christmasTheme;
    this.transitionActive = false;
  }

  showBossTransition(bossNumber, callback) {
    if (this.transitionActive) return;
    this.transitionActive = true;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.9); z-index: 10001;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    `;
    
    const bossNames = ['ABELITO GORDO PANZÓN', 'ANNA LA LOCA', 'BOSS MISTERIOSO', 'EL DEVORADOR'];
    const bossEmojis = ['🎅', '💖', '❓', '👹'];
    
    const title = document.createElement('div');
    title.textContent = `${bossEmojis[bossNumber]} ${bossNames[bossNumber]} ${bossEmojis[bossNumber]}`;
    title.style.cssText = `
      color: #f0f; font-size: 3rem; font-weight: bold;
      animation: bossAppear 1.5s ease-out;
    `;
    
    const subtitle = document.createElement('div');
    subtitle.textContent = `BOSS ${bossNumber + 1}/4`;
    subtitle.style.cssText = 'color: #fff; font-size: 1.5rem; margin-top: 20px;';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bossAppear {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
      this.transitionActive = false;
      callback();
    }, 2000);
  }

  showDifficultySelect() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.95); z-index: 10000;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      gap: 20px;
    `;
    
    const title = document.createElement('div');
    title.textContent = '🔥 BOSS RUSH - DIFICULTAD 🔥';
    title.style.cssText = 'color: #f0f; font-size: 3rem; font-weight: bold; margin-bottom: 20px;';
    
    const difficulties = [
      { name: 'easy', label: 'FÁCIL', color: '#0f0', desc: 'Bosses con 70% HP, más lentos' },
      { name: 'normal', label: 'NORMAL', color: '#ff0', desc: 'Experiencia balanceada' },
      { name: 'hard', label: 'DIFÍCIL', color: '#f80', desc: 'Bosses con 130% HP, más rápidos' },
      { name: 'impossible', label: 'IMPOSIBLE', color: '#f00', desc: 'Bosses con 180% HP, ataques letales' }
    ];
    
    overlay.appendChild(title);
    
    difficulties.forEach(diff => {
      const btn = document.createElement('button');
      btn.textContent = diff.label;
      btn.style.cssText = `
        background: ${diff.color};
        color: #000;
        font-size: 2rem;
        font-weight: bold;
        padding: 20px 60px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: transform 0.3s;
        min-width: 400px;
      `;
      btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
      btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
      btn.addEventListener('click', () => {
        this.difficulty = diff.name;
        overlay.remove();
        this.showCharacterSelect();
      });
      
      const desc = document.createElement('div');
      desc.textContent = diff.desc;
      desc.style.cssText = 'color: #888; font-size: 1rem; margin-top: 5px;';
      
      const container = document.createElement('div');
      container.style.cssText = 'text-align: center;';
      container.appendChild(btn);
      container.appendChild(desc);
      overlay.appendChild(container);
    });
    
    document.body.appendChild(overlay);
  }

  showCharacterSelect() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.95); z-index: 10000;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      gap: 20px; overflow-y: auto;
    `;
    
    const title = document.createElement('div');
    title.textContent = `🔥 BOSS RUSH [${this.difficulty.toUpperCase()}] - PERSONAJE 🔥`;
    title.style.cssText = 'color: #f0f; font-size: 2.5rem; font-weight: bold;';
    
    const warning = document.createElement('div');
    warning.textContent = '⚠️ Una vez iniciado, no podrás pausar entre bosses ⚠️';
    warning.style.cssText = 'color: #ff0; font-size: 1.2rem; font-weight: bold; text-align: center;';
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px;';
    
    const chars = ['Angel', 'Gissel', 'iA777', 'Iris', 'Luna', 'Molly', 'ankush'];
    const iconMap = {
      'Angel': 'AngelNormalIcon',
      'Gissel': 'GisselInactiveIcon',
      'iA777': 'IA777NormalIcon',
      'Iris': 'IrisNormalIcon',
      'Luna': 'LunaNormalIcon',
      'Molly': 'MollyNormalIcon',
      'ankush': 'ankush'
    };
    
    chars.forEach(char => {
      const container = document.createElement('div');
      container.style.cssText = 'text-align: center; cursor: pointer; position: relative;';
      
      const img = document.createElement('img');
      img.src = `assets/icons/${iconMap[char]}.png`;
      img.style.cssText = `
        width: 100px; height: 100px; border: 3px solid #f0f; border-radius: 10px;
        transition: all 0.3s; filter: ${char === 'ankush' ? 'grayscale(100%)' : 'none'};
      `;
      
      const name = document.createElement('div');
      name.textContent = char;
      name.style.cssText = 'color: #fff; font-size: 1.2rem; margin-top: 10px; font-weight: bold;';
      
      if (char === 'ankush') {
        const banned = document.createElement('div');
        banned.textContent = '❌ BANEADO';
        banned.style.cssText = `
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: rgba(255,0,0,0.9); color: #fff; padding: 5px 10px;
          border-radius: 5px; font-size: 0.8rem; font-weight: bold;
        `;
        container.appendChild(banned);
        container.style.cursor = 'not-allowed';
        container.addEventListener('click', () => {
          alert('Ankush está baneado en Boss Rush por ser demasiado OP 😅');
        });
      } else {
        container.addEventListener('mouseenter', () => {
          img.style.transform = 'scale(1.1)';
          img.style.boxShadow = '0 0 20px #f0f';
        });
        container.addEventListener('mouseleave', () => {
          img.style.transform = 'scale(1)';
          img.style.boxShadow = 'none';
        });
        container.addEventListener('click', () => {
          overlay.remove();
          this.start(char);
        });
      }
      
      container.appendChild(img);
      container.appendChild(name);
      grid.appendChild(container);
    });
    
    overlay.appendChild(title);
    overlay.appendChild(warning);
    overlay.appendChild(grid);
    document.body.appendChild(overlay);
  }

  start(character) {
    if (!window.bossSystem) window.bossSystem = new BossFightSystem();
    window.bossSystem.bossRushMode = true;
    window.bossSystem.difficulty = `bossrush_${this.difficulty || 'normal'}`;
    
    const enhancements = new BossFightEnhancements();
    enhancements.score = 0;
    enhancements.scoreMultiplier = 1;
    enhancements.bossRush = enhancements.initBossRush();
    enhancements.bossRush.startTime = Date.now();
    window.bossSystem.setEnhancements(enhancements);
    
    this.showBossRushIntro(() => {
      this.christmasTheme.startBossFight(character);
    });
  }

  showBossRushIntro(callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: #000; z-index: 10001;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    `;
    
    const title = document.createElement('div');
    title.textContent = '🔥 BOSS RUSH INICIANDO 🔥';
    title.style.cssText = `
      color: #f0f; font-size: 4rem; font-weight: bold;
      animation: bossRushIntro 2s ease-in-out;
    `;
    
    const subtitle = document.createElement('div');
    subtitle.textContent = `Dificultad: ${this.difficulty.toUpperCase()}`;
    subtitle.style.cssText = 'color: #fff; font-size: 2rem; margin-top: 20px;';
    
    const countdown = document.createElement('div');
    countdown.style.cssText = 'color: #ff0; font-size: 6rem; font-weight: bold; margin-top: 40px;';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bossRushIntro {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        60% { transform: scale(1.2) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    overlay.appendChild(countdown);
    document.body.appendChild(overlay);
    
    let count = 3;
    const countInterval = setInterval(() => {
      countdown.textContent = count;
      count--;
      if (count < 0) {
        clearInterval(countInterval);
        countdown.textContent = '¡GO!';
        setTimeout(() => {
          overlay.remove();
          callback();
        }, 500);
      }
    }, 1000);
  }
}

window.BossRushMode = BossRushMode;

// Función helper para mostrar estadísticas finales
BossRushMode.prototype.showFinalStats = function(stats) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.95); z-index: 10003;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
  `;
  
  const title = document.createElement('div');
  title.textContent = '🏆 BOSS RUSH COMPLETADO 🏆';
  title.style.cssText = 'color: #ffd700; font-size: 3rem; font-weight: bold; margin-bottom: 30px;';
  
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = 'color: #fff; font-size: 1.5rem; text-align: center; line-height: 2;';
  statsDiv.innerHTML = `
    <div>Tiempo Total: ${stats.totalTime}s</div>
    <div>Score Total: ${stats.totalScore}</div>
    <div>Dificultad: ${stats.difficulty.toUpperCase()}</div>
    <div>Personaje: ${stats.character}</div>
    ${stats.noDamage ? '<div style="color: #ffd700;">🏆 ¡SIN DAÑO RECIBIDO! 🏆</div>' : ''}
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'CONTINUAR';
  closeBtn.style.cssText = `
    background: #ffd700; color: #000; font-weight: bold;
    padding: 15px 40px; border: none; border-radius: 10px;
    cursor: pointer; font-size: 1.5rem; margin-top: 30px;
  `;
  closeBtn.addEventListener('click', () => overlay.remove());
  
  overlay.appendChild(title);
  overlay.appendChild(statsDiv);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
};
