export class ReviveManager {
    constructor(game) {
        this.game = game;
    }

    updateReviveSystem() {
        Object.values(this.game.players).forEach(player => {
            if (player.downed && player.reviveTimer > 0) {
                player.reviveTimer--;
                
                if (player.reviveTimer <= 0) {
                    player.downed = false;
                    player.spectating = true;
                    this.game.audioManager.playDeathSound();
                    this.game.gameTimer += 15;
                    
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
                            this.game.effectsManager.createParticles(player.x + 15, player.y + 15, '#00FF00', 20);
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
                        
                        if (this.game.supabaseGame) {
                            this.game.supabaseGame.sendAttack({
                                type: 'revive',
                                targetId: player.id,
                                health: 60
                            });
                        }
                    }
                }
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