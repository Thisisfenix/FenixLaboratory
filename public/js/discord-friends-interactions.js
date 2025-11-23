/**
 * Discord Friends - Survivor Interactions System
 * Sistema de interacciones entre survivors basado en personalidad
 */

class SurvivorInteractions {
    constructor(game) {
        this.game = game;
        this.interactionCooldown = 600; // 10 segundos
        this.lastInteraction = {};
        this.interactionRange = 80;
        
        // Personalidades
        this.personalities = {
            gissel: {
                trait: 'sociable_preocupada', // Sociable pero se preocupa demasiado
                helpBonus: 1.2,
                preferHelp: ['all'], // Le gusta ayudar a todos
                voicelines: {
                    help: ['¡Cuidado! ¡Te ayudo!', '¿Estás bien? ¡Vamos!', '¡No te preocupes!'],
                    thanks: ['¡Gracias! ¿Seguro estás bien?', 'Te lo agradezco', '¡Eso fue increíble!']
                }
            },
            iA777: {
                trait: 'tranquilo_estresado', // Tranquilo pero con estrés acumulado
                helpBonus: 1.0,
                preferHelp: ['all'], // Prefiere ayudar a los más débiles (lógica)
                voicelines: {
                    help: ['...Te ayudo', 'Está bien', '...Vamos'],
                    thanks: ['...Gracias', 'Hmm', '...']
                }
            },
            luna: {
                trait: 'tímida_hiperactiva', // Tímida pero hiperactiva con amigos
                helpBonus: 0.9,
                preferHelp: ['all'], // Solo ayuda a quienes le dan confianza
                voicelines: {
                    help: ['E-esto... ¡vamos!', 'Yo... te ayudo', '¡P-puedes hacerlo!'],
                    thanks: ['G-gracias...', 'Eh... gracias', 'Oh, gracias']
                }
            },
            angel: {
                trait: 'altruista',
                helpBonus: 1.5,
                preferHelp: ['all'],
                voicelines: {
                    help: ['Que la luz te proteja', 'Estoy aquí', 'No estás solo'],
                    thanks: ['Bendiciones', 'Gracias', 'La luz nos guía']
                }
            },
            iris: {
                trait: 'tranquila_hiperactiva_combate', // Tranquila normalmente, hiperactiva en combate
                helpBonus: 1.3,
                preferHelp: ['all'], // Ayuda a todos por igual (empática)
                voicelines: {
                    calm: ['Todo estará bien', 'Mantén la calma', 'Respira...'],
                    combat: ['¡Vamos! ¡Podemos!', '¡No pares!', '¡Sigue adelante!'],
                    help: ['¡Puedo sentir tu dolor!', 'Déjame ayudarte', '¡Juntos!'],
                    thanks: ['Gracias', 'Eres amable', 'Me alegra tenerte'],
                    apology: ['Lo siento...', 'Ojalá pudiera ayudarte', 'Perdóname...'],
                    fear: ['Está... oscuro', 'No me gusta esto', 'Tengo miedo...']
                }
            },
            molly: {
                trait: 'distante_asertiva', // Distante al inicio, asertiva e impulsiva
                helpBonus: 1.1,
                preferHelp: ['all'], // Solo ayuda a quienes considera confiables
                trustLevel: {}, // Sistema de confianza dinámico
                voicelines: {
                    help: ['Te ayudaré', 'Puedo con esto', 'Confía en mí'],
                    thanks: ['Hmm, gracias', 'Lo aprecio', 'Bien hecho']
                }
            }
        };
    }
    
    canInteract(playerId, targetId) {
        const key = `${playerId}_${targetId}`;
        const lastTime = this.lastInteraction[key] || 0;
        return Date.now() - lastTime > this.interactionCooldown * 16.67;
    }
    
    registerInteraction(playerId, targetId) {
        this.lastInteraction[`${playerId}_${targetId}`] = Date.now();
    }
    
    getNearbySurvivors(player) {
        return Object.values(this.game.players).filter(target => 
            target.role === 'survivor' && 
            target.alive && 
            target.id !== player.id &&
            Math.sqrt(Math.pow(target.x - player.x, 2) + Math.pow(target.y - player.y, 2)) <= this.interactionRange
        );
    }
    
    // Angel: Boost de curación a aliados cercanos cuando usa Rest
    healBoostInteraction(healer, target) {
        if (!this.canInteract(healer.id, target.id)) return false;
        
        const personality = this.personalities[healer.character];
        if (!personality) return false;
        
        if (healer.character === 'angel' && healer.restActive) {
            const bonus = 5 * personality.helpBonus;
            target.health = Math.min(target.maxHealth, target.health + bonus);
            
            this.showInteractionEffect(healer, target, '💚', '#00FF7F');
            this.registerInteraction(healer.id, target.id);
            return true;
        }
        
        return false;
    }
    
    // Luna: Comparte velocidad con aliados cercanos (solo con amigos de confianza)
    speedBoostInteraction(booster, target) {
        if (!this.canInteract(booster.id, target.id)) return false;
        
        if (booster.character === 'luna' && booster.speedBoostActive) {
            const personality = this.personalities[booster.character];
            
            // Luna solo comparte con personajes que le dan confianza
            const isTrustedFriend = personality.preferHelp.includes(target.character);
            
            if (isTrustedFriend) {
                // Con amigos de confianza, es más generosa (hiperactiva)
                target.speedBoost = true;
                target.speedBoostTimer = 240; // 4 segundos (más tiempo)
                target.speedBoostLevel = 1;
                
                this.showInteractionEffect(booster, target, '⚡', '#FFD700');
                this.registerInteraction(booster.id, target.id);
                return true;
            } else {
                // Con otros, es más tímida (menos tiempo)
                target.speedBoost = true;
                target.speedBoostTimer = 120; // 2 segundos
                target.speedBoostLevel = 1;
                
                this.showInteractionEffect(booster, target, '⚡', '#FFD700');
                this.registerInteraction(booster.id, target.id);
                return true;
            }
        }
        
        return false;
    }
    
    // Gissel: Acelera revive de aliados (insistente y preocupada)
    reviveBoostInteraction(protector, target) {
        if (!this.canInteract(protector.id, target.id)) return false;
        
        if (protector.character === 'gissel' && target.downed && target.beingRevived) {
            const personality = this.personalities[protector.character];
            const bonus = 2 * personality.helpBonus;
            target.reviveProgress = Math.min(180, target.reviveProgress + bonus);
            
            this.showInteractionEffect(protector, target, '🛡️', '#4ecdc4');
            return true;
        }
        
        // Gissel se preocupa por aliados con poca vida (insistente)
        if (protector.character === 'gissel' && target.health < target.maxHealth * 0.4) {
            if (Math.random() < 0.01) { // 1% chance
                if (this.game.ctx) {
                    this.game.ctx.save();
                    this.game.ctx.font = 'bold 10px Arial';
                    this.game.ctx.fillStyle = '#FF69B4';
                    this.game.ctx.textAlign = 'center';
                    this.game.ctx.fillText('¡CUÍDATE!', protector.x + 15, protector.y - 60);
                    this.game.ctx.restore();
                }
            }
            return true;
        }
        
        return false;
    }
    
    // Molly: Reduce efectos negativos (solo con aliados de confianza)
    courageInteraction(motivator, target) {
        if (!this.canInteract(motivator.id, target.id)) return false;
        
        if (motivator.character === 'molly' && motivator.mollyChargeActive) {
            const personality = this.personalities[motivator.character];
            const isTrusted = personality.preferHelp.includes(target.character);
            
            // Molly es más efectiva con aliados de confianza (impulsiva por seres queridos)
            if (isTrusted) {
                if (target.stunned) {
                    target.stunTimer = Math.max(0, target.stunTimer - 45); // Más efectiva
                }
                if (target.character === 'angel' && target.fatigued) {
                    target.fatigueTimer = Math.max(0, target.fatigueTimer - 90);
                }
                
                this.showInteractionEffect(motivator, target, '💪', '#FFA500');
                this.registerInteraction(motivator.id, target.id);
                return true;
            } else {
                // Con otros es más distante (menos efectiva)
                if (target.stunned) {
                    target.stunTimer = Math.max(0, target.stunTimer - 20);
                }
                
                this.showInteractionEffect(motivator, target, '💪', '#FFA500');
                this.registerInteraction(motivator.id, target.id);
                return true;
            }
        }
        
        return false;
    }
    
    // Iris + iA777: Combo especial (conexión emocional)
    comboInteraction(player1, player2) {
        if (!this.canInteract(player1.id, player2.id)) return false;
        
        if ((player1.character === 'iris' && player2.character === 'iA777') ||
            (player1.character === 'iA777' && player2.character === 'iris')) {
            
            const iris = player1.character === 'iris' ? player1 : player2;
            const ia = player1.character === 'iA777' ? player1 : player2;
            
            // Combo de habilidades activas
            if (iris.telekinesisActive && ia.chargeActive) {
                iris.telekinesisTimer += 60;
                ia.chargeTimer += 60;
                
                this.showInteractionEffect(player1, player2, '✨', '#9370DB');
                this.registerInteraction(player1.id, player2.id);
                return true;
            }
            
            // Iris calma el estrés de iA777 (conexión empática)
            if (iris.healingAura && ia.health < ia.maxHealth * 0.5) {
                // Iris reduce el "estrés" de iA777 curándolo extra
                const stressRelief = 8;
                ia.health = Math.min(ia.maxHealth, ia.health + stressRelief);
                
                this.showInteractionEffect(iris, ia, '💜', '#9370DB');
                this.registerInteraction(player1.id, player2.id);
                return true;
            }
        }
        
        return false;
    }
    
    // iA777: Interacción de estrés (pierde HP cuando está muy estresado)
    stressInteraction(ia) {
        if (ia.character !== 'iA777') return false;
        
        // Si iA777 está bajo de HP, su estrés aumenta
        if (ia.health < ia.maxHealth * 0.3 && !ia.healActive) {
            // Mostrar indicador de estrés
            if (this.game.ctx && Math.random() < 0.02) { // 2% chance por frame
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#FF6347';
                this.game.ctx.textAlign = 'center';
                this.game.ctx.fillText('ESTRESADO', ia.x + 15, ia.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        return false;
    }
    
    // Luna: Interacción de confianza (se vuelve hiperactiva con amigos)
    confidenceInteraction(luna) {
        if (luna.character !== 'luna') return false;
        
        const nearbySurvivors = this.getNearbySurvivors(luna);
        const personality = this.personalities[luna.character];
        
        // Contar amigos de confianza cercanos
        const trustedFriendsNearby = nearbySurvivors.filter(s => 
            personality.preferHelp.includes(s.character)
        ).length;
        
        // Si tiene 2+ amigos de confianza cerca, se vuelve hiperactiva
        if (trustedFriendsNearby >= 2) {
            // Boost de velocidad pasivo cuando está con amigos
            if (!luna.speedBoostActive && Math.random() < 0.005) { // 0.5% chance
                if (this.game.ctx) {
                    this.game.ctx.save();
                    this.game.ctx.font = 'bold 10px Arial';
                    this.game.ctx.fillStyle = '#FFD700';
                    this.game.ctx.textAlign = 'center';
                    this.game.ctx.fillText('HIPERACTIVA', luna.x + 15, luna.y - 60);
                    this.game.ctx.restore();
                }
            }
            return true;
        }
        
        // Si está sola, mostrar timidez
        if (nearbySurvivors.length === 0 && Math.random() < 0.01) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#87CEEB';
                this.game.ctx.textAlign = 'center';
                this.game.ctx.fillText('...', luna.x + 15, luna.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        return false;
    }
    
    // Gissel: Interacción de sensibilidad (se distrae y preocupa)
    sensitivityInteraction(gissel) {
        if (gissel.character !== 'gissel') return false;
        
        const nearbySurvivors = this.getNearbySurvivors(gissel);
        
        // Gissel se preocupa por situaciones pequeñas
        nearbySurvivors.forEach(survivor => {
            // Si alguien está herido, Gissel se preocupa (insistente)
            if (survivor.health < survivor.maxHealth * 0.6 && Math.random() < 0.008) {
                if (this.game.ctx) {
                    this.game.ctx.save();
                    this.game.ctx.font = 'bold 10px Arial';
                    this.game.ctx.fillStyle = '#FF69B4';
                    this.game.ctx.textAlign = 'center';
                    this.game.ctx.fillText('¿Estás bien?', gissel.x + 15, gissel.y - 60);
                    this.game.ctx.restore();
                }
            }
        });
        
        // Gissel se distrae con facilidad (random)
        if (Math.random() < 0.003) { // 0.3% chance
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#FFD700';
                this.game.ctx.textAlign = 'center';
                const distractions = ['¡Oh!', '¿Qué es eso?', '¡Wow!'];
                const text = distractions[Math.floor(Math.random() * distractions.length)];
                this.game.ctx.fillText(text, gissel.x + 15, gissel.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        // Gissel es sensible en situaciones delicadas (cuando hay muchos heridos)
        const injuredCount = nearbySurvivors.filter(s => s.health < s.maxHealth * 0.5).length;
        if (injuredCount >= 2 && Math.random() < 0.01) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#87CEEB';
                this.game.ctx.textAlign = 'center';
                this.game.ctx.fillText('Esto es serio...', gissel.x + 15, gissel.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        return false;
    }
    
    // Iris: Interacción empática (tranquila/hiperactiva según situación)
    empathyInteraction(iris) {
        if (iris.character !== 'iris') return false;
        
        const nearbySurvivors = this.getNearbySurvivors(iris);
        const personality = this.personalities[iris.character];
        
        // Detectar si está en combate (killer cerca o usando habilidades)
        const killers = Object.values(this.game.players).filter(p => p.role === 'killer' && p.alive);
        let inCombat = false;
        
        killers.forEach(killer => {
            const distance = Math.sqrt(Math.pow(killer.x - iris.x, 2) + Math.pow(killer.y - iris.y, 2));
            if (distance < 200) inCombat = true;
        });
        
        // También está en combate si usa habilidades activas
        if (iris.telekinesisActive || iris.irisDashActive || iris.healingAura) {
            inCombat = true;
        }
        
        // Comportamiento hiperactivo en combate
        if (inCombat && Math.random() < 0.008) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#FF69B4';
                this.game.ctx.textAlign = 'center';
                const combatLines = personality.voicelines.combat;
                const text = combatLines[Math.floor(Math.random() * combatLines.length)];
                this.game.ctx.fillText(text, iris.x + 15, iris.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        // Comportamiento tranquilo fuera de combate
        if (!inCombat && nearbySurvivors.length > 0 && Math.random() < 0.005) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#9370DB';
                this.game.ctx.textAlign = 'center';
                const calmLines = personality.voicelines.calm;
                const text = calmLines[Math.floor(Math.random() * calmLines.length)];
                this.game.ctx.fillText(text, iris.x + 15, iris.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        // Miedo a la oscuridad (cuando el killer usa stealth o está en modo invisible)
        const stealthKiller = killers.find(k => k.stealthMode || k.character === '2019x');
        if (stealthKiller && Math.random() < 0.01) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#8B0000';
                this.game.ctx.textAlign = 'center';
                const fearLines = personality.voicelines.fear;
                const text = fearLines[Math.floor(Math.random() * fearLines.length)];
                this.game.ctx.fillText(text, iris.x + 15, iris.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        // Iris se disculpa con iA777 cuando él está herido y ella tiene healing aura
        const ia777 = nearbySurvivors.find(s => s.character === 'iA777');
        
        if (ia777 && iris.healingAura && ia777.health < ia777.maxHealth * 0.6 && Math.random() < 0.01) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#9370DB';
                this.game.ctx.textAlign = 'center';
                const apologies = personality.voicelines.apology;
                const text = apologies[Math.floor(Math.random() * apologies.length)];
                this.game.ctx.fillText(text, iris.x + 15, iris.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        return false;
    }
    
    // Molly: Interacción de orgullo y distancia (asertiva pero distante)
    prideInteraction(molly) {
        if (molly.character !== 'molly') return false;
        
        const nearbySurvivors = this.getNearbySurvivors(molly);
        const personality = this.personalities[molly.character];
        
        // Molly es distante con desconocidos
        const strangers = nearbySurvivors.filter(s => !personality.preferHelp.includes(s.character));
        if (strangers.length > 0 && Math.random() < 0.005) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#87CEEB';
                this.game.ctx.textAlign = 'center';
                this.game.ctx.fillText('...', molly.x + 15, molly.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        // Molly siente celos si alguien tiene más HP (orgullo)
        nearbySurvivors.forEach(survivor => {
            if (survivor.health > molly.health && Math.random() < 0.003) {
                if (this.game.ctx) {
                    this.game.ctx.save();
                    this.game.ctx.font = 'bold 10px Arial';
                    this.game.ctx.fillStyle = '#FFA500';
                    this.game.ctx.textAlign = 'center';
                    this.game.ctx.fillText('Puedo hacerlo mejor', molly.x + 15, molly.y - 60);
                    this.game.ctx.restore();
                }
            }
        });
        
        // Molly es impulsiva con seres queridos en peligro
        const trustedFriends = nearbySurvivors.filter(s => 
            personality.preferHelp.includes(s.character) && s.health < s.maxHealth * 0.3
        );
        
        if (trustedFriends.length > 0 && Math.random() < 0.01) {
            if (this.game.ctx) {
                this.game.ctx.save();
                this.game.ctx.font = 'bold 10px Arial';
                this.game.ctx.fillStyle = '#FF6347';
                this.game.ctx.textAlign = 'center';
                this.game.ctx.fillText('¡No te preocupes!', molly.x + 15, molly.y - 60);
                this.game.ctx.restore();
            }
            return true;
        }
        
        return false;
    }
    
    showInteractionEffect(source, target, emoji, color) {
        const midX = (source.x + target.x) / 2 + 15;
        const midY = (source.y + target.y) / 2 + 15;
        
        this.game.createParticles(midX, midY, color, 10);
        
        if (this.game.ctx) {
            this.game.ctx.save();
            this.game.ctx.font = 'bold 24px Arial';
            this.game.ctx.textAlign = 'center';
            this.game.ctx.fillText(emoji, midX, midY);
            this.game.ctx.restore();
        }
    }
    
    showVoiceline(player, type) {
        const personality = this.personalities[player.character];
        if (!personality || !personality.voicelines[type]) return;
        
        const lines = personality.voicelines[type];
        const line = lines[Math.floor(Math.random() * lines.length)];
        
        if (this.game.ctx) {
            this.game.ctx.save();
            this.game.ctx.font = 'bold 12px Arial';
            this.game.ctx.fillStyle = '#FFD700';
            this.game.ctx.strokeStyle = '#000';
            this.game.ctx.lineWidth = 3;
            this.game.ctx.textAlign = 'center';
            this.game.ctx.strokeText(line, player.x + 15, player.y - 50);
            this.game.ctx.fillText(line, player.x + 15, player.y - 50);
            this.game.ctx.restore();
        }
    }
    
    update() {
        if (!this.game.gameStarted) return;
        
        const myPlayer = this.game.players[this.game.myPlayerId];
        if (!myPlayer || !myPlayer.alive || myPlayer.role !== 'survivor') return;
        
        // Verificar estrés de iA777
        if (myPlayer.character === 'iA777') {
            this.stressInteraction(myPlayer);
        }
        
        // Verificar confianza de Luna
        if (myPlayer.character === 'luna') {
            this.confidenceInteraction(myPlayer);
        }
        
        // Verificar sensibilidad de Gissel
        if (myPlayer.character === 'gissel') {
            this.sensitivityInteraction(myPlayer);
        }
        
        // Verificar orgullo de Molly
        if (myPlayer.character === 'molly') {
            this.prideInteraction(myPlayer);
        }
        
        // Verificar empatía de Iris
        if (myPlayer.character === 'iris') {
            this.empathyInteraction(myPlayer);
        }
        
        const nearbySurvivors = this.getNearbySurvivors(myPlayer);
        
        nearbySurvivors.forEach(target => {
            this.healBoostInteraction(myPlayer, target);
            this.speedBoostInteraction(myPlayer, target);
            this.reviveBoostInteraction(myPlayer, target);
            this.courageInteraction(myPlayer, target);
            this.comboInteraction(myPlayer, target);
            
            this.healBoostInteraction(target, myPlayer);
            this.speedBoostInteraction(target, myPlayer);
            this.courageInteraction(target, myPlayer);
        });
    }
    
    // Tecla F para interacción manual
    manualInteraction(player) {
        const nearbySurvivors = this.getNearbySurvivors(player);
        if (nearbySurvivors.length === 0) return;
        
        let closest = null;
        let minDist = Infinity;
        
        nearbySurvivors.forEach(target => {
            const dist = Math.sqrt(Math.pow(target.x - player.x, 2) + Math.pow(target.y - player.y, 2));
            if (dist < minDist) {
                minDist = dist;
                closest = target;
            }
        });
        
        if (closest) {
            const personality = this.personalities[player.character];
            
            // Iris no puede curar a iA777 (robot), se disculpa
            if (player.character === 'iris' && closest.character === 'iA777') {
                if (this.game.ctx) {
                    this.game.ctx.save();
                    this.game.ctx.font = 'bold 12px Arial';
                    this.game.ctx.fillStyle = '#9370DB';
                    this.game.ctx.strokeStyle = '#000';
                    this.game.ctx.lineWidth = 3;
                    this.game.ctx.textAlign = 'center';
                    const apologies = personality.voicelines.apology;
                    const text = apologies[Math.floor(Math.random() * apologies.length)];
                    this.game.ctx.strokeText(text, player.x + 15, player.y - 50);
                    this.game.ctx.fillText(text, player.x + 15, player.y - 50);
                    this.game.ctx.restore();
                }
                this.showInteractionEffect(player, closest, '💔', '#9370DB');
                return;
            }
            
            const healAmount = 10 * (personality?.helpBonus || 1.0);
            
            closest.health = Math.min(closest.maxHealth, closest.health + healAmount);
            
            this.showInteractionEffect(player, closest, '❤️', '#FF69B4');
            this.showVoiceline(player, 'help');
            this.showVoiceline(closest, 'thanks');
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendAttack({
                    type: 'survivor_interaction',
                    sourceId: player.id,
                    targetId: closest.id,
                    healAmount: healAmount
                });
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.SurvivorInteractions = SurvivorInteractions;
}
