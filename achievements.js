// 🎮 SISTEMA DE LOGROS Y GAMIFICACIÓN - FenixLaboratory
// Puede ser usado en cualquier página web

class AchievementSystem {
  constructor(storageKey = 'fenix-lab-game') {
    this.storageKey = storageKey;
    this.gameData = this.getDefaultGameData();
    this.achievements = this.getAchievements();
    this.dailyChallenges = this.getDailyChallenges();
    this.weeklyChallenges = this.getWeeklyChallenges();
    this.premiumThemes = this.getPremiumThemes();
    this.cursors = this.getCursors();
    this.premiumEffects = this.getPremiumEffects();
  }

  getDefaultGameData() {
    return {
      points: 0,
      timeOnSite: 0,
      themesUsed: new Set(),
      projectsViewed: new Set(),
      unlockedThemes: new Set(['dark', 'light', 'neon', 'cyberpunk', 'matrix', 'synthwave', 'ocean', 'forest', 'sunset', 'christmas', 'halloween', 'valentine', 'easter', 'summer', 'autumn', 'funkyatlas', 'funkyatlas-christmas']),
      visitedSocials: new Set(),
      browsersUsed: new Set(),
      demosTested: new Set(),
      codeViewed: new Set(),
      effectsPurchased: new Set(),
      customColors: { bg: '#1a1a1a', text: '#f0f0f0', primary: '#ff6b35', secondary: '#f7931e' },
      autoSeasonalThemes: true,
      pushNotifications: true,
      autoDayNight: false,
      streak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,
      lastVisit: null,
      lastWeeklyVisit: null,
      lastMonthlyVisit: null,
      hasScrolledToBottom: false,
      searchCount: 0,
      filterCount: 0,
      activeCursor: 'default',
      unlockedCursors: new Set(['default']),
      themeChangeCount: 0,
      clickCount: 0,
      lastClickTime: 0,
      fastClicks: 0,
      weekendVisits: { saturday: false, sunday: false },
      dailyChallenges: {},
      weeklyChallenges: {},
      completedChallenges: 0,
      completedWeeklyChallenges: 0,
      activeEffects: {},
      leaderboardName: '',
      githubStats: { followers: 0, repos: 0, stars: 0 },
      installSource: 'web',
      lastSyncTime: 0,
      badges: {
        'explorer': { unlocked: false, category: 'exploration', level: 0, maxLevel: 5 },
        'collector': { unlocked: false, category: 'collection', level: 0, maxLevel: 10 },
        'social': { unlocked: false, category: 'social', level: 0, maxLevel: 3 },
        'developer': { unlocked: false, category: 'development', level: 0, maxLevel: 7 },
        'time-warrior': { unlocked: false, category: 'time', level: 0, maxLevel: 5 },
        'theme-master': { unlocked: false, category: 'customization', level: 0, maxLevel: 8 },
        'streak-legend': { unlocked: false, category: 'consistency', level: 0, maxLevel: 10 },
        'challenge-champion': { unlocked: false, category: 'challenges', level: 0, maxLevel: 5 }
      },
      level: 1,
      experience: 0,
      experienceToNext: 100,
      levelBenefits: {
        2: { type: 'discount', value: 5, desc: '5% descuento en temas premium' },
        5: { type: 'bonus', value: 2, desc: 'Doble puntos los fines de semana' },
        10: { type: 'unlock', value: 'exclusive-themes', desc: 'Acceso a temas exclusivos' },
        15: { type: 'multiplier', value: 1.5, desc: '50% más puntos por logros' },
        20: { type: 'unlock', value: 'beta-features', desc: 'Acceso a funciones beta' }
      },
      specialEvents: {
        'double-points': { active: false, endTime: null, multiplier: 2 },
        'theme-festival': { active: false, endTime: null, discount: 50 },
        'streak-boost': { active: false, endTime: null, bonus: 10 }
      },
      achievements: {}
    };
  }

  getAchievements() {
    return {
      'first-visit': { name: 'Primera Visita', desc: 'Bienvenido al laboratorio', points: 10, icon: '🎉' },
      'theme-explorer': { name: 'Explorador de Temas', desc: 'Cambia de tema por primera vez', points: 15, icon: '🎨' },
      'project-hunter': { name: 'Cazador de Proyectos', desc: 'Ve 5 proyectos diferentes', points: 25, icon: '🔍' },
      'time-master': { name: 'Maestro del Tiempo', desc: 'Pasa 5 minutos en el sitio', points: 30, icon: '⏰' },
      'theme-collector': { name: 'Coleccionista', desc: 'Prueba 5 temas diferentes', points: 50, icon: '🌈' },
      'funky-fan': { name: 'Fan de FunkyAtlas', desc: 'Usa el tema FunkyAtlas', points: 20, icon: '🎵' },
      'big-spender': { name: 'Gran Gastador', desc: 'Compra tu primer tema premium', points: 25, icon: '💰' },
      'premium-collector': { name: 'Coleccionista Premium', desc: 'Desbloquea todos los temas premium', points: 100, icon: '💎' },
      'streak-starter': { name: 'Comenzando la Racha', desc: 'Visita 3 días consecutivos', points: 30, icon: '🔥' },
      'streak-master': { name: 'Maestro de la Constancia', desc: 'Visita 7 días consecutivos', points: 70, icon: '🏆' },
      'streak-legend': { name: 'Leyenda Imparable', desc: 'Visita 30 días consecutivos', points: 300, icon: '👑' },
      'scroll-master': { name: 'Explorador Completo', desc: 'Llega hasta el final de la página', points: 5, icon: '📜' },
      'search-explorer': { name: 'Buscador Activo', desc: 'Usa la búsqueda 5 veces', points: 15, icon: '🔍' },
      'filter-expert': { name: 'Experto en Filtros', desc: 'Cambia filtros 10 veces', points: 20, icon: '🎨' },
      'night-owl': { name: 'Búho Nocturno', desc: 'Visita entre 12AM-6AM', points: 25, icon: '🦉' },
      'speed-demon': { name: 'Demonio Veloz', desc: 'Navega súper rápido (5 clicks en 3s)', points: 30, icon: '⚡' },
      'theme-addict': { name: 'Adicto a Temas', desc: 'Cambia tema 20 veces', points: 40, icon: '🎭' },
      'early-bird': { name: 'Madrugador', desc: 'Visita antes de las 7AM', points: 20, icon: '🐦' },
      'weekend-warrior': { name: 'Guerrero de Fin de Semana', desc: 'Visita en sábado y domingo', points: 35, icon: '🏖️' },
      'legendary-hunter': { name: 'Cazador Legendario', desc: 'Desbloquea el tema Legendario', points: 200, icon: '🏹' },
      'challenge-master': { name: 'Maestro de Desafíos', desc: 'Completa 10 desafíos diarios', points: 100, icon: '🎯' },
      'badge-collector': { name: 'Coleccionista de Medallas', desc: 'Desbloquea 5 badges diferentes', points: 150, icon: '🏅' },
      'level-master': { name: 'Maestro de Niveles', desc: 'Alcanza el nivel 10', points: 200, icon: '🏆' },
      'event-participant': { name: 'Participante de Eventos', desc: 'Participa en un evento especial', points: 75, icon: '🎪' },
      'weekly-warrior': { name: 'Guerrero Semanal', desc: 'Mantén racha semanal por 4 semanas', points: 120, icon: '📅' },
      'monthly-champion': { name: 'Campeón Mensual', desc: 'Mantén racha mensual por 3 meses', points: 300, icon: '🗓️' },
      'combo-master': { name: 'Maestro de Combos', desc: 'Consigue 5 logros en una sesión', points: 100, icon: '🔥' },
      'perfectionist': { name: 'Perfeccionista', desc: 'Completa todos los logros', points: 1000, icon: '💯' }
    };
  }

  getDailyChallenges() {
    return {
      'visit-morning': { desc: 'Visita antes de las 10AM', reward: 20, check: () => new Date().getHours() < 10 },
      'use-search': { desc: 'Busca 3 proyectos', reward: 15, target: 3, current: 0 },
      'change-theme': { desc: 'Cambia de tema 5 veces', reward: 25, target: 5, current: 0 },
      'scroll-bottom': { desc: 'Llega al final de la página', reward: 10, check: () => this.gameData.hasScrolledToBottom },
      'spend-time': { desc: 'Pasa 10 minutos en el sitio', reward: 30, target: 600, current: 0 }
    };
  }

  getWeeklyChallenges() {
    return {
      'theme-explorer': { desc: 'Usa 10 temas diferentes esta semana', reward: 100, target: 10, current: 0 },
      'project-master': { desc: 'Ve 15 proyectos esta semana', reward: 150, target: 15, current: 0 },
      'search-expert': { desc: 'Realiza 20 búsquedas esta semana', reward: 80, target: 20, current: 0 }
    };
  }

  getPremiumThemes() {
    return {
      'galaxy': { cost: 100, name: 'Galaxia' },
      'gold': { cost: 150, name: 'Oro' },
      'rainbow': { cost: 200, name: 'Arcoíris' },
      'diamond': { cost: 300, name: 'Diamante' },
      'legendary': { cost: 5000, name: 'Legendario' }
    };
  }

  getCursors() {
    return {
      'default': { cost: 0, name: 'Normal', css: 'auto' },
      'neon': { cost: 50, name: 'Neón', css: 'crosshair' },
      'fire': { cost: 75, name: 'Fuego', css: 'pointer' },
      'diamond': { cost: 100, name: 'Diamante', css: 'help' }
    };
  }

  getPremiumEffects() {
    return {
      'matrix-rain': { cost: 300, name: 'Lluvia Matrix', duration: 30000 },
      'mouse-particles': { cost: 200, name: 'Partículas Mouse', duration: 60000 }
    };
  }

  // Cargar datos guardados
  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.gameData = { ...this.gameData, ...parsed };
      // Convertir arrays a Sets
      this.gameData.themesUsed = new Set(parsed.themesUsed || []);
      this.gameData.projectsViewed = new Set(parsed.projectsViewed || []);
      this.gameData.unlockedThemes = new Set(parsed.unlockedThemes || this.gameData.unlockedThemes);
      this.gameData.unlockedCursors = new Set(parsed.unlockedCursors || ['default']);
      this.gameData.visitedSocials = new Set(parsed.visitedSocials || []);
      this.gameData.browsersUsed = new Set(parsed.browsersUsed || []);
      this.gameData.demosTested = new Set(parsed.demosTested || []);
      this.gameData.codeViewed = new Set(parsed.codeViewed || []);
      this.gameData.effectsPurchased = new Set(parsed.effectsPurchased || []);
    }
    this.checkAchievement('first-visit');
  }

  // Guardar datos
  save() {
    const toSave = {
      ...this.gameData,
      themesUsed: Array.from(this.gameData.themesUsed),
      projectsViewed: Array.from(this.gameData.projectsViewed),
      unlockedThemes: Array.from(this.gameData.unlockedThemes),
      unlockedCursors: Array.from(this.gameData.unlockedCursors),
      visitedSocials: Array.from(this.gameData.visitedSocials),
      browsersUsed: Array.from(this.gameData.browsersUsed),
      demosTested: Array.from(this.gameData.demosTested),
      codeViewed: Array.from(this.gameData.codeViewed),
      effectsPurchased: Array.from(this.gameData.effectsPurchased)
    };
    localStorage.setItem(this.storageKey, JSON.stringify(toSave));
  }

  // Agregar puntos
  addPoints(points) {
    let finalPoints = points;
    
    // Multiplicadores de eventos
    if (this.gameData.specialEvents['double-points'].active) {
      finalPoints *= this.gameData.specialEvents['double-points'].multiplier;
    }
    
    // Beneficios de nivel
    const levelBenefit = this.gameData.levelBenefits[this.gameData.level];
    if (levelBenefit && levelBenefit.type === 'multiplier') {
      finalPoints *= levelBenefit.value;
    }
    
    this.gameData.points += finalPoints;
    this.gameData.experience += Math.floor(finalPoints / 2);
    
    this.checkLevelUp();
    this.save();
    
    return finalPoints;
  }

  // Verificar subida de nivel
  checkLevelUp() {
    while (this.gameData.experience >= this.gameData.experienceToNext) {
      this.gameData.experience -= this.gameData.experienceToNext;
      this.gameData.level += 1;
      this.gameData.experienceToNext = Math.floor(this.gameData.experienceToNext * 1.2);
      
      this.showNotification({
        name: `🎆 ¡Nivel ${this.gameData.level} alcanzado!`,
        points: this.gameData.level * 10
      });
      
      if (this.gameData.level === 10) this.checkAchievement('level-master');
      this.addPoints(this.gameData.level * 10);
    }
  }

  // Verificar logro
  checkAchievement(id) {
    if (!this.gameData.achievements[id] && this.achievements[id]) {
      this.gameData.achievements[id] = true;
      this.addPoints(this.achievements[id].points);
      this.showNotification(this.achievements[id]);
      this.save();
      return true;
    }
    return false;
  }

  // Mostrar notificación (debe ser implementado en la página)
  showNotification(achievement) {
    const event = new CustomEvent('achievement-unlocked', { 
      detail: achievement 
    });
    window.dispatchEvent(event);
  }

  // Verificar visita diaria
  checkDailyVisit() {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (this.gameData.lastVisit === today) return;
    
    if (this.gameData.lastVisit === yesterday) {
      this.gameData.streak += 1;
      const streakPoints = Math.min(this.gameData.streak * 10, 100);
      this.addPoints(streakPoints);
      
      if (this.gameData.streak === 3) this.checkAchievement('streak-starter');
      if (this.gameData.streak === 7) this.checkAchievement('streak-master');
      if (this.gameData.streak === 30) this.checkAchievement('streak-legend');
    } else if (this.gameData.lastVisit) {
      this.gameData.streak = 1;
      this.addPoints(10);
    } else {
      this.gameData.streak = 1;
      this.addPoints(10);
    }
    
    this.gameData.lastVisit = today;
    this.save();
  }

  // Obtener puntos actuales
  getPoints() {
    return this.gameData.points;
  }

  // Obtener nivel actual
  getLevel() {
    return this.gameData.level;
  }

  // Obtener racha actual
  getStreak() {
    return this.gameData.streak;
  }

  // Actualizar progreso de badge
  updateBadgeProgress(badgeId, progress) {
    const badge = this.gameData.badges[badgeId];
    if (!badge || badge.level >= badge.maxLevel) return;
    
    badge.level += progress;
    if (badge.level >= badge.maxLevel) {
      badge.unlocked = true;
      this.showNotification({
        name: `🏅 Badge ${badgeId} maximizado!`,
        points: 50,
        icon: '🏅'
      });
      this.addPoints(50);
      
      const unlockedBadges = Object.values(this.gameData.badges).filter(b => b.unlocked).length;
      if (unlockedBadges >= 5) this.checkAchievement('badge-collector');
    }
    this.save();
  }

  // Actualizar desafío diario
  updateChallenge(challengeId, increment = 1) {
    const today = new Date().toDateString();
    const challenge = this.dailyChallenges[challengeId];
    
    if (!this.gameData.dailyChallenges[today]) {
      this.gameData.dailyChallenges[today] = {};
    }
    
    if (!this.gameData.dailyChallenges[today][challengeId]) {
      this.gameData.dailyChallenges[today][challengeId] = { completed: false, progress: 0 };
    }
    
    const progress = this.gameData.dailyChallenges[today][challengeId];
    
    if (!progress.completed) {
      progress.progress += increment;
      if (challenge.target && progress.progress >= challenge.target) {
        this.completeChallenge(challengeId);
      } else if (challenge.check && challenge.check()) {
        this.completeChallenge(challengeId);
      }
      this.save();
    }
  }

  // Completar desafío
  completeChallenge(challengeId) {
    const today = new Date().toDateString();
    const challenge = this.dailyChallenges[challengeId];
    this.gameData.dailyChallenges[today][challengeId].completed = true;
    this.gameData.completedChallenges++;
    this.addPoints(challenge.reward);
    
    if (this.gameData.completedChallenges >= 10) {
      this.checkAchievement('challenge-master');
    }
    
    this.showNotification({ name: `Desafío completado: ${challenge.desc}`, points: challenge.reward, icon: '🎯' });
    this.save();
  }

  // Actualizar desafío semanal
  updateWeeklyChallenge(challengeId, increment = 1) {
    const thisWeek = this.getWeekString(new Date());
    const challenge = this.weeklyChallenges[challengeId];
    if (!challenge) return;
    
    if (!this.gameData.weeklyChallenges[thisWeek]) {
      this.gameData.weeklyChallenges[thisWeek] = {};
    }
    
    if (!this.gameData.weeklyChallenges[thisWeek][challengeId]) {
      this.gameData.weeklyChallenges[thisWeek][challengeId] = { completed: false, progress: 0 };
    }
    
    const progress = this.gameData.weeklyChallenges[thisWeek][challengeId];
    
    if (!progress.completed) {
      progress.progress += increment;
      if (progress.progress >= challenge.target) {
        this.completeWeeklyChallenge(challengeId);
      }
      this.save();
    }
  }

  // Completar desafío semanal
  completeWeeklyChallenge(challengeId) {
    const thisWeek = this.getWeekString(new Date());
    const challenge = this.weeklyChallenges[challengeId];
    this.gameData.weeklyChallenges[thisWeek][challengeId].completed = true;
    this.gameData.completedWeeklyChallenges++;
    this.addPoints(challenge.reward);
    
    this.showNotification({ name: `🏆 Desafío semanal: ${challenge.desc}`, points: challenge.reward, icon: '🏆' });
    this.save();
  }

  // Obtener string de semana
  getWeekString(date) {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    return `${year}-W${week}`;
  }

  // Comprar tema premium
  buyTheme(theme, cost) {
    if (this.gameData.points >= cost && !this.gameData.unlockedThemes.has(theme)) {
      this.gameData.points -= cost;
      this.gameData.unlockedThemes.add(theme);
      
      if (Object.keys(this.premiumThemes).every(t => this.gameData.unlockedThemes.has(t))) {
        this.checkAchievement('premium-collector');
      }
      if (!this.gameData.achievements['big-spender']) {
        this.checkAchievement('big-spender');
      }
      
      this.showNotification({ name: `Tema ${this.premiumThemes[theme].name} desbloqueado!`, points: 0, icon: '🎨' });
      this.save();
      return true;
    }
    return false;
  }

  // Comprar cursor
  buyCursor(cursor, cost) {
    if (this.gameData.points >= cost && !this.gameData.unlockedCursors.has(cursor)) {
      this.gameData.points -= cost;
      this.gameData.unlockedCursors.add(cursor);
      this.showNotification({ name: `Cursor ${this.cursors[cursor].name} desbloqueado!`, points: 0, icon: '🖱️' });
      this.save();
      return true;
    }
    return false;
  }

  // Activar evento especial
  activateSpecialEvent(eventId, duration = 3600000) {
    const event = this.gameData.specialEvents[eventId];
    if (!event) return;
    
    event.active = true;
    event.endTime = Date.now() + duration;
    
    const eventNames = {
      'double-points': '🔥 Doble Puntos',
      'theme-festival': '🎆 Festival de Temas',
      'streak-boost': '⚡ Boost de Racha'
    };
    
    this.showNotification({
      name: `🎪 Evento: ${eventNames[eventId]} activado!`,
      points: 0,
      icon: '🎪'
    });
    
    this.checkAchievement('event-participant');
    
    setTimeout(() => {
      event.active = false;
      event.endTime = null;
      this.save();
    }, duration);
    
    this.save();
  }

  // Obtener título según nivel
  getTitle() {
    if (this.gameData.level >= 20) return '👑 Leyenda';
    if (this.gameData.level >= 15) return '🏆 Maestro';
    if (this.gameData.level >= 10) return '⭐ Veterano';
    if (this.gameData.level >= 5) return '🌟 Explorador';
    return '🔰 Novato';
  }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AchievementSystem;
} else {
  window.AchievementSystem = AchievementSystem;
}
