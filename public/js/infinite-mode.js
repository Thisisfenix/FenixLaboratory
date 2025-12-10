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
    let invulnerableFrames = 0;
    let abilityCooldown = 0;
    let powerUps = { slot1: null, slot2: null, slot3: null };
    let lastDirection = { x: 1, y: 0 };
    
    document.addEventListener('keydown', e => keys[e.key] = true);
    document.addEventListener('keyup', e => keys[e.key] = false);
    
    const gameLoop = () => {
      if (!gameRunning) return;
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Movimiento del jugador
      const moveSpeed = 4 * player.speed * speedBonus;
      if (keys['w']) player.y -= moveSpeed;
      if (keys['s']) player.y += moveSpeed;
      if (keys['a']) player.x -= moveSpeed;
      if (keys['d']) player.x += moveSpeed;
      
      player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
      player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
      
      // Actualizar dirección
      if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
        lastDirection = { x: 0, y: 0 };
        if (keys['d']) lastDirection.x = 1;
        if (keys['a']) lastDirection.x = -1;
        if (keys['s']) lastDirection.y = 1;
        if (keys['w']) lastDirection.y = -1;
        const mag = Math.sqrt(lastDirection.x**2 + lastDirection.y**2);
        if (mag > 0) {
          lastDirection.x /= mag;
          lastDirection.y /= mag;
        }
      }
      
      // Disparo
      if (keys[' '] && player.shootCooldown === 0) {
        const extraBullets = enhancements.upgrades.extraBullets || 0;
        const baseSpeed = 10 * bulletSpeedBonus;
        
        // Bala principal
        bullets.push({
          x: player.x + player.size/2,
          y: player.y + player.size/2,
          dx: lastDirection.x * baseSpeed,
          dy: lastDirection.y * baseSpeed,
          size: 8,
          damage: 10 * damageBonus
        });
        
        // Balas extras
        for (let i = 1; i <= extraBullets; i++) {
          const angle = (i % 2 === 0 ? 1 : -1) * (Math.PI / 8) * Math.ceil(i / 2);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rotX = lastDirection.x * cos - lastDirection.y * sin;
          const rotY = lastDirection.x * sin + lastDirection.y * cos;
          
          bullets.push({
            x: player.x + player.size/2,
            y: player.y + player.size/2,
            dx: rotX * baseSpeed,
            dy: rotY * baseSpeed,
            size: 8,
            damage: 10 * damageBonus
          });
        }
        
        player.shootCooldown = Math.max(5, 15 * cooldownReduction);
      }
      if (player.shootCooldown > 0) player.shootCooldown--;
      
      // Habilidad (tecla E)
      if (keys['e'] && abilityCooldown === 0) {
        this.useAbility(character, player, bullets, enhancements);
        abilityCooldown = 300; // 5 segundos
      }
      if (abilityCooldown > 0) abilityCooldown--;
      
      // Aplicar upgrades permanentes
      if (!enhancements.upgrades) enhancements.upgrades = {};
      const speedBonus = 1 + (enhancements.upgrades.speed || 0) * 0.1;
      const cooldownReduction = 1 - (enhancements.upgrades.cooldown || 0) * 0.1;
      const bulletSpeedBonus = 1 + (enhancements.upgrades.bulletSpeed || 0) * 0.15;
      const damageBonus = 1 + (enhancements.upgrades.damage || 0) * 0.2;
      
      // Actualizar balas
      bullets.forEach((b, i) => {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          bullets.splice(i, 1);
        }
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
            enemy.health -= (b.damage || 10);
            bullets.splice(j, 1);
            if (enemy.health <= 0) {
              enhancements.waveEnemies.splice(i, 1);
              enhancements.enemiesKilled++;
              enhancements.score += 100 * enhancements.infiniteRound;
            }
          }
        });
        
        // Colisión con jugador
        if (invulnerableFrames === 0 && !player.shield &&
            enemy.x < player.x + player.size && enemy.x + enemy.size > player.x &&
            enemy.y < player.y + player.size && enemy.y + enemy.size > player.y) {
          player.health -= 1;
          invulnerableFrames = 30; // 0.5 segundos de invulnerabilidad
          if (player.health <= 0) {
            gameRunning = false;
            this.showGameOver(enhancements);
            return;
          }
        }
      });
      
      // Reducir frames de invulnerabilidad y escudo
      if (invulnerableFrames > 0) invulnerableFrames--;
      if (player.shield > 0) {
        player.shield--;
        // Dibujar escudo
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Verificar si la oleada terminó
      if (enhancements.waveEnemies.length === 0 && enhancements.totalEnemies > 0) {
        enhancements.infiniteRound++;
        enhancements.totalEnemies = 0; // Prevenir múltiples triggers
        gameRunning = false;
        this.showWaveComplete(enhancements, () => {
          gameRunning = true;
          this.spawnWave(canvas, enhancements.infiniteRound, 
            this.waveTypes[Math.floor(Math.random() * this.waveTypes.length)], enhancements);
          requestAnimationFrame(gameLoop);
        });
        return;
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
      const maxHp = charStats.hp + (enhancements.upgrades.maxHp || 0) * 20;
      player.maxHealth = maxHp;
      ctx.fillText(`HP: ${player.health}/${maxHp}`, 20, 150);
      ctx.fillText(`Habilidad [E]: ${abilityCooldown > 0 ? Math.ceil(abilityCooldown/60) + 's' : 'LISTO'}`, 20, 180);
      
      // Upgrades UI
      ctx.fillText('Upgrades:', canvas.width - 220, 30);
      const upgradeList = [
        { name: 'HP Máx', value: enhancements.upgrades.maxHp || 0 },
        { name: 'Balas', value: enhancements.upgrades.extraBullets || 0 },
        { name: 'Velocidad', value: enhancements.upgrades.speed || 0 },
        { name: 'Daño', value: enhancements.upgrades.damage || 0 },
        { name: 'Cooldown', value: enhancements.upgrades.cooldown || 0 },
        { name: 'Vel.Balas', value: enhancements.upgrades.bulletSpeed || 0 }
      ];
      upgradeList.forEach((up, i) => {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`${up.name}: Lv${up.value}`, canvas.width - 215, 55 + i*25);
      });
      
      requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
  }

  showWaveComplete(enhancements, callback) {
    const upgrades = [
      { name: '+20 HP Máx', key: 'maxHp' },
      { name: '+1 Bala Extra', key: 'extraBullets' },
      { name: '+10% Velocidad', key: 'speed' },
      { name: '+20% Daño', key: 'damage' },
      { name: '-10% Cooldown', key: 'cooldown' },
      { name: '+15% Vel. Balas', key: 'bulletSpeed' }
    ];
    
    const choices = [];
    for (let i = 0; i < 3; i++) {
      choices.push(upgrades[Math.floor(Math.random() * upgrades.length)]);
    }
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.95); z-index: 10001;
      display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px;
    `;
    
    if (!enhancements.upgrades) enhancements.upgrades = {};
    
    overlay.innerHTML = `
      <div style="color: #0ff; font-size: 3rem; font-weight: bold;">¡OLEADA ${enhancements.infiniteRound - 1} COMPLETADA!</div>
      <div style="color: #fff; font-size: 1.5rem;">Elige UN upgrade permanente:</div>
      <div style="display: flex; gap: 20px;">
        ${choices.map((up, i) => {
          const level = enhancements.upgrades[up.key] || 0;
          return `
            <button class="upgrade-choice" data-key="${up.key}" data-name="${up.name}"
              style="background: #0f0; color: #000; padding: 20px 30px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.3rem; font-weight: bold;">
              ${up.name}<br><span style="font-size: 0.9rem;">Nivel ${level}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelectorAll('.upgrade-choice').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.key;
        enhancements.upgrades[key] = (enhancements.upgrades[key] || 0) + 1;
        overlay.remove();
        callback();
      };
    });
  }
  
  useAbility(character, player, bullets, enhancements) {
    const lastDir = { x: 1, y: 0 }; // Default direction
    switch(character) {
      case 'Angel':
        player.speed *= 3;
        setTimeout(() => player.speed /= 3, 1000);
        break;
      case 'Gissel':
        player.health = Math.min(player.maxHealth, player.health + 30);
        break;
      case 'iA777':
        for (let i = -2; i <= 2; i++) {
          bullets.push({ x: player.x + player.size/2, y: player.y + player.size/2, dx: 10, dy: i*2, size: 8, damage: 10 });
        }
        break;
      case 'Iris':
        player.shield = 60;
        break;
      case 'Luna':
        enhancements.waveEnemies.forEach(e => e.speed *= 0.3);
        setTimeout(() => enhancements.waveEnemies.forEach(e => e.speed /= 0.3), 3000);
        break;
      case 'Molly':
        enhancements.waveEnemies.forEach(e => {
          const dist = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
          if (dist < 200) e.health -= 50;
        });
        break;
    }
  }

  showGameOver(enhancements) {
    const survivalTime = ((Date.now() - enhancements.infiniteStartTime) / 1000).toFixed(2);
    const waves = enhancements.infiniteRound - 1;
    const score = enhancements.score;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.95); z-index: 10001;
      display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px;
    `;
    
    overlay.innerHTML = `
      <div style="color: #f00; font-size: 4rem; font-weight: bold;">¡GAME OVER!</div>
      <div style="color: #fff; font-size: 1.5rem; text-align: center;">
        <div>Oleadas Sobrevividas: ${waves}</div>
        <div>Tiempo: ${survivalTime}s</div>
        <div>Score Final: ${score}</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
        <input id="playerName" type="text" placeholder="Tu nombre" maxlength="20"
          style="padding: 10px 20px; font-size: 1.2rem; border: 2px solid #0ff; background: #000; color: #fff; border-radius: 5px; text-align: center;">
        <button id="submitScore"
          style="background: #0f0; color: #000; padding: 15px 40px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.5rem; font-weight: bold;">
          GUARDAR SCORE
        </button>
        <button id="backToLobby"
          style="background: #0ff; color: #000; padding: 15px 40px; border: none; border-radius: 10px; cursor: pointer; font-size: 1.5rem; font-weight: bold;">
          VOLVER AL LOBBY
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const backToLobby = () => {
      document.getElementById('game').classList.remove('active');
      document.getElementById('lobby').classList.add('active');
      overlay.remove();
    };
    
    overlay.querySelector('#backToLobby').onclick = backToLobby;
    
    overlay.querySelector('#submitScore').onclick = async () => {
      const name = overlay.querySelector('#playerName').value.trim();
      if (!name) {
        alert('¡Ingresa tu nombre!');
        return;
      }
      
      try {
        const { data, error } = await window.supabase
          .from('infinite_leaderboard')
          .insert([{
            player_name: name,
            waves_survived: waves,
            survival_time: parseFloat(survivalTime),
            final_score: score,
            created_at: new Date().toISOString()
          }]);
        
        if (error) throw error;
        
        alert('¡Score guardado! 🎉');
        backToLobby();
      } catch (err) {
        console.error('Error guardando score:', err);
        alert('Error guardando el score. Intenta de nuevo.');
      }
    };
  }
}

window.InfiniteMode = InfiniteMode;
