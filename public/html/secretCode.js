// Sistema de código secreto - Hash SHA-256 para evitar trampa
(function() {
    // Hash SHA-256 de "FENIX2025"
    const validHash = 'fb39396cd544d43b2732c225210ae1de327c310fbd80e9a0a34710419540754c';
    
    window.checkSecretCode = async function(inputCode) {
        try {
            const normalized = inputCode.toUpperCase().trim();
            const hash = await sha256(normalized);
            console.log('=== DEBUG CÓDIGO SECRETO ===');
            console.log('Input original:', inputCode);
            console.log('Input normalizado:', normalized);
            console.log('Hash generado:', hash);
            console.log('Hash válido:', validHash);
            console.log('¿Coincide?:', hash === validHash);
            console.log('===========================');
            return hash === validHash;
        } catch(e) {
            console.error('Error en checkSecretCode:', e);
            return false;
        }
    };
    
    async function sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    window.unlockChapter2 = function() {
        console.log('=== UNLOCK CHAPTER 2 LLAMADO ===');
        console.log('chapter2 existe?', typeof chapter2 !== 'undefined');
        console.log('chapter2.start existe?', typeof chapter2 !== 'undefined' && typeof chapter2.start === 'function');
        
        if(typeof chapter2 !== 'undefined' && chapter2.start) {
            console.log('Iniciando Chapter 2...');
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
    
    console.log('secretCode.js cargado correctamente');
    console.log('Hash válido configurado:', validHash);
})();
