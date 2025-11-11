// Sistema de Tienda VIP con Temas
export class VipStore {
  constructor() {
    this.themes = {
      free: {
        'default': {
          name: '🔥 Tema Original',
          description: 'Naranja vibrante',
          colors: { primary: '#ff6b35', secondary: '#ff8c42' }
        },
        'neon': {
          name: '⚡ Tema Neón',
          description: 'Verde eléctrico',
          colors: { primary: '#00ff88', secondary: '#00cc66' }
        },
        'retro': {
          name: '🌸 Tema Retro',
          description: 'Rosa vintage',
          colors: { primary: '#ff6b9d', secondary: '#2d1b69' }
        }
      },
      premium: {
        'hacker': {
          name: '💻 Tema Hacker',
          description: 'Verde matrix',
          colors: { primary: '#00ff00', secondary: '#000000' },
          price: 100
        },
        'purple': {
          name: '💜 Tema Púrpura',
          description: 'Morado elegante',
          colors: { primary: '#8b5cf6', secondary: '#a855f7' },
          price: 125
        },
        'blue': {
          name: '💙 Tema Azul',
          description: 'Azul profesional',
          colors: { primary: '#3b82f6', secondary: '#1d4ed8' },
          price: 125
        }
      },
      vip: {
        'galaxy': {
          name: '💎 Tema Galaxy',
          description: 'Púrpura espacial',
          colors: { primary: '#8b5cf6', secondary: '#ec4899' },
          requiresVip: true
        },
        'sunset': {
          name: '🔥 Tema Sunset',
          description: 'Atardecer dorado',
          colors: { primary: '#f59e0b', secondary: '#dc2626' },
          requiresVip: true
        },
        'ocean': {
          name: '🌊 Tema Ocean',
          description: 'Azul profundo',
          colors: { primary: '#0ea5e9', secondary: '#1e40af' },
          requiresVip: true
        }
      }
    };
    
    this.avatarFrames = {
      free: {
        'none': {
          name: 'Sin Marco',
          description: 'Avatar sin decoración',
          style: 'none'
        },
        'basic': {
          name: '⚪ Marco Básico',
          description: 'Marco simple blanco',
          style: 'border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);'
        },
        'colorful': {
          name: '🎨 Marco Colorido',
          description: 'Marco con colores del tema',
          style: 'border: 2px solid var(--primary); box-shadow: 0 0 10px rgba(255, 107, 53, 0.4);'
        }
      },
      premium: {
        'silver': {
          name: '🥈 Marco Plata',
          description: 'Marco plateado elegante',
          style: 'border: 3px solid #c0c0c0; box-shadow: 0 0 12px rgba(192, 192, 192, 0.6);',
          price: 50
        },
        'bronze': {
          name: '🥉 Marco Bronce',
          description: 'Marco bronce clásico',
          style: 'border: 3px solid #cd7f32; box-shadow: 0 0 12px rgba(205, 127, 50, 0.6);',
          price: 75
        }
      },
      vip: {
        'golden': {
          name: '👑 Marco Dorado',
          description: 'Elegante marco dorado',
          style: 'border: 3px solid #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);',
          requiresVip: true,
          price: 75
        },
        'diamond': {
          name: '💎 Marco Diamante',
          description: 'Marco cristalino premium',
          style: 'border: 3px solid #b4c7d9; box-shadow: 0 0 15px rgba(180, 199, 217, 0.7);',
          requiresVip: true,
          price: 100
        },
        'fire': {
          name: '🔥 Marco Fuego',
          description: 'Marco ardiente animado',
          style: 'border: 3px solid #ff4500; box-shadow: 0 0 20px rgba(255, 69, 0, 0.8); animation: fireGlow 2s ease-in-out infinite alternate;',
          requiresVip: true,
          price: 125
        }
      }
    };
    
    this.vipTags = {
      'vip14': {
        name: '👑 VIP 14 días',
        description: 'Acceso VIP temporal',
        duration: 14,
        price: 500
      },
      'vip30': {
        name: '👑 VIP 30 días',
        description: 'Acceso VIP mensual',
        duration: 30,
        price: 900
      },
      'vipPerma': {
        name: '💎 VIP Permanente',
        description: 'Acceso VIP de por vida',
        duration: 'permanent',
        price: 2500
      }
    };
    
    this.init();
  }
  
  init() {
    this.loadSavedTheme();
    this.loadSavedFrame();
    this.setupGlobalFunctions();
    this.addFrameAnimations();
    this.checkVipExpiry();
  }
  
  setupGlobalFunctions() {
    window.showVipStore = () => this.showStore();
    window.applyTheme = (themeName) => this.applyTheme(themeName);
    window.loadSavedTheme = () => this.loadSavedTheme();
    window.applyAvatarFrame = (frameKey) => this.applyAvatarFrame(frameKey);
    window.purchaseTheme = (themeKey) => this.purchaseTheme(themeKey);
    window.purchaseFrame = (frameKey) => this.purchaseFrame(frameKey);
    window.getUserPoints = () => this.getUserPoints();
    window.purchaseVipTag = (tagKey) => this.purchaseVipTag(tagKey);
    window.applyProfileTheme = (username, userProfile) => this.applyProfileTheme(username, userProfile);
    window.applyUserThemeToModal = (modalElement, userTheme, isVip) => this.applyUserThemeToModal(modalElement, userTheme, isVip);
  }
  
  addFrameAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fireGlow {
        0% { box-shadow: 0 0 20px rgba(255, 69, 0, 0.8); }
        100% { box-shadow: 0 0 30px rgba(255, 69, 0, 1), 0 0 40px rgba(255, 140, 0, 0.5); }
      }
      
      @keyframes vipGlow {
        0% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); }
        100% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6); }
      }
      
      .vip-user {
        position: relative;
        animation: vipGlow 2s ease-in-out infinite alternate;
      }
      
      .vip-user .card {
        background: linear-gradient(135deg, var(--bg-light), var(--bg-light)) !important;
        border: 2px solid var(--user-primary, var(--primary)) !important;
      }
      
      .user-panel[data-theme] {
        border-color: var(--user-primary, var(--primary)) !important;
        box-shadow: 0 0 10px var(--user-primary, var(--primary))33 !important;
      }
      
      .vip-profile .modal-content {
        animation: vipGlow 3s ease-in-out infinite alternate;
      }
      
      .vip-profile .modal-header {
        position: relative;
        overflow: hidden;
      }
      
      .vip-profile .modal-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent);
        animation: shimmer 3s infinite;
      }
      
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
    `;
    document.head.appendChild(style);
  }
  
  showStore() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content" style="background: var(--bg-dark); border: 2px solid var(--primary);">
          <div class="modal-header" style="border-bottom: 1px solid var(--primary);">
            <h5 class="modal-title" style="color: var(--primary);">💎 Tienda VIP</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(1);"></button>
          </div>
          <div class="modal-body">
            <ul class="nav nav-tabs mb-3" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#free-content" type="button" role="tab">
                  🆓 Gratis
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#market-content" type="button" role="tab">
                  💰 Mercado
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#vip-content" type="button" role="tab">
                  💎 VIP
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#vip-store" type="button" role="tab">
                  🛒 Comprar VIP
                </button>
              </li>
            </ul>
            
            <div class="tab-content">
              <div class="tab-pane fade show active" id="free-content" role="tabpanel">
                <div class="row">
                  <div class="col-md-6">
                    <h6 style="color: var(--primary); margin-bottom: 15px;">🎨 Temas Gratuitos</h6>
                    ${this.renderFreeThemes()}
                  </div>
                  <div class="col-md-6">
                    <h6 style="color: var(--primary); margin-bottom: 15px;">🖼️ Marcos Gratuitos</h6>
                    ${this.renderFreeFrames()}
                  </div>
                </div>
              </div>
              
              <div class="tab-pane fade" id="market-content" role="tabpanel">
                <div class="text-center mb-3">
                  <h5 style="color: var(--primary);">Tus Puntos: <span class="badge bg-primary">${this.getUserPoints()}</span></h5>
                </div>
                <div class="row">
                  <div class="col-md-6">
                    <h6 style="color: #ffa500; margin-bottom: 15px;">🎨 Temas Premium</h6>
                    ${this.renderPremiumThemes()}
                  </div>
                  <div class="col-md-6">
                    <h6 style="color: #ffa500; margin-bottom: 15px;">🖼️ Marcos Premium</h6>
                    ${this.renderPremiumFrames()}
                  </div>
                </div>
              </div>
              
              <div class="tab-pane fade" id="vip-content" role="tabpanel">
                <div class="text-center mb-4">
                  <div style="font-size: 3em; margin-bottom: 15px;">👑</div>
                  <h4 style="color: var(--primary);">Contenido VIP</h4>
                  <div class="alert ${this.hasVipAccess() ? 'alert-success' : 'alert-warning'}" role="alert">
                    ${this.hasVipAccess() ? '✅ Tienes acceso VIP' : '⚠️ Necesitas VIP para acceder a este contenido'}
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6">
                    <h6 style="color: #8b5cf6;">🎨 Temas VIP</h6>
                    ${this.renderVipThemes()}
                  </div>
                  <div class="col-md-6">
                    <h6 style="color: #8b5cf6;">🖼️ Marcos VIP</h6>
                    ${this.renderVipFrames()}
                  </div>
                </div>
              </div>
              
              <div class="tab-pane fade" id="vip-store" role="tabpanel">
                <div class="text-center mb-4">
                  <h4 style="color: var(--primary);">🛒 Comprar Acceso VIP</h4>
                  <h5 style="color: var(--primary);">Tus Puntos: <span class="badge bg-primary">${this.getUserPoints()}</span></h5>
                </div>
                <div class="row justify-content-center">
                  ${this.renderVipTagsStore()}
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="border-top: 1px solid var(--primary);">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }
  
  renderFreeThemes() {
    return Object.entries(this.themes.free).map(([key, theme]) => `
      <div class="mb-2">
        <div class="card theme-card" style="background: var(--bg-light); border: 2px solid ${theme.colors.primary}; cursor: pointer;" onclick="applyTheme('${key}')">
          <div class="card-body p-2 text-center">
            <div style="width: 100%; height: 40px; background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}); border-radius: 6px; margin-bottom: 8px;"></div>
            <h6 style="color: ${theme.colors.primary}; margin: 0; font-size: 0.9em;">${theme.name}</h6>
            <small class="text-muted" style="font-size: 0.7em;">${theme.description}</small>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderFreeFrames() {
    return Object.entries(this.avatarFrames.free).map(([key, frame]) => `
      <div class="mb-2">
        <div class="card frame-card" style="background: var(--bg-light); border: 1px solid var(--primary); cursor: pointer;" onclick="applyAvatarFrame('${key}')">
          <div class="card-body p-2 text-center">
            <div style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); margin: 0 auto 6px; ${frame.style !== 'none' ? frame.style : ''}"></div>
            <h6 style="color: var(--primary); margin: 0; font-size: 0.8em;">${frame.name}</h6>
            <small class="text-muted" style="font-size: 0.7em;">${frame.description}</small>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderPremiumThemes() {
    return Object.entries(this.themes.premium).map(([key, theme]) => `
      <div class="mb-2">
        <div class="card theme-card" style="background: var(--bg-light); border: 2px solid ${theme.colors.primary}; cursor: pointer; opacity: ${this.hasPoints(theme.price) ? '1' : '0.6'};" onclick="purchaseTheme('${key}')">
          <div class="card-body p-2 text-center">
            <div style="width: 100%; height: 40px; background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}); border-radius: 6px; margin-bottom: 8px;"></div>
            <h6 style="color: ${theme.colors.primary}; margin: 0; font-size: 0.8em;">${theme.name}</h6>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <small class="text-muted" style="font-size: 0.7em;">${theme.description}</small>
              <span class="badge bg-warning text-dark" style="font-size: 0.6em;">${theme.price}pts</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderPremiumFrames() {
    return Object.entries(this.avatarFrames.premium).map(([key, frame]) => `
      <div class="mb-2">
        <div class="card frame-card" style="background: var(--bg-light); border: 1px solid var(--primary); cursor: pointer; opacity: ${this.hasPoints(frame.price) ? '1' : '0.6'};" onclick="purchaseFrame('${key}')">
          <div class="card-body p-2 text-center">
            <div style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); margin: 0 auto 6px; ${frame.style}"></div>
            <h6 style="color: var(--primary); margin: 0; font-size: 0.8em;">${frame.name}</h6>
            <div class="d-flex justify-content-between align-items-center mt-1">
              <small class="text-muted" style="font-size: 0.7em;">${frame.description}</small>
              <span class="badge bg-warning text-dark" style="font-size: 0.6em;">${frame.price}pts</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderVipThemes() {
    return Object.entries(this.themes.vip).map(([key, theme]) => `
      <div class="mb-2">
        <div class="card" style="background: var(--bg-light); border: 2px solid ${theme.colors.primary}; cursor: ${this.hasVipAccess() ? 'pointer' : 'not-allowed'}; opacity: ${this.hasVipAccess() ? '1' : '0.6'};" ${this.hasVipAccess() ? `onclick="applyTheme('${key}')"` : ''}>
          <div class="card-body p-2 text-center">
            <div style="width: 100%; height: 30px; background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}); border-radius: 4px; margin-bottom: 6px;"></div>
            <small style="color: ${theme.colors.primary}; font-size: 0.7em;">${theme.name}</small>
            <div class="badge bg-warning text-dark mt-1" style="font-size: 0.6em;">VIP</div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  renderVipFrames() {
    return Object.entries(this.avatarFrames.vip).map(([key, frame]) => `
      <div class="mb-2">
        <div class="card" style="background: var(--bg-light); border: 1px solid var(--primary); cursor: ${this.hasVipAccess() ? 'pointer' : 'not-allowed'}; opacity: ${this.hasVipAccess() ? '1' : '0.6'};" ${this.hasVipAccess() ? `onclick="applyAvatarFrame('${key}')"` : ''}>
          <div class="card-body p-2 text-center">
            <div style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); margin: 0 auto 6px; ${frame.style}"></div>
            <small style="color: var(--primary); font-size: 0.7em;">${frame.name}</small>
            <div class="badge bg-warning text-dark mt-1" style="font-size: 0.6em;">VIP</div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  applyTheme(themeName) {
    const body = document.body;
    
    if (this.themes.vip[themeName] && !this.hasVipAccess()) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification('❌ Necesitas el tag VIP para usar este tema', 'error');
      }
      return;
    }
    
    if (this.themes.premium[themeName] && !this.hasPurchased('themes', themeName)) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification('❌ Debes comprar este tema primero', 'error');
      }
      return;
    }
    
    body.removeAttribute('data-theme');
    
    if (themeName !== 'default') {
      body.setAttribute('data-theme', themeName);
    }
    
    localStorage.setItem('guestbook-theme', themeName);
    
    // Guardar tema en Firebase si el usuario está logueado
    this.saveThemeToFirebase(themeName);
    
    if (window.guestbookApp && window.guestbookApp.ui) {
      const theme = this.themes.free[themeName] || this.themes.premium[themeName] || this.themes.vip[themeName];
      if (theme) {
        window.guestbookApp.ui.showNotification(`✅ ${theme.name} aplicado`, 'success');
      }
    }
  }
  
  applyAvatarFrame(frameKey) {
    const frame = this.avatarFrames.free[frameKey] || this.avatarFrames.premium[frameKey] || this.avatarFrames.vip[frameKey];
    if (!frame) return;
    
    if (frame.requiresVip && !this.hasVipAccess()) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification('❌ Necesitas el tag VIP para usar este marco', 'error');
      }
      return;
    }
    
    if (this.avatarFrames.premium[frameKey] && !this.hasPurchased('frames', frameKey)) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification('❌ Debes comprar este marco primero', 'error');
      }
      return;
    }
    
    localStorage.setItem('guestbook-avatar-frame', frameKey);
    
    if (window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()) {
      window.guestbookApp.profiles.currentProfile.avatarFrame = frameKey;
      window.guestbookApp.profiles.saveProfile();
    }
    
    if (window.guestbookApp && window.guestbookApp.ui) {
      window.guestbookApp.ui.showNotification(`✅ ${frame.name} aplicado`, 'success');
    }
  }
  
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('guestbook-theme');
    if (savedTheme) {
      this.applyTheme(savedTheme);
    }
  }
  
  loadSavedFrame() {
    const savedFrame = localStorage.getItem('guestbook-avatar-frame');
    if (savedFrame) {
      // Frame loading logic here
    }
  }
  
  hasVipAccess() {
    if (!window.guestbookApp || !window.guestbookApp.profiles || !window.guestbookApp.profiles.isLoggedIn()) {
      return false;
    }
    
    const profile = window.guestbookApp.profiles.currentProfile;
    if (!profile || !profile.userTags || !Array.isArray(profile.userTags)) {
      return false;
    }
    
    const userTags = profile.userTags;
    
    // OWNER y ADMIN siempre tienen acceso VIP
    if (userTags.includes('OWNER') || userTags.includes('ADMIN')) {
      return true;
    }
    
    // Para usuarios regulares, verificar tag VIP
    if (!userTags.includes('VIP')) {
      return false;
    }
    
    // Si tiene VIP permanente, tiene acceso
    if (profile.vipExpiry === 'permanent') {
      return true;
    }
    
    // Si tiene VIP temporal, verificar expiración
    if (profile.vipExpiry) {
      const expiryDate = new Date(profile.vipExpiry);
      const now = new Date();
      return now <= expiryDate;
    }
    
    // Si tiene tag VIP pero no hay fecha de expiración válida, no tiene acceso
    return false;
  }
  
  getUserPoints() {
    return parseInt(localStorage.getItem('guestbook-user-points') || '0');
  }
  
  hasPoints(amount) {
    return this.getUserPoints() >= amount;
  }
  
  spendPoints(amount, reason = '') {
    const currentPoints = this.getUserPoints();
    if (currentPoints < amount) return false;
    
    const newPoints = currentPoints - amount;
    localStorage.setItem('guestbook-user-points', newPoints.toString());
    
    if (window.guestbookApp && window.guestbookApp.ui) {
      window.guestbookApp.ui.showNotification(`-${amount} puntos: ${reason}`, 'info');
    }
    
    return true;
  }
  
  purchaseTheme(themeKey) {
    const theme = this.themes.premium[themeKey];
    if (!theme) return;
    
    if (!this.hasPoints(theme.price)) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification(`❌ Necesitas ${theme.price} puntos (tienes ${this.getUserPoints()})`, 'error');
      }
      return;
    }
    
    if (confirm(`¿Comprar ${theme.name} por ${theme.price} puntos?`)) {
      if (this.spendPoints(theme.price, theme.name)) {
        const purchased = JSON.parse(localStorage.getItem('guestbook-purchased-themes') || '[]');
        if (!purchased.includes(themeKey)) {
          purchased.push(themeKey);
          localStorage.setItem('guestbook-purchased-themes', JSON.stringify(purchased));
        }
        
        this.applyTheme(themeKey);
        
        if (window.guestbookApp && window.guestbookApp.ui) {
          window.guestbookApp.ui.showNotification(`✅ ${theme.name} comprado!`, 'success');
        }
      }
    }
  }
  
  purchaseFrame(frameKey) {
    const frame = this.avatarFrames.premium[frameKey];
    if (!frame) return;
    
    if (!this.hasPoints(frame.price)) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification(`❌ Necesitas ${frame.price} puntos (tienes ${this.getUserPoints()})`, 'error');
      }
      return;
    }
    
    if (confirm(`¿Comprar ${frame.name} por ${frame.price} puntos?`)) {
      if (this.spendPoints(frame.price, frame.name)) {
        const purchased = JSON.parse(localStorage.getItem('guestbook-purchased-frames') || '[]');
        if (!purchased.includes(frameKey)) {
          purchased.push(frameKey);
          localStorage.setItem('guestbook-purchased-frames', JSON.stringify(purchased));
        }
        
        this.applyAvatarFrame(frameKey);
        
        if (window.guestbookApp && window.guestbookApp.ui) {
          window.guestbookApp.ui.showNotification(`✅ ${frame.name} comprado!`, 'success');
        }
      }
    }
  }
  
  hasPurchased(type, key) {
    const purchased = JSON.parse(localStorage.getItem(`guestbook-purchased-${type}`) || '[]');
    return purchased.includes(key);
  }
  
  renderVipTagsStore() {
    return Object.entries(this.vipTags).map(([key, tag]) => `
      <div class="col-md-4 mb-3">
        <div class="card h-100" style="background: var(--bg-light); border: 2px solid #ffd700; cursor: pointer; opacity: ${this.hasPoints(tag.price) ? '1' : '0.6'};" onclick="purchaseVipTag('${key}')">
          <div class="card-body text-center">
            <div style="font-size: 2.5em; margin-bottom: 10px;">${key === 'vipPerma' ? '💎' : '👑'}</div>
            <h5 style="color: #ffd700; margin-bottom: 10px;">${tag.name}</h5>
            <p class="text-muted" style="font-size: 0.9em;">${tag.description}</p>
            <div class="mb-3">
              <span class="badge bg-info" style="font-size: 0.8em;">
                ${tag.duration === 'permanent' ? 'Permanente' : `${tag.duration} días`}
              </span>
            </div>
            <div class="d-grid">
              <span class="btn btn-warning" style="font-weight: bold;">${tag.price} puntos</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  purchaseVipTag(tagKey) {
    const tag = this.vipTags[tagKey];
    if (!tag) return;
    
    if (!this.hasPoints(tag.price)) {
      if (window.guestbookApp && window.guestbookApp.ui) {
        window.guestbookApp.ui.showNotification(`❌ Necesitas ${tag.price} puntos (tienes ${this.getUserPoints()})`, 'error');
      }
      return;
    }
    
    if (confirm(`¿Comprar ${tag.name} por ${tag.price} puntos?`)) {
      if (this.spendPoints(tag.price, tag.name)) {
        this.grantVipAccess(tag.duration);
        
        if (window.guestbookApp && window.guestbookApp.ui) {
          window.guestbookApp.ui.showNotification(`✅ ${tag.name} comprado! Ahora tienes acceso VIP`, 'success');
        }
      }
    }
  }
  
  grantVipAccess(duration) {
    if (window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()) {
      const profile = window.guestbookApp.profiles.currentProfile;
      
      if (!profile.userTags) {
        profile.userTags = [];
      }
      
      if (!profile.userTags.includes('VIP')) {
        profile.userTags.push('VIP');
      }
      
      if (duration !== 'permanent') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + duration);
        profile.vipExpiry = expiryDate.toISOString();
      } else {
        profile.vipExpiry = 'permanent';
      }
      
      window.guestbookApp.profiles.saveProfile();
    }
  }
  
  checkVipExpiry() {
    if (!window.guestbookApp || !window.guestbookApp.profiles || !window.guestbookApp.profiles.isLoggedIn()) {
      return;
    }
    
    const profile = window.guestbookApp.profiles.currentProfile;
    if (!profile || !profile.userTags) {
      return;
    }
    
    // Solo verificar si tiene tag VIP y no es OWNER/ADMIN
    if (profile.userTags.includes('VIP') && !profile.userTags.includes('OWNER') && !profile.userTags.includes('ADMIN')) {
      // Si tiene VIP pero no hay fecha de expiración y no es permanente, remover VIP
      if (!profile.vipExpiry) {
        profile.userTags = profile.userTags.filter(tag => tag !== 'VIP');
        window.guestbookApp.profiles.saveProfile();
        return;
      }
      
      // Si no es permanente, verificar expiración
      if (profile.vipExpiry !== 'permanent') {
        const expiryDate = new Date(profile.vipExpiry);
        const now = new Date();
        
        if (now > expiryDate) {
          profile.userTags = profile.userTags.filter(tag => tag !== 'VIP');
          delete profile.vipExpiry;
          window.guestbookApp.profiles.saveProfile();
          
          if (window.guestbookApp && window.guestbookApp.ui) {
            window.guestbookApp.ui.showNotification('⏰ Tu acceso VIP ha expirado', 'warning');
          }
        }
      }
    }
  }
  
  updateProfileCircleFrame(profileCircle, frameKey) {
    if (!profileCircle || !profileCircle.style) return;
    
    const frame = this.avatarFrames.free[frameKey] || this.avatarFrames.premium[frameKey] || this.avatarFrames.vip[frameKey];
    if (!frame || frame.style === 'none') {
      profileCircle.style.border = '';
      profileCircle.style.boxShadow = '';
      profileCircle.style.animation = '';
      return;
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = frame.style;
    
    profileCircle.style.border = tempDiv.style.border || '2px solid var(--primary)';
    profileCircle.style.boxShadow = tempDiv.style.boxShadow || '0 0 10px rgba(255, 107, 53, 0.4)';
    profileCircle.style.animation = tempDiv.style.animation || '';
  }
  
  // Personalizar panel de usuario según tema y VIP
  customizeUserPanel(userElement, userProfile) {
    if (!userElement || !userProfile) return;
    
    const userTheme = userProfile.selectedTheme || 'default';
    const hasVip = this.checkUserVipStatus(userProfile);
    const theme = this.themes.free[userTheme] || this.themes.premium[userTheme] || this.themes.vip[userTheme];
    
    // Aplicar colores del tema al panel
    if (theme && theme.colors) {
      userElement.style.setProperty('--user-primary', theme.colors.primary);
      userElement.style.setProperty('--user-secondary', theme.colors.secondary);
      
      // Personalizar borde del panel
      const panel = userElement.querySelector('.user-panel, .card');
      if (panel) {
        panel.style.border = `2px solid ${theme.colors.primary}`;
        panel.style.boxShadow = `0 0 10px ${theme.colors.primary}33`;
      }
    }
    
    // Añadir efectos VIP
    if (hasVip) {
      userElement.classList.add('vip-user');
      const vipBadge = userElement.querySelector('.vip-badge') || this.createVipBadge();
      if (!userElement.querySelector('.vip-badge')) {
        userElement.appendChild(vipBadge);
      }
    }
  }
  
  createVipBadge() {
    const badge = document.createElement('div');
    badge.className = 'vip-badge';
    badge.innerHTML = '👑';
    badge.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      background: linear-gradient(45deg, #ffd700, #ffed4e);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
      z-index: 10;
    `;
    return badge;
  }
  
  checkUserVipStatus(userProfile) {
    if (!userProfile.userTags) return false;
    
    const userTags = userProfile.userTags;
    if (userTags.includes('OWNER') || userTags.includes('ADMIN')) return true;
    if (!userTags.includes('VIP')) return false;
    
    if (userProfile.vipExpiry === 'permanent') return true;
    if (userProfile.vipExpiry) {
      const expiryDate = new Date(userProfile.vipExpiry);
      return new Date() <= expiryDate;
    }
    
    return false;
  }
  
  // Guardar tema del usuario en Firebase
  async saveThemeToFirebase(themeName) {
    if (window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()) {
      try {
        const profile = window.guestbookApp.profiles.currentProfile;
        profile.selectedTheme = themeName;
        await window.guestbookApp.profiles.saveProfile();
        console.log(`Tema ${themeName} guardado en Firebase para ${profile.username}`);
      } catch (error) {
        console.error('Error guardando tema en Firebase:', error);
      }
    }
  }
  
  // Aplicar personalización a todos los paneles visibles
  updateAllUserPanels() {
    const userElements = document.querySelectorAll('[data-user-id]');
    userElements.forEach(element => {
      const userId = element.getAttribute('data-user-id');
      if (window.guestbookApp && window.guestbookApp.profiles) {
        const userProfile = window.guestbookApp.profiles.getUserById(userId);
        if (userProfile) {
          this.customizeUserPanel(element, userProfile);
        }
      }
    });
  }
  
  // Personalizar panel de perfil específico (para gallery.js)
  customizeProfilePanel(username, userProfile) {
    if (!userProfile) return;
    
    const userTheme = userProfile.selectedTheme || 'default';
    const hasVip = this.checkUserVipStatus(userProfile);
    const theme = this.themes.free[userTheme] || this.themes.premium[userTheme] || this.themes.vip[userTheme];
    
    // Buscar el modal de perfil del usuario
    const profileModal = document.querySelector(`#userProfileModal-${username.replace(/\s+/g, '')}`);
    if (!profileModal) return;
    
    // Personalizar colores del modal
    if (theme && theme.colors) {
      const modalContent = profileModal.querySelector('.modal-content');
      const modalHeader = profileModal.querySelector('.modal-header');
      const badges = profileModal.querySelectorAll('.badge');
      
      if (modalContent) {
        modalContent.style.border = `2px solid ${theme.colors.primary}`;
        modalContent.style.boxShadow = `0 0 20px ${theme.colors.primary}33`;
      }
      
      if (modalHeader) {
        modalHeader.style.borderBottom = `1px solid ${theme.colors.primary}`;
        modalHeader.style.background = `linear-gradient(135deg, ${theme.colors.primary}11, ${theme.colors.secondary}11)`;
      }
      
      badges.forEach(badge => {
        if (!badge.classList.contains('vip-badge')) {
          badge.style.background = `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
        }
      });
    }
    
    // Añadir efectos VIP
    if (hasVip) {
      profileModal.classList.add('vip-profile');
      
      // Añadir badge VIP al título
      const modalTitle = profileModal.querySelector('.modal-title');
      if (modalTitle && !modalTitle.querySelector('.vip-crown')) {
        const vipCrown = document.createElement('span');
        vipCrown.className = 'vip-crown';
        vipCrown.innerHTML = ' 👑';
        vipCrown.style.cssText = `
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
          animation: vipGlow 2s ease-in-out infinite alternate;
        `;
        modalTitle.appendChild(vipCrown);
      }
      
      // Personalizar estadísticas con efectos VIP
      const statsSection = profileModal.querySelector('.stats-section');
      if (statsSection) {
        statsSection.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))';
        statsSection.style.border = '1px solid rgba(255, 215, 0, 0.3)';
        statsSection.style.borderRadius = '8px';
        statsSection.style.padding = '15px';
      }
    }
  }
  
  // Función para ser llamada desde gallery.js
  applyProfileTheme(username, userProfile) {
    // Esperar un poco para que el modal se renderice
    setTimeout(() => {
      this.customizeProfilePanel(username, userProfile);
    }, 100);
  }
  
  // Función simple para aplicar tema a cualquier modal
  applyUserThemeToModal(modalElement, userTheme, isVip = false) {
    if (!modalElement || !userTheme) return;
    
    const theme = this.themes.free[userTheme] || this.themes.premium[userTheme] || this.themes.vip[userTheme];
    if (!theme || !theme.colors) return;
    
    const modalContent = modalElement.querySelector('.modal-content');
    const modalTitle = modalElement.querySelector('.modal-title');
    
    // Aplicar colores específicos del tema (no variables CSS)
    if (modalContent) {
      modalContent.style.border = `2px solid ${theme.colors.primary}`;
      modalContent.style.boxShadow = `0 0 15px ${theme.colors.primary}44`;
    }
    
    if (modalTitle) {
      modalTitle.style.color = theme.colors.primary;
    }
    
    // Reemplazar todas las referencias a var(--primary) con el color del tema del usuario
    const allElements = modalElement.querySelectorAll('*');
    allElements.forEach(el => {
      // Reemplazar en atributos style
      if (el.style.cssText && el.style.cssText.includes('var(--primary)')) {
        el.style.cssText = el.style.cssText.replace(/var\(--primary\)/g, theme.colors.primary);
      }
      
      // Reemplazar en innerHTML para estilos inline
      if (el.innerHTML && el.innerHTML.includes('var(--primary)')) {
        el.innerHTML = el.innerHTML.replace(/var\(--primary\)/g, theme.colors.primary);
      }
    });
    
    // Aplicar colores del tema a todos los textos principales
    const titleElements = modalElement.querySelectorAll('h4, h5, h6, strong');
    titleElements.forEach(el => {
      el.style.color = theme.colors.primary;
    });
    
    // Cambiar colores de estadísticas y elementos destacados
    const statElements = modalElement.querySelectorAll('[style*="color: var(--primary)"]');
    statElements.forEach(el => {
      el.style.color = theme.colors.primary;
    });
    
    // Aplicar fondo del tema al modal
    if (modalContent) {
      modalContent.style.background = `linear-gradient(135deg, ${theme.colors.primary}11, ${theme.colors.secondary}08)`;
    }
    
    // Aplicar marco del usuario al avatar
    const avatarElement = modalElement.querySelector('[style*="border-radius: 50%"]');
    if (avatarElement && window.guestbookApp?.vipStore) {
      const currentFrame = localStorage.getItem('guestbook-avatar-frame') || 'none';
      window.guestbookApp.vipStore.updateProfileCircleFrame(avatarElement, currentFrame);
    }
    
    // Efectos VIP
    if (isVip) {
      modalElement.classList.add('vip-profile');
      if (modalTitle && !modalTitle.querySelector('.vip-crown')) {
        modalTitle.innerHTML += ' 👑';
      }
    }
  }
}