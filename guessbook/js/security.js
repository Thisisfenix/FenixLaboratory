// 🔒 Sistema de Seguridad Mejorado para Guestbook v2.2.1
class SecurityManager {
  constructor() {
    this.sessionToken = null;
    this.tokenExpiry = null;
    this.failedAttempts = parseInt(localStorage.getItem('sec_failed') || '0');
    this.maxAttempts = 5;
    this.lockoutTime = 15 * 60 * 1000;
    this.lastAttempt = parseInt(localStorage.getItem('sec_last') || '0');
    this.init();
  }

  init() {
    this.protectConsole();
    setInterval(() => this.verifyIntegrity(), 5000);
    this.cleanExpiredSessions();
    this.loadSession();
  }

  protectConsole() {
    console.log('%c⚠️ ADVERTENCIA DE SEGURIDAD', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cNo pegues código aquí. Podrías comprometer tu cuenta.', 'color: orange; font-size: 14px;');
  }

  loadSession() {
    const saved = localStorage.getItem('sec_token');
    const expiry = parseInt(localStorage.getItem('sec_expiry') || '0');
    if (saved && expiry > Date.now()) {
      this.sessionToken = saved;
      this.tokenExpiry = expiry;
    }
  }

  saveSession() {
    if (this.sessionToken && this.tokenExpiry) {
      localStorage.setItem('sec_token', this.sessionToken);
      localStorage.setItem('sec_expiry', this.tokenExpiry.toString());
    }
  }

  async validateSession() {
    if (!this.sessionToken || !this.tokenExpiry) return false;
    if (Date.now() > this.tokenExpiry) {
      this.clearSession();
      return false;
    }
    
    try {
      const isValid = await this.verifyTokenWithServer(this.sessionToken);
      if (!isValid) {
        this.clearSession();
        this.logSecurityEvent('invalid_token');
      }
      return isValid;
    } catch (error) {
      return false;
    }
  }

  async verifyTokenWithServer(token) {
    if (!window.app?.firebase?.db) return false;
    
    try {
      const snapshot = await window.app.firebase.db.collection('admin_sessions')
        .where('token', '==', token)
        .where('expiresAt', '>', Date.now())
        .limit(1)
        .get();
      
      return !snapshot.empty;
    } catch (error) {
      return false;
    }
  }

  async createSession(role, userId) {
    const token = this.generateSecureToken();
    const expiresAt = Date.now() + (2 * 60 * 60 * 1000);
    
    this.sessionToken = token;
    this.tokenExpiry = expiresAt;
    this.saveSession();
    
    try {
      await window.app.firebase.db.collection('admin_sessions').add({
        token,
        role,
        userId,
        domain: 'thisisfenix.github.io',
        createdAt: Date.now(),
        expiresAt,
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent
      });
      
      this.logSecurityEvent('session_created', { role, userId });
      return token;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  clearSession() {
    if (this.sessionToken) {
      window.app?.firebase?.db.collection('admin_sessions')
        .where('token', '==', this.sessionToken)
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => doc.ref.delete());
        })
        .catch(() => {});
    }
    
    this.sessionToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('sec_token');
    localStorage.removeItem('sec_expiry');
    window.currentUser = null;
    window.isAdminLoggedIn = false;
  }

  async checkRateLimit() {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttempt;
    
    if (this.failedAttempts >= this.maxAttempts) {
      const lockoutRemaining = this.lockoutTime - timeSinceLastAttempt;
      if (lockoutRemaining > 0) {
        const minutes = Math.ceil(lockoutRemaining / 60000);
        throw new Error(`Demasiados intentos fallidos. Intenta en ${minutes} minutos.`);
      } else {
        this.failedAttempts = 0;
        localStorage.setItem('sec_failed', '0');
      }
    }
    
    this.lastAttempt = now;
    localStorage.setItem('sec_last', now.toString());
  }

  recordFailedAttempt() {
    this.failedAttempts++;
    localStorage.setItem('sec_failed', this.failedAttempts.toString());
    this.logSecurityEvent('failed_login_attempt', { attempts: this.failedAttempts });
    
    if (this.failedAttempts >= this.maxAttempts) {
      this.logSecurityEvent('account_locked', { duration: this.lockoutTime });
    }
  }

  resetFailedAttempts() {
    this.failedAttempts = 0;
    localStorage.setItem('sec_failed', '0');
  }

  async verifyIntegrity() {
    if (window.isAdminLoggedIn && !await this.validateSession()) {
      console.warn('⚠️ Sesión inválida detectada');
      this.forceLogout();
    }
    
    if (window.currentUser && !this.sessionToken) {
      console.warn('⚠️ Usuario sin sesión válida');
      this.forceLogout();
    }
  }

  forceLogout() {
    this.clearSession();
    if (typeof window.logoutAdmin === 'function') {
      window.logoutAdmin();
    }
    alert('⚠️ Tu sesión ha expirado o fue invalidada por seguridad.');
  }

  async logSecurityEvent(event, data = {}) {
    try {
      await window.app?.firebase?.db.collection('security_logs').add({
        event,
        data,
        domain: 'thisisfenix.github.io',
        timestamp: Date.now(),
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
        sessionToken: this.sessionToken || 'none'
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', { timeout: 3000 });
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  cleanExpiredSessions() {
    setInterval(async () => {
      try {
        const expired = await window.app?.firebase?.db.collection('admin_sessions')
          .where('expiresAt', '<', Date.now())
          .limit(10)
          .get();
        
        expired?.forEach(doc => doc.ref.delete());
      } catch (error) {
        console.error('Error cleaning sessions:', error);
      }
    }, 60000);
  }

  async validateAdminAction(action) {
    if (!await this.validateSession()) {
      throw new Error('Sesión inválida. Por favor inicia sesión nuevamente.');
    }
    
    this.logSecurityEvent('admin_action', { action });
    return true;
  }
}

// Inicializar
window.securityManager = new SecurityManager();

// Proteger loginAdmin
if (window.loginAdmin) {
  const originalLoginAdmin = window.loginAdmin;
  window.loginAdmin = async function() {
    try {
      await window.securityManager.checkRateLimit();
      const result = await originalLoginAdmin.apply(this, arguments);
      
      if (result !== false) {
        window.securityManager.resetFailedAttempts();
        await window.securityManager.createSession('admin', 'admin_user');
      } else {
        window.securityManager.recordFailedAttempt();
      }
      
      return result;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };
}

// Proteger loginModerator
if (window.loginModerator) {
  const originalLoginModerator = window.loginModerator;
  window.loginModerator = async function() {
    try {
      await window.securityManager.checkRateLimit();
      const result = await originalLoginModerator.apply(this, arguments);
      
      if (result !== false) {
        window.securityManager.resetFailedAttempts();
        const username = document.getElementById('moderatorUsername')?.value || 'moderator';
        await window.securityManager.createSession('moderator', username);
      } else {
        window.securityManager.recordFailedAttempt();
      }
      
      return result;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };
}

// Proteger funciones críticas
const protectFunction = (funcName) => {
  const original = window[funcName];
  if (original) {
    window[funcName] = async function() {
      try {
        await window.securityManager.validateAdminAction(funcName);
        return await original.apply(this, arguments);
      } catch (error) {
        alert(error.message);
        window.securityManager.forceLogout();
        return false;
      }
    };
  }
};

// Esperar a que las funciones estén disponibles
setTimeout(() => {
  ['deleteDrawing', 'deleteSuggestion', 'deleteComment', 'assignTag', 'removeTag', 
   'warnUser', 'blockUser', 'createModerator'].forEach(protectFunction);
}, 1000);

console.log('🔒 Sistema de seguridad v2.2.1 activado');
