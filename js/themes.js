// themes.js - Sistema de gestión de temas

function setTheme(theme) {
  const body = document.body;
  const themes = ['light-theme', 'neon-theme', 'cyberpunk-theme', 'matrix-theme', 'synthwave-theme', 'ocean-theme', 'forest-theme', 'sunset-theme', 'christmas-theme', 'halloween-theme', 'valentine-theme', 'easter-theme', 'summer-theme', 'autumn-theme', 'funkyatlas-theme', 'funkyatlas-christmas-theme', 'galaxy-theme', 'gold-theme', 'rainbow-theme', 'diamond-theme', 'custom-theme', 'vaporwave-theme', 'hacker-theme', 'neon-city-theme', 'space-theme', 'fire-theme', 'ice-theme', 'toxic-theme', 'royal-theme', 'steampunk-theme', 'hologram-theme', 'legendary-theme'];
  
  themes.forEach(t => body.classList.remove(t));
  
  if (theme !== 'dark') {
    body.classList.add(theme + '-theme');
  }
  
  if (theme === 'custom') {
    applyCustomTheme();
  }
  
  if (theme === 'christmas' || theme === 'funkyatlas-christmas') {
    createSnowflakes();
  } else {
    removeSnowflakes();
  }
  
  if (theme !== 'matrix') {
    removeMatrixRain();
  }
  
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.remove('active');
    if (card.dataset.theme === theme) {
      card.classList.add('active');
    }
  });
  
  localStorage.setItem('theme', theme);
}

function createSnowflakes() {
  removeSnowflakes();
  const snowflakeCount = 50;
  const snowflakes = ['❄', '❅', '❆'];
  
  for (let i = 0; i < snowflakeCount; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
    snowflake.style.left = Math.random() * 100 + '%';
    snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
    snowflake.style.animationDelay = Math.random() * 5 + 's';
    snowflake.style.fontSize = (Math.random() * 1 + 0.5) + 'em';
    snowflake.style.opacity = Math.random() * 0.6 + 0.4;
    document.body.appendChild(snowflake);
  }
}

function removeSnowflakes() {
  document.querySelectorAll('.snowflake').forEach(snowflake => snowflake.remove());
}

function removeMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  if (canvas) canvas.remove();
}

function applyCustomTheme() {
  const colors = gameData.customColors;
  document.documentElement.style.setProperty('--custom-bg', colors.bg);
  document.documentElement.style.setProperty('--custom-bg-light', colors.bg + '33');
  document.documentElement.style.setProperty('--custom-text', colors.text);
  document.documentElement.style.setProperty('--custom-text-secondary', colors.text + '99');
  document.documentElement.style.setProperty('--custom-primary', colors.primary);
  document.documentElement.style.setProperty('--custom-secondary', colors.secondary);
}

function showCustomColors() {
  document.getElementById('custom-colors').style.display = 'block';
  document.getElementById('bg-color').value = gameData.customColors.bg;
  document.getElementById('text-color').value = gameData.customColors.text;
  document.getElementById('primary-color').value = gameData.customColors.primary;
  document.getElementById('secondary-color').value = gameData.customColors.secondary;
}

function loadTheme() {
  const seasonalTheme = getSeasonalTheme();
  const savedTheme = localStorage.getItem('theme') || seasonalTheme || 'dark';
  const lastThemeChange = localStorage.getItem('last-theme-change');
  const today = new Date().toDateString();
  
  if (seasonalTheme && lastThemeChange !== today && gameData.autoSeasonalThemes) {
    setTheme(seasonalTheme);
    showSeasonalNotification(seasonalTheme);
  } else {
    setTheme(savedTheme);
  }
}

function getSeasonalTheme() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  if (month === 10) return 'halloween';
  if (month === 12) return 'christmas';
  if (month === 2 && day === 14) return 'valentine';
  if (month === 4) return 'easter';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  
  return null;
}

function showSeasonalNotification(theme) {
  const themeNames = {
    'halloween': '🎃 Halloween',
    'christmas': '🎄 Navidad', 
    'valentine': '💕 San Valentín',
    'easter': '🐰 Pascua',
    'summer': '☀️ Verano',
    'autumn': '🍂 Otoño'
  };
  
  const notification = document.getElementById('achievement-notification');
  document.getElementById('notification-text').textContent = `Tema ${themeNames[theme]} activado automáticamente`;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 4000);
}

function showThemePanel() {
  document.getElementById('theme-overlay').classList.add('show');
  document.getElementById('theme-panel').classList.add('show');
}

function hideThemePanel() {
  document.getElementById('theme-overlay').classList.remove('show');
  document.getElementById('theme-panel').classList.remove('show');
}

function updatePremiumThemes() {
  document.querySelectorAll('.premium-theme').forEach(card => {
    const theme = card.dataset.theme;
    const isUnlocked = gameData.unlockedThemes.has(theme);
    
    if (isUnlocked) {
      card.classList.remove('locked');
      card.classList.add('owned');
    } else {
      card.classList.add('locked');
      card.classList.remove('owned');
    }
  });
}

function updateSeasonalIndicator() {
  const currentSeason = getSeasonalTheme();
  const indicator = document.getElementById('seasonal-indicator');
  
  document.querySelectorAll('.seasonal-theme').forEach(card => {
    card.classList.remove('current-season');
  });
  
  if (currentSeason) {
    const seasonNames = {
      'halloween': '(Activo: Halloween 🎃)',
      'christmas': '(Activo: Navidad 🎄)', 
      'valentine': '(Activo: San Valentín 💕)',
      'easter': '(Activo: Pascua 🐰)',
      'summer': '(Activo: Verano ☀️)',
      'autumn': '(Activo: Otoño 🍂)'
    };
    
    indicator.textContent = seasonNames[currentSeason] || '';
    const currentCard = document.querySelector(`[data-theme="${currentSeason}"]`);
    if (currentCard) {
      currentCard.classList.add('current-season');
    }
  } else {
    indicator.textContent = '';
  }
}

function buyTheme(theme, cost) {
  const result = achievementSystem.buyTheme(theme, cost);
  if (result) {
    updatePointsDisplay();
    updatePremiumThemes();
  }
  return result;
}

function applyEditorTheme(preview = false) {
  const bg = document.getElementById('editor-bg').value;
  const bgLight = document.getElementById('editor-bg-light').value;
  const text = document.getElementById('editor-text').value;
  const textSec = document.getElementById('editor-text-sec').value;
  const primary = document.getElementById('editor-primary').value;
  const secondary = document.getElementById('editor-secondary').value;
  const shadows = document.getElementById('editor-shadows').checked;
  const gradients = document.getElementById('editor-gradients').checked;
  const animations = document.getElementById('editor-animations').checked;
  const opacity = document.getElementById('editor-opacity').value;
  const root = document.documentElement;
  root.style.setProperty('--bg-dark', bg);
  root.style.setProperty('--bg-light', bgLight);
  root.style.setProperty('--text-primary', text);
  root.style.setProperty('--text-secondary', textSec);
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--secondary', secondary);
  if (!shadows) root.style.setProperty('--box-shadow', 'none');
  if (!animations) root.style.setProperty('--animation-duration', '0s');
  document.body.style.opacity = opacity;
  if (!preview) {
    gameData.customColors = { bg, bgLight, text, textSec, primary, secondary };
    gameData.editorSettings = { shadows, gradients, animations, opacity };
    setTheme('custom');
    saveGameData();
  }
}

function checkAutoDayNight() {
  if (!gameData.autoDayNight) return;
  
  const hour = new Date().getHours();
  const isDayTime = hour >= 6 && hour < 20;
  const currentTheme = localStorage.getItem('theme') || 'dark';
  
  if (isDayTime && currentTheme === 'dark') {
    setTheme('light');
  } else if (!isDayTime && currentTheme === 'light') {
    setTheme('dark');
  }
}

function initThemeListeners() {
  document.getElementById('theme-panel-btn').addEventListener('click', showThemePanel);
  document.getElementById('close-theme-panel').addEventListener('click', hideThemePanel);
  document.getElementById('theme-overlay').addEventListener('click', hideThemePanel);
  
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const theme = e.target.closest('.theme-card').dataset.theme;
      const cost = parseInt(card.dataset.cost);
      
      if (card.classList.contains('premium-theme') && !gameData.unlockedThemes.has(theme)) {
        if (buyTheme(theme, cost)) {
          setTheme(theme);
          hideThemePanel();
          if (theme === 'custom') showCustomColors();
        } else {
          alert(`Necesitas ${cost} puntos para desbloquear este tema. Tienes ${gameData.points} puntos.`);
          return;
        }
      } else {
        setTheme(theme);
        hideThemePanel();
        if (theme === 'custom') showCustomColors();
      }
      
      localStorage.setItem('last-theme-change', new Date().toDateString());
      
      gameData.themesUsed.add(theme);
      gameData.themeChangeCount++;
      updateChallenge('change-theme');
      updateWeeklyChallenge('theme-explorer');
      updateBadgeProgress('theme-master', 1);
      updateBadgeProgress('customization', 1);
      
      if (gameData.themesUsed.size === 1) checkAchievement('theme-explorer');
      if (gameData.themesUsed.size >= 5) checkAchievement('theme-collector');
      if (gameData.themeChangeCount >= 20) checkAchievement('theme-addict');
      if (theme === 'funkyatlas' || theme === 'funkyatlas-christmas') {
        checkAchievement('funky-fan');
        const creditsPanel = document.createElement('div');
        creditsPanel.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: linear-gradient(135deg, rgba(43,16,85,0.95), rgba(117,151,222,0.95)); padding: 1rem; border-radius: 12px; border: 2px solid #ff4444; z-index: 9999; max-width: 250px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.4);';
        creditsPanel.innerHTML = '<div style="color: white; font-size: 0.9rem;"><strong style="color: #ff4444;">🎨 Tema FunkyAtlas</strong><br><span style="font-size: 0.8rem;">Creado por <a href="https://funkyatlas.abelitogamer.com/" target="_blank" style="color: #7597de; text-decoration: none;">AbelitoGamer</a></span></div>';
        document.body.appendChild(creditsPanel);
        setTimeout(() => creditsPanel.remove(), 5000);
      }
      if (theme === 'legendary') {
        checkAchievement('legendary-hunter');
      }
      
      const allAchievements = Object.keys(achievements);
      const completedAchievements = allAchievements.filter(id => gameData.achievements[id]);
      if (completedAchievements.length === allAchievements.length - 1) {
        checkAchievement('perfectionist');
      }
      
      saveGameData();
    });
  });
  
  const applyCustomBtn = document.getElementById('apply-custom');
  if (applyCustomBtn) {
    applyCustomBtn.addEventListener('click', () => {
      gameData.customColors.bg = document.getElementById('bg-color').value;
      gameData.customColors.text = document.getElementById('text-color').value;
      gameData.customColors.primary = document.getElementById('primary-color').value;
      gameData.customColors.secondary = document.getElementById('secondary-color').value;
      
      applyCustomTheme();
      saveGameData();
      
      showAchievementNotification({ name: 'Colores personalizados aplicados!', points: 0 });
    });
  }
}
