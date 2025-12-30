export class VisualManager {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.damageIndicators = [];
        this.hitConfirmations = [];
        this.characterIcons = {};
        this.loadCharacterIcons();
    }
    
    loadCharacterIcons() {
        const iconMap = {
            '2019x': 'assets/icons/2019XNormalIcon.png',
            'vortex': 'assets/icons/VortexNormalIcon.png',
            'gissel': 'assets/icons/GisselNormalIcon.png',
            'iA777': 'assets/icons/IA777NormalIcon.png',
            'luna': 'assets/icons/LunaNormalIcon.png',
            'angel': 'assets/icons/AngelNormalIcon.png',
            'iris': 'assets/icons/IrisNormalIcon.png',
            'molly': 'assets/icons/MollyNormalIcon.png'
        };
        
        Object.keys(iconMap).forEach(char => {
            const img = new Image();
            img.src = iconMap[char];
            this.characterIcons[char] = img;
        });
    }
    
    setupCanvas(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
        }
        return { canvas: this.canvas, ctx: this.ctx };
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.cssWidth = rect.width;
        this.canvas.cssHeight = rect.height;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    createParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: color,
                life: 30 + Math.random() * 30,
                maxLife: 60
            });
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            return particle.life > 0;
        });
    }
    
    drawParticles() {
        if (!this.ctx) return;
        
        this.ctx.save();
        this.ctx.translate(-this.game.camera.x, -this.game.camera.y);
        
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    showDamageIndicator(target, damage, type) {
        const indicator = {
            x: target.x + 15,
            y: target.y - 10,
            damage: damage,
            type: type,
            timer: 120,
            alpha: 1.0,
            color: this.getDamageColor(type, damage)
        };
        
        this.damageIndicators.push(indicator);
    }

    getDamageColor(type, damage) {
        switch (type) {
            case 'dodged': return '#00BFFF';
            case 'warp_strike': return '#9370DB';
            case 'you_cant_run': return '#8B0000';
            case 'white_orb': return '#FF8000';
            case 'phantom_orb': return '#8A2BE2';
            case 'basic_attack': return damage > 30 ? '#FFD700' : '#FF0000';
            default: return '#FF0000';
        }
    }

    updateDamageIndicators() {
        this.damageIndicators = this.damageIndicators.filter(indicator => {
            indicator.timer--;
            indicator.y -= 1;
            indicator.alpha = indicator.timer / 120;
            return indicator.timer > 0;
        });
    }

    drawDamageIndicators() {
        if (!this.ctx) return;
        
        this.ctx.save();
        this.ctx.translate(-this.game.camera.x, -this.game.camera.y);
        
        this.damageIndicators.forEach(indicator => {
            this.ctx.save();
            this.ctx.globalAlpha = indicator.alpha;
            this.ctx.fillStyle = indicator.color;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            
            const text = indicator.type === 'dodged' ? 'DODGED!' : `-${indicator.damage}`;
            this.ctx.strokeText(text, indicator.x, indicator.y);
            this.ctx.fillText(text, indicator.x, indicator.y);
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }

    triggerJumpscare(targetPlayerId) {
        if (targetPlayerId === this.game.myPlayerId) {
            this.showJumpscare();
        }
    }

    showJumpscare() {
        const jumpscareDiv = document.createElement('div');
        jumpscareDiv.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: #000; z-index: 10000; display: flex; flex-direction: column;
            justify-content: center; align-items: center; animation: jumpscareFlash 0.5s ease-out;
        `;
        
        jumpscareDiv.innerHTML = `
            <div style="font-size: 8rem; color: #FF0000; text-shadow: 0 0 50px #FF0000; animation: shake 0.5s infinite;">
                👹
            </div>
            <div style="font-size: 4rem; color: #FF0000; font-weight: bold; text-shadow: 0 0 30px #FF0000; margin-top: 2rem; animation: glow 0.3s infinite alternate;">
                I AM GOD
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes jumpscareFlash {
                0% { opacity: 0; transform: scale(0.5); }
                50% { opacity: 1; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            @keyframes glow {
                from { text-shadow: 0 0 30px #FF0000; }
                to { text-shadow: 0 0 50px #FF0000, 0 0 70px #FF0000; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(jumpscareDiv);
        
        setTimeout(() => {
            document.body.removeChild(jumpscareDiv);
            document.head.removeChild(style);
        }, 1500);
    }
    
    render(game) {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#2F4F2F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map
        if (game.mapSystem) {
            game.mapSystem.drawMapObjects(this.ctx, game.camera);
        }
        
        // Draw players
        this.drawPlayers(game);
        
        // Draw hitboxes
        this.drawHitboxes(game);
        
        // Draw particles and effects
        this.drawParticles();
        this.drawDamageIndicators();
        
        // Draw UI
        this.drawGameUI(game);
    }
    
    drawPlayers(game) {
        if (!this.ctx) return;
        
        this.ctx.save();
        this.ctx.translate(-game.camera.x, -game.camera.y);
        
        Object.values(game.players).forEach(player => {
            if (!player.alive && !player.spectating) return;
            
            // Draw player
            this.ctx.fillStyle = player.role === 'killer' ? '#FF0000' : '#00FF00';
            this.ctx.fillRect(player.x, player.y, 30, 30);
            
            // Draw player name
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name, player.x + 15, player.y - 5);
        });
        
        this.ctx.restore();
    }
    
    drawGameUI(game) {
        if (!this.ctx) return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const canvasWidth = this.canvas.cssWidth || this.canvas.width;
        const canvasHeight = this.canvas.cssHeight || this.canvas.height;
        
        // Draw timer in center with custom font
        const minutes = Math.floor(game.gameTimer / 60);
        const seconds = Math.floor(game.gameTimer % 60);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px MilkyNice, Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(timeText, canvasWidth / 2, 50);
        this.ctx.fillText(timeText, canvasWidth / 2, 50);
        
        // Draw player info
        const myPlayer = game.players[game.myPlayerId];
        if (myPlayer) {
            // Draw abilities UI
            const abilities = ['q', 'e', 'r'];
            const abilityNames = {
                q: myPlayer.role === 'killer' ? 'Stealth' : 'Charge',
                e: myPlayer.role === 'killer' ? 'Hunt' : 'Repair', 
                r: myPlayer.role === 'killer' ? 'Orb' : 'Ultimate'
            };
            
            abilities.forEach((key, index) => {
            const ability = game.abilities[key];
            const x = canvasWidth - 80 - (index * 90);
            const y = canvasHeight - 80;
            const size = 60;
            
            // Background
            this.ctx.fillStyle = ability.cooldown > 0 ? 'rgba(100,100,100,0.8)' : 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(x, y, size, size);
            
            // Border
            this.ctx.strokeStyle = ability.cooldown > 0 ? '#666' : '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, size, size);
            
            // Cooldown overlay
            if (ability.cooldown > 0) {
                const cooldownPercent = ability.cooldown / ability.maxCooldown;
                this.ctx.fillStyle = 'rgba(255,0,0,0.6)';
                this.ctx.fillRect(x, y + size * (1 - cooldownPercent), size, size * cooldownPercent);
            }
            
            // Key letter
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(key.toUpperCase(), x + size/2, y + 20);
            
            // Ability name
            this.ctx.font = '10px Arial';
            this.ctx.fillText(abilityNames[key], x + size/2, y + size - 5);
            
            // Cooldown text
            if (ability.cooldown > 0) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = 'bold 12px Arial';
                const cooldownSeconds = Math.ceil(ability.cooldown / 16.67); // 60fps to seconds
                this.ctx.fillText(cooldownSeconds + 's', x + size/2, y + size/2 + 5);
            }
            });
        }
        
        // Draw player info again for health bar
        if (myPlayer) {
            this.ctx.font = '16px MilkyNice, Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            
            const playerInfo = `${myPlayer.name} (${myPlayer.character})`;
            this.ctx.strokeText(playerInfo, 20, 30);
            this.ctx.fillText(playerInfo, 20, 30);
            
            // Health bar styled like the image
            const barWidth = 180;
            const barHeight = 20;
            const iconSize = 50;
            const healthPercent = Math.min(1, myPlayer.health / 100);
            const isOverhealed = myPlayer.health > 100;
            
            // Draw character icon frame
            this.ctx.fillStyle = '#2C1810';
            this.ctx.fillRect(15, 35, iconSize + 6, iconSize + 6);
            this.ctx.fillStyle = '#1A0F08';
            this.ctx.fillRect(18, 38, iconSize, iconSize);
            
            // Draw character icon with health phases
            const icon = this.characterIcons[myPlayer.character];
            if (icon && icon.complete && icon.naturalWidth > 0) {
                this.ctx.drawImage(icon, 18, 38, iconSize, iconSize);
                
                // Health phase overlay
                if (myPlayer.health <= 25) {
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                    this.ctx.fillRect(18, 38, iconSize, iconSize);
                } else if (myPlayer.health <= 50) {
                    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
                    this.ctx.fillRect(18, 38, iconSize, iconSize);
                }
            }
            
            // Draw health bar frame
            const barX = 75;
            const barY = 50;
            this.ctx.fillStyle = '#2C1810';
            this.ctx.fillRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6);
            this.ctx.fillStyle = '#1A0F08';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Draw health fill
            if (healthPercent > 0) {
                const gradient = this.ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
                if (isOverhealed) {
                    gradient.addColorStop(0, '#B347D9');
                    gradient.addColorStop(0.5, '#8A2BE2');
                    gradient.addColorStop(1, '#5D1A8B');
                } else {
                    if (myPlayer.role === 'killer') {
                        gradient.addColorStop(0, '#FF4444');
                        gradient.addColorStop(0.5, '#FF0000');
                        gradient.addColorStop(1, '#CC0000');
                    } else {
                        gradient.addColorStop(0, '#44FF44');
                        gradient.addColorStop(0.5, '#00FF00');
                        gradient.addColorStop(1, '#00CC00');
                    }
                }
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            }
            
            // Draw metallic borders
            this.ctx.strokeStyle = '#8B7355';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
            this.ctx.strokeRect(16, 36, iconSize + 4, iconSize + 4);
            
            // Draw inner highlights
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX + 0.5, barY + 0.5, barWidth - 1, barHeight - 1);
            this.ctx.strokeRect(17.5, 37.5, iconSize + 1, iconSize + 1);
            
            // Draw health text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            const healthText = `${myPlayer.health}`;
            this.ctx.strokeText(healthText, barX + barWidth/2, barY + barHeight/2 + 4);
            this.ctx.fillText(healthText, barX + barWidth/2, barY + barHeight/2 + 4);
        }
        
        this.ctx.restore();
    }
    
    drawHitboxes(game) {
        if (!this.ctx) return;
        
        this.ctx.save();
        this.ctx.translate(-game.camera.x, -game.camera.y);
        
        game.hitboxes.forEach(hitbox => {
            if (hitbox.type === 'white_orb') {
                if (hitbox.trail) {
                    hitbox.trail.forEach(point => {
                        this.ctx.save();
                        this.ctx.globalAlpha = point.alpha;
                        this.ctx.fillStyle = hitbox.color;
                        this.ctx.beginPath();
                        this.ctx.arc(point.x, point.y, hitbox.radius * 0.6, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                    });
                }
                
                this.ctx.save();
                this.ctx.shadowColor = hitbox.color;
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = hitbox.color;
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.arc(hitbox.x, hitbox.y, hitbox.radius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            } else if (hitbox.type === 'basic_attack') {
                const alpha = Math.min(0.5, hitbox.life / 30);
                this.ctx.save();
                this.ctx.fillStyle = hitbox.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                this.ctx.restore();
            } else {
                const alpha = Math.min(0.3, hitbox.life / 30);
                this.ctx.strokeStyle = hitbox.color;
                this.ctx.fillStyle = hitbox.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.lineWidth = 2;
                
                this.ctx.beginPath();
                this.ctx.arc(hitbox.x, hitbox.y, hitbox.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.globalAlpha = alpha * 0.2;
                this.ctx.fill();
                
                this.ctx.globalAlpha = 1.0;
            }
        });
        
        this.ctx.restore();
    }
    
    update() {
        this.updateParticles();
        this.updateDamageIndicators();
    }
}