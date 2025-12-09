// Infinite Mode - Sistema independiente
class InfiniteMode {
  constructor(christmasTheme) {
    this.christmasTheme = christmasTheme;
    this.waveTypes = ['normal', 'speed', 'tank', 'swarm', 'elite', 'chaos'];
    this.currentWave = 0;
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
    title.textContent = '♾️ MODO INFINITO - SUPERVIVENCIA ♾️';
    title.style.cssText = 'color: #0ff; font-size: 3rem; font-weight: bold;';
    
    const desc = document.createElement('div');
    desc.textContent = 'Sobrevive oleadas infinitas de enemigos cada vez más difíciles';
    desc.style.cssText = 'color: #aaa; font-size: 1.2rem; text-align: center; margin-bottom: 20px;';
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;';
    
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
      const container = document.createElement('div');
      container.style.cssText = 'text-align: center; cursor: pointer;';
      
      const img = document.createElement('img');
      img.src = `assets/icons/${iconMap[char]}.png`;
      img.style.cssText = 'width: 100px; height: 100px; border: 3px solid #0ff; border-radius: 10px; transition: transform 0.3s;';
      
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
    overlay.appendChild(desc);
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
    enhancements.waveEnemies = [];
    enhancements.enemiesKilled = 0;
    enhancements.waveType = 'normal';
    window.bossSystem.setEnhancements(enhancements);
    
    this.startInfiniteWave(character);
  }

  startInfiniteWave(character) {
    document.getElementById('lobby').classList.remove('active');
    document.getElementById('game').classList.add('active');
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const enhancements = window.bossSystem.enhancements;
    const round = enhancements.infiniteRound;
    const waveType = this.waveTypes[Math.floor(Math.random() * this.waveTypes.length)];
    enhancements.waveType = waveType;
    
    // Crear enemigos según el tipo de oleada
    this.spawnWave(canvas, round, waveType, enhancements);
    
    // Iniciar loop de juego infinito
    this.startInfiniteLoop(canvas, ctx, character, enhancements);
  }

  spawnWave(canvas, round, waveType, enhancements) {
    const baseEnemies = 5 + Math.floor(round / 2);
    let enemyCount = baseEnemies;
    let enemySpeed = 2 + round * 0.3;
    let enemyHealth = 20 + round * 5;
    let enemySize = 25;
    
    if (waveType === 'speed') {
      enemySpeed *= 2;
      enemyHealth *= 0.7;
      enemySize = 20;
    } else if (waveType === 'tank') {
      enemySpeed *= 0.5;
      enemyHealth *= 2;
      enemySize = 35;
    } else if (waveType === 'swarm') {
      enemyCount *= 2;
      enemyHealth *= 0.5;
      enemySize = 15;
    } else if (waveType === 'elite') {
      enemyCount = Math.max(2, Math.floor(enemyCount / 2));
      enemyHealth *= 3;
      enemySpeed *= 1.5;
      enemySize = 40;
    } else if (waveType === 'chaos') {
      enemyCount = Math.floor(enemyCount * 1.5);
    }
    
    enhancements.waveEnemies = [];
    enhancements.enemiesKilled = 0;
    enhancements.totalEnemies = enemyCount;
    
    for (let i = 0; i < enemyCount; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      if (side === 0) { x = -50; y = Math.random() * canvas.height; }
      else if (side === 1) { x = canvas.width + 50; y = Math.random() * canvas.height; }
      else if (side === 2) { x = Math.random() * canvas.width; y = -50; }
      else { x = Math.random() * canvas.width; y = canvas.height + 50; }
      
      const enemy = {
        x, y,
        size: waveType === 'chaos' ? 15 + Math.random() * 20 : enemySize,
        health: waveType === 'chaos' ? enemyHealth * (0.5 + Math.random()) : enemyHealth,
        maxHealth: waveType === 'chaos' ? enemyHealth * (0.5 + Math.random()) : enemyHealth,
        speed: waveType === 'chaos' ? enemySpeed * (0.5 + Math.random()) : enemySpeed,
        type: waveType,
        shootTimer: Math.random() * 120,
        moveTimer: 0
      };
      
      enhancements.waveEnemies.push(enemy);
    }
  }

  startInfiniteLoop(canvas, ctx, character, enhancements) {
    const charStats = enhancements.getCharacterStats(character);
    const player = {
      x: canvas.width / 2, y: canvas.height / 2, size: 40,
      health: charStats.hp, maxHealth: charStats.hp,
      icon: new Image(), speed: charStats.speed,
      shootCooldown: 0, dashCooldown: 0,
      ability: charStats.ability
    };
    player.icon.src = `assets/icons/${character === 'ankush' ? 'ankush' : character + 'NormalIcon'}.png`;
    
    const bullets = [];
    const keys = {};
    let gameRunning = true;
    
    document.addEventListener('keydown', e => keys[e.key] = true);
    document.addEventListener('keyup', e => keys[e.key] = false);
    
    const gameLoop = () => {
      if (!gameRunning) return;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Movimiento del jugador
      const moveSpeed = 4 * player.speed;
      if (keys['w']) player.y -= moveSpeed;
      if (keys['s']) player.y += moveSpeed;
      if (keys['a']) player.x -= moveSpeed;
      if (keys['d']) player.x += moveSpeed;
      
      player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
      player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
      
      // Disparo
      if (keys[' '] && player.shootCooldown === 0) {
        bullets.push({
          x: player.x + player.size/2,
          y: player.y + player.size/2,
          dx: 10, dy: 0, size: 8
        });
        player.shootCooldown = 15;
      }
      if (player.shootCooldown > 0) player.shootCooldown--;
      
      // Actualizar balas
      bullets.forEach((b, i) => {
        b.x += b.dx;
        if (b.x > canvas.width) bullets.splice(i, 1);
      });
      
      // Actualizar enemigos
      enhancements.waveEnemies.forEach((enemy, i) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
          enemy.x += (dx/dist) * enemy.speed;
          enemy.y += (dy/dist) * enemy.speed;
        }
        
        // Colisión con balas
        bullets.forEach((b, j) => {
          if (b.x > enemy.x && b.x < enemy.x + enemy.size &&
              b.y > enemy.y && b.y < enemy.y + enemy.size) {
            enemy.health -= 10;
            bullets.splice(j, 1);
            if (enemy.health <= 0) {
              enhancements.waveEnemies.splice(i, 1);
              enhancements.enemiesKilled++;
              enhancements.score += 100 * enhancements.infiniteRound;
            }
          }
        });
        
        // Colisión con jugador
        if (enemy.x < player.x + player.size && enemy.x + enemy.size > player.x &&
            enemy.y < player.y + player.size && enemy.y + enemy.size > player.y) {
          player.health -= 10;
          if (player.health <= 0) {
            gameRunning = false;
            this.showGameOver(enhancements);
            return;
          }
        }
      });
      
      // Verificar si la oleada terminó
      if (enhancements.waveEnemies.length === 0) {
        enhancements.infiniteRound++;
        this.showWaveComplete(enhancements, () => {
          this.spawnWave(canvas, enhancements.infiniteRound, 
            this.waveTypes[Math.floor(Math.random() * this.waveTypes.length)], enhancements);
        });
      }
      
      // Dibujar todo
      ctx.drawImage(player.icon, player.x, player.y, player.size, player.size);
      
      ctx.fillStyle = '#0f0';
      bullets.forEach(b => ctx.fillRect(b.x, b.y, b.size, b.size));
      
      enhancements.waveEnemies.forEach(enemy => {
        const colors = { normal: '#f00', speed: '#ff0', tank: '#f0f', swarm: '#0ff', elite: '#f80', chaos: '#fff' };
        ctx.fillStyle = colors[enemy.type] || '#f00';
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
        
        // Barra de vida
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.size, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.size * (enemy.health / enemy.maxHealth), 4);
      });
      
      // UI
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText(`Oleada: ${enhancements.infiniteRound}`, 20, 30);
      ctx.fillText(`Tipo: ${enhancements.waveType.toUpperCase()}`, 20, 60);
      ctx.fillText(`Enemigos: ${enhancements.waveEnemies.length}/${enhancements.totalEnemies}`, 20, 90);
      ctx.fillText(`Score: ${enhancements.score}`, 20, 120);
      ctx.fillText(`HP: ${player.health}/${player.maxHealth}`, 20, 150);
      
      requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
  }

  showWaveComplete(enhancements, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0,255,255,0.9); padding: 30px; border-radius: 15px;
      color: #000; font-weight: bold; text-align: center; z-index: 10001;
    `;
    overlay.innerHTML = `
      <div style="font-size: 2rem;">¡OLEADA ${enhancements.infiniteRound - 1} COMPLETADA!</div>
      <div style="font-size: 1.2rem; margin: 10px 0;">Preparándose para la siguiente...</div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      overlay.remove();
      callback();
    }, 2000);
  }

  showGameOver(enhancements) {
    const survivalTime = ((Date.now() - enhancements.infiniteStartTime) / 1000).toFixed(2);
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.95); z-index: 10001;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    `;
    
    overlay.innerHTML = `
      <div style="color: #f00; font-size: 4rem; font-weight: bold;">¡GAME OVER!</div>
      <div style="color: #fff; font-size: 1.5rem; margin: 20px; text-align: center;">
        <div>Oleadas Sobrevividas: ${enhancements.infiniteRound - 1}</div>
        <div>Tiempo: ${survivalTime}s</div>
        <div>Score Final: ${enhancements.score}</div>
      </div>
      <button onclick="document.getElementById('game').classList.remove('active'); document.getElementById('lobby').classList.add('active'); this.parentElement.remove();"
        style="background: #0ff; color: #000; padding: 15px 40px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.5rem; font-weight: bold;">
        VOLVER AL LOBBY
      </button>
    `;
    
    document.body.appendChild(overlay);
  }
}

window.InfiniteMode = InfiniteMode;
