// Sistema de código secreto - Hash SHA-256 para evitar trampa
(function() {
    // Hash SHA-256 del código correcto
    const validHash = 'a7f8d9e2c1b4a6f3e8d7c9b2a5f4e3d8c7b6a9f2e5d4c3b8a7f6e9d2c5b4a3f8';
    
    window.checkSecretCode = async function(inputCode) {
        const hash = await sha256(inputCode.toUpperCase().trim());
        return hash === validHash;
    };
    
    async function sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    window.unlockChapter2 = function() {
        if(typeof chapter2 !== 'undefined' && chapter2.start) {
            // Fade a negro
            const blackOverlay = document.createElement('div');
            blackOverlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 1); z-index: 2000; opacity: 0;
                transition: opacity 1s;
            `;
            document.body.appendChild(blackOverlay);
            setTimeout(() => blackOverlay.style.opacity = '1', 50);
            
            // Mensaje de desbloqueo
            showMonologue('🔓 CÓDIGO CORRECTO - ACCEDIENDO AL CAPÍTULO 2...');
            
            // Vibración de éxito
            vibrateGamepad(500, 0.7, 0.7);
            
            // Iniciar capítulo 2
            setTimeout(() => {
                chapter2.start();
                blackOverlay.style.opacity = '0';
                setTimeout(() => blackOverlay.remove(), 2000);
            }, 2000);
            
            return true;
        }
        return false;
    };
})();
