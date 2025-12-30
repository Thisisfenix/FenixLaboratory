export class GameStateManager {
    constructor(game) {
        this.game = game;
    }
    
    checkGameStart() {
        const playerList = Object.values(this.game.playersInLobby);
        const survivors = playerList.filter(p => p.role === 'survivor').length;
        const killers = playerList.filter(p => p.role === 'killer').length;
        
        if (this.game.countdownActive && (this.game.lobbyCountdown > 30 || this.game.lobbyCountdown < 0)) {
            this.resetCountdown();
            return;
        }
        
        if (playerList.length >= 2 && survivors >= 1 && killers >= 1 && !this.game.countdownActive) {
            const sortedPlayers = playerList.sort((a, b) => a.id.localeCompare(b.id));
            if (sortedPlayers[0].id === this.game.myPlayerId) {
                this.startLobbyCountdown();
            }
        }
    }
    
    startLobbyCountdown() {
        if (this.game.countdownInterval) {
            clearInterval(this.game.countdownInterval);
        }
        
        this.game.countdownActive = true;
        this.game.lobbyCountdown = 30;
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendCountdownStart(this.game.lobbyCountdown);
        }
        
        this.game.countdownInterval = setInterval(() => {
            this.game.lobbyCountdown--;
            
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendCountdownUpdate(this.game.lobbyCountdown);
            }
            
            this.game.uiManager.updateLobbyUI(this.game.playersInLobby, this.game.currentLobby, this.game.countdownActive, this.game.lobbyCountdown);
            
            if (this.game.lobbyCountdown <= 0) {
                clearInterval(this.game.countdownInterval);
                this.game.countdownInterval = null;
                this.game.countdownActive = false;
                
                try {
                    if (this.game.supabaseGame) {
                        this.game.supabaseGame.sendGameStart();
                    }
                    this.game.uiManager.showLoadingScreen(() => this.game.setupGameCanvas());
                    this.game.startGameFromRemote();
                } catch (error) {
                    console.error('❌ Error starting game:', error);
                    this.resetCountdown();
                }
            }
        }, 1000);
    }
    
    resetCountdown() {
        if (this.game.countdownInterval) {
            clearInterval(this.game.countdownInterval);
            this.game.countdownInterval = null;
        }
        this.game.countdownActive = false;
        this.game.lobbyCountdown = 0;
        this.game.uiManager.updateLobbyUI(this.game.playersInLobby, this.game.currentLobby, this.game.countdownActive, this.game.lobbyCountdown);
    }
    
    syncLobbyState(newPlayerId) {
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendLobbySync({
                targetPlayerId: newPlayerId,
                lobbyState: this.game.playersInLobby,
                countdownActive: this.game.countdownActive,
                lobbyCountdown: this.game.lobbyCountdown
            });
        }
    }
    
    requestLobbySync() {
        if (this.game.supabaseGame) {
            this.game.supabaseGame.requestLobbySync();
        }
    }
    
    startGameFromRemote() {
        this.game.gameStarted = true;
        this.game.gameStartTime = Date.now();
        this.game.players = {...this.game.playersInLobby};
        this.game.playersInLobby = {};
        this.game.countdownActive = false;
        
        const myPlayer = this.game.players[this.game.myPlayerId];
        if (myPlayer && (myPlayer.character === '2019x' || myPlayer.character === 'vortex') && myPlayer.role === 'killer') {
            if (this.game.audioManager && typeof this.game.audioManager.playChaseTheme === 'function') {
                this.game.audioManager.playChaseTheme();
            }
        }
    }
    
    endGame(winCondition) {
        this.game.gameStarted = false;
        this.game.lastManStanding = false;
        this.game.lmsActivated = false;
        
        const player = this.game.players[this.game.myPlayerId];
        let message;
        
        if (winCondition === 'KILLERS WIN!') {
            message = player && player.role === 'killer' ? '🔥 ¡GANASTE!' : '💀 ¡PERDISTE!';
        } else if (winCondition === 'SURVIVORS WIN!' || winCondition === 'SURVIVORS ESCAPED!') {
            message = player && player.role === 'survivor' ? '🌟 ¡GANASTE!' : '💀 ¡PERDISTE!';
        } else {
            message = winCondition;
        }
        
        this.startEndGameAnimation(message, winCondition);
    }
    
    startEndGameAnimation(message, winCondition) {
        Object.values(this.game.players).forEach(player => {
            if (player.role === 'killer') {
                player.endGameRed = true;
            }
        });
        
        setTimeout(() => {
            Object.values(this.game.players).forEach(player => {
                if (player.role === 'killer') {
                    player.disappearing = true;
                    if (this.game.visualManager && typeof this.game.visualManager.createParticles === 'function') {
                        this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FF0000', 50);
                    }
                }
            });
        }, 5000);
        
        setTimeout(() => {
            this.showGameResults(message, winCondition);
        }, 15000);
    }
    
    showGameResults(message, winCondition) {
        this.game.cleanupDatabase();
        
        const survivors = Object.values(this.game.players).filter(p => p.role === 'survivor');
        const messageColor = message.includes('GANASTE') ? '#00FF00' : '#FF0000';
        
        let resultsHTML = `<div style="font-size: 2rem; margin-bottom: 2rem; color: ${messageColor};">${message}</div>`;
        resultsHTML += `<div style="font-size: 1.5rem; margin-bottom: 1rem; color: #FFD700;">${winCondition}</div>`;
        resultsHTML += '<div style="font-size: 1.2rem; color: #fff; text-align: left; max-width: 400px;">';
        resultsHTML += '<h3 style="color: #4ecdc4; margin-bottom: 1rem;">📊 Resultados Survivors:</h3>';
        
        survivors.forEach(survivor => {
            const status = survivor.escaped ? '✅ ESCAPÓ' : '💀 MURIÓ';
            const color = survivor.escaped ? '#00FF00' : '#FF0000';
            resultsHTML += `<div style="color: ${color}; margin: 5px 0;">🛡️ ${survivor.name}: ${status}</div>`;
        });
        
        resultsHTML += '</div>';
        
        const victoryDiv = document.createElement('div');
        victoryDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            color: #FFD700;
            font-weight: bold;
            text-align: center;
        `;
        
        victoryDiv.innerHTML = resultsHTML + 
            '<div style="font-size: 1rem; margin-top: 2rem; color: #fff;">Volviendo al lobby en 10 segundos...</div>';
        
        document.body.appendChild(victoryDiv);
        
        setTimeout(() => {
            document.body.removeChild(victoryDiv);
            this.resetGame();
        }, 10000);
    }
    
    resetGame() {
        this.game.playersInLobby = {};
        this.game.players = {};
        
        const config = window.GAME_CONFIG || {};
        const baseTimer = config.GAME_TIMER || 180;
        const survivorCount = Object.values(this.game.players).filter(p => p.role === 'survivor' && !p.spectating).length;
        this.game.gameTimer = baseTimer + (survivorCount * 100);
        this.game.lastManStanding = false;
        this.game.lmsActivated = false;
        this.game.particles = [];
        this.game.hitboxes = [];
        this.game.countdownActive = false;
        this.game.lobbyCountdown = 0;
        
        this.game.audioManager.stopLMSMusic();
        this.game.audioManager.stopChaseTheme();
        
        document.getElementById('lobby').classList.add('active');
        document.getElementById('game').classList.remove('active');
        
        this.game.gameTimerPaused = false;
        this.game.pausedTimer = 0;
        this.game.rageUsed = false;
    }
    
    checkLMSCondition() {
        if (!this.game.gameStarted) return;
        
        const aliveSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && p.alive && !p.downed && !p.spectating);
        const totalActiveSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && !p.spectating);
        const aliveKillers = Object.values(this.game.players).filter(p => p.role === 'killer' && p.alive);
        
        if (Object.keys(this.game.players).length === 0) return;
        
        if (totalActiveSurvivors.length <= 2 && !this.game.lmsActivated) {
            console.log('🔍 LMS Check:', {
                totalActiveSurvivors: totalActiveSurvivors.length,
                aliveSurvivors: aliveSurvivors.length,
                aliveKillers: aliveKillers.length,
                lmsActivated: this.game.lmsActivated,
                survivors: totalActiveSurvivors.map(p => `${p.name}(${p.character}) - alive:${p.alive} downed:${p.downed}`)
            });
        }
        
        if (totalActiveSurvivors.length === 1 && aliveKillers.length >= 1 && !this.game.lmsActivated) {
            console.log('🚀 LMS CONDITIONS MET! Activating...');
            this.activateLMS();
        }
        
        const totalSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor').length;
        const totalKillers = Object.values(this.game.players).filter(p => p.role === 'killer').length;
        
        if (totalSurvivors > 0 && totalKillers > 0) {
            const trulyAliveSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && p.alive && !p.downed && !p.spectating);
            
            if (trulyAliveSurvivors.length === 0 && aliveKillers.length > 0) {
                if (this.game.lastManStanding) {
                    this.game.audioManager.stopLMSMusic();
                }
                this.endGame('KILLERS WIN!');
            } else if (this.game.gameTimer <= 0 && trulyAliveSurvivors.length > 0 && !this.game.gameTimerPaused) {
                this.endGame('SURVIVORS WIN!');
            }
        }
    }
    
    activateLMS() {
        console.log('🔥 ACTIVATING LAST MAN STANDING!');
        this.game.lastManStanding = true;
        this.game.lmsActivated = true;
        
        this.game.audioManager.stopChaseTheme();
        
        const lastSurvivor = Object.values(this.game.players).find(p => p.role === 'survivor' && !p.spectating);
        console.log('Last survivor found:', lastSurvivor ? lastSurvivor.name : 'None');
        
        if (lastSurvivor) {
            if (lastSurvivor.downed) {
                lastSurvivor.alive = true;
                lastSurvivor.downed = false;
                lastSurvivor.beingRevived = false;
                lastSurvivor.reviveProgress = 0;
                console.log('Revived downed survivor for LMS:', lastSurvivor.name);
            }
            
            if (lastSurvivor.character === 'iA777') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(180, lastSurvivor.health + 60);
                lastSurvivor.maxHealth = 180;
                lastSurvivor.lmsFullHeal = true;
                lastSurvivor.lmsResistance = true;
                console.log(`iA777 LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Full heal + resistance`);
            } else if (lastSurvivor.character === 'luna') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(140, lastSurvivor.health + 55);
                lastSurvivor.maxHealth = 140;
                lastSurvivor.lmsSpeedBoost = true;
                lastSurvivor.lmsPunchBoost = true;
                lastSurvivor.lmsResistance = true;
                console.log(`Luna LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Speed boost, Punch boost, Resistance`);
            } else if (lastSurvivor.character === 'angel') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(130, lastSurvivor.health + 40);
                lastSurvivor.maxHealth = 130;
                lastSurvivor.lmsAngelPower = true;
                lastSurvivor.lmsResistance = true;
                lastSurvivor.lmsHealBoost = true;
                lastSurvivor.lmsDashBoost = true;
                console.log(`Angel LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Angel Power, Resistance, Heal boost, Dash boost`);
            } else if (lastSurvivor.character === 'gissel') {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(160, lastSurvivor.health + 60);
                lastSurvivor.maxHealth = 160;
                lastSurvivor.lmsGisselPower = true;
                lastSurvivor.lmsResistance = true;
                console.log(`Gissel LMS bonuses applied: Health ${oldHealth} -> ${lastSurvivor.health}, Gissel Power, Resistance`);
            } else {
                const oldHealth = lastSurvivor.health;
                lastSurvivor.health = Math.min(160, lastSurvivor.health + 60);
                lastSurvivor.maxHealth = 160;
                console.log(`LMS health boost: ${oldHealth} -> ${lastSurvivor.health}`);
            }
            lastSurvivor.lmsBonus = true;
            lastSurvivor.lastLife = true;
            
            if (this.game.visualManager && typeof this.game.visualManager.createParticles === 'function') {
                this.game.visualManager.createParticles(lastSurvivor.x + 15, lastSurvivor.y + 15, '#FFD700', 20);
            }
        }
        
        this.game.gameTimer = 300;
        this.game.audioManager.playLMSMusic();
        
        console.log('🔥 LAST MAN STANDING ACTIVATED! Timer:', this.game.gameTimer);
    }

    updateGameTimer() {
        if (!this.game.gameTimerPaused && this.game.gameTimer > 0) {
            if (this.game.lastManStanding && this.game.lmsMusic && this.game.lmsMusicStartTime) {
                const elapsed = (Date.now() - this.game.lmsMusicStartTime) / 1000;
                const remaining = Math.max(0, (this.game.lmsMusicDuration || 210) - elapsed);
                this.game.gameTimer = Math.ceil(remaining);
            } else {
                if (this.game.gameStartTime) {
                    const elapsed = Math.floor((Date.now() - this.game.gameStartTime) / 1000);
                    const config = window.GAME_CONFIG || {};
                    const totalTime = config.GAME_TIMER || 180;
                    this.game.gameTimer = Math.max(0, totalTime - elapsed);
                    
                    if (this.game.gameTimer === 80 && !this.game.mapSystem.escapeDoor && !this.game.lastManStanding) {
                        const sortedPlayers = Object.values(this.game.players).sort((a, b) => a.id.localeCompare(b.id));
                        if (sortedPlayers.length > 0 && sortedPlayers[0].id === this.game.myPlayerId) {
                            this.showEscapeDoor();
                        }
                    }
                }
            }
        }
    }

    syncGameTimer() {
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendTimerSync({
                gameStartTime: this.game.gameStartTime,
                currentTimer: this.game.gameTimer
            });
        }
    }

    showEscapeDoor(x, y) {
        this.game.escapeDoor = {
            x: x || Math.random() * (this.game.worldSize.width - 200) + 100,
            y: y || Math.random() * (this.game.worldSize.height - 200) + 100,
            width: 60,
            height: 90,
            active: true,
            pulseTimer: 0,
            showIndicator: true,
            indicatorTimer: 300
        };
        
        if (this.game.supabaseGame && this.game.escapeDoor) {
            this.game.supabaseGame.sendAttack({
                type: 'escape_door',
                playerId: this.game.myPlayerId,
                x: this.game.escapeDoor.x,
                y: this.game.escapeDoor.y
            });
        }
        
        console.log('🚪 Escape door appeared!');
    }

    drawEscapeDoor(ctx, camera) {
        if (!this.game.escapeDoor || !this.game.escapeDoor.active) return;
        
        ctx.save();
        
        this.game.escapeDoor.pulseTimer += 0.1;
        const pulse = Math.sin(this.game.escapeDoor.pulseTimer) * 0.2 + 1;
        
        if (this.game.escapeDoor.showIndicator && this.game.escapeDoor.indicatorTimer > 0) {
            this.game.escapeDoor.indicatorTimer--;
            this.drawEscapeDoorIndicator(ctx);
            
            if (this.game.escapeDoor.indicatorTimer <= 0) {
                this.game.escapeDoor.showIndicator = false;
            }
        }
        
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 40 * pulse;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(this.game.escapeDoor.x - this.game.escapeDoor.width/2 - 10, this.game.escapeDoor.y - this.game.escapeDoor.height/2 - 10, this.game.escapeDoor.width + 20, this.game.escapeDoor.height + 20);
        
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#8B4513';
        ctx.globalAlpha = 1;
        ctx.fillRect(this.game.escapeDoor.x - this.game.escapeDoor.width/2, this.game.escapeDoor.y - this.game.escapeDoor.height/2, this.game.escapeDoor.width, this.game.escapeDoor.height);
        
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.game.escapeDoor.x - this.game.escapeDoor.width/2 + 5, this.game.escapeDoor.y - this.game.escapeDoor.height/2 + 5, this.game.escapeDoor.width - 10, this.game.escapeDoor.height - 10);
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.game.escapeDoor.x + this.game.escapeDoor.width/4, this.game.escapeDoor.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPE', this.game.escapeDoor.x, this.game.escapeDoor.y + this.game.escapeDoor.height/2 + 20);
        
        ctx.restore();
        
        this.checkEscapeDoorCollision();
    }

    drawEscapeDoorIndicator(ctx) {
        const player = this.game.players[this.game.myPlayerId];
        if (!player || player.role !== 'survivor') return;
        
        const dx = this.game.escapeDoor.x - (player.x + 15);
        const dy = this.game.escapeDoor.y - (player.y + 15);
        const distance = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        
        const canvasWidth = this.game.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.game.canvas.height / (window.devicePixelRatio || 1);
        
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const indicatorDistance = Math.min(centerX, centerY) - 50;
        
        const indicatorX = centerX + Math.cos(angle) * indicatorDistance;
        const indicatorY = centerY + Math.sin(angle) * indicatorDistance;
        
        ctx.save();
        ctx.translate(indicatorX, indicatorY);
        ctx.rotate(angle);
        
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 1;
        ctx.scale(pulse, pulse);
        
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(distance)}m`, indicatorX, indicatorY + 25);
    }

    checkEscapeDoorCollision() {
        if (!this.game.escapeDoor || !this.game.escapeDoor.active) return;
        
        Object.values(this.game.players).forEach(player => {
            if (player.role === 'survivor' && player.alive) {
                const inDoor = player.x + 15 >= this.game.escapeDoor.x - this.game.escapeDoor.width/2 &&
                               player.x + 15 <= this.game.escapeDoor.x + this.game.escapeDoor.width/2 &&
                               player.y + 15 >= this.game.escapeDoor.y - this.game.escapeDoor.height/2 &&
                               player.y + 15 <= this.game.escapeDoor.y + this.game.escapeDoor.height/2;
                
                if (inDoor && player.id === this.game.myPlayerId) {
                    this.survivorEscaped(player);
                }
            }
        });
    }

    survivorEscaped(player) {
        player.escaped = true;
        player.alive = false;
        this.game.escapeDoor.active = false;
        
        if (this.game.supabaseGame) {
            this.game.supabaseGame.sendAttack({
                type: 'survivor_escaped',
                playerId: player.id
            });
        }
        
        if (this.game.visualManager && typeof this.game.visualManager.createParticles === 'function') {
            this.game.visualManager.createParticles(player.x + 15, player.y + 15, '#FFD700', 30);
        }
        
        const escapeDiv = document.createElement('div');
        escapeDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.9);
            color: #000;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 2rem;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 0 30px #FFD700;
        `;
        
        escapeDiv.innerHTML = '🌟 ¡ESCAPASTE! 🌟';
        document.body.appendChild(escapeDiv);
        
        setTimeout(() => {
            document.body.removeChild(escapeDiv);
        }, 3000);
        
        const aliveSurvivors = Object.values(this.game.players).filter(p => p.role === 'survivor' && (p.alive || p.downed) && !p.escaped);
        if (aliveSurvivors.length === 0) {
            this.endGame('SURVIVORS ESCAPED!');
        }
    }
}