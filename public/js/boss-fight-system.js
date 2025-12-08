// Sistema completo de Boss Fight con Supabase
class BossFightSystem {
  constructor() {
    this.supabase = null;
    this.difficulty = 'normal';
    this.startTime = 0;
    this.damageTaken = 0;
    this.recording = [];
    this.bossRushMode = false;
    this.currentBossIndex = 0;
    this.bosses = ['Abelito Gordo Panzón', 'Santa Molly', 'Krampus'];
    this.enhancements = null;
    this.initSupabase();
  }

  async initSupabase() {
    try {
      if (window.supabaseGameInstance?.supabase) {
        this.supabase = window.supabaseGameInstance.supabase;
        return;
      }
      const { createClient } = supabase;
      const config = window.GAME_CONFIG || {};
      this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: { persistSession: false }
      });
    } catch (e) {
      console.warn('Supabase no disponible, modo offline');
    }
  }

  async createTableIfNotExists() {
    // SQL para agregar columna score a tabla existente:
    /*
    ALTER TABLE boss_leaderboard ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_score ON boss_leaderboard(score);
    */
  }

  getDifficultyMultiplier() {
    return { easy: 0.5, normal: 1, hard: 1.5, impossible: 2.5 }[this.difficulty];
  }

  startRecording() {
    this.recording = [];
    this.startTime = Date.now();
    this.damageTaken = 0;
    this.maxHealthRecorded = 0;
  }

  recordFrame(player, boss, bullets, bossBullets, powerups) {
    if (!this.maxHealthRecorded) {
      this.maxHealthRecorded = player.maxHealth;
    }
    if (player.health < this.maxHealthRecorded) {
      this.damageTaken = this.maxHealthRecorded - player.health;
    }
    this.recording.push({
      t: Date.now() - this.startTime,
      p: { x: player.x, y: player.y, h: player.health },
      b: { x: boss.x, y: boss.y, h: boss.health },
      bl: bullets.map(b => ({ x: b.x, y: b.y })),
      bb: bossBullets.map(b => ({ x: b.x, y: b.y })),
      pw: powerups.map(p => ({ x: p.x, y: p.y, t: p.type })),
      score: this.enhancements?.score || 0
    });
  }

  async saveReplay(playerName, character, won) {
    if (!won || this.isSaving) return;
    this.isSaving = true;
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.9); z-index: 20000;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    `;
    loadingOverlay.innerHTML = `
      <div style="font-size: 3rem; animation: spin 1s linear infinite;">⏳</div>
      <div style="color: #fff; font-size: 2rem; margin-top: 20px;">Guardando...</div>
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    document.body.appendChild(loadingOverlay);
    
    const time = (Date.now() - this.startTime) / 1000;
    const noDamage = this.damageTaken === 0;
    const cleanChar = character.replace('NormalIcon', '').replace('InactiveIcon', '');
    
    const replay = {
      player_name: playerName,
      character: cleanChar,
      difficulty: this.difficulty,
      time: time,
      damage_taken: this.damageTaken,
      no_damage: noDamage,
      score: this.enhancements?.score || 0,
      replay_data: JSON.stringify(this.recording),
      created_at: new Date().toISOString()
    };

    try {
      if (this.supabase) {
        await this.supabase.from('boss_leaderboard').insert([replay]);
      } else {
        const local = JSON.parse(localStorage.getItem('boss_replays') || '[]');
        local.push(replay);
        localStorage.setItem('boss_replays', JSON.stringify(local.slice(-10)));
      }
    } finally {
      loadingOverlay.remove();
      this.isSaving = false;
    }

    if (noDamage) {
      this.unlockSecretTheme();
    }
  }

  async getLeaderboard(difficulty = 'normal', limit = 10) {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('boss_leaderboard')
        .select('*')
        .eq('difficulty', difficulty)
        .order('time', { ascending: true })
        .limit(limit);
      return data || [];
    }
    return JSON.parse(localStorage.getItem('boss_replays') || '[]')
      .filter(r => r.difficulty === difficulty)
      .sort((a, b) => a.time - b.time)
      .slice(0, limit);
  }

  async loadReplay(replayId) {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('boss_leaderboard')
        .select('replay_data')
        .eq('id', replayId)
        .single();
      return JSON.parse(data.replay_data);
    }
    const local = JSON.parse(localStorage.getItem('boss_replays') || '[]');
    return JSON.parse(local[replayId]?.replay_data || '[]');
  }

  unlockSecretTheme() {
    localStorage.setItem('boss_slayer_theme_unlocked', 'true');
    this.showUnlockNotification();
  }

  showUnlockNotification() {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #ff0000, #ffd700);
      padding: 40px;
      border-radius: 20px;
      z-index: 20000;
      text-align: center;
      box-shadow: 0 0 50px rgba(255,215,0,0.8);
      animation: unlockPulse 1s ease-in-out infinite;
    `;
    notif.innerHTML = `
      <div style="font-size: 3rem;">🏆</div>
      <div style="color: #fff; font-size: 2rem; font-weight: bold; margin: 20px 0;">¡LOGRO DESBLOQUEADO!</div>
      <div style="color: #fff; font-size: 1.5rem;">BOSS SLAYER</div>
      <div style="color: #fff; margin-top: 10px;">Derrotaste al boss sin recibir daño</div>
      <div style="color: #ffd700; margin-top: 20px; font-weight: bold;">Tema especial desbloqueado</div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 5000);
  }

  showDifficultySelect(callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.95);
      z-index: 10002;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
    `;

    const title = document.createElement('div');
    title.textContent = 'SELECCIONA DIFICULTAD';
    title.style.cssText = 'color: #FFD700; font-size: 3rem; font-weight: bold; margin-bottom: 30px;';

    const difficulties = [
      { name: 'easy', label: 'FÁCIL', color: '#0f0', desc: 'Boss con 50% HP, ataca más lento' },
      { name: 'normal', label: 'NORMAL', color: '#ff0', desc: 'Experiencia balanceada' },
      { name: 'hard', label: 'DIFÍCIL', color: '#f80', desc: 'Boss con 150% HP, ataca más rápido' },
      { name: 'impossible', label: 'IMPOSIBLE', color: '#f00', desc: 'Boss con 250% HP, ataques letales' }
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
        callback();
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

    const bossRushBtn = document.createElement('button');
    bossRushBtn.textContent = '🔥 BOSS RUSH MODE 🔥';
    bossRushBtn.style.cssText = `
      background: linear-gradient(45deg, #f00, #f0f);
      color: #fff;
      font-size: 2rem;
      font-weight: bold;
      padding: 20px 60px;
      border: 3px solid #ffd700;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 30px;
      animation: bossRushPulse 1s ease-in-out infinite;
    `;
    bossRushBtn.addEventListener('click', () => {
      this.bossRushMode = true;
      this.difficulty = 'hard';
      overlay.remove();
      if (this.enhancements) {
        this.enhancements.bossRush = this.enhancements.initBossRush();
      }
      callback();
    });
    overlay.appendChild(bossRushBtn);
    
    const infiniteBtn = document.createElement('button');
    infiniteBtn.textContent = '♾️ MODO INFINITO ♾️';
    infiniteBtn.style.cssText = `
      background: linear-gradient(45deg, #00f, #0ff);
      color: #fff;
      font-size: 2rem;
      font-weight: bold;
      padding: 20px 60px;
      border: 3px solid #ffd700;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 10px;
      animation: bossRushPulse 1s ease-in-out infinite;
    `;
    infiniteBtn.addEventListener('click', () => {
      this.infiniteMode = true;
      this.difficulty = 'hard';
      overlay.remove();
      if (this.enhancements) {
        this.enhancements.infiniteRound = 1;
      }
      callback();
    });
    overlay.appendChild(infiniteBtn);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes bossRushPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,0,0,0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255,0,255,0.8); }
      }
      @keyframes unlockPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);
  }

  async showLeaderboard() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.95);
      z-index: 10002;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow-y: auto;
    `;

    const title = document.createElement('div');
    title.textContent = '🏆 LEADERBOARD 🏆';
    title.style.cssText = 'color: #FFD700; font-size: 3rem; font-weight: bold; margin: 20px;';

    const tabs = document.createElement('div');
    tabs.style.cssText = 'display: flex; gap: 10px; margin: 20px;';

    ['easy', 'normal', 'hard', 'impossible', 'bossrush', 'infinite'].forEach(diff => {
      const tab = document.createElement('button');
      tab.textContent = diff === 'bossrush' ? '🔥 BOSS RUSH' : diff === 'infinite' ? '♾️ INFINITO' : diff.toUpperCase();
      tab.style.cssText = `
        background: ${diff === 'normal' ? '#ff0' : diff === 'bossrush' ? 'linear-gradient(45deg, #f00, #f0f)' : diff === 'infinite' ? 'linear-gradient(45deg, #00f, #0ff)' : '#333'};
        color: ${diff === 'normal' ? '#000' : '#fff'};
        padding: 10px 20px;
        border: ${diff === 'bossrush' || diff === 'infinite' ? '2px solid #ffd700' : 'none'};
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      `;
      tab.addEventListener('click', async () => {
        tabs.querySelectorAll('button').forEach(b => {
          b.style.background = '#333';
          b.style.color = '#fff';
          b.style.border = 'none';
        });
        if (diff === 'bossrush') {
          tab.style.background = 'linear-gradient(45deg, #f00, #f0f)';
          tab.style.border = '2px solid #ffd700';
        } else if (diff === 'infinite') {
          tab.style.background = 'linear-gradient(45deg, #00f, #0ff)';
          tab.style.border = '2px solid #ffd700';
        } else {
          tab.style.background = '#ff0';
        }
        tab.style.color = diff === 'bossrush' || diff === 'infinite' ? '#fff' : '#000';
        const data = await this.getLeaderboard(diff);
        updateTable(data, diff === 'bossrush');
      });
      tabs.appendChild(tab);
    });

    const table = document.createElement('div');
    table.style.cssText = 'background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; min-width: 600px;';

    const updateTable = (data, isBossRush = false) => {
      if (isBossRush) {
        table.innerHTML = `
          <div style="display: grid; grid-template-columns: 50px 200px 150px 150px 100px; gap: 10px; color: #fff; font-weight: bold; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">
            <div>#</div>
            <div>JUGADOR</div>
            <div>PERSONAJE</div>
            <div>TIEMPO</div>
            <div>SCORE</div>
          </div>
        `;
      } else {
        table.innerHTML = `
          <div style="display: grid; grid-template-columns: 50px 200px 150px 100px 100px 100px; gap: 10px; color: #fff; font-weight: bold; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">
            <div>#</div>
            <div>JUGADOR</div>
            <div>PERSONAJE</div>
            <div>TIEMPO</div>
            <div>DAÑO</div>
            <div>SCORE</div>
          </div>
        `;
      }
      data.forEach((row, i) => {
        const rowDiv = document.createElement('div');
        const cleanChar = row.character.replace('NormalIcon', '').replace('InactiveIcon', '');
        
        if (isBossRush) {
          rowDiv.style.cssText = `
            display: grid;
            grid-template-columns: 50px 200px 150px 150px 100px;
            gap: 10px;
            color: ${i < 3 ? '#ffd700' : '#fff'};
            padding: 10px 0;
            border-bottom: 1px solid #333;
            cursor: pointer;
          `;
          rowDiv.innerHTML = `
            <div>${i + 1}</div>
            <div>${row.player_name}</div>
            <div>${cleanChar}</div>
            <div>${row.time.toFixed(2)}s 🔥</div>
            <div>${row.score || 0}</div>
          `;
        } else {
          rowDiv.style.cssText = `
            display: grid;
            grid-template-columns: 50px 200px 150px 100px 100px 100px;
            gap: 10px;
            color: ${i < 3 ? '#ffd700' : '#fff'};
            padding: 10px 0;
            border-bottom: 1px solid #333;
            cursor: pointer;
          `;
          rowDiv.innerHTML = `
            <div>${i + 1}</div>
            <div>${row.player_name}</div>
            <div>${cleanChar}</div>
            <div>${row.time.toFixed(2)}s ${row.no_damage ? '🏆' : ''}</div>
            <div>${row.damage_taken}</div>
            <div>${row.score || 0}</div>
          `;
        }
        
        rowDiv.addEventListener('click', () => this.playReplay(row.id || i));
        table.appendChild(rowDiv);
      });
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'CERRAR';
    closeBtn.style.cssText = `
      background: #f00;
      color: #fff;
      padding: 15px 40px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1.5rem;
      margin-top: 20px;
    `;
    closeBtn.addEventListener('click', () => overlay.remove());

    overlay.appendChild(title);
    overlay.appendChild(tabs);
    overlay.appendChild(table);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    const data = await this.getLeaderboard('normal');
    updateTable(data);
  }

  async playReplay(replayId) {
    const frames = await this.loadReplay(replayId);
    // Implementar reproductor de replay
    console.log('Playing replay:', frames.length, 'frames');
  }

  applyDifficulty(boss, player) {
    const mult = this.getDifficultyMultiplier();
    boss.health = Math.floor(boss.maxHealth * mult);
    boss.maxHealth = boss.health;
    
    const baseHP = player.maxHealth;
    
    if (this.difficulty === 'easy') {
      boss.dy *= 0.7;
      boss.attackTimer = 300;
      player.maxHealth = Math.floor(baseHP * 1.2);
      player.health = player.maxHealth;
    } else if (this.difficulty === 'hard') {
      boss.dy *= 1.3;
      boss.attackTimer = 120;
    } else if (this.difficulty === 'impossible') {
      boss.dy *= 1.6;
      boss.attackTimer = 80;
      player.maxHealth = Math.floor(baseHP * 0.7);
      player.health = player.maxHealth;
    }
    
    this.maxHealthRecorded = player.maxHealth;
  }
  
  setEnhancements(enhancements) {
    this.enhancements = enhancements;
  }
}

window.BossFightSystem = BossFightSystem;
