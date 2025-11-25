// Platform.js - Detección de plataforma y configuración
class PlatformDetector {
    constructor() {
        this.platform = this.detectPlatform();
        this.showVoiceInstructions();
    }

    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        const gamepad = navigator.getGamepads && navigator.getGamepads()[0];
        
        // PlayStation
        if (ua.includes('playstation') || (gamepad && gamepad.id.toLowerCase().includes('playstation'))) {
            return 'playstation';
        }
        
        // Xbox
        if (ua.includes('xbox') || (gamepad && gamepad.id.toLowerCase().includes('xbox'))) {
            return 'xbox';
        }
        
        // Nintendo Switch
        if (ua.includes('nintendo') || (gamepad && gamepad.id.toLowerCase().includes('switch'))) {
            return 'switch';
        }
        
        // Móvil
        if (/android|webos|iphone|ipad|ipod/i.test(ua)) {
            return 'mobile';
        }
        
        // PC por defecto
        return 'pc';
    }

    showVoiceInstructions() {
        const instructions = {
            playstation: '🎮 PlayStation: Usa Party Chat de PS para voz',
            xbox: '🎮 Xbox: Usa Xbox Party Chat para voz',
            switch: '🎮 Switch: Usa Nintendo Switch Online App para voz',
            mobile: '📱 Móvil: Micrófono integrado activado',
            pc: '🎤 PC: Presiona el botón de micrófono para activar/desactivar'
        };

        const message = instructions[this.platform];
        
        // Mostrar mensaje temporal
        setTimeout(() => {
            const status = document.getElementById('status');
            if (status) {
                status.textContent = message;
                status.style.opacity = 1;
                status.style.background = 'rgba(0, 100, 200, 0.8)';
                
                setTimeout(() => {
                    status.style.opacity = 0;
                }, 5000);
            }
        }, 2000);

        console.log(`Platform detected: ${this.platform}`);
        console.log(`Voice instructions: ${message}`);
    }

    isConsole() {
        return ['playstation', 'xbox', 'switch'].includes(this.platform);
    }

    getControlScheme() {
        const schemes = {
            playstation: {
                jump: '✕',
                sprint: '□',
                flashlight: '△',
                hide: '○',
                spectatorPrev: 'L1',
                spectatorNext: 'R1'
            },
            xbox: {
                jump: 'A',
                sprint: 'X',
                flashlight: 'Y',
                hide: 'B',
                spectatorPrev: 'LB',
                spectatorNext: 'RB'
            },
            switch: {
                jump: 'B',
                sprint: 'Y',
                flashlight: 'X',
                hide: 'A',
                spectatorPrev: 'L',
                spectatorNext: 'R'
            },
            mobile: {
                jump: 'Botón ⬆️',
                sprint: 'Botón 🏃',
                flashlight: 'Botón 🔦',
                hide: 'Botón 🚪'
            },
            pc: {
                jump: 'SPACE',
                sprint: 'SHIFT',
                flashlight: 'F',
                hide: 'E',
                spectatorPrev: '← o Q',
                spectatorNext: '→ o E'
            }
        };

        return schemes[this.platform];
    }
}

const platformDetector = new PlatformDetector();
