// Boss Fight Enhancements - Nuevas mecánicas y efectos visuales
class BossFightEnhancements {
  constructor() {
    this.particles = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.score = 0;
    this.scoreMultiplier = 1;
    this.lastHitTime = 0;
  }

  // Sistema de partículas optimizado
  createParticles(x, y, count, color) {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const particleCount = isMobile ? Math.min(count, 15) : count;
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        size: Math.random() * 4 + 2,
        color
      });
    }
  }

  updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      return p.life > 0;
    });
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });
  }

  // Screen shake
  triggerScreenShake(intensity) {
    this.screenShake.intensity = intensity;
  }

  updateScreenShake() {
    if (this.screenShake.intensity > 0) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= 0.9;
      if (this.screenShake.intensity < 0.1) {
        this.screenShake.intensity = 0;
        this.screenShake.x = 0;
        this.screenShake.y = 0;
      }
    }
  }

  applyScreenShake(ctx) {
    ctx.translate(this.screenShake.x, this.screenShake.y);
  }

  // Nuevos ataques del boss
  laserAttack(boss, bossBullets, canvas) {
    this.triggerScreenShake(15);
    const laserY = boss.y + boss.size / 2;
    for (let i = 0; i < 20; i++) {
      bossBullets.push({
        x: canvas.width,
        y: laserY + (Math.random() - 0.5) * 10,
        dx: -15,
        dy: 0,
        size: 8,
        type: 'laser'
      });
    }
  }

  rainAttack(boss, bossBullets, canvas) {
    for (let i = 0; i < 15; i++) {
      bossBullets.push({
        x: Math.random() * canvas.width,
        y: -20,
        dx: 0,
        dy: 8,
        size: 10,
        type: 'rain',
        warning: 60
      });
    }
  }

  spiralAttack(boss, bossBullets) {
    const spirals = 3;
    for (let s = 0; s < spirals; s++) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i + (s * Math.PI / 3);
        bossBullets.push({
          x: boss.x + boss.size / 2,
          y: boss.y + boss.size / 2,
          dx: Math.cos(angle) * 5,
          dy: Math.sin(angle) * 5,
          size: 10,
          type: 'spiral'
        });
      }
    }
  }

  waveAttack(boss, bossBullets, canvas) {
    for (let i = 0; i < 10; i++) {
      bossBullets.push({
        x: boss.x,
        y: boss.y + boss.size / 2,
        dx: -6,
        dy: Math.sin(i * 0.5) * 3,
        size: 12,
        type: 'wave'
      });
    }
  }

  crossAttack(boss, bossBullets) {
    const directions = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
    directions.forEach(dir => {
      bossBullets.push({
        x: boss.x + boss.size / 2,
        y: boss.y + boss.size / 2,
        dx: dir.x * 7,
        dy: dir.y * 7,
        size: 14,
        type: 'cross'
      });
    });
  }

  homingAttack(boss, bossBullets, player) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + (Math.random() - 0.5) * 0.5;
      bossBullets.push({
        x: boss.x + boss.size / 2,
        y: boss.y + boss.size / 2,
        dx: Math.cos(angle) * 6,
        dy: Math.sin(angle) * 6,
        size: 10,
        type: 'homing',
        targetX: player.x,
        targetY: player.y
      });
    }
  }

  // Nuevos power-ups
  createInvincibilityPowerup(x, y) {
    return {
      x, y,
      type: 'invincibility',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  createPenetratingBulletPowerup(x, y) {
    return {
      x, y,
      type: 'penetrating',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  createTimeFreezePowerup(x, y) {
    return {
      x, y,
      type: 'time_freeze',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  createBombPowerup(x, y) {
    return {
      x, y,
      type: 'bomb',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  createSpeedPowerup(x, y) {
    return {
      x, y,
      type: 'speed',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  createDoubleDamagePowerup(x, y) {
    return {
      x, y,
      type: 'double_damage',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  createSlowMotionPowerup(x, y) {
    return {
      x, y,
      type: 'slow_motion',
      size: 20,
      dx: 0,
      dy: 3,
      timer: 0
    };
  }

  // Sistema de puntuación
  addScore(points, combo) {
    const now = Date.now();
    if (now - this.lastHitTime < 2000) {
      this.scoreMultiplier = Math.min(this.scoreMultiplier + 0.1, 5);
    } else {
      this.scoreMultiplier = 1;
    }
    this.lastHitTime = now;
    this.score += Math.floor(points * this.scoreMultiplier * (1 + combo * 0.1));
  }

  drawScore(ctx, x, y) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, x, y);
    if (this.scoreMultiplier > 1) {
      ctx.fillStyle = '#FF0';
      ctx.fillText(`x${this.scoreMultiplier.toFixed(1)}`, x + 150, y);
    }
  }

  // Dibujar warnings para ataques
  drawWarnings(ctx, bossBullets) {
    bossBullets.forEach(b => {
      if (b.warning && b.warning > 0) {
        ctx.save();
        ctx.globalAlpha = b.warning / 60;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        b.warning--;
      }
    });
  }

  // Efectos visuales mejorados para power-ups
  drawPowerup(ctx, powerup) {
    powerup.timer = (powerup.timer || 0) + 1;
    const pulse = Math.sin(powerup.timer * 0.1) * 5;
    
    ctx.save();
    ctx.shadowBlur = 20;
    
    if (powerup.type === 'invincibility') {
      ctx.shadowColor = '#00FFFF';
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    } else if (powerup.type === 'bomb') {
      ctx.shadowColor = '#FF00FF';
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💣', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    } else if (powerup.type === 'speed') {
      ctx.shadowColor = '#FFFF00';
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    } else if (powerup.type === 'double_damage') {
      ctx.shadowColor = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🔥', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    } else if (powerup.type === 'slow_motion') {
      ctx.shadowColor = '#0000FF';
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🕐', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    } else if (powerup.type === 'penetrating') {
      ctx.shadowColor = '#00FF00';
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎯', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    } else if (powerup.type === 'time_freeze') {
      ctx.shadowColor = '#FFFFFF';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(powerup.x - pulse, powerup.y - pulse, powerup.size + pulse * 2, powerup.size + pulse * 2);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('❄️', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2 + 6);
    }
    
    ctx.restore();
  }

  // Aplicar efectos de power-ups
  applyPowerupEffect(player, powerup, bossBullets) {
    if (powerup.type === 'invincibility') {
      player.invincible = true;
      player.invincibleTimer = 180;
      this.createParticles(powerup.x, powerup.y, 20, '#00FFFF');
    } else if (powerup.type === 'bomb') {
      bossBullets.length = 0;
      this.triggerScreenShake(20);
      this.createParticles(player.x, player.y, 50, '#FF00FF');
    } else if (powerup.type === 'speed') {
      player.speedBoost = true;
      player.speedBoostTimer = 300;
      this.createParticles(powerup.x, powerup.y, 20, '#FFFF00');
    } else if (powerup.type === 'double_damage') {
      player.doubleDamage = true;
      player.doubleDamageTimer = 240;
      this.createParticles(powerup.x, powerup.y, 20, '#FF0000');
    } else if (powerup.type === 'slow_motion') {
      player.slowMotion = true;
      player.slowMotionTimer = 300;
      this.createParticles(powerup.x, powerup.y, 20, '#0000FF');
    } else if (powerup.type === 'penetrating') {
      player.penetratingBullets = true;
      player.penetratingTimer = 240;
      this.createParticles(powerup.x, powerup.y, 20, '#00FF00');
    } else if (powerup.type === 'time_freeze') {
      player.timeFreeze = true;
      player.timeFreezeTimer = 120;
      this.createParticles(powerup.x, powerup.y, 30, '#FFFFFF');
      this.triggerScreenShake(10);
    }
  }

  // Dibujar efecto de invencibilidad
  drawInvincibilityEffect(ctx, player) {
    if (player.invincible) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2 + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Stats de personajes
  getCharacterStats(character) {
    const stats = {
      'Angel': { speed: 1.15, hp: 110, damage: 0.95, ability: 'angel', abilityName: 'Escudo Divino', abilityDesc: '110 HP | Bloquea 1 golpe cada 15s', bulletColor: '#00f' },
      'Gissel': { speed: 1.35, hp: 85, damage: 1.0, ability: 'gissel', abilityName: 'Evasión', abilityDesc: '85 HP | Dash más rápido (8s CD)', bulletColor: '#ff0' },
      'iA777': { speed: 0.85, hp: 130, damage: 1.15, ability: 'ia777', abilityName: 'Tanque', abilityDesc: '130 HP | Reduce daño 30%', bulletColor: '#a0f' },
      'Iris': { speed: 1.05, hp: 100, damage: 1.05, ability: 'iris', abilityName: 'Equilibrio', abilityDesc: '100 HP | Regenera 1 HP/2s', bulletColor: '#a0f' },
      'Luna': { speed: 1.45, hp: 75, damage: 0.85, ability: 'luna', abilityName: 'Velocista', abilityDesc: '75 HP | Disparo más rápido', bulletColor: '#ff0' },
      'Molly': { speed: 1.0, hp: 105, damage: 1.25, ability: 'molly', abilityName: 'Furia', abilityDesc: '105 HP | +50% daño bajo 50% HP', bulletColor: '#f00' },
      'ankush': { speed: 2.0, hp: 999, damage: 5.0, ability: 'ankush', abilityName: 'Ankush', abilityDesc: '999 HP | ROTO (Sin leaderboard)', bulletColor: '#ff0' }
    };
    return stats[character] || { speed: 1.0, hp: 100, damage: 1.0, ability: 'none', abilityName: 'Ninguna', abilityDesc: '', bulletColor: '#0f0' };
  }

  // Música dinámica
  updateMusicIntensity(bossMusic, boss) {
    if (boss.phase === 3) {
      bossMusic.playbackRate = 1.2;
    } else if (boss.phase === 2) {
      bossMusic.playbackRate = 1.1;
    } else {
      bossMusic.playbackRate = 1.0;
    }
  }

  // Achievements
  checkAchievements(player, boss, time) {
    const achievements = [];
    
    if (player.health === player.maxHealth) {
      achievements.push({ name: 'FLAWLESS', desc: 'Sin recibir daño', icon: '🏆' });
    }
    
    if (!player.dashUsed) {
      achievements.push({ name: 'NO DASH', desc: 'Sin usar dash', icon: '🎯' });
    }
    
    if (time < 60) {
      achievements.push({ name: 'SPEEDRUN', desc: 'Menos de 1 minuto', icon: '⚡' });
    }
    
    if (player.combo >= 50) {
      achievements.push({ name: 'COMBO MASTER', desc: 'Combo de 50+', icon: '🔥' });
    }
    
    return achievements;
  }

  displayAchievements(achievements) {
    if (achievements.length === 0) return;
    
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10004;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    achievements.forEach((ach, i) => {
      setTimeout(() => {
        const achDiv = document.createElement('div');
        achDiv.style.cssText = `
          background: linear-gradient(45deg, #FFD700, #FFA500);
          padding: 15px 20px;
          border-radius: 10px;
          color: #000;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(255,215,0,0.5);
          animation: slideIn 0.5s ease-out;
        `;
        achDiv.innerHTML = `
          <div style="font-size: 2rem;">${ach.icon}</div>
          <div style="font-size: 1.2rem;">${ach.name}</div>
          <div style="font-size: 0.9rem; opacity: 0.8;">${ach.desc}</div>
        `;
        container.appendChild(achDiv);
        
        setTimeout(() => achDiv.remove(), 5000);
      }, i * 500);
    });
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(container);
  }

  // Boss Rush Mode
  initBossRush() {
    return {
      currentBoss: 0,
      totalBosses: 4,
      bossesDefeated: 0,
      totalScore: 0
    };
  }

  nextBossRush(bossRush, boss) {
    bossRush.bossesDefeated++;
    bossRush.currentBoss++;
    
    if (bossRush.currentBoss < bossRush.totalBosses) {
      return true;
    }
    return false;
  }

  // Boss 2: Anna
  annaAttack(boss, bossBullets, player, canvas) {
    const attacks = ['heart_burst', 'love_spiral', 'rage_wave', 'toxic_rain', 'charm_circle', 'love_beam', 'heart_shield'];
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    
    if (attack === 'heart_burst') {
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i;
        bossBullets.push({
          x: boss.x + boss.size/2,
          y: boss.y + boss.size/2,
          dx: Math.cos(angle) * 10,
          dy: Math.sin(angle) * 10,
          size: 20,
          type: 'heart'
        });
      }
    } else if (attack === 'love_spiral') {
      for (let wave = 0; wave < 6; wave++) {
        setTimeout(() => {
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + wave * 0.5;
            bossBullets.push({
              x: boss.x + boss.size/2,
              y: boss.y + boss.size/2,
              dx: Math.cos(angle) * (6 + wave),
              dy: Math.sin(angle) * (6 + wave),
              size: 14,
              type: 'love'
            });
          }
        }, wave * 100);
      }
    } else if (attack === 'rage_wave') {
      for (let i = 0; i < 30; i++) {
        bossBullets.push({
          x: boss.x,
          y: boss.y + i * 8,
          dx: -12,
          dy: Math.sin(i * 0.4) * 5,
          size: 18,
          type: 'rage'
        });
      }
    } else if (attack === 'toxic_rain') {
      for (let i = 0; i < 35; i++) {
        bossBullets.push({
          x: Math.random() * canvas.width,
          y: -50,
          dx: 0,
          dy: 15,
          size: 16,
          type: 'toxic',
          warning: 30
        });
      }
    } else if (attack === 'charm_circle') {
      const circles = 4;
      for (let c = 0; c < circles; c++) {
        for (let i = 0; i < 16; i++) {
          const angle = (Math.PI * 2 / 16) * i;
          const radius = 60 + c * 50;
          bossBullets.push({
            x: boss.x + boss.size/2 + Math.cos(angle) * radius,
            y: boss.y + boss.size/2 + Math.sin(angle) * radius,
            dx: Math.cos(angle) * 7,
            dy: Math.sin(angle) * 7,
            size: 12,
            type: 'charm'
          });
        }
      }
    } else if (attack === 'love_beam') {
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
      for (let i = 0; i < 15; i++) {
        bossBullets.push({
          x: boss.x + boss.size/2,
          y: boss.y + boss.size/2,
          dx: Math.cos(angle) * 15,
          dy: Math.sin(angle) * 15,
          size: 25,
          type: 'love_beam'
        });
      }
    } else if (attack === 'heart_shield') {
      boss.shield = Math.min(boss.shieldMax, boss.shield + 50);
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        bossBullets.push({
          x: boss.x + boss.size/2 + Math.cos(angle) * 80,
          y: boss.y + boss.size/2 + Math.sin(angle) * 80,
          dx: Math.cos(angle) * 4,
          dy: Math.sin(angle) * 4,
          size: 15,
          type: 'heart_shield'
        });
      }
    }
  }

  // Boss 4: Gissel (Devorador)
  devourerAttack(boss, bossBullets, player, canvas) {
    const attacks = ['dash_burst', 'evasion_clones', 'speed_barrage', 'teleport_strike', 'wind_spiral', 'phantom_dash', 'velocity_storm'];
    const attack = attacks[Math.floor(Math.random() * attacks.length)];
    
    if (attack === 'dash_burst') {
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.x += Math.cos(angle) * 150;
      boss.y += Math.sin(angle) * 150;
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 / 12) * i;
        bossBullets.push({
          x: boss.x + boss.size/2,
          y: boss.y + boss.size/2,
          dx: Math.cos(a) * 12,
          dy: Math.sin(a) * 12,
          size: 15,
          type: 'dash'
        });
      }
    } else if (attack === 'evasion_clones') {
      for (let i = 0; i < 4; i++) {
        const cloneX = Math.random() * canvas.width;
        const cloneY = Math.random() * canvas.height;
        for (let j = 0; j < 8; j++) {
          const angle = (Math.PI * 2 / 8) * j;
          bossBullets.push({
            x: cloneX,
            y: cloneY,
            dx: Math.cos(angle) * 8,
            dy: Math.sin(angle) * 8,
            size: 12,
            type: 'clone'
          });
        }
      }
    } else if (attack === 'speed_barrage') {
      for (let i = 0; i < 25; i++) {
        setTimeout(() => {
          const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + (Math.random() - 0.5) * 0.8;
          bossBullets.push({
            x: boss.x + boss.size/2,
            y: boss.y + boss.size/2,
            dx: Math.cos(angle) * 18,
            dy: Math.sin(angle) * 18,
            size: 10,
            type: 'speed'
          });
        }, i * 30);
      }
    } else if (attack === 'teleport_strike') {
      const positions = [
        {x: player.x + 100, y: player.y},
        {x: player.x - 100, y: player.y},
        {x: player.x, y: player.y + 100},
        {x: player.x, y: player.y - 100}
      ];
      positions.forEach((pos, i) => {
        setTimeout(() => {
          boss.x = Math.max(0, Math.min(canvas.width - boss.size, pos.x));
          boss.y = Math.max(0, Math.min(canvas.height - boss.size, pos.y));
          for (let j = 0; j < 6; j++) {
            const angle = (Math.PI * 2 / 6) * j;
            bossBullets.push({
              x: boss.x + boss.size/2,
              y: boss.y + boss.size/2,
              dx: Math.cos(angle) * 10,
              dy: Math.sin(angle) * 10,
              size: 14,
              type: 'teleport'
            });
          }
        }, i * 200);
      });
    } else if (attack === 'wind_spiral') {
      for (let wave = 0; wave < 8; wave++) {
        setTimeout(() => {
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + wave * 0.3;
            bossBullets.push({
              x: boss.x + boss.size/2,
              y: boss.y + boss.size/2,
              dx: Math.cos(angle) * (5 + wave * 0.5),
              dy: Math.sin(angle) * (5 + wave * 0.5),
              size: 8,
              type: 'wind'
            });
          }
        }, wave * 80);
      }
    } else if (attack === 'phantom_dash') {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const oldX = boss.x, oldY = boss.y;
          boss.x = Math.random() * (canvas.width - boss.size);
          boss.y = Math.random() * (canvas.height - boss.size);
          
          // Crear trail de balas
          const steps = 10;
          for (let s = 0; s < steps; s++) {
            const trailX = oldX + (boss.x - oldX) * (s / steps);
            const trailY = oldY + (boss.y - oldY) * (s / steps);
            bossBullets.push({
              x: trailX,
              y: trailY,
              dx: 0,
              dy: 0,
              size: 8,
              type: 'phantom',
              lifetime: 60
            });
          }
        }, i * 300);
      }
    } else if (attack === 'velocity_storm') {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 10;
        bossBullets.push({
          x: boss.x + boss.size/2,
          y: boss.y + boss.size/2,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 8,
          type: 'velocity'
        });
      }
    }
  }

  updateDevourerBullets(bossBullets, player, canvas) {
    bossBullets.forEach((b, i) => {
      if (b.type === 'blackhole') {
        b.lifetime--;
        if (b.lifetime <= 0) {
          bossBullets.splice(i, 1);
          return;
        }
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < b.pullRadius) {
          const pull = (1 - dist / b.pullRadius) * 2;
          player.x += (dx / dist) * pull;
          player.y += (dy / dist) * pull;
        }
      } else if (b.type === 'void_rift') {
        b.lifetime--;
        b.spawnTimer++;
        if (b.lifetime <= 0) {
          bossBullets.splice(i, 1);
          return;
        }
        if (b.spawnTimer > 30) {
          const angle = Math.random() * Math.PI * 2;
          bossBullets.push({
            x: b.x,
            y: b.y,
            dx: Math.cos(angle) * 5,
            dy: Math.sin(angle) * 5,
            size: 8,
            type: 'void_spawn'
          });
          b.spawnTimer = 0;
        }
      } else if (b.type === 'gravity_well') {
        b.lifetime--;
        b.rotation += 0.1;
        if (b.lifetime <= 0) {
          bossBullets.splice(i, 1);
          return;
        }
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < b.pullRadius) {
          const pull = (1 - dist / b.pullRadius) * 1.5;
          player.x += (dx / dist) * pull;
          player.y += (dy / dist) * pull;
        }
      } else if (b.type === 'dimension_tear') {
        b.lifetime--;
        if (b.warning > 0) b.warning--;
        if (b.lifetime <= 0) bossBullets.splice(i, 1);
      } else if (b.type === 'star' && b.trail) {
        b.trail.push({x: b.x, y: b.y});
        if (b.trail.length > 5) b.trail.shift();
      } else if (b.type === 'singularity') {
        b.lifetime--;
        if (b.lifetime <= 0) {
          for (let j = 0; j < 20; j++) {
            const angle = (Math.PI * 2 / 20) * j;
            bossBullets.push({
              x: b.x,
              y: b.y,
              dx: Math.cos(angle) * 8,
              dy: Math.sin(angle) * 8,
              size: 10,
              type: 'singularity_burst'
            });
          }
          bossBullets.splice(i, 1);
        }
      }
    });
  }

  drawDevourerEffects(ctx, boss, bossBullets) {
    bossBullets.forEach(b => {
      if (b.type === 'blackhole') {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a0f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.pullRadius * (b.lifetime / 180), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (b.type === 'meteor' && b.warning > 0) {
        ctx.save();
        ctx.globalAlpha = b.warning / 30;
        ctx.fillStyle = '#f80';
        ctx.beginPath();
        ctx.arc(b.x, ctx.canvas.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        b.warning--;
      } else if (b.type === 'void_rift') {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#800080';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * (1 + Math.sin(b.spawnTimer * 0.1) * 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else if (b.type === 'gravity_well') {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, b.size + i * 10, 0, Math.PI * 2);
          ctx.globalAlpha = 0.3 - i * 0.05;
          ctx.stroke();
        }
        ctx.restore();
      } else if (b.type === 'dimension_tear' && b.warning > 0) {
        ctx.save();
        ctx.globalAlpha = b.warning / 60;
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (b.type === 'star' && b.trail) {
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        b.trail.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.restore();
      } else if (b.type === 'singularity') {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * (1 + Math.sin(Date.now() * 0.01) * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f0f';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  drawBossRushUI(ctx, bossRush, x, y) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS RUSH: ${bossRush.bossesDefeated}/${bossRush.totalBosses}`, x, y);
    
    if (bossRush.totalScore > 0) {
      ctx.fillStyle = '#FF0';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`TOTAL: ${bossRush.totalScore}`, x, y + 25);
    }
  }

  // Optimización de memoria
  cleanupBullets(bullets, canvas) {
    return bullets.filter(b => {
      return b.x > -50 && b.x < canvas.width + 50 && 
             b.y > -50 && b.y < canvas.height + 50;
    });
  }

  // Mejorar detección de colisiones
  checkCollision(rect1, rect2, hitboxReduction = 3) {
    return rect1.x + hitboxReduction < rect2.x + rect2.size - hitboxReduction &&
           rect1.x + rect1.size - hitboxReduction > rect2.x + hitboxReduction &&
           rect1.y + hitboxReduction < rect2.y + rect2.size - hitboxReduction &&
           rect1.y + rect1.size - hitboxReduction > rect2.y + hitboxReduction;
  }
}

window.BossFightEnhancements = BossFightEnhancements;
