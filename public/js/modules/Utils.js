export class Utils {
    constructor(game) {
        this.game = game;
    }

    isImageValid(img) {
        return img && img.complete && img.naturalWidth > 0 && !img.src.includes('broken');
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

    cleanupPlayer() {
        if (this.game.supabaseGame && this.game.myPlayerId) {
            this.game.supabaseGame.removePlayerFromLobby(this.game.myPlayerId);
            console.log('🧹 Player cleanup:', this.game.myPlayerId);
        }
        
        if (this.game.playersInLobby[this.game.myPlayerId]) {
            delete this.game.playersInLobby[this.game.myPlayerId];
        }
        if (this.game.players[this.game.myPlayerId]) {
            delete this.game.players[this.game.myPlayerId];
        }
    }

    cleanupDatabase() {
        console.log('🧹 Database cleanup handled by Supabase');
    }
}