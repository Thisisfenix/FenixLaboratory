// Audio.js - Sistema de audio del juego
class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentMusic = null;
        this.footstepTimer = 0;
        this.footstepInterval = 500;
    }

    init() {
        // Cargar sonidos
        this.sounds.walk = new Audio('../public/html/stuff/stepsound.mp3');
        this.sounds.walk.volume = 0.3;
        
        this.sounds.jump = new Audio('../public/html/stuff/salto.mp3');
        this.sounds.jump.volume = 0.4;
        
        this.sounds.ambient = new Audio('../public/html/stuff/pasillo1better.mp3');
        this.sounds.ambient.volume = 0.5;
        this.sounds.ambient.loop = true;
        
        this.sounds.flashlight = new Audio('../public/html/stuff/flashlight.mp3');
        this.sounds.flashlight.volume = 0.4;
        
        this.sounds.exhausted = new Audio('../public/html/stuff/exhausted.mp3');
        this.sounds.exhausted.volume = 0.5;
        
        this.sounds.run = new Audio('../public/html/stuff/correr.mp3');
        this.sounds.run.volume = 0.4;
        this.sounds.run.loop = true;
        
        this.sounds.runGrass = new Audio('../public/html/stuff/correrpasto.mp3');
        this.sounds.runGrass.volume = 0.4;
        this.sounds.runGrass.loop = true;
        
        this.sounds.walkGrass = new Audio('../public/html/stuff/caminarpasto.mp3');
        this.sounds.walkGrass.volume = 0.3;
        
        this.sounds.rain = new Audio('../public/html/stuff/lluvia.mp3');
        this.sounds.rain.volume = 0.3;
        this.sounds.rain.loop = true;
        
        this.sounds.death = new Audio('../public/html/stuff/mandied.mp3');
        this.sounds.death.volume = 0.6;
        
        console.log('Audio system initialized');
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {});
        }
    }

    playLoop(soundName) {
        if (this.sounds[soundName] && this.sounds[soundName].paused) {
            this.sounds[soundName].play().catch(() => {});
        }
    }

    stop(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
        }
    }

    playFootstep(onGrass = false) {
        const sound = onGrass ? 'walkGrass' : 'walk';
        this.play(sound);
    }

    playRunning(onGrass = false) {
        const sound = onGrass ? 'runGrass' : 'run';
        this.playLoop(sound);
    }

    stopRunning() {
        this.stop('run');
        this.stop('runGrass');
    }

    startAmbient() {
        this.playLoop('ambient');
    }

    stopAmbient() {
        this.stop('ambient');
    }

    startRain() {
        this.playLoop('rain');
    }

    stopRain() {
        this.stop('rain');
    }
    
    playDeath() {
        this.play('death');
    }
}

const audioManager = new AudioManager();
