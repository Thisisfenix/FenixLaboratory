// Sistema de temática navideña para Deadly Pursuer
class ChristmasTheme {
  constructor() {
    this.isDecember = new Date().getMonth() === 11; // Diciembre = mes 11
    if (this.isDecember) {
      this.init();
    }
  }

  init() {
    this.addChristmasStyles();
    this.addSnowEffect();
    this.modifyUI();
    this.addSantaHats();
  }

  addChristmasStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .christmas-active body {
        background: linear-gradient(135deg, #0a1628 0%, #1a0a0a 100%) !important;
      }
      
      .christmas-active .header h1 {
        color: #ff0000 !important;
        text-shadow: 0 0 30px rgba(255,0,0,0.8), 0 0 60px rgba(0,255,0,0.4) !important;
      }
      
      .christmas-active .game-section {
        border-color: rgba(255,0,0,0.5) !important;
        background: rgba(10,0,0,0.8) !important;
      }
      
      .christmas-active .character-card {
        border-color: rgba(255,0,0,0.4) !important;
      }
      
      .christmas-active .character-card:hover {
        border-color: #ff0000 !important;
        box-shadow: 0 25px 50px rgba(255,0,0,0.5), 0 0 30px rgba(0,255,0,0.3) !important;
      }
      
      .christmas-active .character-card.selected {
        border-color: #ff0000 !important;
        box-shadow: 0 0 50px rgba(255,0,0,0.7), 0 0 30px rgba(0,255,0,0.5) !important;
      }
      
      .santa-hat {
        position: absolute;
        top: -15px;
        right: -10px;
        width: 40px;
        height: 40px;
        z-index: 10;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        animation: hatWiggle 3s ease-in-out infinite;
      }
      
      @keyframes hatWiggle {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
      
      .christmas-snow {
        position: fixed;
        top: -10px;
        color: #fff;
        font-size: 1.5em;
        z-index: 1;
        pointer-events: none;
        animation: snowFall linear infinite;
        text-shadow: 0 0 5px rgba(255,255,255,0.8);
      }
      
      @keyframes snowFall {
        0% { transform: translateY(-10px) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(calc(100vh + 10px)) translateX(20px); opacity: 0; }
      }
      
      .christmas-lights {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        background: repeating-linear-gradient(
          90deg,
          #ff0000 0px,
          #ff0000 20px,
          #00ff00 20px,
          #00ff00 40px,
          #ffff00 40px,
          #ffff00 60px,
          #0000ff 60px,
          #0000ff 80px
        );
        opacity: 0.3;
        animation: lightsGlow 2s ease-in-out infinite;
      }
      
      @keyframes lightsGlow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
      
      .christmas-decoration {
        position: absolute;
        font-size: 2rem;
        opacity: 0.6;
        animation: decorationFloat 4s ease-in-out infinite;
      }
      
      @keyframes decorationFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(10deg); }
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('christmas-active');
  }

  addSnowEffect() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const snowCount = isMobile ? 20 : 40;
    const snowflakes = ['❄', '❅', '❆'];
    
    for (let i = 0; i < snowCount; i++) {
      const snow = document.createElement('div');
      snow.className = 'christmas-snow';
      snow.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
      snow.style.left = Math.random() * 100 + '%';
      snow.style.animationDuration = (Math.random() * 4 + 6) + 's';
      snow.style.animationDelay = Math.random() * 5 + 's';
      snow.style.fontSize = (Math.random() * 1 + 0.8) + 'em';
      document.body.appendChild(snow);
    }
    
    this.playChristmasMusic();
  }

  playChristmasMusic() {
    const lobby = document.getElementById('lobby');
    if (!lobby || !lobby.classList.contains('active')) return;
    
    this.songs = ['assets/Deadly pursuir christmas.mp3', 'assets/Deadly pursuir christmas-1.mp3', 'assets/Deadly pursuir christmas-2.mp3'];
    this.currentSongIndex = Math.floor(Math.random() * this.songs.length);
    this.christmasAudio = new Audio(this.songs[this.currentSongIndex]);
    this.christmasAudio.volume = 0.3;
    
    const playMusic = () => {
      this.christmasAudio.play().catch(() => {});
      document.removeEventListener('click', playMusic);
      document.removeEventListener('touchstart', playMusic);
    };
    
    document.addEventListener('click', playMusic, { once: true });
    document.addEventListener('touchstart', playMusic, { once: true });
    
    const gameScreen = document.getElementById('game');
    if (gameScreen) {
      const observer = new MutationObserver(() => {
        if (gameScreen.classList.contains('active')) {
          if (this.christmasAudio) {
            this.christmasAudio.pause();
            this.christmasAudio.currentTime = 0;
          }
        } else if (lobby.classList.contains('active')) {
          if (this.christmasAudio && this.christmasAudio.paused) {
            this.christmasAudio.play().catch(() => {});
          }
        }
      });
      
      observer.observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
      observer.observe(lobby, { attributes: true, attributeFilter: ['class'] });
    }
  }

  modifyUI() {
    // Cambiar título
    const header = document.querySelector('.header h1');
    if (header) {
      header.innerHTML = '🎄 DEADLY CHRISTMAS PURSUIT 🎅';
    }

    // Cambiar subtítulo
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
      subtitle.textContent = '¡Especial de Navidad! 🎁 Escapa de Santa Molly o caza a los elfos sobrevivientes';
    }

    // Agregar luces navideñas
    const sections = document.querySelectorAll('.game-section');
    sections.forEach(section => {
      const lights = document.createElement('div');
      lights.className = 'christmas-lights';
      section.style.position = 'relative';
      section.insertBefore(lights, section.firstChild);
    });

    // Agregar decoraciones
    this.addDecorations();
  }

  addSantaHats() {
    // Agregar gorros a los avatares de personajes
    const avatars = document.querySelectorAll('.character-avatar');
    avatars.forEach(avatar => {
      const hat = document.createElement('div');
      hat.className = 'santa-hat';
      hat.innerHTML = '🎅';
      avatar.style.position = 'relative';
      avatar.appendChild(hat);
    });
  }

  showPlaylist() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.95);
      border: 3px solid #FFD700;
      border-radius: 15px;
      padding: 30px;
      z-index: 10002;
      min-width: 400px;
    `;
    
    const title = document.createElement('div');
    title.textContent = '🎵 CHRISTMAS PLAYLIST 🎵';
    title.style.cssText = 'color: #FFD700; font-size: 2rem; font-weight: bold; text-align: center; margin-bottom: 20px;';
    
    const songNames = ['Deadly Pursuir Christmas', 'Deadly Pursuir Christmas 2', 'Deadly Pursuir Christmas 3'];
    const list = document.createElement('div');
    list.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
    
    this.songs.forEach((song, i) => {
      const item = document.createElement('div');
      item.style.cssText = `
        background: ${i === this.currentSongIndex ? 'linear-gradient(45deg, #ff0000, #00ff00)' : 'rgba(255,255,255,0.1)'};
        padding: 15px;
        border-radius: 10px;
        cursor: pointer;
        transition: transform 0.2s;
        color: ${i === this.currentSongIndex ? '#000' : '#fff'};
        font-weight: ${i === this.currentSongIndex ? 'bold' : 'normal'};
        font-size: 1.2rem;
      `;
      item.textContent = `${i === this.currentSongIndex ? '▶️ ' : ''}${songNames[i]}`;
      item.addEventListener('mouseenter', () => item.style.transform = 'scale(1.05)');
      item.addEventListener('mouseleave', () => item.style.transform = 'scale(1)');
      item.addEventListener('click', () => {
        this.currentSongIndex = i;
        this.christmasAudio.src = this.songs[i];
        this.christmasAudio.play();
        panel.remove();
      });
      list.appendChild(item);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'CERRAR';
    closeBtn.style.cssText = `
      background: #f00;
      color: #fff;
      border: none;
      padding: 10px 30px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 20px;
      width: 100%;
    `;
    closeBtn.addEventListener('click', () => panel.remove());
    
    panel.appendChild(title);
    panel.appendChild(list);
    panel.appendChild(closeBtn);
    document.body.appendChild(panel);
  }

  addDecorations() {
    const decorations = ['🎄', '🎁', '⛄', '🔔', '🕯️', '🎀'];
    const lobby = document.getElementById('lobby');
    
    if (lobby) {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      
      this.musicControl = document.createElement('button');
      this.musicControl.innerHTML = '🔊 🎵';
      this.musicControl.style.cssText = isMobile ? `
        position: fixed;
        bottom: 170px;
        right: 20px;
        background: linear-gradient(45deg, #ff0000, #00ff00);
        border: 2px solid #FFD700;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(255,0,0,0.5);
        transition: transform 0.3s;
      ` : `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(45deg, #ff0000, #00ff00);
        border: 2px solid #FFD700;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(255,0,0,0.5);
        transition: transform 0.3s;
      `;
      
      this.musicControl.addEventListener('click', () => this.showPlaylist());
      
      this.christmasAudio.addEventListener('ended', () => {
        this.currentSongIndex = (this.currentSongIndex + 1) % this.songs.length;
        this.christmasAudio.src = this.songs[this.currentSongIndex];
        this.christmasAudio.play();
      });
      
      document.body.appendChild(this.musicControl);
      
      this.gif = document.createElement('img');
      this.gif.src = Math.random() < 0.99 ? 'assets/SPOILER_GIF_20251207_160827_305.gif' : 'assets/GIF_20251206_082647_448.gif';
      this.gif.style.cssText = isMobile ? `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 80px;
        height: auto;
        border-radius: 8px;
        border: 2px solid #FFD700;
        box-shadow: 0 4px 15px rgba(255,215,0,0.5);
        z-index: 9998;
        animation: gifBounce 2s ease-in-out infinite;
      ` : `
        position: fixed;
        bottom: 90px;
        left: 20px;
        width: 150px;
        height: auto;
        border-radius: 10px;
        border: 3px solid #FFD700;
        box-shadow: 0 4px 15px rgba(255,215,0,0.5);
        z-index: 9998;
        animation: gifBounce 2s ease-in-out infinite;
      `;
      document.body.appendChild(this.gif);
      
      const gifStyle = document.createElement('style');
      gifStyle.textContent = `
        @keyframes gifBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(gifStyle);
      
      for (let i = 0; i < 6; i++) {
        const deco = document.createElement('div');
        deco.className = 'christmas-decoration';
        deco.textContent = decorations[i];
        deco.style.left = (i * 16 + 5) + '%';
        deco.style.top = Math.random() * 80 + 10 + '%';
        deco.style.animationDelay = (i * 0.5) + 's';
        lobby.appendChild(deco);
      }
      
      this.addBossFight();
    }
  }

  addBossFight() {
    const footer = document.querySelector('.game-footer');
    if (!footer) return;
    
    const container = document.createElement('div');
    container.style.cssText = 'text-align: center; margin: 20px; position: relative;';
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; display: inline-block;';
    
    const bossImg = document.createElement('img');
    bossImg.src = 'abelitogordopanzon/image.png';
    bossImg.style.cssText = `
      width: 120px;
      cursor: pointer;
      filter: drop-shadow(0 0 20px rgba(255,0,0,0.8));
      animation: bossFloat 3s ease-in-out infinite;
      display: block;
      margin: 0 auto 10px;
    `;
    
    const overlay = document.createElement('div');
    const bossDefeated = localStorage.getItem('bossDefeated');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${bossDefeated ? 'transparent' : '#000'};
      cursor: pointer;
      display: ${bossDefeated ? 'none' : 'flex'};
      align-items: center;
      justify-content: center;
      color: #FFD700;
      font-size: 3rem;
      animation: bossFloat 3s ease-in-out infinite;
    `;
    overlay.textContent = '?';
    
    bossImg.addEventListener('click', () => {
      this.showBossIntro();
    });
    
    overlay.addEventListener('click', () => {
      overlay.remove();
      this.showBossIntro();
    });
    
    const leaderboardBtn = document.createElement('button');
    leaderboardBtn.textContent = '🏆 LEADERBOARD';
    leaderboardBtn.style.cssText = `
      background: linear-gradient(45deg, #ffd700, #ff8c00);
      color: #000;
      font-weight: bold;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      margin: 5px;
      display: ${localStorage.getItem('bossDefeated') ? 'inline-block' : 'none'};
    `;
    leaderboardBtn.addEventListener('click', () => {
      if (!window.bossSystem) window.bossSystem = new BossFightSystem();
      window.bossSystem.showLeaderboard();
    });
    this.leaderboardBtn = leaderboardBtn;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bossFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
    
    const timer = document.createElement('div');
    timer.style.cssText = `
      color: #FFD700;
      font-size: 1rem;
      font-weight: bold;
      text-align: center;
      margin-bottom: 10px;
      text-shadow: 0 0 10px rgba(255,215,0,0.8);
    `;
    
    const updateTimer = () => {
      const now = new Date();
      const endOfDecember = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      const diff = endOfDecember - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      timer.textContent = `⏰ Desaparece en: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
    
    wrapper.appendChild(bossImg);
    wrapper.appendChild(overlay);
    container.appendChild(timer);
    container.appendChild(wrapper);
    container.appendChild(leaderboardBtn);
    footer.parentNode.insertBefore(container, footer);
  }

  showBossIntro() {
    const intro = document.createElement('div');
    intro.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 30px;
    `;
    
    const bossImg = document.createElement('img');
    bossImg.src = 'abelitogordopanzon/image.png';
    bossImg.style.cssText = 'width: 250px; animation: bossIntroAnim 2s ease-in-out;';
    
    const text = document.createElement('div');
    text.textContent = 'ABELITO GORDO PANZÓN';
    text.style.cssText = 'color: #ff0000; font-size: 4rem; font-weight: bold; text-shadow: 0 0 30px #ff0000; animation: textPulse 1s ease-in-out infinite;';
    
    const subtitle = document.createElement('div');
    subtitle.textContent = '¡HA APARECIDO!';
    subtitle.style.cssText = 'color: #fff; font-size: 2rem; margin-top: 20px;';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bossIntroAnim {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        60% { transform: scale(1.3) rotate(10deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes textPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
    
    intro.appendChild(bossImg);
    intro.appendChild(text);
    intro.appendChild(subtitle);
    document.body.appendChild(intro);
    
    setTimeout(() => {
      intro.remove();
      this.showCharacterSelect();
    }, 3000);
  }

  showCharacterSelect() {
    if (!window.bossSystem) window.bossSystem = new BossFightSystem();
    window.bossSystem.showDifficultySelect((mode) => {
      if (mode === 'bossrush') {
        if (window.BossRushMode) {
          const bossRush = new BossRushMode(this);
          bossRush.showCharacterSelect();
        }
      } else if (mode === 'infinite') {
        if (window.InfiniteMode) {
          const infinite = new InfiniteMode(this);
          infinite.showCharacterSelect();
        }
      } else {
        this.showCharacterSelectInternal();
      }
    });
  }

  showCharacterSelectInternal() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const hasGamepad = navigator.getGamepads && navigator.getGamepads()[0];
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.95);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      overflow-y: auto;
    `;
    
    const title = document.createElement('div');
    title.textContent = 'ELIGE TU PERSONAJE';
    title.style.cssText = 'color: #FFD700; font-size: 3rem; font-weight: bold;';
    
    const controls = document.createElement('div');
    controls.style.cssText = 'background: rgba(0,0,0,0.8); padding: 15px 30px; border-radius: 10px; border: 2px solid #FFD700; max-width: 600px;';
    
    if (isMobile) {
      controls.innerHTML = `
        <div style="color: #fff; font-size: 1rem; text-align: center;">
          <div style="color: #FFD700; font-weight: bold; margin-bottom: 10px;">📱 CONTROLES MÓVIL</div>
          <div>👆 Izquierda: Mover | Derecha: Disparar</div>
          <div>👆 Doble tap: Dash</div>
          <div>Botón Q: Slow Time | Botón E: Heal</div>
          <div>Botón R: Rapid Fire</div>
        </div>
      `;
    } else if (hasGamepad) {
      controls.innerHTML = `
        <div style="color: #fff; font-size: 1rem; text-align: center;">
          <div style="color: #FFD700; font-weight: bold; margin-bottom: 10px;">🎮 CONTROLES GAMEPAD</div>
          <div>🕹️ Stick Izq: Mover | Stick Der: Apuntar</div>
          <div>🅰️ A: Disparar | 🅱️ B: Dash</div>
          <div>❌ X: Slow Time | 🔺 Y: Heal</div>
          <div>LB: Rapid Fire</div>
        </div>
      `;
    } else {
      controls.innerHTML = `
        <div style="color: #fff; font-size: 1rem; text-align: center;">
          <div style="color: #FFD700; font-weight: bold; margin-bottom: 10px;">⌨️ CONTROLES PC</div>
          <div>WASD: Mover | Flechas: Dirección</div>
          <div>Espacio: Disparar | Shift: Dash</div>
          <div>Q: Slow Time | E: Heal | R: Rapid Fire</div>
        </div>
      `;
    }
    
    const helpBtn = document.createElement('div');
    helpBtn.style.cssText = `
      background: rgba(255,215,0,0.2);
      border: 2px solid #FFD700;
      border-radius: 10px;
      padding: 10px 20px;
      color: #FFD700;
      font-size: 0.9rem;
      text-align: center;
      margin-bottom: 10px;
    `;
    helpBtn.innerHTML = hasGamepad ? '🎮 Presiona SELECT/BACK para ver habilidades' : '💡 Toca un personaje para ver su habilidad';
    
    let selectedCharIndex = 0;
    let helpVisible = false;
    
    const getAdjustedHP = (baseHP) => {
      const diff = window.bossSystem.difficulty;
      if (diff === 'easy') return Math.floor(baseHP * 1.2);
      if (diff === 'impossible') return Math.floor(baseHP * 0.7);
      return baseHP;
    };
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;';
    
    const chars = ['Angel', 'Gissel', 'iA777', 'Iris', 'Luna', 'Molly', 'ankush'];
    chars.forEach(char => {
      const tempEnhancements = new BossFightEnhancements();
      const stats = tempEnhancements.getCharacterStats(char);
      const adjustedHP = getAdjustedHP(stats.hp);
      
      const container = document.createElement('div');
      container.style.cssText = 'text-align: center;';
      
      const img = document.createElement('img');
      const iconMap = {
        'Angel': 'AngelNormalIcon',
        'Gissel': 'GisselInactiveIcon',
        'iA777': 'IA777NormalIcon',
        'Iris': 'IrisNormalIcon',
        'Luna': 'LunaNormalIcon',
        'Molly': 'MollyNormalIcon',
        'ankush': 'ankush'
      };
      img.src = char === 'ankush' ? 'assets/icons/ankush.png' : `assets/icons/${iconMap[char]}.png`;
      img.style.cssText = 'width: 100px; height: 100px; cursor: pointer; border: 3px solid #fff; border-radius: 10px; transition: transform 0.3s;';
      img.addEventListener('mouseenter', () => img.style.transform = 'scale(1.1)');
      img.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
      img.addEventListener('click', () => {
        overlay.remove();
        this.showIntro(char);
      });
      
      const abilityName = document.createElement('div');
      abilityName.textContent = stats.abilityName;
      abilityName.style.cssText = 'color: #FFD700; font-size: 0.9rem; font-weight: bold; margin-top: 5px;';
      
      const abilityDesc = document.createElement('div');
      const descParts = stats.abilityDesc.split(' | ');
      abilityDesc.textContent = char === 'ankush' ? '999 HP | Imposible perder' : `${adjustedHP} HP | ${descParts[1] || descParts[0]}`;
      abilityDesc.style.cssText = 'color: #aaa; font-size: 0.75rem;';
      
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.95);
        border: 2px solid #FFD700;
        border-radius: 10px;
        padding: 15px;
        color: #fff;
        font-size: 0.9rem;
        width: 250px;
        z-index: 10001;
        display: none;
        pointer-events: none;
      `;
      
      const tooltipContent = {
        'Angel': `<b style="color: #FFD700;">⚔️ Escudo Divino</b><br><br>${adjustedHP} HP | Angel tiene un escudo dorado que bloquea automáticamente el primer golpe que reciba.<br><br>• Cooldown: 15 segundos<br>• Pasiva automática<br>• Ideal para principiantes`,
        'Gissel': `<b style="color: #FFD700;">💨 Evasión</b><br><br>${adjustedHP} HP | Gissel puede usar Dash con mayor frecuencia que otros personajes.<br><br>• Cooldown: 8 segundos (vs 2s normal)<br>• Perfecta para esquivar<br>• Alta movilidad`,
        'iA777': `<b style="color: #FFD700;">🛡️ Tanque</b><br><br>${adjustedHP} HP | iA777 reduce todo el daño recibido en un 30%.<br><br>• Pasiva permanente<br>• Más HP base<br>• Ideal para aguantar`,
        'Iris': `<b style="color: #FFD700;">💚 Equilibrio</b><br><br>${adjustedHP} HP | Iris regenera vida constantemente durante la batalla.<br><br>• +1 HP cada 2 segundos<br>• Pasiva automática<br>• Recuperación sostenida`,
        'Luna': `<b style="color: #FFD700;">⚡ Velocista</b><br><br>${adjustedHP} HP | Luna dispara más rápido que otros personajes.<br><br>• Cooldown de disparo reducido<br>• Más velocidad de movimiento<br>• Alto DPS`,
        'Molly': `<b style="color: #FFD700;">🔥 Furia</b><br><br>${adjustedHP} HP | Molly hace +50% de daño cuando tiene menos del 50% de vida.<br><br>• Se activa bajo 50% HP<br>• Partículas rojas al disparar<br>• Riesgo/Recompensa`,
        'ankush': `<b style="color: #FFD700;">😂 Ankush</b><br><br>999 HP | El personaje más roto del juego. Literalmente imposible perder.<br><br>• 999 HP (inmortal básicamente)<br>• Velocidad x2 (zoom zoom)<br>• Daño x5 (one shot everything)<br>• Balas amarillas<br>• No leaderboard (obvio)`
      };
      
      tooltip.innerHTML = tooltipContent[char];
      
      container.addEventListener('mouseenter', (e) => {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.pageX + 20) + 'px';
        tooltip.style.top = (e.pageY - 50) + 'px';
      });
      
      container.addEventListener('mousemove', (e) => {
        tooltip.style.left = (e.pageX + 20) + 'px';
        tooltip.style.top = (e.pageY - 50) + 'px';
      });
      
      container.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      
      let touchTimeout;
      container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        tooltip.style.display = 'block';
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.style.position = 'fixed';
        
        touchTimeout = setTimeout(() => {
          tooltip.style.display = 'none';
        }, 3000);
      });
      
      container.addEventListener('touchend', () => {
        clearTimeout(touchTimeout);
      });
      
      container.appendChild(img);
      container.appendChild(abilityName);
      container.appendChild(abilityDesc);
      container.appendChild(tooltip);
      grid.appendChild(container);
    });
    
    const helpOverlay = document.createElement('div');
    helpOverlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.98);
      border: 3px solid #FFD700;
      border-radius: 15px;
      padding: 30px;
      max-width: 600px;
      z-index: 10002;
      display: none;
    `;
    
    const updateHelpContent = (charIndex) => {
      const char = chars[charIndex];
      const tempEnhancements = new BossFightEnhancements();
      const stats = tempEnhancements.getCharacterStats(char);
      const adjustedHP = getAdjustedHP(stats.hp);
      const tooltipContent = {
        'Angel': `<b style="color: #FFD700;">⚔️ Escudo Divino</b><br><br>${adjustedHP} HP | Angel tiene un escudo dorado que bloquea automáticamente el primer golpe que reciba.<br><br>• Cooldown: 15 segundos<br>• Pasiva automática<br>• Ideal para principiantes`,
        'Gissel': `<b style="color: #FFD700;">💨 Evasión</b><br><br>${adjustedHP} HP | Gissel puede usar Dash con mayor frecuencia que otros personajes.<br><br>• Cooldown: 8 segundos (vs 2s normal)<br>• Perfecta para esquivar<br>• Alta movilidad`,
        'iA777': `<b style="color: #FFD700;">🛡️ Tanque</b><br><br>${adjustedHP} HP | iA777 reduce todo el daño recibido en un 30%.<br><br>• Pasiva permanente<br>• Más HP base<br>• Ideal para aguantar`,
        'Iris': `<b style="color: #FFD700;">💚 Equilibrio</b><br><br>${adjustedHP} HP | Iris regenera vida constantemente durante la batalla.<br><br>• +1 HP cada 2 segundos<br>• Pasiva automática<br>• Recuperación sostenida`,
        'Luna': `<b style="color: #FFD700;">⚡ Velocista</b><br><br>${adjustedHP} HP | Luna dispara más rápido que otros personajes.<br><br>• Cooldown de disparo reducido<br>• Más velocidad de movimiento<br>• Alto DPS`,
        'Molly': `<b style="color: #FFD700;">🔥 Furia</b><br><br>${adjustedHP} HP | Molly hace +50% de daño cuando tiene menos del 50% de vida.<br><br>• Se activa bajo 50% HP<br>• Partículas rojas al disparar<br>• Riesgo/Recompensa`,
        'ankush': `<b style="color: #FFD700;">😂 Ankush</b><br><br>999 HP | El personaje más roto del juego. Literalmente imposible perder.<br><br>• 999 HP (inmortal básicamente)<br>• Velocidad x2 (zoom zoom)<br>• Daño x5 (one shot everything)<br>• Balas amarillas<br>• No leaderboard (obvio)`
      };
      helpOverlay.innerHTML = `
        <div style="color: #fff; font-size: 1.1rem; line-height: 1.6;">
          ${tooltipContent[char]}
        </div>
        <div style="color: #888; font-size: 0.9rem; margin-top: 20px; text-align: center;">
          ${hasGamepad ? '🎮 D-Pad: Cambiar | SELECT: Cerrar' : '👆 Toca fuera para cerrar'}
        </div>
      `;
    };
    
    if (hasGamepad) {
      const gamepadInterval = setInterval(() => {
        const gp = navigator.getGamepads()[0];
        if (!gp) return;
        
        if (gp.buttons[8] && gp.buttons[8].pressed && !gp.buttons[8].wasPressed) {
          helpVisible = !helpVisible;
          helpOverlay.style.display = helpVisible ? 'block' : 'none';
          if (helpVisible) updateHelpContent(selectedCharIndex);
        }
        gp.buttons[8].wasPressed = gp.buttons[8].pressed;
        
        if (helpVisible) {
          if (gp.buttons[14] && gp.buttons[14].pressed && !gp.buttons[14].wasPressed) {
            selectedCharIndex = (selectedCharIndex - 1 + chars.length) % chars.length;
            updateHelpContent(selectedCharIndex);
          }
          if (gp.buttons[15] && gp.buttons[15].pressed && !gp.buttons[15].wasPressed) {
            selectedCharIndex = (selectedCharIndex + 1) % chars.length;
            updateHelpContent(selectedCharIndex);
          }
          gp.buttons[14].wasPressed = gp.buttons[14].pressed;
          gp.buttons[15].wasPressed = gp.buttons[15].pressed;
        }
      }, 100);
      
      overlay.addEventListener('remove', () => clearInterval(gamepadInterval));
    }
    
    helpOverlay.addEventListener('click', () => {
      helpOverlay.style.display = 'none';
      helpVisible = false;
    });
    
    overlay.appendChild(title);
    overlay.appendChild(helpBtn);
    overlay.appendChild(controls);
    overlay.appendChild(grid);
    overlay.appendChild(helpOverlay);
    document.body.appendChild(overlay);
  }

  showIntro(character) {
    if (this.musicControl) this.musicControl.style.display = 'none';
    if (this.gif) this.gif.style.display = 'none';
    
    const intro = document.createElement('div');
    intro.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 30px;
    `;
    
    const bossImg = document.createElement('img');
    bossImg.src = 'abelitogordopanzon/image.png';
    bossImg.style.cssText = 'width: 200px; animation: bossIntro 2s ease-in-out;';
    
    const text = document.createElement('div');
    text.textContent = 'ABELITO GORDO PANZÓN';
    text.style.cssText = 'color: #ff0000; font-size: 4rem; font-weight: bold; text-shadow: 0 0 30px #ff0000;';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bossIntro {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    intro.appendChild(bossImg);
    intro.appendChild(text);
    document.body.appendChild(intro);
    
    setTimeout(() => {
      intro.remove();
      this.startBossFight(character);
    }, 3000);
  }

  startBossFight(character) {
    document.getElementById('lobby').classList.remove('active');
    document.getElementById('game').classList.add('active');
    
    const enhancements = window.bossSystem.enhancements || new BossFightEnhancements();
    if (!window.bossSystem.enhancements) {
      enhancements.score = 0;
      enhancements.scoreMultiplier = 1;
    }
    window.bossSystem.setEnhancements(enhancements);
    const charStats = enhancements.getCharacterStats(character);
    
    const bossMusic = new Audio('abelitogordopanzon/AbelitoGordoPanzon bossfight.mp3');
    bossMusic.volume = 0.5;
    bossMusic.loop = true;
    bossMusic.play().catch(() => {});
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const maxAspectRatio = 21 / 9;
    const currentAspectRatio = window.innerWidth / window.innerHeight;
    
    if (currentAspectRatio > maxAspectRatio) {
      canvas.height = window.innerHeight;
      canvas.width = Math.floor(canvas.height * maxAspectRatio);
      canvas.style.margin = '0 auto';
      canvas.style.display = 'block';
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    const player = { x: 100, y: canvas.height / 2, size: 40, health: charStats.hp, maxHealth: charStats.hp, icon: new Image(), combo: 0, dashCooldown: 0, tripleShot: false, tripleShotTimer: 0, shield: false, shieldTimer: 0, slowTime: false, slowTimeTimer: 0, slowTimeCooldown: 0, healCooldown: 0, rapidFire: false, rapidFireTimer: 0, rapidFireCooldown: 0, shootCooldown: 0, invincible: false, invincibleTimer: 0, speedBoost: false, speedBoostTimer: 0, doubleDamage: false, doubleDamageTimer: 0, slowMotion: false, slowMotionTimer: 0, dashUsed: false, speed: charStats.speed, damageMultiplier: charStats.damage, ability: charStats.ability, angelShield: true, angelShieldCooldown: 0, regenTimer: 0 };
    const iconMap = {
      'Angel': 'AngelNormalIcon',
      'Gissel': 'GisselInactiveIcon',
      'iA777': 'IA777NormalIcon',
      'Iris': 'IrisNormalIcon',
      'Luna': 'LunaNormalIcon',
      'Molly': 'MollyNormalIcon',
      'ankush': 'ankush'
    };
    player.icon.src = `assets/icons/${iconMap[character] || character}.png`;
    
    const boss = { 
      x: canvas.width + 100, 
      y: -100,
      targetX: canvas.width - 150,
      targetY: 50,
      size: 80, 
      health: 500,
      maxHealth: 500,
      img: new Image(), 
      dy: 2,
      attackTimer: 0,
      phase: 1,
      intro: true,
      shield: 0,
      shieldMax: 30,
      shieldTimer: 0,
      telegraphTimer: 0,
      telegraphActive: false,
      telegraphType: null,
      droppedPowerups: [],
      isAnnaBoss: false,
      isDevourerBoss: false
    };
    
    if (window.bossSystem.bossRushMode && window.bossSystem.enhancements?.bossRush) {
      const currentBoss = window.bossSystem.enhancements.bossRush.currentBoss;
      if (currentBoss === 1) {
        boss.img.src = 'abelitogordopanzon/Anna.png';
        boss.isAnnaBoss = true;
      } else if (currentBoss === 3) {
        boss.img.src = 'assets/GIF_20251206_082647_448.gif';
        boss.isDevourerBoss = true;
      } else {
        boss.img.src = 'abelitogordopanzon/image.png';
      }
    } else {
      boss.img.src = 'abelitogordopanzon/image.png';
    }
    
    if (window.bossSystem.infiniteMode && window.bossSystem.enhancements?.infiniteRound) {
      const round = window.bossSystem.enhancements.infiniteRound;
      boss.health = Math.floor(boss.maxHealth * (1 + round * 0.3));
      boss.maxHealth = boss.health;
      boss.dy *= (1 + round * 0.1);
    } else {
      window.bossSystem.applyDifficulty(boss, player);
    }
    window.bossSystem.startRecording();
    
    const bullets = [];
    const bossBullets = [];
    const powerups = [];
    const keys = {};
    const touches = {};
    let fearEffect = false;
    let fearTimer = 0;
    let introTimer = 0;
    let lastTap = 0;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    let isPaused = false;
    let pauseOverlay = null;
    
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTap < 300 && player.dashCooldown === 0) {
        const dx = e.touches[0].clientX - player.x;
        const dy = e.touches[0].clientY - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          player.x = Math.max(0, Math.min(canvas.width - player.size, player.x + (dx/dist) * 100));
          player.y = Math.max(0, Math.min(canvas.height - player.size, player.y + (dy/dist) * 100));
          player.dashCooldown = 120;
        }
      }
      lastTap = now;
      Array.from(e.touches).forEach(t => {
        touches[t.identifier] = { x: t.clientX, y: t.clientY };
        
        const dpadX = canvas.width - 100;
        const dpadY = canvas.height - 100;
        const dpadSize = 40;
        
        if (t.clientX > dpadX && t.clientX < dpadX + dpadSize && t.clientY > dpadY - dpadSize && t.clientY < dpadY) shootDir = { x: 0, y: -1 };
        else if (t.clientX > dpadX && t.clientX < dpadX + dpadSize && t.clientY > dpadY + dpadSize && t.clientY < dpadY + dpadSize * 2) shootDir = { x: 0, y: 1 };
        else if (t.clientX > dpadX - dpadSize && t.clientX < dpadX && t.clientY > dpadY && t.clientY < dpadY + dpadSize) shootDir = { x: -1, y: 0 };
        else if (t.clientX > dpadX + dpadSize && t.clientX < dpadX + dpadSize * 2 && t.clientY > dpadY && t.clientY < dpadY + dpadSize) shootDir = { x: 1, y: 0 };
        else if (t.clientX > canvas.width * 0.7 && t.clientY < canvas.height - 200 && player.shootCooldown === 0) {
          playShootSound();
          if (player.tripleShot) {
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10, dy: shootDir.y * 10, size: 10 });
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10 + shootDir.y * 2, dy: shootDir.y * 10 - shootDir.x * 2, size: 10 });
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10 - shootDir.y * 2, dy: shootDir.y * 10 + shootDir.x * 2, size: 10 });
          } else {
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10, dy: shootDir.y * 10, size: 10 });
          }
          player.shootCooldown = player.rapidFire ? 5 : 15;
        }
        
        const btnSize = 50;
        const btnY = canvas.height - 250;
        if (t.clientX > 20 && t.clientX < 20 + btnSize && t.clientY > btnY && t.clientY < btnY + btnSize && player.slowTimeCooldown === 0) {
          player.slowTime = true;
          player.slowTimeTimer = 180;
          player.slowTimeCooldown = 720;
        }
        if (t.clientX > 80 && t.clientX < 80 + btnSize && t.clientY > btnY && t.clientY < btnY + btnSize && player.healCooldown === 0) {
          player.health = Math.min(player.maxHealth, player.health + 25);
          player.healCooldown = 600;
        }
        if (t.clientX > 140 && t.clientX < 140 + btnSize && t.clientY > btnY && t.clientY < btnY + btnSize && player.rapidFireCooldown === 0) {
          player.rapidFire = true;
          player.rapidFireTimer = 180;
          player.rapidFireCooldown = 720;
        }
      });
    });
    
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      Array.from(e.touches).forEach(t => {
        if (touches[t.identifier] && t.clientX < canvas.width * 0.5) {
          const dx = t.clientX - touches[t.identifier].x;
          const dy = t.clientY - touches[t.identifier].y;
          player.x = Math.max(0, Math.min(canvas.width - player.size, player.x + dx * 0.5));
          player.y = Math.max(0, Math.min(canvas.height - player.size, player.y + dy * 0.5));
          touches[t.identifier] = { x: t.clientX, y: t.clientY };
        }
      });
    });
    
    canvas.addEventListener('touchend', e => {
      Array.from(e.changedTouches).forEach(t => delete touches[t.identifier]);
    });
    
    const getGamepad = () => {
      const gp = navigator.getGamepads()[0];
      if (gp) {
        if (Math.abs(gp.axes[0]) > 0.2) player.x += gp.axes[0] * 4;
        if (Math.abs(gp.axes[1]) > 0.2) player.y += gp.axes[1] * 4;
        
        if (Math.abs(gp.axes[2]) > 0.3 || Math.abs(gp.axes[3]) > 0.3) {
          const angle = Math.atan2(gp.axes[3], gp.axes[2]);
          shootDir = { x: Math.cos(angle), y: Math.sin(angle) };
        }
        
        if (gp.buttons[0].pressed && player.shootCooldown === 0) {
          playShootSound();
          if (player.tripleShot) {
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10, dy: shootDir.y * 10, size: 10 });
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10 + shootDir.y * 2, dy: shootDir.y * 10 - shootDir.x * 2, size: 10 });
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10 - shootDir.y * 2, dy: shootDir.y * 10 + shootDir.x * 2, size: 10 });
          } else {
            bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10, dy: shootDir.y * 10, size: 10 });
          }
          player.shootCooldown = player.rapidFire ? 5 : 15;
        }
        
        if (gp.buttons[1].pressed && player.dashCooldown === 0) {
          const dashDist = 100;
          player.x += shootDir.x * dashDist;
          player.y += shootDir.y * dashDist;
          player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
          player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
          player.dashCooldown = 120;
        }
        
        if (gp.buttons[2].pressed && !gp.buttons[2].wasPressed && player.slowTimeCooldown === 0) {
          player.slowTime = true;
          player.slowTimeTimer = 180;
          player.slowTimeCooldown = 720;
        }
        gp.buttons[2].wasPressed = gp.buttons[2].pressed;
        
        if (gp.buttons[3].pressed && !gp.buttons[3].wasPressed && player.healCooldown === 0) {
          player.health = Math.min(player.maxHealth, player.health + 25);
          player.healCooldown = 600;
        }
        gp.buttons[3].wasPressed = gp.buttons[3].pressed;
        
        if (gp.buttons[4].pressed && !gp.buttons[4].wasPressed && player.rapidFireCooldown === 0) {
          player.rapidFire = true;
          player.rapidFireTimer = 180;
          player.rapidFireCooldown = 720;
        }
        gp.buttons[4].wasPressed = gp.buttons[4].pressed;
      }
    };
    
    let shootDir = { x: 1, y: 0 };
    const shootSound = new Audio('abelitogordopanzon/pew.mp3');
    shootSound.volume = 0.3;
    
    const playShootSound = () => {
      shootSound.currentTime = 0;
      shootSound.play().catch(() => {});
    };
    
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        isPaused = !isPaused;
        if (isPaused) {
          if (!pauseOverlay) {
            pauseOverlay = document.createElement('div');
            pauseOverlay.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              background: rgba(0,0,0,0.8); z-index: 10001;
              display: flex; flex-direction: column; justify-content: center; align-items: center;
            `;
            pauseOverlay.innerHTML = `
              <div style="color: #FFD700; font-size: 4rem; font-weight: bold;">PAUSA</div>
              <div style="color: #fff; font-size: 1.5rem; margin-top: 20px;">Presiona ESC para continuar</div>
            `;
            document.body.appendChild(pauseOverlay);
          }
        } else {
          if (pauseOverlay) {
            pauseOverlay.remove();
            pauseOverlay = null;
          }
        }
        return;
      }
      
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (e.key === 'ArrowUp') shootDir = { x: 0, y: -1 };
        if (e.key === 'ArrowDown') shootDir = { x: 0, y: 1 };
        if (e.key === 'ArrowLeft') shootDir = { x: -1, y: 0 };
        if (e.key === 'ArrowRight') shootDir = { x: 1, y: 0 };
        return;
      }
      
      keys[e.key] = true;
      
      if (e.key === ' ' && player.shootCooldown === 0) {
        playShootSound();
        if (player.tripleShot) {
          bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10, dy: shootDir.y * 10, size: 10 });
          bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10 + shootDir.y * 2, dy: shootDir.y * 10 - shootDir.x * 2, size: 10 });
          bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10 - shootDir.y * 2, dy: shootDir.y * 10 + shootDir.x * 2, size: 10 });
        } else {
          bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: shootDir.x * 10, dy: shootDir.y * 10, size: 10 });
        }
        player.shootCooldown = player.rapidFire ? 5 : 15;
      }
      if (e.key === 'Shift' && player.dashCooldown === 0 && !e.repeat) {
        const dashDist = 100;
        if (keys['w']) player.y = Math.max(0, player.y - dashDist);
        else if (keys['s']) player.y = Math.min(canvas.height - player.size, player.y + dashDist);
        else if (keys['a']) player.x = Math.max(0, player.x - dashDist);
        else if (keys['d']) player.x = Math.min(canvas.width - player.size, player.x + dashDist);
        player.dashCooldown = 120;
      }
      if (e.key === 'q' && player.slowTimeCooldown === 0 && !e.repeat) {
        player.slowTime = true;
        player.slowTimeTimer = 150;
        player.slowTimeCooldown = 900;
      }
      if (e.key === 'e' && player.healCooldown === 0 && !e.repeat) {
        player.health = Math.min(player.maxHealth, player.health + 20);
        player.healCooldown = 720;
      }
      if (e.key === 'r' && player.rapidFireCooldown === 0 && !e.repeat) {
        player.rapidFire = true;
        player.rapidFireTimer = 180;
        player.rapidFireCooldown = 720;
      }
    });
    document.addEventListener('keyup', e => keys[e.key] = false);
    
    const triggerFear = () => {
      fearEffect = true;
      fearTimer = 120;
      setTimeout(() => fearEffect = false, 1500);
    };
    
    const abilityCooldowns = { spread: 0, dash: 0, fear: 0, aimed: 0, teleport: 0, triple: 0, circle: 0, wave: 0, cross: 0, homing: 0, heal: 0, summon: 0, laser: 0, rain: 0, spiral: 0 };
    let bossMinions = [];
    let isTransitioning = false;
    
    const bossAttack = () => {
      const available = [];
      if (abilityCooldowns.spread === 0) available.push(0);
      if (abilityCooldowns.dash === 0) available.push(1);
      if (abilityCooldowns.fear === 0) available.push(2);
      if (abilityCooldowns.aimed === 0) available.push(3);
      if (abilityCooldowns.teleport === 0) available.push(4);
      if (abilityCooldowns.triple === 0) available.push(5);
      if (boss.phase === 3 && abilityCooldowns.circle === 0) available.push(6);
      if (boss.phase >= 2 && abilityCooldowns.wave === 0) available.push(7);
      if (boss.phase >= 2 && abilityCooldowns.cross === 0) available.push(8);
      if (boss.phase === 3 && abilityCooldowns.homing === 0) available.push(9);
      if (boss.phase >= 2 && boss.health < boss.maxHealth * 0.5 && abilityCooldowns.heal === 0) available.push(10);
      if (boss.phase === 3 && abilityCooldowns.summon === 0) available.push(11);
      if (boss.phase >= 2 && abilityCooldowns.laser === 0) available.push(12);
      if (boss.phase >= 2 && abilityCooldowns.rain === 0) available.push(13);
      if (boss.phase === 3 && abilityCooldowns.spiral === 0) available.push(14);
      
      if (available.length === 0) return;
      const attack = available[Math.floor(Math.random() * available.length)];
      
      if (attack === 0) {
        abilityCooldowns.spread = 240;
        boss.telegraphActive = true;
        boss.telegraphType = 'spread';
        boss.telegraphTimer = 60;
        setTimeout(() => {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
          for (let i = 0; i < 5; i++) {
            const a = angle + (i - 2) * 0.2;
            bossBullets.push({ x: boss.x, y: boss.y + boss.size/2, dx: Math.cos(a) * 6, dy: Math.sin(a) * 6, size: 12 });
          }
          boss.telegraphActive = false;
        }, 1000);
      } else if (attack === 1) {
        abilityCooldowns.dash = 180;
        boss.dy *= 2.5;
        setTimeout(() => boss.dy /= 2.5, 1200);
      } else if (attack === 2) {
        abilityCooldowns.fear = 300;
        triggerFear();
      } else if (attack === 3) {
        abilityCooldowns.aimed = 220;
        boss.telegraphActive = true;
        boss.telegraphType = 'aimed';
        boss.telegraphTimer = 60;
        setTimeout(() => {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
          for (let i = 0; i < 6; i++) {
            const a = angle + (i - 2.5) * 0.25;
            bossBullets.push({ x: boss.x, y: boss.y + boss.size/2, dx: Math.cos(a) * 8, dy: Math.sin(a) * 8, size: 10 });
          }
          boss.telegraphActive = false;
        }, 1000);
      } else if (attack === 4) {
        abilityCooldowns.teleport = 280;
        boss.x = Math.random() * (canvas.width - boss.size - 200) + 100;
        boss.y = Math.random() * (canvas.height - boss.size);
      } else if (attack === 5) {
        abilityCooldowns.triple = 200;
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            bossBullets.push({ x: boss.x, y: boss.y + boss.size/2, dx: Math.cos(angle) * 10, dy: Math.sin(angle) * 10, size: 18 });
          }, i * 250);
        }
      } else if (attack === 6) {
        abilityCooldowns.circle = 360;
        boss.telegraphActive = true;
        boss.telegraphType = 'circle';
        boss.telegraphTimer = 60;
        setTimeout(() => {
          for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 / 12) * i;
            bossBullets.push({ x: boss.x + boss.size/2, y: boss.y + boss.size/2, dx: Math.cos(a) * 7, dy: Math.sin(a) * 7, size: 10 });
          }
          boss.telegraphActive = false;
        }, 1000);
      } else if (attack === 7) {
        abilityCooldowns.wave = 250;
        for (let i = 0; i < 10; i++) {
          bossBullets.push({ x: boss.x, y: boss.y + boss.size/2, dx: -6, dy: Math.sin(i * 0.5) * 3, size: 12 });
        }
      } else if (attack === 8) {
        abilityCooldowns.cross = 300;
        const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
        directions.forEach(dir => {
          bossBullets.push({ x: boss.x + boss.size/2, y: boss.y + boss.size/2, dx: dir.x * 7, dy: dir.y * 7, size: 14 });
        });
      } else if (attack === 9) {
        abilityCooldowns.homing = 320;
        for (let i = 0; i < 5; i++) {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + (Math.random() - 0.5) * 0.5;
          bossBullets.push({ x: boss.x + boss.size/2, y: boss.y + boss.size/2, dx: Math.cos(angle) * 6, dy: Math.sin(angle) * 6, size: 10 });
        }
      } else if (attack === 10) {
        abilityCooldowns.heal = 600;
        const healAmount = Math.floor(boss.maxHealth * 0.1);
        boss.health = Math.min(boss.maxHealth, boss.health + healAmount);
        enhancements.createParticles(boss.x + boss.size/2, boss.y + boss.size/2, 30, '#0f0');
        enhancements.triggerScreenShake(10);
      } else if (attack === 11) {
        abilityCooldowns.summon = 500;
        for (let i = 0; i < 3; i++) {
          bossMinions.push({
            x: boss.x + (i - 1) * 60,
            y: boss.y + 100,
            size: 30,
            health: 30,
            dx: (Math.random() - 0.5) * 2,
            dy: Math.random() * 2 + 1,
            shootTimer: 0
          });
        }
        enhancements.createParticles(boss.x, boss.y, 50, '#f0f');
      } else if (attack === 12) {
        abilityCooldowns.laser = 350;
        enhancements.triggerScreenShake(15);
        const laserY = boss.y + boss.size / 2;
        for (let i = 0; i < 20; i++) {
          bossBullets.push({ x: canvas.width, y: laserY + (Math.random() - 0.5) * 10, dx: -15, dy: 0, size: 8 });
        }
      } else if (attack === 13) {
        abilityCooldowns.rain = 400;
        for (let i = 0; i < 15; i++) {
          bossBullets.push({ x: Math.random() * canvas.width, y: -50, dx: 0, dy: 8, size: 10, warning: 60 });
        }
      } else if (attack === 14) {
        abilityCooldowns.spiral = 380;
        const spirals = 3;
        for (let s = 0; s < spirals; s++) {
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + (s * Math.PI / 3);
            bossBullets.push({ x: boss.x + boss.size/2, y: boss.y + boss.size/2, dx: Math.cos(angle) * 5, dy: Math.sin(angle) * 5, size: 10 });
          }
        }
      }
    };
    
    const gameLoop = () => {
      if (isPaused) {
        requestAnimationFrame(gameLoop);
        return;
      }
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (boss.intro) {
        introTimer++;
        boss.x += (boss.targetX - boss.x) * 0.05;
        boss.y += (boss.targetY - boss.y) * 0.05;
        if (introTimer > 120) boss.intro = false;
      }
      
      if (!fearEffect && !boss.intro) {
        const moveSpeed = 4 * player.speed * (player.speedBoost ? 1.5 : 1);
        if (keys['w']) player.y -= moveSpeed;
        if (keys['s']) player.y += moveSpeed;
        if (keys['a']) player.x -= moveSpeed;
        if (keys['d']) player.x += moveSpeed;
        getGamepad();
        
        player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
      }
      
      if (!boss.intro) {
        boss.y += boss.dy;
        if (boss.y <= 0 || boss.y >= canvas.height - boss.size) boss.dy *= -1;
      }
      
      if (!boss.intro) {
        boss.attackTimer++;
      const baseSpeed = window.bossSystem.difficulty === 'easy' ? 400 : window.bossSystem.difficulty === 'hard' ? 150 : window.bossSystem.difficulty === 'impossible' ? 120 : 220;
      const attackSpeed = boss.phase === 3 ? (window.bossSystem.difficulty === 'easy' ? baseSpeed * 0.7 : window.bossSystem.difficulty === 'impossible' ? baseSpeed * 0.7 : baseSpeed / 2) : baseSpeed;
      if (boss.attackTimer > attackSpeed) {
        if (boss.isAnnaBoss) {
          enhancements.annaAttack(boss, bossBullets, player, canvas);
        } else if (boss.isDevourerBoss) {
          enhancements.devourerAttack(boss, bossBullets, player, canvas);
        } else {
          bossAttack();
        }
        boss.attackTimer = 0;
      }
      
      if (boss.health < 250 && boss.phase === 1) {
        boss.phase = 2;
        boss.dy *= 1.5;
        triggerFear();
        isTransitioning = true;
        enhancements.triggerScreenShake(25);
        enhancements.createParticles(boss.x + boss.size/2, boss.y + boss.size/2, 50, '#ff0000');
        setTimeout(() => isTransitioning = false, 1500);
        powerups.push({ x: Math.random() * canvas.width, y: -50, type: 'health', size: 20, dx: 0, dy: 3 });
      }
      
      if (boss.health < 100 && boss.phase === 2) {
        boss.phase = 3;
        const phase3Mult = window.bossSystem.difficulty === 'easy' ? 1.3 : window.bossSystem.difficulty === 'hard' ? 2.2 : window.bossSystem.difficulty === 'impossible' ? 2.5 : 1.8;
        boss.dy *= phase3Mult;
        boss.attackTimer = window.bossSystem.difficulty === 'easy' ? 150 : window.bossSystem.difficulty === 'hard' ? 60 : window.bossSystem.difficulty === 'impossible' ? 50 : 90;
        triggerFear();
        isTransitioning = true;
        enhancements.triggerScreenShake(35);
        enhancements.createParticles(boss.x + boss.size/2, boss.y + boss.size/2, 80, '#ff00ff');
        setTimeout(() => isTransitioning = false, 2000);
        powerups.push({ x: Math.random() * canvas.width, y: -50, type: 'shield', size: 20, dx: 0, dy: 3 });
      }
      
      if (Math.random() < 0.005 && boss.health < 400) {
        powerups.push({ x: Math.random() * canvas.width, y: -50, type: 'triple', size: 20, dx: 0, dy: 3 });
      }
      
      if (Math.random() < 0.003 && boss.phase >= 2) {
        const types = ['invincibility', 'bomb', 'speed', 'double_damage', 'slow_motion'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerupFuncs = {
          'invincibility': 'createInvincibilityPowerup',
          'bomb': 'createBombPowerup',
          'speed': 'createSpeedPowerup',
          'double_damage': 'createDoubleDamagePowerup',
          'slow_motion': 'createSlowMotionPowerup'
        };
        powerups.push(enhancements[powerupFuncs[type]](Math.random() * canvas.width, -50));
      }
      
      boss.shieldTimer++;
      if (boss.shieldTimer > 600 && boss.shield === 0) {
        boss.shield = boss.shieldMax;
        boss.shieldTimer = 0;
      }
      
      if (boss.telegraphTimer > 0) boss.telegraphTimer--;
      
      Object.keys(abilityCooldowns).forEach(key => {
        if (abilityCooldowns[key] > 0) abilityCooldowns[key]--;
      });
      
      bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          bullets.splice(i, 1);
          player.combo = 0;
        }
        if (b.x > boss.x && b.x < boss.x + boss.size && b.y > boss.y && b.y < boss.y + boss.size) {
          if (boss.shield > 0) {
            boss.shield -= 10;
          } else {
            const baseDmg = player.combo >= 15 ? 15 : 10;
            let dmgMult = player.damageMultiplier;
            if (player.doubleDamage) dmgMult *= 2;
            if (player.ability === 'molly' && player.health < player.maxHealth * 0.5) dmgMult *= 1.5;
            const dmg = Math.floor(baseDmg * dmgMult);
            boss.health -= dmg;
            player.combo++;
            enhancements.addScore(dmg, player.combo);
            enhancements.createParticles(b.x, b.y, 5, player.ability === 'molly' && player.health < player.maxHealth * 0.5 ? '#ff0000' : '#0f0');
          }
          bullets.splice(i, 1);
        }
      });
      
      bossMinions.forEach((m, i) => {
        m.x += m.dx;
        m.y += m.dy;
        if (m.y <= 0 || m.y >= canvas.height - m.size) m.dy *= -1;
        if (m.x <= 0 || m.x >= canvas.width - m.size) m.dx *= -1;
        
        m.shootTimer++;
        if (m.shootTimer > 120) {
          const angle = Math.atan2(player.y - m.y, player.x - m.x);
          bossBullets.push({ x: m.x + m.size/2, y: m.y + m.size/2, dx: Math.cos(angle) * 4, dy: Math.sin(angle) * 4, size: 8 });
          m.shootTimer = 0;
        }
        
        bullets.forEach((b, j) => {
          if (b.x > m.x && b.x < m.x + m.size && b.y > m.y && b.y < m.y + m.size) {
            m.health -= 10;
            bullets.splice(j, 1);
            if (m.health <= 0) {
              bossMinions.splice(i, 1);
              enhancements.createParticles(m.x, m.y, 15, '#f0f');
              enhancements.addScore(50, player.combo);
            }
          }
        });
      });
      
      if (boss.isDevourerBoss) {
        enhancements.updateDevourerBullets(bossBullets, player, canvas);
      }
      
      bossBullets.forEach((b, i) => {
        if (b.type === 'blackhole') return;
        const speed = player.slowMotion ? 0.3 : (player.slowTime ? 0.5 : 1);
        b.x += b.dx * speed;
        b.y += b.dy * speed;
        if (b.x < 0 || b.y < 0 || b.y > canvas.height) bossBullets.splice(i, 1);
        const hitboxReduction = 5;
        if (b.x + hitboxReduction < player.x + player.size - hitboxReduction && 
            b.x + b.size - hitboxReduction > player.x + hitboxReduction && 
            b.y + hitboxReduction < player.y + player.size - hitboxReduction && 
            b.y + b.size - hitboxReduction > player.y + hitboxReduction) {
          if (!player.shield && !player.invincible) {
            if (player.ability === 'angel' && player.angelShield) {
              player.angelShield = false;
              player.angelShieldCooldown = 900;
              enhancements.createParticles(player.x, player.y, 20, '#FFD700');
            } else {
              let dmg = window.bossSystem.difficulty === 'impossible' ? 20 : window.bossSystem.difficulty === 'hard' ? 18 : 15;
              if (player.ability === 'ia777') dmg = Math.floor(dmg * 0.7);
              player.health -= dmg;
              player.combo = 0;
            }
          }
          bossBullets.splice(i, 1);
        }
      });
      
      powerups.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) powerups.splice(i, 1);
        if (p.x < player.x + player.size && p.x + p.size > player.x && 
            p.y < player.y + player.size && p.y + p.size > player.y) {
          if (p.type === 'health') player.health = Math.min(player.maxHealth, player.health + 30);
          if (p.type === 'shield') { player.shield = true; player.shieldTimer = 300; }
          if (p.type === 'triple') { player.tripleShot = true; player.tripleShotTimer = 300; }
          if (['invincibility', 'bomb', 'speed', 'double_damage', 'slow_motion'].includes(p.type)) {
            enhancements.applyPowerupEffect(player, p, bossBullets);
          }
          powerups.splice(i, 1);
        }
      });
      
      if (player.dashCooldown > 0) player.dashCooldown--;
      if (player.shieldTimer > 0) { player.shieldTimer--; if (player.shieldTimer === 0) player.shield = false; }
      if (player.tripleShotTimer > 0) { player.tripleShotTimer--; if (player.tripleShotTimer === 0) player.tripleShot = false; }
      if (player.slowTimeTimer > 0) { player.slowTimeTimer--; if (player.slowTimeTimer === 0) player.slowTime = false; }
      if (player.slowTimeCooldown > 0) player.slowTimeCooldown--;
      if (player.healCooldown > 0) player.healCooldown--;
      if (player.rapidFireTimer > 0) { player.rapidFireTimer--; if (player.rapidFireTimer === 0) player.rapidFire = false; }
      if (player.rapidFireCooldown > 0) player.rapidFireCooldown--;
      if (player.shootCooldown > 0) player.shootCooldown--;
      if (player.invincibleTimer > 0) { player.invincibleTimer--; if (player.invincibleTimer === 0) player.invincible = false; }
      if (player.speedBoostTimer > 0) { player.speedBoostTimer--; if (player.speedBoostTimer === 0) player.speedBoost = false; }
      if (player.doubleDamageTimer > 0) { player.doubleDamageTimer--; if (player.doubleDamageTimer === 0) player.doubleDamage = false; }
      if (player.slowMotionTimer > 0) { player.slowMotionTimer--; if (player.slowMotionTimer === 0) player.slowMotion = false; }
      if (player.angelShieldCooldown > 0) player.angelShieldCooldown--;
      if (player.ability === 'angel' && player.angelShieldCooldown === 0 && !player.angelShield) player.angelShield = true;
      if (player.ability === 'iris' && player.health < player.maxHealth) {
        player.regenTimer++;
        if (player.regenTimer >= 120) { player.health++; player.regenTimer = 0; }
      }
      
      enhancements.updateParticles();
      enhancements.updateScreenShake();
      enhancements.updateMusicIntensity(bossMusic, boss);
      
      ctx.save();
      enhancements.applyScreenShake(ctx);
      
      if (fearEffect) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.filter = 'blur(5px)';
      }
      
      ctx.drawImage(player.icon, player.x, player.y, player.size, player.size);
      enhancements.drawInvincibilityEffect(ctx, player);
      
      if (player.shield) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2 + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (player.angelShield) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2 + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      if (fearEffect) ctx.restore();
      
      ctx.save();
      if (boss.phase === 2) {
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 30;
      }
      if (boss.phase === 3) {
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 50;
      }
      ctx.drawImage(boss.img, boss.x, boss.y, boss.size, boss.size);
      
      if (boss.shield > 0) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(boss.x + boss.size/2, boss.y + boss.size/2, boss.size/2 + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.shield, boss.x + boss.size/2, boss.y - 10);
      }
      
      if (boss.telegraphActive) {
        ctx.strokeStyle = 'rgba(255,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        if (boss.telegraphType === 'spread') {
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(boss.x, boss.y + boss.size/2);
            ctx.lineTo(0, boss.y + boss.size/2 + (i - 2) * 100);
            ctx.stroke();
          }
        } else if (boss.telegraphType === 'aimed') {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
          ctx.beginPath();
          ctx.moveTo(boss.x, boss.y + boss.size/2);
          ctx.lineTo(boss.x + Math.cos(angle) * -500, boss.y + boss.size/2 + Math.sin(angle) * 500);
          ctx.stroke();
        } else if (boss.telegraphType === 'circle') {
          ctx.beginPath();
          ctx.arc(boss.x + boss.size/2, boss.y + boss.size/2, 150, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      
      ctx.restore();
      
      ctx.fillStyle = charStats.bulletColor || '#0f0';
      bullets.forEach(b => ctx.fillRect(b.x, b.y, b.size, b.size));
      
      bossMinions.forEach(m => {
        ctx.save();
        ctx.fillStyle = '#f0f';
        ctx.fillRect(m.x, m.y, m.size, m.size);
        ctx.fillStyle = '#fff';
        ctx.fillRect(m.x, m.y - 5, m.size * (m.health / 30), 3);
        ctx.restore();
      });
      
      if (boss.isDevourerBoss) {
        enhancements.drawDevourerEffects(ctx, boss, bossBullets);
      }
      
      ctx.fillStyle = '#f00';
      bossBullets.forEach(b => {
        if (b.type === 'blackhole') return;
        ctx.fillRect(b.x, b.y, b.size, b.size);
      });
      
      enhancements.drawWarnings(ctx, bossBullets);
      
      powerups.forEach(p => {
        if (['invincibility', 'bomb', 'speed', 'double_damage', 'slow_motion'].includes(p.type)) {
          enhancements.drawPowerup(ctx, p);
        } else {
          ctx.fillStyle = p.type === 'health' ? '#0f0' : p.type === 'shield' ? '#0ff' : '#ff0';
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(p.type === 'health' ? '+' : p.type === 'shield' ? '🛡' : '×3', p.x + p.size/2, p.y + p.size/2 + 4);
        }
      });
      
      enhancements.drawParticles(ctx);
      
      const barW = 200, barH = 20;
      ctx.fillStyle = '#333';
      ctx.fillRect(20, 20, barW, barH);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(20, 20, (player.health / player.maxHealth) * barW, barH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, barW, barH);
      
      ctx.fillStyle = '#333';
      ctx.fillRect(canvas.width - barW - 20, 20, barW, barH);
      ctx.fillStyle = boss.phase === 3 ? '#f0f' : boss.phase === 2 ? '#f00' : '#ff0';
      ctx.fillRect(canvas.width - barW - 20, 20, (boss.health / boss.maxHealth) * barW, barH);
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(canvas.width - barW - 20, 20, barW, barH);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText('PLAYER', 20, 50);
      ctx.textAlign = 'right';
      ctx.fillText('ABELITO', canvas.width - 20, 50);
      ctx.textAlign = 'left';
      
      enhancements.drawScore(ctx, 20, 100);
      
      if (player.combo >= 10) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`COMBO x${player.combo} (DMG x2)`, 20, 70);
      } else if (player.combo > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`Combo: ${player.combo}`, 20, 70);
      }
      
      if (player.dashCooldown > 0) {
        ctx.fillStyle = '#888';
        ctx.fillRect(20, canvas.height - 40, 100, 10);
        ctx.fillStyle = '#0ff';
        ctx.fillRect(20, canvas.height - 40, (1 - player.dashCooldown / 120) * 100, 10);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, canvas.height - 40, 100, 10);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('DASH', 70, canvas.height - 45);
      } else {
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('DASH READY (Shift)', 20, canvas.height - 30);
      }
      
      if (player.tripleShot) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`TRIPLE SHOT: ${Math.ceil(player.tripleShotTimer / 60)}s`, 20, 90);
      }
      
      if (player.shield) {
        ctx.fillStyle = '#0ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`SHIELD: ${Math.ceil(player.shieldTimer / 60)}s`, 20, player.tripleShot ? 110 : 90);
      }
      
      if (player.slowTime) {
        ctx.fillStyle = '#00f';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`SLOW TIME: ${Math.ceil(player.slowTimeTimer / 60)}s`, 20, 130);
      }
      
      if (player.rapidFire) {
        ctx.fillStyle = '#f0f';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`RAPID FIRE: ${Math.ceil(player.rapidFireTimer / 60)}s`, 20, 150);
      }
      
      if (player.doubleDamage) {
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`DOUBLE DAMAGE: ${Math.ceil(player.doubleDamageTimer / 60)}s`, 20, 170);
      }
      
      if (player.slowMotion) {
        ctx.fillStyle = '#00f';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`SLOW MOTION: ${Math.ceil(player.slowMotionTimer / 60)}s`, 20, 190);
      }
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      let yPos = canvas.height - 60;
      
      // Barra Q
      if (player.slowTimeCooldown > 0) {
        ctx.fillStyle = '#888';
        ctx.fillRect(20, yPos - 10, 100, 8);
        ctx.fillStyle = '#00f';
        ctx.fillRect(20, yPos - 10, (1 - player.slowTimeCooldown / 900) * 100, 8);
        ctx.fillStyle = '#fff';
        ctx.fillText(`Q: ${Math.ceil(player.slowTimeCooldown / 60)}s`, 20, yPos);
        yPos -= 20;
      } else {
        ctx.fillStyle = '#0ff';
        ctx.fillText('Q: SLOW TIME', 20, yPos);
        ctx.fillStyle = '#fff';
        yPos -= 15;
      }
      
      // Barra E
      if (player.healCooldown > 0) {
        ctx.fillStyle = '#888';
        ctx.fillRect(20, yPos - 10, 100, 8);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(20, yPos - 10, (1 - player.healCooldown / 720) * 100, 8);
        ctx.fillStyle = '#fff';
        ctx.fillText(`E: ${Math.ceil(player.healCooldown / 60)}s`, 20, yPos);
        yPos -= 20;
      } else {
        ctx.fillStyle = '#0f0';
        ctx.fillText('E: HEAL', 20, yPos);
        ctx.fillStyle = '#fff';
        yPos -= 15;
      }
      
      // Barra R
      if (player.rapidFireCooldown > 0) {
        ctx.fillStyle = '#888';
        ctx.fillRect(20, yPos - 10, 100, 8);
        ctx.fillStyle = '#f0f';
        ctx.fillRect(20, yPos - 10, (1 - player.rapidFireCooldown / 720) * 100, 8);
        ctx.fillStyle = '#fff';
        ctx.fillText(`R: ${Math.ceil(player.rapidFireCooldown / 60)}s`, 20, yPos);
      } else {
        ctx.fillStyle = '#f0f';
        ctx.fillText('R: RAPID FIRE', 20, yPos);
        ctx.fillStyle = '#fff';
      }
      
      if (boss.phase === 3) {
        ctx.fillStyle = '#f0f';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡FASE FINAL!', canvas.width/2, 60);
        ctx.textAlign = 'left';
      }
      
      if (fearEffect) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 10;
        ctx.fillText('¡MIEDO!', canvas.width/2, 80);
        ctx.restore();
      }
      
      if (isMobile) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        
        const moveX = canvas.width * 0.15;
        const moveY = canvas.height - 80;
        const moveR = 60;
        ctx.beginPath();
        ctx.arc(moveX, moveY, moveR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(moveX, moveY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MOVE', moveX, moveY - moveR - 10);
        
        const shootX = canvas.width - 80;
        const shootY = canvas.height / 2;
        const shootR = 50;
        ctx.fillStyle = 'rgba(255,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(shootX, shootY, shootR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('FIRE', shootX, shootY + 5);
        
        const dpadX = canvas.width - 100;
        const dpadY = canvas.height - 100;
        const dpadSize = 40;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(dpadX, dpadY - dpadSize, dpadSize, dpadSize);
        ctx.fillRect(dpadX, dpadY + dpadSize, dpadSize, dpadSize);
        ctx.fillRect(dpadX - dpadSize, dpadY, dpadSize, dpadSize);
        ctx.fillRect(dpadX + dpadSize, dpadY, dpadSize, dpadSize);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(dpadX, dpadY - dpadSize, dpadSize, dpadSize);
        ctx.strokeRect(dpadX, dpadY + dpadSize, dpadSize, dpadSize);
        ctx.strokeRect(dpadX - dpadSize, dpadY, dpadSize, dpadSize);
        ctx.strokeRect(dpadX + dpadSize, dpadY, dpadSize, dpadSize);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('↑', dpadX + dpadSize/2, dpadY - dpadSize/2 + 8);
        ctx.fillText('↓', dpadX + dpadSize/2, dpadY + dpadSize + dpadSize/2 + 8);
        ctx.fillText('←', dpadX - dpadSize/2, dpadY + dpadSize/2 + 8);
        ctx.fillText('→', dpadX + dpadSize + dpadSize/2, dpadY + dpadSize/2 + 8);
        
        const btnSize = 50;
        const btnY = canvas.height - 250;
        
        ctx.fillStyle = player.slowTimeCooldown > 0 ? 'rgba(100,100,100,0.5)' : 'rgba(0,0,255,0.5)';
        ctx.fillRect(20, btnY, btnSize, btnSize);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(20, btnY, btnSize, btnSize);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Q', 45, btnY + 30);
        
        ctx.fillStyle = player.healCooldown > 0 ? 'rgba(100,100,100,0.5)' : 'rgba(0,255,0,0.5)';
        ctx.fillRect(80, btnY, btnSize, btnSize);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(80, btnY, btnSize, btnSize);
        ctx.fillStyle = '#fff';
        ctx.fillText('E', 105, btnY + 30);
        
        ctx.fillStyle = player.rapidFireCooldown > 0 ? 'rgba(100,100,100,0.5)' : 'rgba(255,0,255,0.5)';
        ctx.fillRect(140, btnY, btnSize, btnSize);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(140, btnY, btnSize, btnSize);
        ctx.fillStyle = '#fff';
        ctx.fillText('R', 165, btnY + 30);
        
        ctx.restore();
      }
      
      }
      
      if (boss.health <= 0) {
        if (!window.bossSystem.damageTaken) {
          window.bossSystem.damageTaken = player.maxHealth - player.health;
        }
      }
      
      if (isTransitioning) {
        requestAnimationFrame(gameLoop);
        return;
      }
      
      if (boss.health > 0 && player.health > 0) {
        window.bossSystem.recordFrame(player, boss, bullets, bossBullets, powerups);
        requestAnimationFrame(gameLoop);
      } else {
        bossMusic.pause();
        bossMusic.currentTime = 0;
        const won = boss.health <= 0;
        
        if (won && boss.isAnnaBoss) {
          for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            bossBullets.push({ x: boss.x + boss.size/2, y: boss.y + boss.size/2, dx: Math.cos(angle) * 8, dy: Math.sin(angle) * 8, size: 15 });
          }
          enhancements.triggerScreenShake(30);
          enhancements.createParticles(boss.x, boss.y, 100, '#ff0000');
          
          let explosionFrames = 0;
          const explosionLoop = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(player.icon, player.x, player.y, player.size, player.size);
            ctx.drawImage(boss.img, boss.x, boss.y, boss.size, boss.size);
            
            bossBullets.forEach((b, i) => {
              b.x += b.dx;
              b.y += b.dy;
              if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
                bossBullets.splice(i, 1);
              }
            });
            
            ctx.fillStyle = '#f00';
            bossBullets.forEach(b => ctx.fillRect(b.x, b.y, b.size, b.size));
            
            enhancements.updateParticles();
            enhancements.updateScreenShake();
            ctx.save();
            enhancements.applyScreenShake(ctx);
            enhancements.drawParticles(ctx);
            ctx.restore();
            
            explosionFrames++;
            if (explosionFrames < 60) {
              requestAnimationFrame(explosionLoop);
            } else {
              ctx.fillStyle = '#0f0';
              ctx.font = '60px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('¡GANASTE!', canvas.width/2, canvas.height/2);
              
              localStorage.setItem('bossDefeated', 'true');
              if (this.leaderboardBtn) this.leaderboardBtn.style.display = 'inline-block';
              setTimeout(() => this.showVictoryScreen(character, boss), 2000);
            }
          };
          explosionLoop();
          return;
        }
        
        if (won) {
          if (!window.bossSystem.damageTaken) {
            window.bossSystem.damageTaken = player.maxHealth - player.health;
          }
          
          ctx.fillStyle = '#0f0';
          ctx.font = '60px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('¡GANASTE!', canvas.width/2, canvas.height/2);
          
          localStorage.setItem('bossDefeated', 'true');
          if (this.leaderboardBtn) this.leaderboardBtn.style.display = 'inline-block';
          setTimeout(() => this.showVictoryScreen(character, boss), 2000);
        } else {
          const loseSound = new Audio('assets/deathsound.mp3');
          loseSound.volume = 0.5;
          loseSound.play().catch(() => {});
          
          if (window.bossSystem.infiniteMode) {
            const enhancements = window.bossSystem.enhancements;
            const survivalTime = ((Date.now() - enhancements.infiniteStartTime) / 1000).toFixed(2);
            
            ctx.fillStyle = '#f00';
            ctx.font = '60px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('¡GAME OVER!', canvas.width/2, canvas.height/2 - 100);
            
            ctx.fillStyle = '#fff';
            ctx.font = '30px Arial';
            ctx.fillText(`Ronda: ${enhancements.infiniteRound}`, canvas.width/2, canvas.height/2);
            ctx.fillText(`Tiempo: ${survivalTime}s`, canvas.width/2, canvas.height/2 + 50);
            ctx.fillText(`Score: ${enhancements.score}`, canvas.width/2, canvas.height/2 + 100);
            
            setTimeout(() => {
              document.getElementById('game').classList.remove('active');
              document.getElementById('lobby').classList.add('active');
            }, 5000);
            return;
          }
          
          ctx.fillStyle = '#f00';
          ctx.font = '60px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('¡PERDISTE!', canvas.width/2, canvas.height/2);
          
          setTimeout(() => {
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = `
              position: fixed;
              top: 60%;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 20px;
              z-index: 10002;
            `;
            
            const retryBtn = document.createElement('button');
            retryBtn.textContent = 'REINTENTAR';
            retryBtn.style.cssText = `
              background: #0f0;
              color: #000;
              font-weight: bold;
              padding: 15px 40px;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              font-size: 1.5rem;
            `;
            retryBtn.addEventListener('click', () => {
              btnContainer.remove();
              video.remove();
              this.startBossFight(character);
            });
            
            const restartBtn = document.createElement('button');
            restartBtn.textContent = 'LOBBY';
            restartBtn.style.cssText = `
              background: #ffd700;
              color: #000;
              font-weight: bold;
              padding: 15px 40px;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              font-size: 1.5rem;
            `;
            restartBtn.addEventListener('click', () => {
              btnContainer.remove();
              video.remove();
              this.showCharacterSelect();
            });
            
            btnContainer.appendChild(retryBtn);
            btnContainer.appendChild(restartBtn);
            document.body.appendChild(btnContainer);
            
            const video = document.createElement('video');
            const videos = ['abelitogordopanzon/estamal.mp4', 'abelitogordopanzon/lv_0_20251125062445.mp4', 'abelitogordopanzon/eyes.mp4'];
            video.src = videos[Math.floor(Math.random() * videos.length)];
            video.autoplay = true;
            video.style.cssText = `
              position: fixed;
              top: 70%;
              left: 50%;
              transform: translateX(-50%);
              width: 300px;
              border: 3px solid #f00;
              border-radius: 10px;
              z-index: 10002;
            `;
            document.body.appendChild(video);
          }, 1000);
        }
      }
    };
    
    gameLoop();
  }

  showVictoryScreen(character, bossRef) {
    if (window.bossSystem.infiniteMode) {
      const enhancements = window.bossSystem.enhancements;
      enhancements.infiniteRound++;
      setTimeout(() => this.startBossFight(character), 2000);
      return;
    }
    
    if (window.bossSystem.bossRushMode && window.bossSystem.enhancements?.bossRush) {
      const enhancements = window.bossSystem.enhancements;
      const hasNext = enhancements.nextBossRush(enhancements.bossRush, bossRef || { health: 500, maxHealth: 500, dy: 2, img: new Image() });
      
      if (hasNext) {
        setTimeout(() => this.startBossFight(character), 2000);
        return;
      }
    }
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.95);
      z-index: 10003;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
    `;
    
    const title = document.createElement('div');
    title.textContent = '🎉 ¡VICTORIA! 🎉';
    title.style.cssText = 'color: #0f0; font-size: 4rem; font-weight: bold; text-shadow: 0 0 30px #0f0;';
    
    const time = ((Date.now() - window.bossSystem.startTime) / 1000).toFixed(2);
    const stats = document.createElement('div');
    stats.style.cssText = 'color: #fff; font-size: 1.5rem; text-align: center;';
    stats.innerHTML = `
      <div>Tiempo: ${time}s</div>
      <div>Daño recibido: ${window.bossSystem.damageTaken}</div>
      <div>Dificultad: ${window.bossSystem.difficulty.toUpperCase()}</div>
      ${window.bossSystem.damageTaken === 0 ? '<div style="color: #ffd700; font-weight: bold; margin-top: 10px;">🏆 ¡SIN DAÑO! 🏆</div>' : ''}
    `;
    
    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Tu nombre';
    nameInput.style.cssText = `
      padding: 15px;
      font-size: 1.5rem;
      border: 2px solid #ffd700;
      border-radius: 10px;
      background: #000;
      color: #fff;
      text-align: center;
      margin-top: 20px;
    `;
    
    const saveBtn = document.createElement('button');
    const isAnkush = character === 'ankush' || character.includes('ankush');
    saveBtn.textContent = isAnkush ? 'SALIR (NO LEADERBOARD)' : 'GUARDAR EN LEADERBOARD';
    saveBtn.style.cssText = `
      background: ${isAnkush ? '#888' : '#ffd700'};
      color: ${isAnkush ? '#fff' : '#000'};
      font-weight: bold;
      padding: 15px 40px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1.5rem;
    `;
    saveBtn.addEventListener('click', async () => {
      if (isAnkush) {
        overlay.remove();
        document.getElementById('game').classList.remove('active');
        document.getElementById('lobby').classList.add('active');
      } else if (nameInput.value.trim()) {
        await window.bossSystem.saveReplay(nameInput.value.trim(), character, true);
        overlay.remove();
        window.bossSystem.showLeaderboard();
      }
    });
    
    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'SALIR';
    skipBtn.style.cssText = `
      background: #f00;
      color: #fff;
      padding: 10px 30px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
    `;
    skipBtn.addEventListener('click', () => {
      overlay.remove();
      document.getElementById('game').classList.remove('active');
      document.getElementById('lobby').classList.add('active');
    });
    
    overlay.appendChild(title);
    overlay.appendChild(stats);
    overlay.appendChild(nameInput);
    overlay.appendChild(saveBtn);
    overlay.appendChild(skipBtn);
    document.body.appendChild(overlay);
  }

  // Modificar nombres de mapas (se llamará desde el código principal)
  getChristmasMapName(originalName) {
    const christmasNames = {
      'Abandoned Hospital': '🎄 Hospital Navideño Abandonado',
      'Dark Forest': '❄️ Bosque Invernal Oscuro',
      'Haunted Mansion': '🎅 Mansión de Santa Embrujada',
      'Industrial Complex': '🎁 Fábrica de Juguetes Maldita',
      'Underground Facility': '⛄ Refugio Subterráneo Helado'
    };
    return christmasNames[originalName] || originalName;
  }
}

// Inicializar automáticamente si es diciembre
let christmasTheme;
document.addEventListener('DOMContentLoaded', () => {
  christmasTheme = new ChristmasTheme();
});

// Exponer globalmente
window.christmasTheme = christmasTheme;

// Integrar con el juego
ChristmasTheme.prototype.integrateWithGame = function(game) {
  if (!this.isDecember || !game) return;
  
  console.log('🎄 Activando decoraciones navideñas en el juego...');
  
  const originalDrawPlayer = game.drawPlayer.bind(game);
  
  game.drawPlayer = function(player) {
    originalDrawPlayer(player);
    
    if (player && player.alive && !player.downed) {
      const size = 30;
      const ctx = this.ctx;
      ctx.save();
      ctx.font = `${size * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🎅', player.x + size/2, player.y - size * 0.3);
      ctx.restore();
    }
  };
  
  console.log('✅ Gorros de Santa activados!');
};

// Auto-integrar cuando el juego esté listo
if (christmasTheme && christmasTheme.isDecember) {
  const checkGame = setInterval(() => {
    const game = window.game || window.discordFriendsGame;
    if (game && game.drawPlayer) {
      christmasTheme.integrateWithGame(game);
      clearInterval(checkGame);
    }
  }, 500);
}
