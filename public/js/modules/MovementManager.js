export class MovementManager {
    constructor(game) {
        this.game = game;
    }
    
    updateMovement() {
        const player = this.game.players[this.game.myPlayerId];
        if (!player || (!player.alive && !player.spectating)) return;
        
        if (player.spectating) {
            this.updateSpectatorMovement(player);
            return;
        }
        
        if (!player.alive || player.downed) return;

        let speed = this.calculateSpeed(player);
        let moved = false;
        let newX = player.x;
        let newY = player.y;

        if (player.youCantRunActive) {
            moved = this.handleYouCantRunMovement(player);
        } else if (player.sharpWingsActive) {
            moved = this.handleSharpWingsMovement(player);
        } else if (player.charging && !player.wallStunned) {
            moved = this.handleChargeMovement(player);
        } else if (!player.stunned && !player.wallStunned && !player.autoRepairing) {
            moved = this.handleNormalMovement(player, speed);
        }

        if (moved && this.game.supabaseGame && (!this.game.lastPositionUpdate || Date.now() - this.game.lastPositionUpdate > 16)) {
            this.game.supabaseGame.sendPlayerMove(Math.round(player.x), Math.round(player.y));
            this.game.lastPositionUpdate = Date.now();
        }
    }
    
    updateSpectatorMovement(player) {
        let moved = false;
        let newX = this.game.camera.x;
        let newY = this.game.camera.y;
        
        if (this.game.inputManager.isKeyPressed('w') || this.game.inputManager.isKeyPressed('ArrowUp')) {
            newY = Math.max(0, this.game.camera.y - 8);
            moved = true;
        }
        if (this.game.inputManager.isKeyPressed('s') || this.game.inputManager.isKeyPressed('ArrowDown')) {
            newY = Math.min(this.game.worldSize.height - this.game.canvas.height, this.game.camera.y + 8);
            moved = true;
        }
        if (this.game.inputManager.isKeyPressed('a') || this.game.inputManager.isKeyPressed('ArrowLeft')) {
            newX = Math.max(0, this.game.camera.x - 8);
            moved = true;
        }
        if (this.game.inputManager.isKeyPressed('d') || this.game.inputManager.isKeyPressed('ArrowRight')) {
            newX = Math.min(this.game.worldSize.width - this.game.canvas.width, this.game.camera.x + 8);
            moved = true;
        }
        
        if (moved) {
            this.game.camera.x = newX;
            this.game.camera.y = newY;
        }
    }
    
    calculateSpeed(player) {
        let speed;
        if (player.role === 'killer') {
            speed = player.character === 'vortex' ? 4.4 : 4.2;
        } else {
            speed = 4.0;
        }
        
        if (player.role === 'killer' && player.rageMode && player.rageMode.active) {
            speed = 5.8;
        }
        
        if (player.character === 'iA777' && this.game.lastManStanding) {
            speed = 4.8;
        }
        
        if (player.character === 'luna' && (player.speedBoost || player.lmsSpeedBoost)) {
            speed = 5.2;
        }
        
        if (player.angelSpeedBoost) {
            speed = 4.8;
        }
        
        return speed;
    }
    
    handleYouCantRunMovement(player) {
        if (this.game.lastMouseX && this.game.lastMouseY) {
            const angle = Math.atan2(this.game.lastMouseY - (player.y + 15), this.game.lastMouseX - (player.x + 15));
            const distance = Math.sqrt(
                Math.pow(this.game.lastMouseX - (player.x + 15), 2) + 
                Math.pow(this.game.lastMouseY - (player.y + 15), 2)
            );
            
            if (distance > 10) {
                const moveSpeed = 6.5;
                player.x = Math.max(0, Math.min(this.game.worldSize.width - 30, player.x + Math.cos(angle) * moveSpeed));
                player.y = Math.max(0, Math.min(this.game.worldSize.height - 30, player.y + Math.sin(angle) * moveSpeed));
                return true;
            }
        }
        return false;
    }
    
    handleSharpWingsMovement(player) {
        if (this.game.lastMouseX && this.game.lastMouseY) {
            const angle = Math.atan2(this.game.lastMouseY - (player.y + 15), this.game.lastMouseX - (player.x + 15));
            const distance = Math.sqrt(
                Math.pow(this.game.lastMouseX - (player.x + 15), 2) + 
                Math.pow(this.game.lastMouseY - (player.y + 15), 2)
            );
            
            if (distance > 10) {
                const moveSpeed = 5.5;
                player.x = Math.max(0, Math.min(this.game.worldSize.width - 30, player.x + Math.cos(angle) * moveSpeed));
                player.y = Math.max(0, Math.min(this.game.worldSize.height - 30, player.y + Math.sin(angle) * moveSpeed));
                return true;
            }
        }
        return false;
    }
    
    handleChargeMovement(player) {
        const chargeSpeed = 7.0;
        let dirX = 0;
        let dirY = 0;
        
        if (this.game.inputManager.isKeyPressed('w') || this.game.inputManager.isKeyPressed('arrowup')) dirY = -1;
        if (this.game.inputManager.isKeyPressed('s') || this.game.inputManager.isKeyPressed('arrowdown')) dirY = 1;
        if (this.game.inputManager.isKeyPressed('a') || this.game.inputManager.isKeyPressed('arrowleft')) dirX = -1;
        if (this.game.inputManager.isKeyPressed('d') || this.game.inputManager.isKeyPressed('arrowright')) dirX = 1;
        
        if (!player.chargeDirection) {
            player.chargeDirection = { x: 0, y: 1 };
        }
        
        if (dirX !== 0 || dirY !== 0) {
            const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
            player.chargeDirection.x = dirX / magnitude;
            player.chargeDirection.y = dirY / magnitude;
        }
        
        player.x = Math.max(0, Math.min(this.game.worldSize.width - 30, player.x + player.chargeDirection.x * chargeSpeed));
        player.y = Math.max(0, Math.min(this.game.worldSize.height - 30, player.y + player.chargeDirection.y * chargeSpeed));
        
        if (player.grabbedKiller) {
            const killer = this.game.players[player.grabbedKiller];
            if (killer) {
                killer.x = player.x;
                killer.y = player.y;
                
                if (this.game.supabaseGame) {
                    this.game.supabaseGame.sendGrabbedPlayerMove(killer.id, killer.x, killer.y);
                }
            }
        }
        
        return true;
    }
    
    handleNormalMovement(player, speed) {
        let moved = false;
        
        if (this.game.inputManager.isKeyPressed('w') || this.game.inputManager.isKeyPressed('arrowup')) {
            player.y = Math.max(0, player.y - speed);
            moved = true;
        }
        if (this.game.inputManager.isKeyPressed('s') || this.game.inputManager.isKeyPressed('arrowdown')) {
            player.y = Math.min(this.game.worldSize.height - 30, player.y + speed);
            moved = true;
        }
        if (this.game.inputManager.isKeyPressed('a') || this.game.inputManager.isKeyPressed('arrowleft')) {
            player.x = Math.max(0, player.x - speed);
            moved = true;
        }
        if (this.game.inputManager.isKeyPressed('d') || this.game.inputManager.isKeyPressed('arrowright')) {
            player.x = Math.min(this.game.worldSize.width - 30, player.x + speed);
            moved = true;
        }
        
        return moved;
    }
    
    updateRemotePlayerInterpolation() {
        Object.values(this.game.players).forEach(player => {
            if (player.id !== this.game.myPlayerId && player.interpolating) {
                const speed = 0.25;
                
                player.interpolationProgress += speed;
                
                if (player.interpolationProgress >= 1) {
                    player.x = player.targetX;
                    player.y = player.targetY;
                    player.interpolating = false;
                } else {
                    const t = player.interpolationProgress;
                    player.x = player.startX + (player.targetX - player.startX) * t;
                    player.y = player.startY + (player.targetY - player.startY) * t;
                }
            }
        });
    }
    
    updateCamera() {
        const player = this.game.players[this.game.myPlayerId];
        if (player && this.game.canvas) {
            const canvasWidth = this.game.canvas.cssWidth || window.innerWidth;
            const canvasHeight = this.game.canvas.cssHeight || window.innerHeight;
            
            this.game.camera.x = player.x - canvasWidth / 2;
            this.game.camera.y = player.y - canvasHeight / 2;
            
            this.game.camera.x = Math.max(0, Math.min(Math.max(0, this.game.worldSize.width - canvasWidth), this.game.camera.x));
            this.game.camera.y = Math.max(0, Math.min(Math.max(0, this.game.worldSize.height - canvasHeight), this.game.camera.y));
        }
    }
}