export class CombatManager {
    constructor(game) {
        this.game = game;
    }
    
    updateCooldowns() {
        const player = this.game.players[this.game.myPlayerId];
        let deltaTime = 16;
        
        if (player && this.game.lastManStanding) {
            if (player.character === 'iA777') {
                deltaTime = 32;
            } else if (player.character === 'luna') {
                deltaTime = 24;
            } else if (player.character === 'angel') {
                deltaTime = 28;
            }
        }
        
        if (player && player.role === 'killer' && player.rageMode && player.rageMode.active) {
            deltaTime = 32;
        }
        
        if (this.game.abilities.q.cooldown > 0) {
            this.game.abilities.q.cooldown = Math.max(0, this.game.abilities.q.cooldown - deltaTime);
        }
        if (this.game.abilities.e.cooldown > 0) {
            this.game.abilities.e.cooldown = Math.max(0, this.game.abilities.e.cooldown - deltaTime);
        }
        if (this.game.abilities.r.cooldown > 0) {
            this.game.abilities.r.cooldown = Math.max(0, this.game.abilities.r.cooldown - deltaTime);
        }
        if (this.game.abilities.basicAttack.cooldown > 0) {
            this.game.abilities.basicAttack.cooldown = Math.max(0, this.game.abilities.basicAttack.cooldown - deltaTime);
        }
    }
    
    updateHitboxes() {
        this.game.hitboxes = this.game.hitboxes.filter(hitbox => {
            hitbox.life--;
            
            if (hitbox.type === 'white_orb') {
                hitbox.trail.push({x: hitbox.x, y: hitbox.y, alpha: 1.0});
                if (hitbox.trail.length > 8) hitbox.trail.shift();
                
                hitbox.trail.forEach((point, index) => {
                    point.alpha = (index + 1) / hitbox.trail.length * 0.5;
                });
                
                hitbox.x += hitbox.vx;
                hitbox.y += hitbox.vy;
                
                if (hitbox.x < 0 || hitbox.x > this.game.worldSize.width || 
                    hitbox.y < 0 || hitbox.y > this.game.worldSize.height) {
                    hitbox.life = 0;
                }
            } else if (hitbox.type === 'phantom_orb') {
                hitbox.x += hitbox.vx;
                hitbox.y += hitbox.vy;
                
                if (hitbox.x < 0 || hitbox.x > this.game.worldSize.width || 
                    hitbox.y < 0 || hitbox.y > this.game.worldSize.height) {
                    hitbox.life = 0;
                }
                
                if (hitbox.life <= 0 && !hitbox.exploded) {
                    hitbox.exploded = true;
                    this.game.visualManager.createParticles(hitbox.x, hitbox.y, '#8A2BE2', 25);
                }
            }
            
            if (hitbox.life > 0) {
                this.checkHitboxCollisions(hitbox);
            }
            return hitbox.life > 0;
        });
    }
    
    checkHitboxCollisions(hitbox) {
        Object.values(this.game.players).forEach(target => {
            if (!target.alive || target.id === hitbox.ownerId) return;
            
            let collision = false;
            
            if (hitbox.type === 'basic_attack') {
                collision = target.x < hitbox.x + hitbox.width &&
                           target.x + 30 > hitbox.x &&
                           target.y < hitbox.y + hitbox.height &&
                           target.y + 30 > hitbox.y;
            } else {
                const distance = Math.sqrt(
                    Math.pow(target.x + 15 - hitbox.x, 2) + 
                    Math.pow(target.y + 15 - hitbox.y, 2)
                );
                collision = distance <= hitbox.radius;
            }
            
            if (collision) {
                this.applyHitboxEffect(hitbox, target);
                hitbox.life = 0;
            }
        });
    }
    
    applyHitboxEffect(hitbox, target) {
        if (hitbox.type === 'you_cant_run' && target.role === 'survivor' && !hitbox.hasHit) {
            this.handleYouCantRunHit(hitbox, target);
        } else if (hitbox.type === 'basic_attack' && target.role === 'survivor' && !hitbox.hasHit) {
            this.handleBasicAttackHit(hitbox, target);
        } else if (hitbox.type === 'white_orb' && target.role === 'survivor' && !hitbox.hasHit) {
            this.handleWhiteOrbHit(hitbox, target);
        } else if (hitbox.type === 'phantom_orb' && target.role === 'survivor' && !hitbox.exploded) {
            this.handlePhantomOrbHit(hitbox, target);
        }
    }
    
    handleYouCantRunHit(hitbox, target) {
        if (target.character === 'iris' && target.dodgeBar > 0) {
            target.dodgeHits++;
            if (target.dodgeHits <= 2) {
                target.dodgeBar = Math.max(0, target.dodgeBar - 37.5);
                this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#00BFFF', 15);
                this.game.showDamageIndicator(target, 0, 'dodged');
                if (target.id === this.game.myPlayerId && this.game.supabaseGame) {
                    this.game.supabaseGame.sendAttack({
                        type: 'dodge_regen',
                        playerId: target.id,
                        dodgeBar: target.dodgeBar
                    });
                }
                hitbox.hasHit = true;
                hitbox.life = 0;
                return;
            }
        }
        
        target.health = Math.max(0, target.health - 25);
        this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#8B0000', 15);
        this.game.triggerJumpscare(target.id);
        
        hitbox.hasHit = true;
        hitbox.life = 0;
        
        if (target.autoRepairing) {
            target.autoRepairing = false;
            target.autoRepairTimer = 0;
        }
        
        if (target.health <= 0) {
            if (target.lastLife || target.character === 'iA777') {
                target.alive = false;
                target.spectating = true;
                this.game.playDeathSound();
                this.game.gameTimer += 15;
            } else {
                this.game.setPlayerDowned(target);
                this.game.gameTimer += 10;
            }
        }
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'damage',
                targetId: target.id,
                health: target.health,
                alive: target.health > 0,
                downed: target.health <= 0 && !target.lastLife && target.character !== 'iA777',
                spectating: target.health <= 0 && (target.lastLife || target.character === 'iA777'),
                damage: 25,
                attackerId: hitbox.ownerId,
                attackType: 'you_cant_run'
            });
        }
        
        this.game.showDamageIndicator(target, 25, 'you_cant_run');
    }
    
    handleBasicAttackHit(hitbox, target) {
        const attacker = this.game.players[hitbox.ownerId];
        let damage = 30;
        hitbox.hasHit = true;
        hitbox.life = 0;
        
        if (attacker && attacker.stealthMode && attacker.stealthHits < attacker.maxStealthHits) {
            damage = 50;
            attacker.stealthHits++;
            
            if (attacker.stealthHits >= attacker.maxStealthHits) {
                attacker.stealthMode = false;
                attacker.criticalStrike = false;
            }
            
            this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#FFD700', 20);
        } else {
            this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#FF0000', 12);
        }
        
        if (attacker && attacker.rageMode && attacker.rageMode.active) {
            damage = Math.floor(damage * 1.5);
        }
        
        if (target.character === 'iris' && target.dodgeBar > 0) {
            target.dodgeHits++;
            if (target.dodgeHits <= 2) {
                target.dodgeBar = Math.max(0, target.dodgeBar - 37.5);
                this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#00BFFF', 15);
                this.game.showDamageIndicator(target, 0, 'dodged');
                
                if (target.id === this.game.myPlayerId && this.game.supabaseGame) {
                    this.game.supabaseGame.sendAttack({
                        type: 'dodge_regen',
                        playerId: target.id,
                        dodgeBar: target.dodgeBar
                    });
                }
                return;
            }
        }
        
        // Apply LMS resistance
        if (target.character === 'luna' && target.lmsResistance) {
            damage = Math.floor(damage * 0.8);
        } else if (target.character === 'iA777' && target.lmsResistance) {
            damage = Math.floor(damage * 0.75);
        } else if (target.character === 'angel' && target.lmsResistance) {
            damage = Math.floor(damage * 0.75);
        } else if (target.character === 'gissel' && target.lmsResistance) {
            damage = Math.floor(damage * 0.8);
        }
        
        target.health = Math.max(0, target.health - damage);
        
        if (target.autoRepairing) {
            target.autoRepairing = false;
            target.autoRepairTimer = 0;
        }
        
        if (target.health <= 0) {
            if (target.lastLife || target.character === 'iA777') {
                target.alive = false;
                target.spectating = true;
                this.game.playDeathSound();
                this.game.gameTimer += 15;
            } else {
                this.game.setPlayerDowned(target);
                this.game.gameTimer += 10;
            }
        }
        
        if (this.game.supabaseGame) {
            const isDowned = target.health <= 0 && !target.lastLife && target.character !== 'iA777';
            const isDead = target.health <= 0 && (target.lastLife || target.character === 'iA777');
            
            this.game.supabaseGame.sendAttack({
                type: 'damage',
                targetId: target.id,
                health: target.health,
                alive: isDowned ? true : target.health > 0,
                downed: isDowned,
                spectating: isDead,
                damage: damage,
                attackerId: hitbox.ownerId,
                attackType: 'basic_attack'
            });
        }
        
        this.game.showDamageIndicator(target, damage, 'basic_attack');
    }
    
    handleWhiteOrbHit(hitbox, target) {
        const attacker = this.game.players[hitbox.ownerId];
        let damage = 40;
        
        if (attacker && attacker.rageMode && attacker.rageMode.active) {
            damage = Math.floor(damage * 1.5);
        }
        
        if (target.character === 'iris' && target.dodgeBar > 0) {
            target.dodgeHits++;
            if (target.dodgeHits <= 2) {
                target.dodgeBar = Math.max(0, target.dodgeBar - 37.5);
                this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#00BFFF', 15);
                this.game.showDamageIndicator(target, 0, 'dodged');
                
                if (target.id === this.game.myPlayerId && this.game.supabaseGame) {
                    this.game.supabaseGame.sendAttack({
                        type: 'dodge_regen',
                        playerId: target.id,
                        dodgeBar: target.dodgeBar
                    });
                }
                
                hitbox.life = 0;
                return;
            }
        }
        
        // Apply LMS resistance
        if (target.character === 'luna' && target.lmsResistance) {
            damage = Math.floor(damage * 0.8);
        } else if (target.character === 'iA777' && target.lmsResistance) {
            damage = Math.floor(damage * 0.75);
        } else if (target.character === 'angel' && target.lmsResistance) {
            damage = Math.floor(damage * 0.75);
        } else if (target.character === 'gissel' && target.lmsResistance) {
            damage = Math.floor(damage * 0.8);
        }
        
        target.health = Math.max(0, target.health - damage);
        hitbox.hasHit = true;
        
        const knockback = 100;
        const angle = Math.atan2(hitbox.vy, hitbox.vx);
        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, 
            target.x + Math.cos(angle) * knockback));
        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, 
            target.y + Math.sin(angle) * knockback));
        
        target.x = newX;
        target.y = newY;
        
        if (target.autoRepairing) {
            target.autoRepairing = false;
            target.autoRepairTimer = 0;
        }
        
        if (target.health <= 0) {
            if (target.lastLife || target.character === 'iA777') {
                target.alive = false;
                target.spectating = true;
                this.game.playDeathSound();
                this.game.gameTimer += 15;
            } else {
                this.game.setPlayerDowned(target);
                this.game.gameTimer += 10;
            }
        }
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendPlayerMove(newX, newY);
            this.game.supabaseGame.sendAttack({
                type: 'damage',
                targetId: target.id,
                health: target.health,
                alive: target.health > 0,
                downed: target.health <= 0 && !target.lastLife && target.character !== 'iA777',
                spectating: target.health <= 0 && (target.lastLife || target.character === 'iA777'),
                damage: damage,
                attackerId: hitbox.ownerId,
                attackType: 'white_orb',
                knockbackX: newX,
                knockbackY: newY
            });
        }
        
        this.game.showDamageIndicator(target, damage, 'white_orb');
        this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#FF8000', 15);
        hitbox.life = 0;
    }
    
    handlePhantomOrbHit(hitbox, target) {
        const distance = Math.sqrt(
            Math.pow(target.x + 15 - hitbox.x, 2) + 
            Math.pow(target.y + 15 - hitbox.y, 2)
        );
        
        if (distance <= hitbox.radius + 30) {
            hitbox.exploded = true;
            this.game.visualManager.createParticles(hitbox.x, hitbox.y, '#8A2BE2', 25);
            
            Object.values(this.game.players).forEach(nearbyTarget => {
                if (nearbyTarget.role === 'survivor' && nearbyTarget.alive) {
                    const explosionDistance = Math.sqrt(
                        Math.pow(nearbyTarget.x + 15 - hitbox.x, 2) + 
                        Math.pow(nearbyTarget.y + 15 - hitbox.y, 2)
                    );
                    
                    if (explosionDistance <= 80) {
                        if (nearbyTarget.character === 'iris' && nearbyTarget.dodgeBar > 0) {
                            nearbyTarget.dodgeHits++;
                            if (nearbyTarget.dodgeHits <= 2) {
                                nearbyTarget.dodgeBar = Math.max(0, nearbyTarget.dodgeBar - 37.5);
                                this.game.visualManager.createParticles(nearbyTarget.x + 15, nearbyTarget.y + 15, '#00BFFF', 15);
                                this.game.showDamageIndicator(nearbyTarget, 0, 'dodged');
                                if (this.game.supabaseGame) {
                                    this.game.supabaseGame.sendAttack({
                                        type: 'dodge_regen',
                                        playerId: nearbyTarget.id,
                                        dodgeBar: nearbyTarget.dodgeBar
                                    });
                                }
                                return;
                            }
                        }
                        
                        const attacker = this.game.players[hitbox.ownerId];
                        let damage = 35;
                        
                        if (attacker && attacker.powerSurge && attacker.powerSurge.active) {
                            damage = Math.floor(damage * 2);
                        }
                        
                        nearbyTarget.health = Math.max(0, nearbyTarget.health - damage);
                        
                        if (nearbyTarget.health <= 0) {
                            if (nearbyTarget.lastLife || nearbyTarget.character === 'iA777') {
                                nearbyTarget.alive = false;
                                nearbyTarget.spectating = true;
                            } else {
                                this.game.setPlayerDowned(nearbyTarget);
                            }
                        }
                        
                        this.game.visualManager.createParticles(nearbyTarget.x + 15, nearbyTarget.y + 15, '#8A2BE2', 15);
                        this.game.showDamageIndicator(nearbyTarget, damage, 'phantom_orb');
                    }
                }
            });
            
            hitbox.life = 0;
        }
    }
    
    handleAttack(e) {
        const player = this.game.players[this.game.myPlayerId];
        if (!player || !player.alive || player.role !== 'killer') return;
        if (this.game.abilities.basicAttack.cooldown > 0) return;
        
        this.game.abilities.basicAttack.cooldown = this.game.abilities.basicAttack.maxCooldown;
        
        let attackX = player.x;
        let attackY = player.y;
        
        if (this.game.lastMouseX && this.game.lastMouseY) {
            const angle = Math.atan2(this.game.lastMouseY - (player.y + 15), this.game.lastMouseX - (player.x + 15));
            const distance = 40;
            attackX = player.x + Math.cos(angle) * distance;
            attackY = player.y + Math.sin(angle) * distance;
        }
        
        const hitboxData = {
            type: 'basic_attack',
            x: attackX,
            y: attackY,
            width: 60,
            height: 60,
            life: 30,
            ownerId: player.id,
            color: '#FF0000',
            hasHit: false
        };
        
        this.game.hitboxes.push(hitboxData);
        this.game.visualManager.createParticles(attackX + 30, attackY + 30, '#FF0000', 8);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'basic_attack',
                attackData: hitboxData,
                playerId: player.id
            });
        }
    }

    drawHitboxes(ctx) {
        this.game.hitboxes.forEach(hitbox => {
            if (hitbox.type === 'white_orb') {
                if (hitbox.trail) {
                    hitbox.trail.forEach(point => {
                        ctx.save();
                        ctx.globalAlpha = point.alpha;
                        ctx.fillStyle = hitbox.color;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, hitbox.radius * 0.6, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    });
                }
                
                ctx.save();
                ctx.shadowColor = hitbox.color;
                ctx.shadowBlur = 15;
                ctx.fillStyle = hitbox.color;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(hitbox.x, hitbox.y, hitbox.radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            } else if (hitbox.type === 'basic_attack') {
                const alpha = Math.min(0.5, hitbox.life / 30);
                ctx.save();
                ctx.fillStyle = hitbox.color;
                ctx.globalAlpha = alpha;
                ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                ctx.restore();
            } else {
                const alpha = Math.min(0.3, hitbox.life / 30);
                ctx.strokeStyle = hitbox.color;
                ctx.fillStyle = hitbox.color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.globalAlpha = alpha * 0.2;
                ctx.fill();
                
                ctx.globalAlpha = 1.0;
            }
        });
    }

    setPlayerDowned(target) {
        target.downed = true;
        target.alive = true;
        target.reviveTimer = 1200;
        target.beingRevived = false;
        this.game.gameTimer += 10;
    }
}