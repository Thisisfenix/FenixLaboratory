export class AudioManager {
    constructor(game) {
        this.game = game;
        this.lmsMusic = null;
        this.chaseMusic = null;
        this.lmsMusicStartTime = null;
        this.lmsMusicDuration = null;
        this.pendingLMSMusic = false;
    }
    
    playLMSMusic() {
        try {
            const lastSurvivor = Object.values(this.game.players).find(p => p.role === 'survivor' && !p.spectating);
            let musicPath;
            
            if (lastSurvivor && lastSurvivor.character === 'iA777') {
                musicPath = 'assets/IA777LMS.mp3';
            } else if (lastSurvivor && lastSurvivor.character === 'gissel') {
                musicPath = 'assets/GisselLMS1.mp3';
            } else if (lastSurvivor && lastSurvivor.character === 'luna') {
                musicPath = 'assets/LunaLMS2.mp3';
            } else if (lastSurvivor && lastSurvivor.character === 'iris') {
                musicPath = 'assets/IrisLMS_.mp3';
            } else {
                musicPath = 'assets/SpeedofSoundRound2.mp3';
            }
            
            this.lmsMusic = new Audio(musicPath);
            this.lmsMusic.volume = 0.6;
            this.lmsMusic.loop = false;
            
            this.lmsMusic.addEventListener('play', () => {
                this.lmsMusicStartTime = Date.now();
                console.log('🎵 LMS Music started playing, timer synchronized');
            });
            
            this.lmsMusic.addEventListener('loadedmetadata', () => {
                if (this.game.lastManStanding) {
                    this.lmsMusicDuration = this.lmsMusic.duration;
                    console.log(`🎵 LMS Music loaded: ${this.lmsMusicDuration} seconds`);
                }
            });
            
            this.lmsMusic.addEventListener('ended', () => {
                if (this.game.lastManStanding) {
                    this.game.gameTimer = 0;
                    console.log('🎵 Song ended, LMS timer finished');
                }
            });
            
            const playPromise = this.lmsMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (this.game.lastManStanding && this.lmsMusicDuration) {
                        this.game.gameTimer = Math.floor(this.lmsMusicDuration);
                        console.log(`🎵 LMS Timer set to song duration: ${this.game.gameTimer} seconds`);
                    }
                }).catch(error => {
                    console.log('LMS music autoplay blocked, will play on next user interaction');
                    this.pendingLMSMusic = true;
                });
            }
        } catch (error) {
            console.log('LMS music not available:', error);
            this.game.gameTimer = 300;
            this.lmsMusicDuration = 300;
        }
    }
    
    stopLMSMusic() {
        if (this.lmsMusic) {
            this.lmsMusic.pause();
            this.lmsMusic.currentTime = 0;
            this.lmsMusic = null;
        }
    }
    
    playChaseTheme() {
        try {
            const myPlayer = this.game.players[this.game.myPlayerId];
            let themePath = 'assets/ChaseTheme2019X.mp3';
            
            if (myPlayer && myPlayer.character === 'vortex') {
                themePath = 'assets/VortexChaseTheme.mp3';
            }
            
            this.chaseMusic = new Audio(themePath);
            this.chaseMusic.volume = 0.4;
            this.chaseMusic.loop = true;
            
            const playPromise = this.chaseMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Chase theme autoplay blocked');
                });
            }
        } catch (error) {
            console.log('Chase theme not available:', error);
        }
    }
    
    updateChaseThemeVolume() {
        if (!this.chaseMusic || this.game.lastManStanding) return;
        
        const myPlayer = this.game.players[this.game.myPlayerId];
        if (!myPlayer || myPlayer.role !== 'survivor') return;
        
        const chaseKiller = Object.values(this.game.players).find(p => 
            (p.character === '2019x' || p.character === 'vortex') && p.role === 'killer' && p.alive
        );
        
        if (!chaseKiller) {
            this.chaseMusic.volume = 0;
            return;
        }
        
        const distance = Math.sqrt(
            Math.pow(myPlayer.x - chaseKiller.x, 2) + 
            Math.pow(myPlayer.y - chaseKiller.y, 2)
        );
        
        const maxDistance = 300;
        if (distance <= maxDistance) {
            const volume = Math.max(0.1, 0.4 * (1 - distance / maxDistance));
            this.chaseMusic.volume = volume;
        } else {
            this.chaseMusic.volume = 0;
        }
    }
    
    stopChaseTheme() {
        if (this.chaseMusic) {
            this.chaseMusic.pause();
            this.chaseMusic.currentTime = 0;
            this.chaseMusic = null;
        }
    }
    
    playDeathSound() {
        try {
            const deathSound = new Audio('assets/death-sound.mp3');
            deathSound.volume = 0.5;
            deathSound.play().catch(error => {
                console.log('Death sound autoplay blocked');
            });
        } catch (error) {
            console.log('Death sound not available:', error);
        }
    }
}