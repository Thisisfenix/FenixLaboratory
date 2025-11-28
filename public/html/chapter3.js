// Chapter 3 - JOKE CHAPTER (Cursed Castle)
class Chapter3 {
    constructor() {
        this.active = false;
        this.phase = 'cinematic';
        this.cinematicProgress = 0;
        this.flashbangTriggered = false;
    }

    start() {
        this.active = true;
        this.phase = 'cinematic';
        this.clearScene();
        this.startCinematic();
    }

    clearScene() {
        while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }

    startCinematic() {
        // Pantalla negra inicial
        const blackScreen = document.createElement('div');
        blackScreen.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;';
        document.body.appendChild(blackScreen);

        // Castillo oscuro y dramático
        const ambient = new THREE.AmbientLight(0x202020, 0.2);
        scene.add(ambient);

        // Castillo épico
        const castleWall = new THREE.Mesh(
            new THREE.BoxGeometry(40, 20, 3),
            new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
        );
        castleWall.position.set(0, 10, -20);
        scene.add(castleWall);

        // Torres
        for(let x of [-15, -5, 5, 15]) {
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 3, 25, 8),
                new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
            );
            tower.position.set(x, 12.5, -20);
            scene.add(tower);

            const towerTop = new THREE.Mesh(
                new THREE.ConeGeometry(4, 5, 8),
                new THREE.MeshBasicMaterial({ color: 0x8b0000 })
            );
            towerTop.position.set(x, 26, -20);
            scene.add(towerTop);
        }

        // Puerta del castillo
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(8, 12, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x2a1a0a })
        );
        door.position.set(0, 6, -17);
        scene.add(door);

        // Luces dramáticas
        const redLight = new THREE.PointLight(0xff0000, 3, 30);
        redLight.position.set(0, 15, -15);
        scene.add(redLight);

        // Cámara cinemática
        camera.position.set(0, 2, 10);
        camera.lookAt(0, 10, -20);

        // Fade in desde negro
        setTimeout(() => {
            blackScreen.style.transition = 'opacity 2s';
            blackScreen.style.opacity = '0';
            setTimeout(() => blackScreen.remove(), 2000);
        }, 500);

        // Texto dramático
        setTimeout(() => {
            showMonologue('El Castillo Oscuro...');
            setTimeout(() => {
                showMonologue('Aquí yacen los secretos más profundos...');
                setTimeout(() => {
                    showMonologue('Debo entrar... y descubrir la verdad...');
                    setTimeout(() => {
                        this.moveCameraTowardsCastle();
                    }, 3000);
                }, 3000);
            }, 3000);
        }, 2000);
    }

    moveCameraTowardsCastle() {
        // Mover cámara hacia el castillo dramáticamente
        let progress = 0;
        const moveInterval = setInterval(() => {
            progress += 0.01;
            camera.position.z -= 0.15;
            camera.position.y += 0.02;
            
            if(camera.position.z <= -15) {
                clearInterval(moveInterval);
                this.triggerFlashbang();
            }
        }, 16);

        setTimeout(() => {
            showMonologue('La puerta se abre...');
        }, 2000);
    }

    triggerFlashbang() {
        this.flashbangTriggered = true;
        
        // FLASHBANG INTENSO
        const flashbang = document.createElement('div');
        flashbang.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:10000;opacity:0;';
        document.body.appendChild(flashbang);

        // Sonido de flashbang
        this.playFlashbangSound();
        vibrateGamepad(1000, 1.0, 1.0);

        setTimeout(() => {
            flashbang.style.transition = 'opacity 0.1s';
            flashbang.style.opacity = '1';
            
            setTimeout(() => {
                // JOKE REVEAL
                flashbang.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;font-family:Comic Sans MS,cursive;">
                        <h1 style="font-size:120px;color:#ff00ff;text-shadow:0 0 20px #ff00ff;animation:spin 2s linear infinite;margin:0;">SIKE!</h1>
                        <h2 style="font-size:60px;color:#00ff00;margin:20px 0;">Chapter 3 no existe todavía 😂</h2>
                        <p style="font-size:30px;color:#ff0000;margin:10px;">Te trolleé bien feo</p>
                        <img src="https://media.tenor.com/images/d8c0e3f5e5f5e5f5e5f5e5f5e5f5e5f5/tenor.gif" style="width:400px;margin:30px;border:5px solid #ff00ff;border-radius:20px;" onerror="this.style.display='none'">
                        <button onclick="location.reload()" style="padding:20px 40px;font-size:30px;background:#ff00ff;color:#fff;border:none;border-radius:10px;cursor:pointer;margin-top:20px;font-family:Comic Sans MS;">Volver al Laboratorio 🤡</button>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg) scale(1); }
                            50% { transform: rotate(180deg) scale(1.2); }
                            100% { transform: rotate(360deg) scale(1); }
                        }
                    </style>
                `;
                
                // Efectos cursed
                this.startCursedEffects();
            }, 500);
        }, 100);
    }

    startCursedEffects() {
        // Cambiar colores random
        setInterval(() => {
            document.body.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(${Math.random() * 3})`;
        }, 200);

        // Shake de pantalla
        setInterval(() => {
            document.body.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px) rotate(${Math.random() * 2 - 1}deg)`;
        }, 50);

        // Emojis random cayendo
        setInterval(() => {
            const emojis = ['🤡', '💀', '👻', '🎃', '🔥', '💩', '🤪', '😂', '🗿', '💯'];
            const emoji = document.createElement('div');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.cssText = `position:fixed;left:${Math.random() * 100}%;top:-50px;font-size:${Math.random() * 50 + 30}px;z-index:9999;pointer-events:none;`;
            document.body.appendChild(emoji);
            
            let pos = -50;
            const fall = setInterval(() => {
                pos += 5;
                emoji.style.top = pos + 'px';
                emoji.style.transform = `rotate(${pos * 2}deg)`;
                if(pos > window.innerHeight) {
                    clearInterval(fall);
                    emoji.remove();
                }
            }, 16);
        }, 300);

        // Sonidos random
        setInterval(() => {
            this.playRandomSound();
        }, 1000);
    }

    playFlashbangSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 1);
        
        gain.gain.setValueAtTime(0.8, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + 2);
    }

    playRandomSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(Math.random() * 4)];
        osc.frequency.setValueAtTime(Math.random() * 1000 + 100, audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
    }

    update(delta) {
        if(!this.active) return;
        // No hay update necesario, todo es cinemático
    }
}

const chapter3 = new Chapter3();
