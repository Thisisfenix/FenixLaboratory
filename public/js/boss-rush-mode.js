// Boss Rush Mode - Sistema independiente
class BossRushMode {
  constructor(christmasTheme) {
    this.christmasTheme = christmasTheme;
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
    title.textContent = '🔥 BOSS RUSH - ELIGE PERSONAJE 🔥';
    title.style.cssText = 'color: #f0f; font-size: 3rem; font-weight: bold;';
    
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
      container.style.cssText = 'text-align: center; cursor: pointer;';
      
      const img = document.createElement('img');
      img.src = `assets/icons/${iconMap[char]}.png`;
      img.style.cssText = 'width: 100px; height: 100px; border: 3px solid #f0f; border-radius: 10px; transition: transform 0.3s;';
      
      const name = document.createElement('div');
      name.textContent = char;
      name.style.cssText = 'color: #fff; font-size: 1.2rem; margin-top: 10px; font-weight: bold;';
      
      container.addEventListener('mouseenter', () => img.style.transform = 'scale(1.1)');
      container.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
      container.addEventListener('click', () => {
        overlay.remove();
        this.start(char);
      });
      
      container.appendChild(img);
      container.appendChild(name);
      grid.appendChild(container);
    });
    
    overlay.appendChild(title);
    overlay.appendChild(grid);
    document.body.appendChild(overlay);
  }

  start(character) {
    if (!window.bossSystem) window.bossSystem = new BossFightSystem();
    window.bossSystem.bossRushMode = true;
    window.bossSystem.difficulty = 'bossrush';
    
    const enhancements = new BossFightEnhancements();
    enhancements.score = 0;
    enhancements.scoreMultiplier = 1;
    enhancements.bossRush = enhancements.initBossRush();
    window.bossSystem.setEnhancements(enhancements);
    
    this.christmasTheme.startBossFight(character);
  }
}

window.BossRushMode = BossRushMode;
