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
      seasonalEvents: {
        'halloween': { active: false, startDate: '10-01', endDate: '11-01', rewards: { theme: 'halloween', points: 100 } },
        'christmas': { active: false, startDate: '12-01', endDate: '12-31', rewards: { theme: 'christmas', points: 150 } },
        'valentine': { active: false, startDate: '02-10', endDate: '02-20', rewards: { theme: 'valentine', points: 75 } },
        'easter': { active: false, startDate: '03-15', endDate: '04-15', rewards: { theme: 'easter', points: 80 } },
        'summer': { active: false, startDate: '06-01', endDate: '08-31', rewards: { theme: 'summer', points: 120 } },
        'new-year': { active: false, startDate: '12-31', endDate: '01-07', rewards: { points: 200, multiplier: 2 } }
      },
      hiddenProgress: {
        konamiSequence: [],
        devToolsOpened: false,
        matrixTime: 0,
        clickCount: 0,
        scrollCount: 0,
        easterEggsFound: new Set(),
        themeSpeedrunStart: null,
        themeSpeedrunCount: 0
      },
      achievements: {}
    };
  }

  getAchievements() {
    return {
      // Logros básicos
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
      'plushie-collector': { name: 'Coleccionista de Peluches', desc: 'Encuentra los 40 peluches escondidos', points: 500, icon: '🧸' },
      'gissel-fan': { name: 'Fan de Gissel', desc: 'Encuentra los 20 peluches de Gissel', points: 250, icon: '💜' },
      'molly-hunter': { name: 'Cazador de Molly', desc: 'Encuentra los 20 peluches de Molly', points: 250, icon: '🔪' },
      'guestbook-artist': { name: 'Artista del Guestbook', desc: 'Crea 10 dibujos en el guestbook', points: 100, icon: '🎨' },
      'social-butterfly': { name: 'Mariposa Social', desc: 'Visita todas las redes sociales', points: 50, icon: '🦋' },
      'deadly-player': { name: 'Jugador Mortal', desc: 'Juega Deadly Pursuer', points: 75, icon: '🎮' },
      'ankaro-explorer': { name: 'Explorador de Ankaro', desc: 'Entra a Project Ankaro', points: 75, icon: '👻' },
      'comment-king': { name: 'Rey de Comentarios', desc: 'Deja 5 comentarios', points: 50, icon: '💬' },
      'like-master': { name: 'Maestro de Likes', desc: 'Da 20 likes en el guestbook', points: 40, icon: '❤️' },
      'midnight-visitor': { name: 'Visitante de Medianoche', desc: 'Visita exactamente a las 12:00 AM', points: 50, icon: '🌙' },
      'speed-reader': { name: 'Lector Veloz', desc: 'Lee el README completo', points: 30, icon: '📖' },
      'theme-hoarder': { name: 'Acaparador de Temas', desc: 'Desbloquea 15 temas', points: 150, icon: '🎨' },
      'point-millionaire': { name: 'Millonario de Puntos', desc: 'Acumula 10,000 puntos', points: 500, icon: '💰' },
      'loyal-visitor': { name: 'Visitante Leal', desc: 'Visita 50 días diferentes', points: 200, icon: '🏅' },
      'perfectionist': { name: 'Perfeccionista', desc: 'Completa todos los logros', points: 1000, icon: '💯' },
      
      // 🔒 LOGROS OCULTOS (Hidden Achievements)
      'konami-master': { name: '🕹️ Maestro Konami', desc: 'Ingresa el código Konami', points: 100, icon: '🕹️', hidden: true, hint: 'Arriba, Arriba, Abajo, Abajo...' },
      'secret-dev': { name: '👨‍💻 Desarrollador Secreto', desc: 'Abre las herramientas de desarrollador', points: 50, icon: '🔧', hidden: true, hint: 'F12 es tu amigo' },
      'matrix-neo': { name: '🔴 Neo Despertó', desc: 'Usa el tema Matrix por 10 minutos', points: 150, icon: '💊', hidden: true, hint: 'Sigue al conejo blanco...' },
      'time-traveler': { name: '⏰ Viajero del Tiempo', desc: 'Visita en tu cumpleaños', points: 200, icon: '🎂', hidden: true, hint: 'Un día especial del año' },
      'ghost-hunter': { name: '👻 Cazafantasmas', desc: 'Encuentra el easter egg fantasma', points: 300, icon: '👻', hidden: true, hint: 'Boo! Está escondido en algún lugar' },
      'rainbow-seeker': { name: '🌈 Buscador del Arcoíris', desc: 'Usa todos los temas de colores en una sesión', points: 250, icon: '🌈', hidden: true, hint: 'Todos los colores del arcoíris' },
      'midnight-coder': { name: '🌙 Programador Nocturno', desc: 'Programa a las 3:33 AM', points: 333, icon: '🦇', hidden: true, hint: 'La hora del diablo para programadores' },
      'click-master': { name: '🖱️ Maestro del Click', desc: 'Haz 1000 clicks', points: 100, icon: '🖱️', hidden: true, hint: 'Click, click, click...' },
      'scroll-infinity': { name: '♾️ Scroll Infinito', desc: 'Haz scroll 500 veces', points: 75, icon: '♾️', hidden: true, hint: 'Rueda que rueda' },
      'theme-speedrun': { name: '🏃 Speedrun Temas', desc: 'Cambia 10 temas en 30 segundos', points: 200, icon: '🏃', hidden: true, hint: 'Velocidad de la luz' },
      'easter-egg-hunter': { name: '🥚 Cazador de Huevos', desc: 'Encuentra 5 easter eggs', points: 500, icon: '🥚', hidden: true, hint: 'Están por todas partes' },
      'binary-master': { name: '🔢 Maestro Binario', desc: 'Escribe en binario en el guestbook', points: 150, icon: '🔢', hidden: true, hint: '01001000 01101111 01101100 01100001' }
    };
  }

  getDailyChallenges() {
    const challenges = [
      { id: 'visit-morning', desc: 'Visita antes de las 10AM', reward: 20, check: () => new Date().getHours() < 10 },
      { id: 'use-search', desc: 'Busca 3 proyectos', reward: 15, target: 3, current: 0 },
      { id: 'change-theme', desc: 'Cambia de tema 5 veces', reward: 25, target: 5, current: 0 },
      { id: 'scroll-bottom', desc: 'Llega al final de la página', reward: 10, check: () => this.gameData.hasScrolledToBottom },
      { id: 'spend-time', desc: 'Pasa 10 minutos en el sitio', reward: 30, target: 600, current: 0 },
      { id: 'social-visit', desc: 'Visita 2 redes sociales', reward: 25, target: 2, current: 0 },
      { id: 'fast-clicks', desc: 'Haz 50 clicks rápidos', reward: 20, target: 50, current: 0 },
      { id: 'theme-marathon', desc: 'Usa un tema por 30 minutos', reward: 35, target: 1800, current: 0 },
      { id: 'project-deep-dive', desc: 'Ve 10 proyectos', reward: 40, target: 10, current: 0 },
      { id: 'guestbook-visit', desc: 'Visita el guestbook', reward: 15, check: () => window.location.href.includes('guestbook') },
      { id: 'weekend-special', desc: 'Visita en fin de semana', reward: 30, check: () => [0,6].includes(new Date().getDay()) },
      { id: 'night-session', desc: 'Sesión nocturna (9PM-6AM)', reward: 25, check: () => { const h = new Date().getHours(); return h >= 21 || h <= 6; } }
    ];
    
    // Seleccionar 3-5 desafíos aleatorios para hoy
    const today = new Date().toDateString();
    const seed = this.hashCode(today);
    const shuffled = this.shuffleArray([...challenges], seed);
    const dailyCount = 3 + (seed % 3); // 3-5 desafíos
    
    const result = {};
    shuffled.slice(0, dailyCount).forEach(challenge => {
      result[challenge.id] = challenge;
    });
    
    return result;
  }

  getWeeklyChallenges() {
    const challenges = [
      { id: 'theme-explorer', desc: 'Usa 10 temas diferentes', reward: 100, target: 10, current: 0 },
      { id: 'project-master', desc: 'Ve 15 proyectos', reward: 150, target: 15, current: 0 },
      { id: 'search-expert', desc: 'Realiza 20 búsquedas', reward: 80, target: 20, current: 0 },
      { id: 'daily-streak', desc: 'Visita 5 días esta semana', reward: 200, target: 5, current: 0 },
      { id: 'social-butterfly', desc: 'Visita todas las redes sociales', reward: 120, target: 5, current: 0 },
      { id: 'guestbook-artist', desc: 'Crea 3 dibujos en el guestbook', reward: 180, target: 3, current: 0 },
      { id: 'theme-purchaser', desc: 'Compra 2 temas premium', reward: 250, target: 2, current: 0 },
      { id: 'time-master', desc: 'Pasa 2 horas total en el sitio', reward: 300, target: 7200, current: 0 }
    ];
    
    // Seleccionar 2-3 desafíos semanales
    const thisWeek = this.getWeekString(new Date());
    const seed = this.hashCode(thisWeek);
    const shuffled = this.shuffleArray([...challenges], seed);
    const weeklyCount = 2 + (seed % 2); // 2-3 desafíos
    
    const result = {};
    shuffled.slice(0, weeklyCount).forEach(challenge => {
      result[challenge.id] = challenge;
    });
    
    return result;
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

  // Cargar datos guardados con migración
  load() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      this.gameData = { ...this.gameData, ...parsed };
      
      // Migrar datos antiguos
      this.migrateData();
      
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
      
      if (parsed.hiddenProgress && parsed.hiddenProgress.easterEggsFound) {
        this.gameData.hiddenProgress.easterEggsFound = new Set(parsed.hiddenProgress.easterEggsFound);
      }
    }
    this.checkAchievement('first-visit');
  }

  // Migrar datos de versiones anteriores
  migrateData() {
    // Migrar specialEvents a seasonalEvents si existe
    if (this.gameData.specialEvents && !this.gameData.seasonalEvents) {
      // Mantener eventos especiales pero agregar estacionales
      this.gameData.seasonalEvents = this.getDefaultGameData().seasonalEvents;
    }
    
    // Inicializar hiddenProgress si no existe
    if (!this.gameData.hiddenProgress) {
      this.gameData.hiddenProgress = this.getDefaultGameData().hiddenProgress;
    }
  }

  // Guardar datos con Sets convertidos
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
      effectsPurchased: Array.from(this.gameData.effectsPurchased),
      hiddenProgress: {
        ...this.gameData.hiddenProgress,
        easterEggsFound: Array.from(this.gameData.hiddenProgress.easterEggsFound || [])
      }
    };
    localStorage.setItem(this.storageKey, JSON.stringify(toSave));
  }

  // Agregar puntos
  addPoints(points) {
    let finalPoints = points;
    
    // Multiplicadores de eventos
    if (this.gameData.specialEvents && this.gameData.specialEvents['double-points'] && this.gameData.specialEvents['double-points'].active) {
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
      this.gameData.achievements[id] = {
        unlocked: true,
        date: new Date().toISOString(),
        timestamp: Date.now()
      };
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
    if (!challenge) return;
    
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
    // Initialize specialEvents if it doesn't exist
    if (!this.gameData.specialEvents) {
      this.gameData.specialEvents = {
        'double-points': { active: false, endTime: null, multiplier: 2 },
        'theme-festival': { active: false, endTime: null, discount: 50 },
        'streak-boost': { active: false, endTime: null, bonus: 10 }
      };
    }
    
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

  // Utilidades para desafíos aleatorios
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  shuffleArray(array, seed) {
    const rng = this.seededRandom(seed);
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Sistema de eventos estacionales
  checkSeasonalEvents() {
    const now = new Date();
    const currentDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    Object.entries(this.gameData.seasonalEvents).forEach(([eventId, event]) => {
      const isInSeason = this.isDateInRange(currentDate, event.startDate, event.endDate);
      
      if (isInSeason && !event.active) {
        this.activateSeasonalEvent(eventId);
      } else if (!isInSeason && event.active) {
        this.deactivateSeasonalEvent(eventId);
      }
    });
  }

  isDateInRange(current, start, end) {
    // Handle year-crossing events (like New Year)
    if (start > end) {
      return current >= start || current <= end;
    }
    return current >= start && current <= end;
  }

  activateSeasonalEvent(eventId) {
    const event = this.gameData.seasonalEvents[eventId];
    event.active = true;
    
    // Auto-unlock seasonal theme
    if (event.rewards.theme) {
      this.gameData.unlockedThemes.add(event.rewards.theme);
    }
    
    // Give seasonal points
    if (event.rewards.points) {
      this.addPoints(event.rewards.points);
    }
    
    const eventNames = {
      'halloween': '🎃 Halloween',
      'christmas': '🎄 Navidad',
      'valentine': '💕 San Valentín',
      'easter': '🐰 Pascua',
      'summer': '☀️ Verano',
      'new-year': '🎆 Año Nuevo'
    };
    
    this.showNotification({
      name: `🎉 Evento ${eventNames[eventId]} activado!`,
      points: event.rewards.points || 0,
      icon: '🎉'
    });
    
    this.save();
  }

  deactivateSeasonalEvent(eventId) {
    this.gameData.seasonalEvents[eventId].active = false;
    this.save();
  }

  // Sistema de logros ocultos
  checkHiddenAchievements() {
    // Konami Code
    if (this.gameData.hiddenProgress.konamiSequence.join(',') === '38,38,40,40,37,39,37,39,66,65') {
      this.checkAchievement('konami-master');
    }
    
    // Dev Tools
    if (this.gameData.hiddenProgress.devToolsOpened) {
      this.checkAchievement('secret-dev');
    }
    
    // Matrix theme time
    if (this.gameData.hiddenProgress.matrixTime >= 600000) { // 10 minutes
      this.checkAchievement('matrix-neo');
    }
    
    // Click master
    if (this.gameData.hiddenProgress.clickCount >= 1000) {
      this.checkAchievement('click-master');
    }
    
    // Scroll infinity
    if (this.gameData.hiddenProgress.scrollCount >= 500) {
      this.checkAchievement('scroll-infinity');
    }
    
    // Easter eggs
    if (this.gameData.hiddenProgress.easterEggsFound.size >= 5) {
      this.checkAchievement('easter-egg-hunter');
    }
    
    // Theme speedrun
    if (this.gameData.hiddenProgress.themeSpeedrunCount >= 10) {
      const timeDiff = Date.now() - this.gameData.hiddenProgress.themeSpeedrunStart;
      if (timeDiff <= 30000) { // 30 seconds
        this.checkAchievement('theme-speedrun');
      }
    }
  }

  // Detectar código Konami
  addKonamiKey(keyCode) {
    this.gameData.hiddenProgress.konamiSequence.push(keyCode);
    if (this.gameData.hiddenProgress.konamiSequence.length > 10) {
      this.gameData.hiddenProgress.konamiSequence.shift();
    }
    this.checkHiddenAchievements();
    this.save();
  }

  // Detectar herramientas de desarrollador
  detectDevTools() {
    this.gameData.hiddenProgress.devToolsOpened = true;
    this.checkHiddenAchievements();
    this.save();
  }

  // Rastrear tiempo en tema Matrix
  trackMatrixTime(duration) {
    this.gameData.hiddenProgress.matrixTime += duration;
    this.checkHiddenAchievements();
    this.save();
  }

  // Incrementar contador de clicks
  incrementClicks() {
    this.gameData.hiddenProgress.clickCount++;
    this.checkHiddenAchievements();
  }

  // Incrementar contador de scroll
  incrementScroll() {
    this.gameData.hiddenProgress.scrollCount++;
    this.checkHiddenAchievements();
  }

  // Encontrar easter egg
  findEasterEgg(eggId) {
    this.gameData.hiddenProgress.easterEggsFound.add(eggId);
    this.checkHiddenAchievements();
    this.save();
  }

  // Iniciar speedrun de temas
  startThemeSpeedrun() {
    this.gameData.hiddenProgress.themeSpeedrunStart = Date.now();
    this.gameData.hiddenProgress.themeSpeedrunCount = 0;
  }

  // Incrementar contador de speedrun
  incrementThemeSpeedrun() {
    if (this.gameData.hiddenProgress.themeSpeedrunStart) {
      this.gameData.hiddenProgress.themeSpeedrunCount++;
      this.checkHiddenAchievements();
    }
  }

  // Obtener pistas de logros ocultos
  getHiddenAchievementHints() {
    const hints = [];
    Object.entries(this.achievements).forEach(([id, achievement]) => {
      if (achievement.hidden && !this.gameData.achievements[id] && achievement.hint) {
        hints.push({ id, hint: achievement.hint, icon: achievement.icon });
      }
    });
    return hints;
  }

  // Obtener título según nivel
  getTitle() {
    if (this.gameData.level >= 20) return '👑 Leyenda';
    if (this.gameData.level >= 15) return '🏆 Maestro';
    if (this.gameData.level >= 10) return '⭐ Veterano';
    if (this.gameData.level >= 5) return '🌟 Explorador';
    return '🔰 Novato';
  }

  // Inicializar sistema completo
  init() {
    this.load();
    this.checkDailyVisit();
    this.checkSeasonalEvents();
    this.setupEventListeners();
    
    // Check special time-based achievements
    this.checkTimeBasedAchievements();
    
    // Start session tracking
    this.sessionStart = Date.now();
    this.sessionAchievements = 0;
  }

  // Configurar event listeners para logros ocultos
  setupEventListeners() {
    // Konami code detection
    document.addEventListener('keydown', (e) => {
      this.addKonamiKey(e.keyCode);
    });

    // Dev tools detection
    let devtools = { open: false, orientation: null };
    const threshold = 160;
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.detectDevTools();
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Click tracking
    document.addEventListener('click', () => {
      this.incrementClicks();
    });

    // Scroll tracking
    document.addEventListener('scroll', () => {
      this.incrementScroll();
    });

    // Birthday detection (if user sets birthday)
    if (this.gameData.birthday) {
      const today = new Date();
      const birthday = new Date(this.gameData.birthday);
      if (today.getMonth() === birthday.getMonth() && 
          today.getDate() === birthday.getDate()) {
        this.checkAchievement('time-traveler');
      }
    }
  }

  // Verificar logros basados en tiempo
  checkTimeBasedAchievements() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Midnight visitor (exactly 12:00 AM)
    if (hour === 0 && minute === 0) {
      this.checkAchievement('midnight-visitor');
    }
    
    // Midnight coder (3:33 AM)
    if (hour === 3 && minute === 33) {
      this.checkAchievement('midnight-coder');
    }
    
    // Early bird
    if (hour < 7) {
      this.checkAchievement('early-bird');
    }
    
    // Night owl
    if (hour >= 0 && hour < 6) {
      this.checkAchievement('night-owl');
    }
  }

  // Verificar combo de logros en sesión
  checkComboAchievements() {
    this.sessionAchievements++;
    if (this.sessionAchievements >= 5) {
      this.checkAchievement('combo-master');
    }
  }

  // Override del método checkAchievement para combos
  checkAchievement(id) {
    const wasUnlocked = this.baseCheckAchievement(id);
    if (wasUnlocked) {
      this.checkComboAchievements();
    }
    return wasUnlocked;
  }

  // Método base para verificar logros
  baseCheckAchievement(id) {
    if (!this.gameData.achievements[id] && this.achievements[id]) {
      this.gameData.achievements[id] = {
        unlocked: true,
        date: new Date().toISOString(),
        timestamp: Date.now()
      };
      this.addPoints(this.achievements[id].points);
      this.showNotification(this.achievements[id]);
      this.save();
      return true;
    }
    return false;
  }

  // Obtener estadísticas del sistema
  getStats() {
    const totalAchievements = Object.keys(this.achievements).length;
    const unlockedAchievements = Object.keys(this.gameData.achievements).length;
    const hiddenUnlocked = Object.entries(this.achievements)
      .filter(([id, ach]) => ach.hidden && this.gameData.achievements[id]).length;
    const totalHidden = Object.values(this.achievements)
      .filter(ach => ach.hidden).length;
    
    return {
      level: this.gameData.level,
      points: this.gameData.points,
      streak: this.gameData.streak,
      achievements: {
        total: totalAchievements,
        unlocked: unlockedAchievements,
        percentage: Math.round((unlockedAchievements / totalAchievements) * 100)
      },
      hidden: {
        total: totalHidden,
        unlocked: hiddenUnlocked,
        percentage: totalHidden > 0 ? Math.round((hiddenUnlocked / totalHidden) * 100) : 0
      },
      challenges: {
        daily: this.gameData.completedChallenges,
        weekly: this.gameData.completedWeeklyChallenges
      }
    };
  }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AchievementSystem;
} else {
  window.AchievementSystem = AchievementSystem;
}
