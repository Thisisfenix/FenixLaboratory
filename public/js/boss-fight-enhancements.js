// Boss Fight Enhancements - Nuevas mecánicas y efectos visuales
class BossFightEnhancements {
  constructor() {
    this.particles = [];
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.score = 0;
    this.scoreMultiplier = 1;
    this.lastHitTime = 0;
  }

  // Sistema de partículas
  createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
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

  // Nuevos power-ups
  createInvincibilityPowerup(x, y) {
    return {
      x, y,
      type: 'invincibility',
      size: 20,
      dx: -4,
      dy: 0,
      timer: 0
    };
  }

  createBombPowerup(x, y) {
    return {
      x, y,
      type: 'bomb',
      size: 20,
      dx: -4,
      dy: 0,
      timer: 0
    };
  }

  createSpeedPowerup(x, y) {
    return {
      x, y,
      type: 'speed',
      size: 20,
      dx: -4,
      dy: 0,
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
      'AngelNormalIcon': { speed: 1.1, hp: 110, damage: 0.9 },
      'GisselInactiveIcon': { speed: 1.2, hp: 90, damage: 1.0 },
      'IA777NormalIcon': { speed: 0.9, hp: 120, damage: 1.1 },
      'IrisNormalIcon': { speed: 1.0, hp: 100, damage: 1.0 },
      'LunaNormalIcon': { speed: 1.3, hp: 80, damage: 0.8 }
    };
    return stats[character] || { speed: 1.0, hp: 100, damage: 1.0 };
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
      totalBosses: 3,
      bossesDefeated: 0,
      totalScore: 0
    };
  }

  nextBossRush(bossRush, boss) {
    bossRush.bossesDefeated++;
    bossRush.currentBoss++;
    
    if (bossRush.currentBoss < bossRush.totalBosses) {
      boss.health = boss.maxHealth * (1 + bossRush.currentBoss * 0.5);
      boss.maxHealth = boss.health;
      boss.dy *= 1.2;
      return true;
    }
    return false;
  }

  drawBossRushUI(ctx, bossRush, x, y) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS RUSH: ${bossRush.bossesDefeated}/${bossRush.totalBosses}`, x, y);
  }
}

window.BossFightEnhancements = BossFightEnhancements;
