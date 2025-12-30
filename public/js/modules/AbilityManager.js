export class AbilityManager {
    constructor(game) {
        this.game = game;
    }

    setupAbilities() {
        const player = this.game.players[this.game.myPlayerId];
        if (!player) return;
        
        this.setupCharacterAbilities(player.character, player.role);
    }

    setupCharacterAbilities(character, role) {
        Object.keys(this.game.abilities).forEach(key => {
            this.game.abilities[key].cooldown = 0;
        });
        
        if (character === '2019x') {
            this.game.abilities.q.maxCooldown = 8000;
            this.game.abilities.e.maxCooldown = 6000;
            this.game.abilities.r.maxCooldown = 4000;
        } else if (character === 'vortex') {
            this.game.abilities.q.maxCooldown = 10000;
            this.game.abilities.e.maxCooldown = 8000;
            this.game.abilities.r.maxCooldown = 12000;
        } else if (character === 'gissel') {
            this.game.abilities.q.maxCooldown = 15000;
        } else if (character === 'iA777') {
            this.game.abilities.q.maxCooldown = 20000;
            this.game.abilities.e.maxCooldown = 25000;
            this.game.abilities.r.maxCooldown = 0;
        } else if (character === 'luna') {
            this.game.abilities.q.maxCooldown = 20000;
            this.game.abilities.q.uses = 3;
            this.game.abilities.q.maxUses = 3;
            this.game.abilities.e.maxCooldown = 12000;
            this.game.abilities.r.maxCooldown = 18000;
        } else if (character === 'angel') {
            this.game.abilities.q.maxCooldown = 30000;
            this.game.abilities.e.maxCooldown = 15000;
            this.game.abilities.r.maxCooldown = 20000;
        } else if (character === 'iris') {
            this.game.abilities.q.maxCooldown = 25000;
            this.game.abilities.e.maxCooldown = 18000;
            this.game.abilities.r.maxCooldown = 12000;
        } else if (character === 'molly') {
            this.game.abilities.q.maxCooldown = 15000;
            this.game.abilities.e.maxCooldown = 20000;
            this.game.abilities.r.maxCooldown = 25000;
        }
    }

    useAbility(ability) {
        const player = this.game.players[this.game.myPlayerId];
        if (!player || !player.alive) return;
        
        const abilityData = this.game.abilities[ability];
        if (abilityData.cooldown > 0) return;

        abilityData.cooldown = abilityData.maxCooldown;
        this.executeAbility(player, ability);
    }

    executeAbility(player, ability) {
        if (player.character === '2019x') {
            if (ability === 'q') this.activateStealth(player);
            else if (ability === 'e') this.youCantRun(player);
            else if (ability === 'r') this.launchDamageOrb(player);
        } else if (player.character === 'vortex') {
            if (ability === 'q') this.activateWarpStrike(player);
            else if (ability === 'e') this.activateVoidStep(player);
            else if (ability === 'r') this.launchPhantomOrb(player);
        } else if (player.character === 'gissel') {
            if (ability === 'q') this.activateSharpWings(player);
        } else if (player.character === 'iA777') {
            if (ability === 'q') this.activateCharge(player);
            else if (ability === 'e') this.activateAutoRepair(player);
            else if (ability === 'r') this.handleSelfDestruct(player);
        } else if (player.character === 'luna') {
            if (ability === 'q' && this.game.abilities.q.uses > 0) {
                this.activateEnergyJuice(player);
                this.game.abilities.q.uses--;
            } else if (ability === 'e') this.activateLunaPunch(player);
            else if (ability === 'r') this.activateTaunt(player);
        } else if (player.character === 'angel') {
            if (ability === 'q') this.activateAngelicSacrifice(player);
            else if (ability === 'e') this.activateProtectiveDash(player);
            else if (ability === 'r') this.activateRest(player);
        } else if (player.character === 'iris') {
            if (ability === 'q') this.activateHealing(player);
            else if (ability === 'e') this.activateTelekinesis(player);
            else if (ability === 'r') this.activateIrisDash(player);
        } else if (player.character === 'molly') {
            if (ability === 'q') this.activateMollyCharge(player);
            else if (ability === 'e') this.activateCookie(player);
            else if (ability === 'r') this.activateUppercut(player);
        }
    }

    activateRageMode() {
        const player = this.game.players[this.game.myPlayerId];
        if (!player || !player.alive || player.role !== 'killer') return;
        
        if (player.character === 'vortex') {
            if (player.powerSurgeUsed) return;
            
            player.powerSurge = { active: true, timer: 3600 };
            player.powerSurgeUsed = true;
            
            this.game.createParticles(player.x + 15, player.y + 15, '#9370DB', 30);
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendAttack({
                    type: 'power_surge',
                    playerId: player.id,
                    powerSurge: player.powerSurge,
                    powerSurgeUsed: true
                });
            }
        } else {
            if (player.rageLevel < player.maxRage || player.rageMode.active || player.rageUsed) return;
            if (this.game.gameModeManager?.lastManStanding) return;
            
            player.rageMode = { active: true, timer: 3600 };
            player.rageLevel = 0;
            player.rageUsed = true;
            
            this.game.createParticles(player.x + 15, player.y + 15, '#FF4500', 30);
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendAttack({
                    type: 'rage_mode',
                    playerId: player.id,
                    rageMode: player.rageMode,
                    rageUsed: true
                });
            }
        }
    }

    updateAbilities() {
        this.updateStealth();
        this.updateRageMode();
        this.updateVortexAbilities();
        this.updateSharpWings();
        this.updateYouCantRun();
        this.updateCharge();
        this.updateAutoRepair();
        this.updateSelfDestruct();
        this.updateLunaAbilities();
        this.updateAngelAbilities();
        this.updateIrisAbilities();
        this.updateMollyAbilities();
    }

    // Ability implementations
    activateStealth(killer) {
        killer.stealthMode = true;
        killer.stealthTimer = 480;
        killer.criticalStrike = true;
        killer.stealthHits = 0;
        killer.maxStealthHits = 3;
        
        this.game.createParticles(killer.x + 15, killer.y + 15, '#2C2C2C', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'stealth_activate',
                playerId: killer.id,
                stealthMode: true,
                criticalStrike: true
            });
        }
    }

    youCantRun(killer) {
        killer.youCantRunActive = true;
        killer.youCantRunTimer = 300;
        killer.youCantRunHit = false;
        
        this.game.createParticles(killer.x + 15, killer.y + 15, '#8B0000', 20);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'you_cant_run_activate',
                playerId: killer.id
            });
        }
    }

    launchDamageOrb(killer) {
        const survivors = Object.values(this.game.players).filter(p => 
            p.role === 'survivor' && p.alive && p.id !== killer.id && !p.downed
        );
        
        if (survivors.length === 0) return;
        
        let closestSurvivor = null;
        let minDistance = Infinity;
        
        survivors.forEach(survivor => {
            const distance = Math.sqrt(
                Math.pow(killer.x - survivor.x, 2) + 
                Math.pow(killer.y - survivor.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestSurvivor = survivor;
            }
        });
        
        if (!closestSurvivor) return;
        
        const angle = Math.atan2(closestSurvivor.y - killer.y, closestSurvivor.x - killer.x);
        const speed = 12;
        
        const orbData = {
            type: 'white_orb',
            x: killer.x + 15,
            y: killer.y + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 25,
            life: 180,
            maxLife: 180,
            ownerId: killer.id,
            color: '#FFFFFF',
            trail: [],
            hasHit: false
        };
        
        this.game.hitboxes.push(orbData);
        this.game.createParticles(killer.x + 15, killer.y + 15, '#FFFFFF', 12);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'white_orb',
                attackData: orbData,
                playerId: killer.id
            });
        }
    }

    activateWarpStrike(player) {
        const randomX = Math.random() * (this.game.worldSize.width - 30);
        const randomY = Math.random() * (this.game.worldSize.height - 30);
        
        player.x = randomX;
        player.y = randomY;
        player.warpStrikeActive = true;
        player.warpStrikeTimer = 300;
        player.warpStrikeLastUpdate = null;
        player.warpStrikeHit = false;
        
        this.game.createParticles(randomX + 15, randomY + 15, '#9370DB', 20);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendPlayerMove(randomX, randomY);
            this.game.supabaseGame.sendAttack({
                type: 'warp_strike_activate',
                playerId: player.id
            });
        }
    }

    activateVoidStep(player) {
        const nearestSurvivor = this.findNearestSurvivor(player);
        if (!nearestSurvivor) return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 60;
        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, nearestSurvivor.x + Math.cos(angle) * distance));
        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, nearestSurvivor.y + Math.sin(angle) * distance));
        
        player.x = newX;
        player.y = newY;
        
        this.game.createParticles(newX + 15, newY + 15, '#4B0082', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendPlayerMove(newX, newY);
        }
    }

    launchPhantomOrb(player) {
        const nearestSurvivor = this.findNearestSurvivor(player);
        if (!nearestSurvivor) return;
        
        const angle = Math.atan2(nearestSurvivor.y - player.y, nearestSurvivor.x - player.x);
        const speed = 8;
        
        const orbData = {
            type: 'phantom_orb',
            x: player.x + 15,
            y: player.y + 15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 20,
            life: 240,
            ownerId: player.id,
            color: '#8A2BE2',
            hasHit: false,
            exploded: false
        };
        
        this.game.hitboxes.push(orbData);
        this.game.createParticles(player.x + 15, player.y + 15, '#8A2BE2', 12);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'phantom_orb',
                attackData: orbData,
                playerId: player.id
            });
        }
    }

    findNearestSurvivor(killer) {
        const survivors = Object.values(this.game.players).filter(p => 
            p.role === 'survivor' && p.alive && !p.downed
        );
        
        if (survivors.length === 0) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        survivors.forEach(survivor => {
            const distance = Math.sqrt(
                Math.pow(killer.x - survivor.x, 2) + 
                Math.pow(killer.y - survivor.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = survivor;
            }
        });
        
        return nearest;
    }

    activateSharpWings(player) {
        player.sharpWingsActive = true;
        player.sharpWingsTimer = 300;
        player.sharpWingsHit = false;
        player.stunHits = 0;
        
        this.game.createParticles(player.x + 15, player.y + 15, '#FF69B4', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'sharp_wings_activate',
                playerId: player.id
            });
        }
    }

    activateCharge(player) {
        player.charging = true;
        player.chargeTimer = 420;
        player.chargeHit = false;
        player.grabbedKiller = null;
        player.chargeStunned = false;
        player.chargeFlash = true;
        player.chargeFlashTimer = 60;
        
        this.game.createParticles(player.x + 15, player.y + 15, '#00FFFF', 20);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'charge_activate',
                playerId: player.id
            });
        }
    }

    activateAutoRepair(player) {
        player.autoRepairing = true;
        player.autoRepairTimer = 1200;
        player.autoRepairTick = 0;
        
        this.game.createParticles(player.x + 15, player.y + 15, '#00FF00', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'auto_repair_activate',
                playerId: player.id
            });
        }
    }

    handleSelfDestruct(player) {
        if (this.game.gameModeManager?.lastManStanding) {
            this.activateSierra(player);
        } else if (player.health <= 50 || player.canSelfDestruct) {
            this.game.abilities.r.cooldown = 0;
            this.activateSelfDestruct(player);
        }
    }

    activateSierra(player) {
        player.sierraActive = true;
        player.sierraTimer = 180;
        player.sierraHit = false;
        player.sierraFlash = true;
        
        this.game.createParticles(player.x + 15, player.y + 15, '#FF0000', 25);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'sierra_activate',
                playerId: player.id
            });
        }
    }

    activateSelfDestruct(player) {
        console.log('Self destruct activated');
    }

    activateEnergyJuice(player) {
        player.energyJuiceActive = true;
        player.energyJuiceTimer = 600;
        player.speedBoost = true;
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#00FFFF', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'energy_juice_activate',
                playerId: player.id
            });
        }
    }

    activateAngelicSacrifice(player) {
        const nearbySurvivors = Object.values(this.game.players).filter(target => 
            target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
        );
        
        if (nearbySurvivors.length === 0 && player.lmsAngelPower) {
            const sacrifice = Math.floor(player.health * 0.3);
            player.health = Math.max(15, player.health - sacrifice);
            
            setTimeout(() => {
                if (player.alive) {
                    player.health = Math.min(player.maxHealth, player.health + sacrifice * 2);
                    this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FFD700', 30);
                }
            }, 2000);
            
            this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FFD700', 25);
            return;
        }
        
        if (nearbySurvivors.length === 0) return;
        
        let closestSurvivor = null;
        let minDistance = Infinity;
        
        nearbySurvivors.forEach(survivor => {
            const distance = Math.sqrt(
                Math.pow(player.x - survivor.x, 2) + 
                Math.pow(player.y - survivor.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestSurvivor = survivor;
            }
        });
        
        if (!closestSurvivor) return;
        
        const sacrifice = Math.floor(player.health * 0.4);
        player.health = Math.max(10, player.health - sacrifice);
        
        const healAmount = sacrifice + 15;
        closestSurvivor.health = Math.min(closestSurvivor.maxHealth, closestSurvivor.health + healAmount);
        closestSurvivor.angelSpeedBoost = true;
        closestSurvivor.speedBoostTimer = 600;
        closestSurvivor.angelBlessing = true;
        closestSurvivor.blessingTimer = 300;
        
        player.fatigued = true;
        player.fatigueTimer = 240;
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FFD700', 20);
        this.game.visualManager.createParticles(closestSurvivor.x + 15, closestSurvivor.y + 15, '#00FF00', 15);
    }

    activateProtectiveDash(player) {
        player.dashActive = true;
        player.dashTimer = 60;
        player.dashProtection = true;
        
        if (this.game.lastMouseX && this.game.lastMouseY) {
            const angle = Math.atan2(this.game.lastMouseY - (player.y + 15), this.game.lastMouseX - (player.x + 15));
            const dashDistance = player.lmsDashBoost ? 130 : 90;
            const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, player.x + Math.cos(angle) * dashDistance));
            const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, player.y + Math.sin(angle) * dashDistance));
            
            player.x = newX;
            player.y = newY;
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendPlayerMove(newX, newY);
            }
        }
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#87CEEB', 15);
    }

    activateRest(player) {
        player.restActive = true;
        player.restTimer = 600;
        player.restTick = 0;
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#98FB98', 20);
    }

    activateHealing(player) {
        const selfHeal = Math.floor(Math.random() * 11) + 10;
        player.health = Math.min(player.maxHealth, player.health + selfHeal);
        
        const nearbySurvivors = Object.values(this.game.players).filter(target => 
            target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
        );
        
        player.healingAura = true;
        player.healingTimer = nearbySurvivors.length > 0 ? 1200 : 300;
        player.healingTick = 0;
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#00FF7F', 25);
    }

    activateTelekinesis(player) {
        const nearbyKillers = Object.values(this.game.players).filter(target => 
            target.role === 'killer' && target.alive && target.id !== player.id
        );
        
        let telekinesisHit = false;
        nearbyKillers.forEach(target => {
            const distance = Math.sqrt(
                Math.pow(target.x - player.x, 2) + 
                Math.pow(target.y - player.y, 2)
            );
            
            if (distance <= 30) {
                telekinesisHit = true;
                
                const angle = Math.atan2(target.y - player.y, target.x - player.x);
                const pushDistance = 80;
                const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, 
                    target.x + Math.cos(angle) * pushDistance));
                const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, 
                    target.y + Math.sin(angle) * pushDistance));
                
                target.x = newX;
                target.y = newY;
                
                target.telekinesisEffect = true;
                target.telekinesisTimer = 300;
                
                this.game.visualManager.createParticles(target.x + 15, target.y + 15, '#9370DB', 20);
            }
        });
        
        if (telekinesisHit) {
            player.telekinesisActive = true;
            player.telekinesisTimer = 300;
        }
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#9370DB', 15);
    }

    activateIrisDash(player) {
        player.irisDashActive = true;
        player.irisDashTimer = 60;
        
        const nearbyKillers = Object.values(this.game.players).filter(target => 
            target.role === 'killer' && target.alive && target.id !== player.id
        );
        
        if (nearbyKillers.length > 0) {
            let closestKiller = null;
            let minDistance = Infinity;
            
            nearbyKillers.forEach(killer => {
                const distance = Math.sqrt(
                    Math.pow(killer.x - player.x, 2) + 
                    Math.pow(killer.y - player.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestKiller = killer;
                }
            });
            
            if (closestKiller) {
                const angle = Math.atan2(player.y - closestKiller.y, player.x - closestKiller.x);
                const dashDistance = 100;
                const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, 
                    player.x + Math.cos(angle) * dashDistance));
                const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, 
                    player.y + Math.sin(angle) * dashDistance));
                
                player.x = newX;
                player.y = newY;
                
                if (minDistance <= 50) {
                    closestKiller.stunned = true;
                    closestKiller.stunTimer = 120;
                    
                    this.game.visualManager.createParticles(closestKiller.x + 15, closestKiller.y + 15, '#FF69B4', 15);
                }
                
                player.dodgeBar = Math.min(player.maxDodgeBar, player.dodgeBar + 25);
            }
        }
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#00BFFF', 15);
    }
    
    activateMollyCharge(player) {
        const killer = Object.values(this.game.players).find(p => p.role === 'killer' && p.alive && p.id !== player.id);
        if (!killer) return;
        
        const angle = Math.atan2(killer.y - player.y, killer.x - player.x);
        const distance = 100;
        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, player.x + Math.cos(angle) * distance));
        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, player.y + Math.sin(angle) * distance));
        
        player.x = newX;
        player.y = newY;
        player.mollyChargeActive = true;
        player.mollyChargeTimer = 60;
        player.mollyImmune = true;
        
        const distanceToKiller = Math.sqrt(Math.pow(killer.x - newX, 2) + Math.pow(killer.y - newY, 2));
        if (distanceToKiller < 50) {
            const pushAngle = Math.atan2(killer.y - player.y, killer.x - player.x);
            const pushDistance = 120;
            const killerX = Math.max(0, Math.min(this.game.worldSize.width - 30, killer.x + Math.cos(pushAngle) * pushDistance));
            const killerY = Math.max(0, Math.min(this.game.worldSize.height - 30, killer.y + Math.sin(pushAngle) * pushDistance));
            
            killer.x = killerX;
            killer.y = killerY;
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendGrabbedPlayerMove(killer.id, killerX, killerY);
            }
            
            this.game.visualManager.createParticles(killer.x + 15, killer.y + 15, '#FFA500', 20);
        }
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendPlayerMove(newX, newY);
            this.game.supabaseGame.sendAttack({
                type: 'molly_charge',
                playerId: player.id
            });
        }
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FFA500', 15);
    }
    
    activateCookie(player) {
        const heal = 20;
        player.health = Math.min(player.maxHealth, player.health + heal);
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FFD700', 12);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'heal',
                targetId: player.id,
                health: player.health
            });
        }
    }
    
    activateUppercut(player) {
        const killer = Object.values(this.game.players).find(p => p.role === 'killer' && p.alive && p.id !== player.id);
        if (!killer) return;
        
        const distance = Math.sqrt(Math.pow(killer.x - player.x, 2) + Math.pow(killer.y - player.y, 2));
        
        if (distance < 60) {
            if (!(killer.rageMode && killer.rageMode.active)) {
                killer.stunned = true;
                killer.stunTimer = 180;
                
                if (killer.role === 'killer' && !killer.rageUsed) {
                    killer.rageLevel = Math.min(killer.maxRage, killer.rageLevel + 30);
                }
            }
            
            player.y = Math.max(0, player.y - 10);
            
            this.game.visualManager.createParticles(killer.x + 15, killer.y + 15, '#FF6347', 20);
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendAttack({
                    type: 'stun',
                    targetId: killer.id,
                    stunDuration: 180
                });
                this.game.supabaseGame.sendPlayerMove(player.x, player.y);
            }
        }
        
        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FF6347', 15);
    }

    activateLunaPunch(player) {
        const nearestKiller = Object.values(this.game.players).find(p => 
            p.role === 'killer' && p.alive && p.id !== player.id
        );
        
        if (!nearestKiller) return;
        
        const angle = Math.atan2(nearestKiller.y - player.y, nearestKiller.x - player.x);
        const dashDistance = 80;
        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, 
            player.x + Math.cos(angle) * dashDistance));
        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, 
            player.y + Math.sin(angle) * dashDistance));
        
        player.x = newX;
        player.y = newY;
        player.punchActive = true;
        player.punchTimer = 60;
        
        this.game.createParticles(player.x + 15, player.y + 15, '#FFD700', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendPlayerMove(newX, newY);
        }
    }

    activateTaunt(player) {
        player.tauntActive = true;
        player.tauntTimer = 60;
        player.tauntHit = false;
        
        this.game.createParticles(player.x + 15, player.y + 15, '#FF69B4', 15);
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'taunt_activate',
                playerId: player.id
            });
        }
    }

    // Update methods for abilities
    updateStealth() {
        Object.values(this.game.players).forEach(player => {
            if (player.stealthMode && player.stealthTimer > 0) {
                player.stealthTimer--;
                
                if (Math.random() < 0.3) {
                    this.game.createParticles(player.x + Math.random() * 30, player.y + Math.random() * 30, '#2C2C2C', 1);
                }
                
                if (player.stealthTimer <= 0) {
                    player.stealthMode = false;
                    this.game.createParticles(player.x + 15, player.y + 15, '#FF0000', 10);
                }
            }
        });
    }

    updateRageMode() {
        Object.values(this.game.players).forEach(player => {
            if (player.role === 'killer') {
                if (!player.rageMode) {
                    player.rageMode = { active: false, timer: 0 };
                }
                if (player.rageLevel === undefined) {
                    player.rageLevel = 0;
                }
                if (player.maxRage === undefined) {
                    player.maxRage = 500;
                }
                
                if (player.rageUsed) {
                    player.rageLevel = 0;
                }
                
                if (player.rageMode && player.rageMode.active) {
                    player.rageMode.timer--;
                    
                    if (Math.random() < 0.4) {
                        this.game.createParticles(
                            player.x + Math.random() * 30, 
                            player.y + Math.random() * 30, 
                            '#FF4500', 
                            1
                        );
                    }
                    
                    if (player.rageMode.timer <= 0) {
                        player.rageMode.active = false;
                        this.game.createParticles(player.x + 15, player.y + 15, '#8B0000', 8);
                    }
                }
            }
        });
    }

    updateVortexAbilities() {
        Object.values(this.game.players).forEach(player => {
            if (player.character === 'vortex') {
                if (player.warpStrikeActive) {
                    player.warpStrikeTimer--;
                    
                    const nearestSurvivor = this.findNearestSurvivor(player);
                    if (nearestSurvivor && player.id === this.game.myPlayerId) {
                        const angle = Math.atan2(nearestSurvivor.y - player.y, nearestSurvivor.x - player.x);
                        const speed = 6.5;
                        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, player.x + Math.cos(angle) * speed));
                        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, player.y + Math.sin(angle) * speed));
                        
                        player.x = newX;
                        player.y = newY;
                        
                        const distance = Math.sqrt(
                            Math.pow(nearestSurvivor.x - player.x, 2) + 
                            Math.pow(nearestSurvivor.y - player.y, 2)
                        );
                        
                        if (distance < 40 && !player.warpStrikeHit) {
                            player.warpStrikeHit = true;
                            player.warpStrikeActive = false;
                            this.handleWarpStrikeDamage(player, nearestSurvivor);
                        }
                        
                        if (!player.warpStrikeLastUpdate || Date.now() - player.warpStrikeLastUpdate > 100) {
                            if (this.game.supabaseGame) {
                                this.game.supabaseGame.sendPlayerMove(newX, newY);
                            }
                            player.warpStrikeLastUpdate = Date.now();
                        }
                    }
                    
                    if (player.warpStrikeTimer <= 0) {
                        player.warpStrikeActive = false;
                        player.warpStrikeLastUpdate = null;
                    }
                }
                
                if (player.powerSurge && player.powerSurge.active) {
                    player.powerSurge.timer--;
                    
                    if (player.powerSurge.timer <= 0) {
                        player.powerSurge.active = false;
                    }
                }
            }
        });
    }

    handleWarpStrikeDamage(attacker, target) {
        if (target.character === 'iris' && target.dodgeBar > 0) {
            target.dodgeHits++;
            if (target.dodgeHits <= 2) {
                target.dodgeBar = Math.max(0, target.dodgeBar - 37.5);
                this.game.createParticles(target.x + 15, target.y + 15, '#00BFFF', 15);
                this.game.showDamageIndicator(target, 0, 'dodged');
                return;
            }
        }
        
        let damage = 35;
        if (attacker.powerSurge && attacker.powerSurge.active) {
            damage = Math.floor(damage * 1.5);
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
                this.game.audioManager?.playDeathSound();
                this.game.gameModeManager.gameTimer += 15;
            } else {
                this.setPlayerDowned(target);
                this.game.gameModeManager.gameTimer += 10;
            }
        }
        
        this.game.createParticles(target.x + 15, target.y + 15, '#9370DB', 20);
        this.game.showDamageIndicator(target, damage, 'warp_strike');
    }

    setPlayerDowned(target) {
        target.downed = true;
        target.alive = true;
        target.reviveTimer = 1200;
        target.beingRevived = false;
        this.game.gameModeManager.gameTimer += 10;
    }

    updateSharpWings() {
        Object.values(this.game.players).forEach(player => {
            if (player.sharpWingsActive) {
                player.sharpWingsTimer--;
                
                const nearbyKillers = Object.values(this.game.players).filter(target => 
                    target.role === 'killer' && target.alive && target.id !== player.id
                );
                
                nearbyKillers.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 40 && !player.sharpWingsHit) {
                        player.sharpWingsHit = true;
                        player.sharpWingsActive = false;
                        player.stunHits = (player.stunHits || 0) + 1;
                        
                        let stunDuration = player.stunHits >= 3 ? 180 : 90;
                        if (!(target.rageMode && target.rageMode.active)) {
                            target.stunned = true;
                            target.stunTimer = stunDuration;
                            
                            if (target.role === 'killer' && !target.rageUsed) {
                                target.rageLevel = Math.min(target.maxRage, target.rageLevel + 30);
                            }
                        }
                        
                        const angle = Math.atan2(target.y - player.y, target.x - player.x);
                        const knockback = 80;
                        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, 
                            target.x + Math.cos(angle) * knockback));
                        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, 
                            target.y + Math.sin(angle) * knockback));
                        
                        target.x = newX;
                        target.y = newY;
                        
                        this.game.createParticles(target.x + 15, target.y + 15, '#FF69B4', 15);
                    }
                });
                
                if (player.sharpWingsTimer <= 0) {
                    player.sharpWingsActive = false;
                }
            }
            
            if (player.stunned) {
                player.stunTimer--;
                
                if (player.role === 'killer' && !player.rageUsed && player.rageLevel < player.maxRage) {
                    player.rageLevel = Math.min(player.maxRage, player.rageLevel + 5);
                }
                
                if (player.stunTimer <= 0) {
                    player.stunned = false;
                }
            }
        });
    }

    updateYouCantRun() {
        Object.values(this.game.players).forEach(player => {
            if (player.youCantRunActive) {
                player.youCantRunTimer--;
                
                const nearbyTargets = Object.values(this.game.players).filter(target => 
                    target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
                );
                
                nearbyTargets.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 50 && !player.youCantRunHit) {
                        player.youCantRunHit = true;
                        player.youCantRunActive = false;
                        
                        let damage = 25;
                        if (player.rageMode && player.rageMode.active) {
                            damage = Math.floor(damage * 1.5);
                        }
                        
                        target.health = Math.max(0, target.health - damage);
                        this.game.createParticles(target.x + 15, target.y + 15, '#8B0000', 15);
                        this.game.triggerJumpscare(target.id);
                        
                        if (target.autoRepairing) {
                            target.autoRepairing = false;
                            target.autoRepairTimer = 0;
                        }
                        
                        if (target.health <= 0) {
                            if (target.lastLife || target.character === 'iA777') {
                                target.alive = false;
                                target.spectating = true;
                                this.game.audioManager?.playDeathSound();
                            } else {
                                this.setPlayerDowned(target);
                            }
                        }
                        
                        this.game.showDamageIndicator(target, damage, 'you_cant_run');
                    }
                });
                
                if (player.youCantRunTimer <= 0) {
                    player.youCantRunActive = false;
                }
            }
        });
    }

    updateCharge() {
        Object.values(this.game.players).forEach(player => {
            if (player.charging) {
                player.chargeTimer--;
                
                if (player.chargeFlashTimer > 0) {
                    player.chargeFlashTimer--;
                    if (player.chargeFlashTimer <= 0) {
                        player.chargeFlash = false;
                    }
                }
                
                if (!player.grabbedKiller && !player.chargeFlash) {
                    const nearbyKillers = Object.values(this.game.players).filter(target => 
                        target.role === 'killer' && target.alive && target.id !== player.id
                    );
                    
                    nearbyKillers.forEach(target => {
                        const distance = Math.sqrt(
                            Math.pow(target.x - player.x, 2) + 
                            Math.pow(target.y - player.y, 2)
                        );
                        
                        if (distance < 40 && !player.chargeHit) {
                            player.chargeHit = true;
                            player.grabbedKiller = target.id;
                            player.chargeStunned = true;
                            
                            if (!(target.rageMode && target.rageMode.active)) {
                                target.stunned = true;
                                target.stunTimer = 420;
                                
                                if (target.role === 'killer' && !target.rageUsed) {
                                    target.rageLevel = Math.min(target.maxRage, target.rageLevel + 30);
                                }
                            }
                            target.grabbedBy = player.id;
                            
                            this.game.createParticles(target.x + 15, target.y + 15, '#00FFFF', 20);
                        }
                    });
                }
                
                if (player.grabbedKiller && player.chargeStunned) {
                    if (player.chargeTimer % 60 === 0 && player.id === this.game.myPlayerId) {
                        player.health = Math.max(0, player.health - 4);
                        this.game.createParticles(player.x + 15, player.y + 15, '#FF0000', 8);
                    }
                }
                
                if (player.grabbedKiller) {
                    const margin = 50;
                    if (player.x <= margin || player.x >= this.game.worldSize.width - margin - 30 ||
                        player.y <= margin || player.y >= this.game.worldSize.height - margin - 30) {
                        player.wallStunned = true;
                        player.wallStunTimer = 60;
                        player.charging = false;
                        player.grabbedKiller = null;
                        player.chargeStunned = false;
                        
                        const killer = this.game.players[player.grabbedKiller];
                        if (killer) {
                            killer.grabbedBy = null;
                        }
                        
                        this.game.createParticles(player.x + 15, player.y + 15, '#8B4513', 15);
                    }
                }
                
                if (player.chargeTimer <= 0) {
                    player.charging = false;
                    player.chargeDirection = null;
                    
                    if (player.grabbedKiller) {
                        const killer = this.game.players[player.grabbedKiller];
                        if (killer) {
                            if (player.chargeDirection) {
                                const pushDistance = 150;
                                killer.x = Math.max(0, Math.min(this.game.worldSize.width - 30, 
                                    killer.x + player.chargeDirection.x * pushDistance));
                                killer.y = Math.max(0, Math.min(this.game.worldSize.height - 30, 
                                    killer.y + player.chargeDirection.y * pushDistance));
                            }
                            
                            if (!(killer.rageMode && killer.rageMode.active)) {
                                killer.stunned = true;
                                killer.stunTimer = 180;
                            }
                        }
                    }
                    
                    player.grabbedKiller = null;
                    player.chargeStunned = false;
                    
                    Object.values(this.game.players).forEach(killer => {
                        if (killer.grabbedBy === player.id) {
                            killer.grabbedBy = null;
                        }
                    });
                }
            }
            
            if (player.wallStunned) {
                player.wallStunTimer--;
                if (player.wallStunTimer <= 0) {
                    player.wallStunned = false;
                }
            }
        });
    }

    updateAutoRepair() {
        Object.values(this.game.players).forEach(player => {
            if (player.autoRepairing) {
                player.autoRepairTimer--;
                player.autoRepairTick++;
                
                if (player.autoRepairTick >= 180 && player.id === this.game.myPlayerId) {
                    let maxHealHealth = 100;
                    if (player.character === 'iA777' && this.game.gameModeManager?.lastManStanding) {
                        maxHealHealth = player.maxHealth;
                    }
                    
                    if (player.health < maxHealHealth) {
                        player.health = Math.min(maxHealHealth, player.health + 5);
                        this.game.createParticles(player.x + 15, player.y + 15, '#00FF00', 8);
                    }
                    player.autoRepairTick = 0;
                }
                
                if (player.autoRepairTimer <= 0) {
                    player.autoRepairing = false;
                }
            }
        });
    }

    updateSelfDestruct() {
        Object.values(this.game.players).forEach(player => {
            if (player.character === 'iA777' && player.health <= 50 && !player.canSelfDestruct) {
                player.canSelfDestruct = true;
            }
            
            if (player.sierraActive) {
                player.sierraTimer--;
                
                const nearbyKillers = Object.values(this.game.players).filter(target => 
                    target.role === 'killer' && target.alive && target.id !== player.id
                );
                
                nearbyKillers.forEach(target => {
                    const distance = Math.sqrt(
                        Math.pow(target.x - player.x, 2) + 
                        Math.pow(target.y - player.y, 2)
                    );
                    
                    if (distance < 50 && !player.sierraHit) {
                        player.sierraHit = true;
                        
                        if (!(target.rageMode && target.rageMode.active)) {
                            const stunDuration = this.game.gameModeManager?.lastManStanding ? 420 : 300;
                            target.stunned = true;
                            target.stunTimer = stunDuration;
                            
                            if (target.role === 'killer' && !target.rageUsed) {
                                target.rageLevel = Math.min(target.maxRage, target.rageLevel + 100);
                            }
                        }
                        
                        const angle = Math.atan2(target.y - player.y, target.x - player.x);
                        const pushDistance = 120;
                        const newX = Math.max(0, Math.min(this.game.worldSize.width - 30, 
                            target.x + Math.cos(angle) * pushDistance));
                        const newY = Math.max(0, Math.min(this.game.worldSize.height - 30, 
                            target.y + Math.sin(angle) * pushDistance));
                        
                        target.x = newX;
                        target.y = newY;
                        
                        this.game.createParticles(target.x + 15, target.y + 15, '#FF0000', 25);
                    }
                });
                
                if (player.sierraTimer <= 0) {
                    player.sierraActive = false;
                    player.sierraFlash = false;
                }
            }
        });
    }

    updateLunaAbilities() {
        Object.values(this.game.players).forEach(player => {
            if (player.character === 'luna' && player.lunaLifeGain === undefined) {
                player.lunaLifeGain = 0;
            }
            
            if (player.energyJuiceActive) {
                player.energyJuiceTimer--;
                if (player.energyJuiceTimer <= 0) {
                    player.energyJuiceActive = false;
                    player.speedBoost = false;
                }
            }
            
            if (player.punchActive) {
                player.punchTimer--;
                if (player.punchTimer <= 0) {
                    player.punchActive = false;
                }
            }
            
            if (player.tauntActive) {
                player.tauntTimer--;
                if (player.tauntTimer <= 0) {
                    player.tauntActive = false;
                }
            }
            
            if (player.screenBlurred) {
                player.blurTimer--;
                if (player.blurTimer <= 0) {
                    player.screenBlurred = false;
                }
            }
        });
    }

    updateAngelAbilities() {
        Object.values(this.game.players).forEach(player => {
            if (player.fatigued) {
                player.fatigueTimer--;
                if (player.fatigueTimer <= 0) {
                    player.fatigued = false;
                }
            }
            
            if (player.angelBlessing) {
                player.blessingTimer--;
                if (player.blessingTimer <= 0) {
                    player.angelBlessing = false;
                }
            }
            
            if (player.angelSpeedBoost) {
                player.speedBoostTimer--;
                if (player.speedBoostTimer <= 0) {
                    player.angelSpeedBoost = false;
                }
            }
            
            if (player.dashActive) {
                player.dashTimer--;
                if (player.dashTimer <= 0) {
                    player.dashActive = false;
                    player.dashProtection = false;
                }
            }
            
            if (player.restActive) {
                player.restTimer--;
                player.restTick++;
                
                if (player.restTick >= 60) {
                    if (player.id === this.game.myPlayerId && player.health < player.maxHealth) {
                        const healAmount = player.lmsHealBoost ? 6 : 3;
                        player.health = Math.min(player.maxHealth, player.health + healAmount);
                        this.game.createParticles(player.x + 15, player.y + 15, '#98FB98', player.lmsHealBoost ? 8 : 5);
                    }
                    
                    const nearbySurvivors = Object.values(this.game.players).filter(target => 
                        target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
                    );
                    
                    nearbySurvivors.forEach(target => {
                        const distance = Math.sqrt(
                            Math.pow(target.x - player.x, 2) + 
                            Math.pow(target.y - player.y, 2)
                        );
                        
                        if (distance < 120 && target.health < target.maxHealth) {
                            const healAmount = target.angelBlessing ? 8 : 6;
                            target.health = Math.min(target.maxHealth, target.health + healAmount);
                            this.game.createParticles(target.x + 15, target.y + 15, '#98FB98', 3);
                        }
                    });
                    
                    player.restTick = 0;
                }
                
                if (player.restTimer <= 0) {
                    player.restActive = false;
                }
            }
        });
    }

    updateIrisAbilities() {
        Object.values(this.game.players).forEach(player => {
            if (player.character === 'iris' && player.dodgeBar < player.maxDodgeBar) {
                if (!player.dodgeRegenTimer) player.dodgeRegenTimer = 0;
                player.dodgeRegenTimer++;
                
                if (player.dodgeRegenTimer >= 120) {
                    player.dodgeBar = Math.min(player.maxDodgeBar, player.dodgeBar + 1);
                    player.dodgeRegenTimer = 0;
                }
            }
            
            if (player.healingAura) {
                player.healingTimer--;
                player.healingTick++;
                
                if (player.healingTick >= 180) {
                    const nearbySurvivors = Object.values(this.game.players).filter(target => 
                        target.role === 'survivor' && target.alive && target.id !== player.id && !target.downed
                    );
                    
                    nearbySurvivors.forEach(target => {
                        if (target.health < target.maxHealth) {
                            target.health = Math.min(target.maxHealth, target.health + 15);
                            this.game.createParticles(target.x + 15, target.y + 15, '#00FF7F', 8);
                        }
                    });
                    
                    player.healingTick = 0;
                }
                
                if (player.healingTimer <= 0) {
                    player.healingAura = false;
                }
            }
            
            if (player.telekinesisActive) {
                player.telekinesisTimer--;
                if (player.telekinesisTimer <= 0) {
                    player.telekinesisActive = false;
                }
            }
            
            if (player.telekinesisEffect) {
                player.telekinesisTimer--;
                if (player.telekinesisTimer <= 0) {
                    player.telekinesisEffect = false;
                }
            }
            
            if (player.irisDashActive) {
                player.irisDashTimer--;
                if (player.irisDashTimer <= 0) {
                    player.irisDashActive = false;
                }
            }
        });
    }

    updateMollyAbilities() {
        Object.values(this.game.players).forEach(player => {
            if (player.character === 'molly') {
                if (player.mollyChargeActive) {
                    player.mollyChargeTimer--;
                    if (player.mollyChargeTimer <= 0) {
                        player.mollyChargeActive = false;
                    }
                }
                
                if (player.mollyImmune) {
                    player.mollyImmuneTimer--;
                    if (player.mollyImmuneTimer <= 0) {
                        player.mollyImmune = false;
                    }
                }
            }
        });
    }

    updateReviveSystem() {
        Object.values(this.game.players).forEach(player => {
            if (player.downed && player.reviveTimer > 0) {
                player.reviveTimer--;
                
                if (player.reviveTimer <= 0) {
                    player.downed = false;
                    player.spectating = true;
                    this.game.audioManager?.playDeathSound();
                    this.game.gameModeManager.gameTimer += 15;
                    
                    if (this.game.sandboxMode && player.role === 'survivor' && player.id !== this.game.myPlayerId) {
                        const otherDummies = Object.values(this.game.players).filter(p => 
                            p.id !== this.game.myPlayerId && p.id !== player.id && p.role === 'survivor' && p.alive && !p.downed
                        );
                        if (otherDummies.length > 0) {
                            const reviver = otherDummies[0];
                            reviver.beingRevived = false;
                            player.alive = true;
                            player.downed = false;
                            player.health = 60;
                            player.lastLife = true;
                            this.game.createParticles(player.x + 15, player.y + 15, '#00FF00', 20);
                        }
                    }
                }
                
                if (!player.beingRevived) {
                    const nearbyReviver = Object.values(this.game.players).find(other => 
                        other.id !== player.id && 
                        other.role === 'survivor' && 
                        other.alive && 
                        !other.downed &&
                        Math.sqrt(Math.pow(other.x - player.x, 2) + Math.pow(other.y - player.y, 2)) < 50
                    );
                    
                    if (nearbyReviver && nearbyReviver.id === this.game.myPlayerId) {
                        this.game.showRevivePrompt = player.id;
                    } else if (this.game.showRevivePrompt === player.id) {
                        const myPlayer = this.game.players[this.game.myPlayerId];
                        if (myPlayer && Math.sqrt(Math.pow(myPlayer.x - player.x, 2) + Math.pow(myPlayer.y - player.y, 2)) >= 50) {
                            this.game.showRevivePrompt = null;
                        }
                    }
                } else {
                    player.reviveProgress = (player.reviveProgress || 0) + 1;
                    if (player.reviveProgress >= 180) {
                        player.alive = true;
                        player.downed = false;
                        player.beingRevived = false;
                        player.health = 60;
                        player.lastLife = true;
                        player.reviveProgress = 0;
                    }
                }
            }
        });
    }
}