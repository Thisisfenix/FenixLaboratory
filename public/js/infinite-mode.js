// Infinite Mode - Sistema independiente
class InfiniteMode {
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
    title.textContent = '♾️ MODO INFINITO - ELIGE PERSONAJE ♾️';
    title.style.cssText = 'color: #0ff; font-size: 3rem; font-weight: bold;';
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;';
    
    const chars = ['Angel', 'Gissel', 'iA777', 'Iris', 'Luna', 'Molly'];
    const iconMap = {
      'Angel': 'AngelNormalIcon',
      'Gissel': 'GisselInactiveIcon',
      'iA777': 'IA777NormalIcon',
      'Iris': 'IrisNormalIcon',
      'Luna': 'LunaNormalIcon',
      'Molly': 'MollyNormalIcon'
    };
    chars.forEach(char => {
      const img = document.createElement('img');
      img.src = `assets/icons/${iconMap[char]}.png`;
      img.style.cssText = 'width: 100px; height: 100px; cursor: pointer; border: 3px solid #0ff; border-radius: 10px;';
      img.addEventListener('click', () => {
        overlay.remove();
        this.start(char);
      });
      grid.appendChild(img);
    });
    
    overlay.appendChild(title);
    overlay.appendChild(grid);
    document.body.appendChild(overlay);
  }

  start(character) {
    if (!window.bossSystem) window.bossSystem = new BossFightSystem();
    window.bossSystem.infiniteMode = true;
    window.bossSystem.difficulty = 'infinite';
    
    const enhancements = new BossFightEnhancements();
    enhancements.score = 0;
    enhancements.scoreMultiplier = 1;
    enhancements.infiniteRound = 1;
    enhancements.infiniteStartTime = Date.now();
    window.bossSystem.setEnhancements(enhancements);
    
    this.christmasTheme.startBossFight(character);
  }
}

window.InfiniteMode = InfiniteMode;
