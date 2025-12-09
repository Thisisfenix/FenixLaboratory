// Configuración centralizada del minijuego
class GameConfig {
  constructor() {
    this.version = '2.3.0';
    this.initializeConfig();
  }

  initializeConfig() {
    // Configuración base del juego
    this.gameSettings = {
      // Performance
      targetFPS: 60,
      maxParticles: 50,
      maxBullets: 100,
      enableShadows: true,
      enableScreenShake: true,
      
      // Gameplay
      difficultyMultipliers: {
        easy: { health: 0.7, speed: 0.8, damage: 0.8 },
        normal: { health: 1.0, speed: 1.0, damage: 1.0 },
        hard: { health: 1.3, speed: 1.2, damage: 1.2 },
        impossible: { health: 1.8, speed: 1.4, damage: 1.5 }
      },
      
      // Boss Rush
      bossRushSettings: {
        totalBosses: 4,
        scoreMultipliers: {
          easy: 1.5,
          normal: 2.0,
          hard: 3.0,
          impossible: 6.0
        },
        transitionTime: 2000,
        healBetweenBosses: false
      },
      
      // Power-ups
      powerupSettings: {
        spawnRate: 0.003,
        duration: {
          invincibility: 180,
          bomb: 0,
          speed: 300,
          doubleDamage: 240,
          slowMotion: 300,
          penetrating: 240,
          timeFreeze: 120
        }
      },
      
      // Audio
      audioSettings: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.3,
        enableDynamicMusic: true
      },
      
      // Visual Effects
      visualSettings: {
        particleQuality: 'high', // low, medium, high
        enableBloom: true,
        enableMotionBlur: false,
        screenShakeIntensity: 1.0
      }
    };

    // Configuración específica para móviles
    this.mobileSettings = {
      maxParticles: 20,
      maxBullets: 50,
      enableShadows: false,
      enableScreenShake: true,
      particleQuality: 'medium',
      enableBloom: false,
      controlSensitivity: 1.2,
      hapticFeedback: true
    };

    // Configuración de achievements
    this.achievementSettings = {
      flawless: { points: 1000, icon: '🏆' },
      noDash: { points: 500, icon: '🎯' },
      speedrun: { points: 750, icon: '⚡' },
      comboMaster: { points: 300, icon: '🔥' },
      noHeal: { points: 400, icon: '💪' },
      lightningFast: { points: 1500, icon: '⚡⚡' },
      bossSlayer: { points: 2000, icon: '👑' },
      rushMaster: { points: 3000, icon: '🏃‍♂️' }
    };

    // Configuración de personajes balanceada
    this.characterStats = {
      Angel: {
        speed: 1.15,
        hp: 110,
        damage: 0.95,
        ability: 'angel',
        abilityName: 'Escudo Divino',
        abilityDesc: '110 HP | Bloquea 1 golpe cada 15s',
        bulletColor: '#00f',
        specialty: 'Defensa',
        difficulty: 'Fácil'
      },
      Gissel: {
        speed: 1.35,
        hp: 85,
        damage: 1.0,
        ability: 'gissel',
        abilityName: 'Evasión',
        abilityDesc: '85 HP | Dash más rápido (8s CD)',
        bulletColor: '#ff0',
        specialty: 'Movilidad',
        difficulty: 'Medio'
      },
      iA777: {
        speed: 0.85,
        hp: 130,
        damage: 1.15,
        ability: 'ia777',
        abilityName: 'Tanque',
        abilityDesc: '130 HP | Reduce daño 30%',
        bulletColor: '#a0f',
        specialty: 'Tanque',
        difficulty: 'Fácil'
      },
      Iris: {
        speed: 1.05,
        hp: 100,
        damage: 1.05,
        ability: 'iris',
        abilityName: 'Equilibrio',
        abilityDesc: '100 HP | Regenera 1 HP/2s',
        bulletColor: '#a0f',
        specialty: 'Soporte',
        difficulty: 'Medio'
      },
      Luna: {
        speed: 1.45,
        hp: 75,
        damage: 0.85,
        ability: 'luna',
        abilityName: 'Velocista',
        abilityDesc: '75 HP | Disparo más rápido',
        bulletColor: '#ff0',
        specialty: 'Velocidad',
        difficulty: 'Difícil'
      },
      Molly: {
        speed: 1.0,
        hp: 105,
        damage: 1.25,
        ability: 'molly',
        abilityName: 'Furia',
        abilityDesc: '105 HP | +50% daño bajo 50% HP',
        bulletColor: '#f00',
        specialty: 'Berserker',
        difficulty: 'Difícil'
      },
      ankush: {
        speed: 2.0,
        hp: 999,
        damage: 5.0,
        ability: 'ankush',
        abilityName: 'Ankush',
        abilityDesc: '999 HP | ROTO (Sin leaderboard)',
        bulletColor: '#ff0',
        specialty: 'Cheat',
        difficulty: 'ROTO'
      }
    };

    // Configuración de bosses
    this.bossSettings = {
      abelito: {
        name: 'Abelito Gordo Panzón',
        health: 500,
        phases: 3,
        attacks: ['spread', 'dash', 'fear', 'aimed', 'teleport', 'triple'],
        phaseTransitions: [250, 100]
      },
      anna: {
        name: 'Anna la Loca',
        health: 600,
        phases: 2,
        attacks: ['heart_burst', 'love_spiral', 'rage_wave', 'toxic_rain', 'charm_circle'],
        phaseTransitions: [300]
      },
      devourer: {
        name: 'El Devorador',
        health: 800,
        phases: 3,
        attacks: ['vortex', 'blackhole', 'meteor', 'laser_grid', 'void_rift'],
        phaseTransitions: [500, 200]
      }
    };

    // Aplicar configuración según el dispositivo
    this.applyDeviceOptimizations();
  }

  applyDeviceOptimizations() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const isLowEnd = this.detectLowEndDevice();

    if (isMobile) {
      Object.assign(this.gameSettings, this.mobileSettings);
    }

    if (isLowEnd) {
      this.gameSettings.maxParticles = 10;
      this.gameSettings.maxBullets = 30;
      this.gameSettings.enableShadows = false;
      this.gameSettings.particleQuality = 'low';
      this.gameSettings.enableBloom = false;
      this.gameSettings.targetFPS = 30;
    }
  }

  detectLowEndDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 2 || cores <= 2;
  }

  // Obtener configuración de dificultad
  getDifficultyConfig(difficulty) {
    return this.gameSettings.difficultyMultipliers[difficulty] || 
           this.gameSettings.difficultyMultipliers.normal;
  }

  // Obtener configuración de personaje
  getCharacterConfig(character) {
    return this.characterStats[character] || this.characterStats.Angel;
  }

  // Obtener configuración de boss
  getBossConfig(bossName) {
    return this.bossSettings[bossName] || this.bossSettings.abelito;
  }

  // Obtener configuración de power-up
  getPowerupConfig(powerupType) {
    return {
      duration: this.gameSettings.powerupSettings.duration[powerupType] || 180,
      spawnRate: this.gameSettings.powerupSettings.spawnRate
    };
  }

  // Configuración dinámica basada en performance
  adjustForPerformance(fps) {
    if (fps < 30) {
      this.gameSettings.maxParticles = Math.max(5, this.gameSettings.maxParticles - 5);
      this.gameSettings.enableShadows = false;
      this.gameSettings.particleQuality = 'low';
    } else if (fps > 55) {
      this.gameSettings.maxParticles = Math.min(50, this.gameSettings.maxParticles + 2);
      this.gameSettings.enableShadows = true;
    }
  }

  // Guardar configuración personalizada
  saveCustomConfig(config) {
    try {
      localStorage.setItem('gameConfig', JSON.stringify(config));
    } catch (e) {
      console.warn('No se pudo guardar la configuración:', e);
    }
  }

  // Cargar configuración personalizada
  loadCustomConfig() {
    try {
      const saved = localStorage.getItem('gameConfig');
      if (saved) {
        const config = JSON.parse(saved);
        Object.assign(this.gameSettings, config);
      }
    } catch (e) {
      console.warn('No se pudo cargar la configuración:', e);
    }
  }

  // Resetear a configuración por defecto
  resetToDefaults() {
    this.initializeConfig();
    localStorage.removeItem('gameConfig');
  }

  // Obtener información del sistema
  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      memory: navigator.deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      connection: navigator.connection?.effectiveType || 'unknown',
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio || 1
      }
    };
  }

  // Debug info
  getDebugInfo() {
    return {
      version: this.version,
      gameSettings: this.gameSettings,
      systemInfo: this.getSystemInfo(),
      timestamp: new Date().toISOString()
    };
  }

  // Validar configuración
  validateConfig() {
    const errors = [];
    
    if (this.gameSettings.maxParticles < 1) {
      errors.push('maxParticles debe ser mayor a 0');
    }
    
    if (this.gameSettings.targetFPS < 15 || this.gameSettings.targetFPS > 120) {
      errors.push('targetFPS debe estar entre 15 y 120');
    }
    
    return errors;
  }

  // Exportar configuración
  exportConfig() {
    return {
      version: this.version,
      settings: this.gameSettings,
      exported: new Date().toISOString()
    };
  }

  // Importar configuración
  importConfig(configData) {
    try {
      if (configData.version && configData.settings) {
        Object.assign(this.gameSettings, configData.settings);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importando configuración:', e);
      return false;
    }
  }
}

// Crear instancia global
const gameConfig = new GameConfig();

// Cargar configuración personalizada si existe
gameConfig.loadCustomConfig();

// Exponer globalmente
window.gameConfig = gameConfig;

// Integrar con otros sistemas
if (typeof window !== 'undefined') {
  // Integrar con BossFightEnhancements
  window.addEventListener('load', () => {
    if (window.BossFightEnhancements) {
      BossFightEnhancements.prototype.getCharacterStats = function(character) {
        return gameConfig.getCharacterConfig(character);
      };
    }
  });
}

console.log(`🎮 Game Config v${gameConfig.version} cargado`);
console.log('📊 Configuración actual:', gameConfig.gameSettings);