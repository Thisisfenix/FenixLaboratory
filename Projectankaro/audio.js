// Audio.js - Sistema de audio del juego
class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentMusic = null;
        this.footstepTimer = 0;
        this.footstepInterval = 500;
    }

    init() {
        try {
            // Cargar sonidos con rutas relativas correctas
            const audioPath = '../public/html/stuff/';
            
            this.sounds.walk = new Audio(audioPath + 'stepsound.mp3');
            this.sounds.walk.volume = 0.3;
            
            this.sounds.jump = new Audio(audioPath + 'salto.mp3');
            this.sounds.jump.volume = 0.4;
            
            this.sounds.gameStart = new Audio(audioPath + 'pasillo1better.mp3');
            this.sounds.gameStart.volume = 0.5;
            this.sounds.gameStart.loop = false;
            
            this.sounds.flashlight = new Audio(audioPath + 'flashlight.mp3');
            this.sounds.flashlight.volume = 0.4;
            
            this.sounds.exhausted = new Audio(audioPath + 'exhausted.mp3');
            this.sounds.exhausted.volume = 0.5;
            
            this.sounds.run = new Audio(audioPath + 'correr.mp3');
            this.sounds.run.volume = 0.4;
            this.sounds.run.loop = true;
            
            this.sounds.runGrass = new Audio(audioPath + 'correrpasto.mp3');
            this.sounds.runGrass.volume = 0.4;
            this.sounds.runGrass.loop = true;
            
            this.sounds.walkGrass = new Audio(audioPath + 'caminarpasto.mp3');
            this.sounds.walkGrass.volume = 0.3;
            
            this.sounds.rain = new Audio(audioPath + 'lluvia.mp3');
            this.sounds.rain.volume = 0.3;
            this.sounds.rain.loop = true;
            
            this.sounds.death = new Audio(audioPath + 'mandied.mp3');
            this.sounds.death.volume = 0.6;
            
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Audio initialization error:', error);
        }
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

    playGameStart() {
        if (this.sounds.gameStart && this.sounds.gameStart.paused) {
            this.sounds.gameStart.currentTime = 0;
            this.sounds.gameStart.play().catch(() => {});
        }
    }

    startRain() {
        this.playLoop('rain');
    }

    stopRain() {
        this.stop('rain');
    }
    
    playDeath() {
        if (this.sounds.death && this.sounds.death.paused) {
            this.play('death');
        }
    }
}

const audioManager = new AudioManager();
