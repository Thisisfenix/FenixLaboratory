class DiscordFriendsGameModes {
    constructor(game) {
        this.game = game;
        this.currentMode = 'classic';
        this.modeData = {};
    }

    // Modos disponibles
    getModes() {
        return {
            classic: {
                name: 'Clásico',
                description: 'Modo estándar: Survivors vs Killer',
                icon: '⚔️',
                minPlayers: 2,
                maxPlayers: 8,
                survivorRatio: 0.75
            },
            escape: {
                name: 'Escape',
                description: 'Survivors deben escapar por el anillo dorado',
                icon: '🏃',
                minPlayers: 2,
                maxPlayers: 8,
                survivorRatio: 0.75,
                escapeRingEnabled: true
            },
            deathmatch: {
                name: 'Deathmatch',
                description: 'Todos contra todos, último en pie gana',
                icon: '💀',
                minPlayers: 3,
                maxPlayers: 8,
                freeForAll: true
            },
            infection: {
                name: 'Infección',
                description: 'Survivors infectados se convierten en killers',
                icon: '🦠',
                minPlayers: 3,
                maxPlayers: 8,
                survivorRatio: 0.85,
                infectionEnabled: true
            },
            juggernaut: {
                name: 'Juggernaut',
                description: '1 Killer super poderoso vs todos los Survivors',
                icon: '👹',
                minPlayers: 3,
                maxPlayers: 8,
                survivorRatio: 0.85,
                killerBuffs: {
                    hpMultiplier: 2.5,
                    damageMultiplier: 1.5,
                    speedMultiplier: 1.2
                }
            },
            hide_and_seek: {
                name: 'Escondidas',
                description: 'Survivors se esconden, Killer tiene visión limitada',
                icon: '🙈',
                minPlayers: 3,
                maxPlayers: 8,
                survivorRatio: 0.75,
                limitedVision: true,
                hideTime: 30
            }
        };
    }

    // Inicializar modo de juego
    initializeMode(modeName) {
        this.currentMode = modeName;
        const modes = this.getModes();
        const mode = modes[modeName];

        if (!mode) {
            console.error(`Modo ${modeName} no existe`);
            return false;
        }

        console.log(`🎮 Iniciando modo: ${mode.name}`);
        this.modeData = { ...mode };

        // Configuraciones específicas por modo
        switch(modeName) {
            case 'escape':
                this.setupEscapeMode();
                break;
            case 'deathmatch':
                this.setupDeathmatchMode();
                break;
            case 'infection':
                this.setupInfectionMode();
                break;
            case 'juggernaut':
                this.setupJuggernautMode();
                break;
            case 'hide_and_seek':
                this.setupHideAndSeekMode();
                break;
            default:
                this.setupClassicMode();
        }

        return true;
    }

    // Modo Clásico
    setupClassicMode() {
        console.log('⚔️ Modo Clásico activado');
        // Configuración estándar del juego
    }

    // Modo Escape
    setupEscapeMode() {
        console.log('🏃 Modo Escape activado');
        this.modeData.escapeRingTimer = 120; // 2 minutos para que aparezca
        this.modeData.escapeRingActive = false;
        
        // Programar aparición del anillo
        setTimeout(() => {
            if (this.game.gameStarted && !this.game.gameEnded) {
                this.game.mapSystem.showEscapeRing();
                this.modeData.escapeRingActive = true;
                console.log('🔵 Anillo de escape apareció!');
            }
        }, this.modeData.escapeRingTimer * 1000);
    }

    // Modo Deathmatch
    setupDeathmatchMode() {
        console.log('💀 Modo Deathmatch activado');
        this.modeData.kills = {};
        this.modeData.freeForAll = true;
        
        // Todos los jugadores pueden atacarse entre sí
        Object.values(this.game.players).forEach(player => {
            player.canAttackAll = true;
            this.modeData.kills[player.id] = 0;
        });
    }

    // Modo Infección
    setupInfectionMode() {
        console.log('🦠 Modo Infección activado');
        this.modeData.infected = [];
        this.modeData.originalKiller = null;
        
        // Marcar killer original
        const killer = Object.values(this.game.players).find(p => p.role === 'killer');
        if (killer) {
            this.modeData.originalKiller = killer.id;
            this.modeData.infected.push(killer.id);
        }
    }

    // Modo Juggernaut
    setupJuggernautMode() {
        console.log('👹 Modo Juggernaut activado');
        
        // Buffear al killer
        const killer = Object.values(this.game.players).find(p => p.role === 'killer');
        if (killer) {
            killer.maxHealth = killer.maxHealth * this.modeData.killerBuffs.hpMultiplier;
            killer.health = killer.maxHealth;
            killer.damageMultiplier = this.modeData.killerBuffs.damageMultiplier;
            killer.speed = killer.speed * this.modeData.killerBuffs.speedMultiplier;
            killer.isJuggernaut = true;
            
            console.log(`👹 ${killer.name} es el Juggernaut! HP: ${killer.maxHealth}`);
        }
    }

    // Modo Escondidas
    setupHideAndSeekMode() {
        console.log('🙈 Modo Escondidas activado');
        this.modeData.hidePhase = true;
        this.modeData.hideTimeRemaining = this.modeData.hideTime;
        
        // Congelar al killer durante el tiempo de escondite
        const killer = Object.values(this.game.players).find(p => p.role === 'killer');
        if (killer) {
            killer.frozen = true;
            killer.visionRadius = 300; // Visión limitada
        }
        
        // Countdown para fase de escondite
        const hideInterval = setInterval(() => {
            this.modeData.hideTimeRemaining--;
            
            if (this.modeData.hideTimeRemaining <= 0) {
                clearInterval(hideInterval);
                this.modeData.hidePhase = false;
                if (killer) {
                    killer.frozen = false;
                }
                console.log('🔍 ¡Fase de búsqueda iniciada!');
            }
        }, 1000);
    }

    // Manejar muerte de jugador según modo
    handlePlayerDeath(victim, attacker) {
        switch(this.currentMode) {
            case 'deathmatch':
                if (attacker) {
                    this.modeData.kills[attacker.id]++;
                    console.log(`💀 ${attacker.name}: ${this.modeData.kills[attacker.id]} kills`);
                }
                break;
                
            case 'infection':
                if (victim.role === 'survivor' && attacker && attacker.role === 'killer') {
                    // Convertir survivor en killer infectado
                    victim.role = 'killer';
                    victim.infected = true;
                    victim.health = victim.maxHealth;
                    victim.alive = true;
                    this.modeData.infected.push(victim.id);
                    console.log(`🦠 ${victim.name} ha sido infectado!`);
                }
                break;
        }
    }

    // Verificar condiciones de victoria según modo
    checkWinCondition() {
        const alivePlayers = Object.values(this.game.players).filter(p => p.alive);
        
        switch(this.currentMode) {
            case 'classic':
                return this.checkClassicWin();
                
            case 'escape':
                return this.checkEscapeWin();
                
            case 'deathmatch':
                return this.checkDeathmatchWin(alivePlayers);
                
            case 'infection':
                return this.checkInfectionWin();
                
            case 'juggernaut':
                return this.checkJuggernautWin();
                
            case 'hide_and_seek':
                return this.checkHideAndSeekWin();
                
            default:
                return null;
        }
    }

    checkClassicWin() {
        const aliveSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && p.alive && !p.downed);
        const aliveKillers = Object.values(this.game.players).filter(p => p.role === 'killer' && p.alive);
        
        if (aliveSurvivors.length === 0 && aliveKillers.length > 0) {
            return { winner: 'killer', message: '⚔️ ¡El Killer ha ganado!' };
        }
        
        if (aliveKillers.length === 0 && aliveSurvivors.length > 0) {
            return { winner: 'survivors', message: '🛡️ ¡Los Survivors han ganado!' };
        }
        
        return null;
    }

    checkEscapeWin() {
        const escapedSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && p.escaped);
        const totalSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor').length;
        
        if (escapedSurvivors.length >= totalSurvivors * 0.5) {
            return { winner: 'survivors', message: `🏃 ¡${escapedSurvivors.length} Survivors escaparon!` };
        }
        
        return this.checkClassicWin();
    }

    checkDeathmatchWin(alivePlayers) {
        if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];
            const kills = this.modeData.kills[winner.id] || 0;
            return { winner: winner.name, message: `💀 ${winner.name} ganó con ${kills} kills!` };
        }
        return null;
    }

    checkInfectionWin() {
        const survivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && p.alive);
        const infected = Object.values(this.game.players).filter(p => p.role === 'killer' && p.alive);
        
        if (survivors.length === 0) {
            return { winner: 'infected', message: '🦠 ¡La infección se propagó a todos!' };
        }
        
        if (infected.length === 0) {
            return { winner: 'survivors', message: '💊 ¡Los Survivors resistieron la infección!' };
        }
        
        return null;
    }

    checkJuggernautWin() {
        const juggernaut = Object.values(this.game.players).find(p => p.isJuggernaut && p.alive);
        const survivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && p.alive);
        
        if (!juggernaut) {
            return { winner: 'survivors', message: '🛡️ ¡Los Survivors derrotaron al Juggernaut!' };
        }
        
        if (survivors.length === 0) {
            return { winner: 'juggernaut', message: '👹 ¡El Juggernaut es imparable!' };
        }
        
        return null;
    }

    checkHideAndSeekWin() {
        return this.checkClassicWin();
    }

    // Dibujar UI específica del modo
    drawModeUI(ctx) {
        switch(this.currentMode) {
            case 'hide_and_seek':
                if (this.modeData.hidePhase) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(this.game.canvas.width/2 - 150, 20, 300, 60);
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🙈 ESCONDERSE', this.game.canvas.width/2, 50);
                    ctx.fillStyle = '#FFF';
                    ctx.font = '18px Arial';
                    ctx.fillText(`${this.modeData.hideTimeRemaining}s`, this.game.canvas.width/2, 75);
                    ctx.restore();
                }
                break;
                
            case 'deathmatch':
                // Mostrar tabla de kills
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(10, 100, 200, 150);
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('💀 KILLS', 20, 120);
                
                let y = 145;
                Object.entries(this.modeData.kills)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .forEach(([playerId, kills]) => {
                        const player = this.game.players[playerId];
                        if (player) {
                            ctx.fillStyle = '#FFF';
                            ctx.font = '14px Arial';
                            ctx.fillText(`${player.name}: ${kills}`, 20, y);
                            y += 20;
                        }
                    });
                ctx.restore();
                break;
        }
    }

    // Obtener nombre del modo actual
    getCurrentModeName() {
        const modes = this.getModes();
        return modes[this.currentMode]?.name || 'Desconocido';
    }
}
