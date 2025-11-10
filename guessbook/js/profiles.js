// Sistema de perfiles mejorado con autenticación
export class ProfileManager {
  constructor(firebaseManager) {
    this.firebase = firebaseManager;
    this.users = new Map(); // Base de datos local de usuarios
    this.currentProfile = {
      id: null,
      username: '',
      email: '',
      avatar: '👤',
      avatarType: 'emoji',
      avatarImage: null,
      totalDrawings: 0,
      totalLikes: 0,
      totalComments: 0,
      joinDate: Date.now(),
      favoriteCategory: 'Arte',
      achievements: [],
      isLoggedIn: false,
      lastLogin: null,
      sessionToken: null
    };
    
    this.init();
  }
  
  async init() {
    this.loadUsers();
    this.createProfileCircle();
    await this.loadProfile();
    this.setupProfileButton();
    
    // Forzar actualización después de que el DOM esté listo
    setTimeout(() => {
      this.updateProfileCircle();
      this.syncAllDrawingCards();
    }, 500);
  }
  
  loadUsers() {
    const savedUsers = localStorage.getItem('registeredUsers');
    if (savedUsers) {
      const usersArray = JSON.parse(savedUsers);
      this.users = new Map(usersArray.map(user => [user.username.toLowerCase(), user]));
    }
  }
  
  saveUsers() {
    const usersArray = Array.from(this.users.values());
    localStorage.setItem('registeredUsers', JSON.stringify(usersArray));
  }
  
  async loadProfile() {
    const saved = localStorage.getItem('userProfile');
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (saved && sessionToken) {
      this.currentProfile = { ...this.currentProfile, ...JSON.parse(saved) };
      
      // Verificar si la sesión sigue válida (7 días)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (this.currentProfile.lastLogin && this.currentProfile.lastLogin > sevenDaysAgo && 
          this.currentProfile.sessionToken === sessionToken) {
        this.currentProfile.isLoggedIn = true;
        console.log('✅ Sesión restaurada para:', this.currentProfile.username);
        
        // Cargar datos actualizados desde Firebase
        try {
          const firebaseProfile = await this.firebase.getUserProfile(this.currentProfile.username);
          if (firebaseProfile) {
            this.currentProfile.avatar = firebaseProfile.avatar || this.currentProfile.avatar;
            this.currentProfile.avatarType = firebaseProfile.avatarType || this.currentProfile.avatarType;
            this.currentProfile.avatarImage = firebaseProfile.avatarImage || this.currentProfile.avatarImage;
            this.currentProfile.totalDrawings = firebaseProfile.totalDrawings || this.currentProfile.totalDrawings;
            this.currentProfile.totalLikes = firebaseProfile.totalLikes || this.currentProfile.totalLikes;
            this.currentProfile.achievements = firebaseProfile.achievements || this.currentProfile.achievements;
            console.log('🔄 Perfil sincronizado desde Firebase');
          }
        } catch (error) {
          console.warn('Error sincronizando perfil desde Firebase:', error);
        }
        
        // Asegurar que la foto de perfil se mantenga
        setTimeout(() => this.updateProfileCircle(), 100);
      } else {
        this.logout(false);
        console.log('⚠️ Sesión expirada');
      }
    }
    this.updateProfileCircle();
  }
  
  generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  hashPassword(password) {
    // Hash simple para demo - en producción usar bcrypt o similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit
    }
    return hash.toString();
  }
  
  async saveProfile() {
    if (this.currentProfile.isLoggedIn) {
      localStorage.setItem('userProfile', JSON.stringify(this.currentProfile));
      localStorage.setItem('sessionToken', this.currentProfile.sessionToken);
      
      // Guardar en Firebase
      try {
        await this.firebase.saveUserProfile({
          username: this.currentProfile.username,
          avatar: this.currentProfile.avatar,
          avatarType: this.currentProfile.avatarType,
          avatarImage: this.currentProfile.avatarImage,
          totalDrawings: this.currentProfile.totalDrawings,
          totalLikes: this.currentProfile.totalLikes,
          achievements: this.currentProfile.achievements,
          lastLogin: this.currentProfile.lastLogin
        });
      } catch (error) {
        console.warn('Error guardando perfil en Firebase:', error);
      }
      
      // Actualizar usuario en la base de datos local
      if (this.users.has(this.currentProfile.username.toLowerCase())) {
        const user = this.users.get(this.currentProfile.username.toLowerCase());
        user.avatar = this.currentProfile.avatar;
        user.avatarType = this.currentProfile.avatarType;
        user.avatarImage = this.currentProfile.avatarImage;
        user.totalDrawings = this.currentProfile.totalDrawings;
        user.totalLikes = this.currentProfile.totalLikes;
        user.achievements = this.currentProfile.achievements;
        user.lastLogin = this.currentProfile.lastLogin;
        this.saveUsers();
      }
      
      // Actualizar tarjetas de dibujos existentes
      this.updateExistingDrawingCards();
    }
  }
  
  createProfileCircle() {
    const circle = document.createElement('div');
    circle.id = 'profileCircle';
    circle.className = 'profile-circle';
    circle.title = 'Mi Perfil';
    circle.innerHTML = '👤';
    circle.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(45deg, var(--primary), #ff8c42);
      border: 3px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
      color: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;
    
    circle.addEventListener('mouseenter', () => {
      circle.style.transform = 'scale(1.1)';
      circle.style.boxShadow = '0 6px 20px rgba(255, 107, 53, 0.4)';
    });
    
    circle.addEventListener('mouseleave', () => {
      circle.style.transform = 'scale(1)';
      circle.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });
    
    circle.addEventListener('click', () => this.showProfileModal());
    document.body.appendChild(circle);
  }
  
  updateExistingDrawingCards() {
    const drawingCards = document.querySelectorAll('.drawing-card');
    drawingCards.forEach(card => {
      const authorElement = card.querySelector('.author-name');
      if (authorElement && authorElement.textContent.trim() === this.currentProfile.username) {
        const avatarElement = card.querySelector('.author-avatar');
        if (avatarElement) {
          this.updateCardAvatar(avatarElement, this.currentProfile);
        }
      }
    });
  }
  
  async syncAllDrawingCards() {
    const drawingCards = document.querySelectorAll('.drawing-card');
    console.log(`🔄 Sincronizando ${drawingCards.length} tarjetas...`);
    
    for (const card of drawingCards) {
      const authorElement = card.querySelector('.author-name');
      const avatarElement = card.querySelector('.author-avatar');
      
      if (authorElement && avatarElement) {
        const username = authorElement.textContent.trim();
        
        // Buscar perfil en usuarios locales
        let userProfile = this.users.get(username.toLowerCase());
        
        // Si no está local, intentar cargar desde Firebase
        if (!userProfile) {
          try {
            userProfile = await this.firebase.getUserProfile(username);
            if (userProfile) {
              // Guardar en caché local
              this.users.set(username.toLowerCase(), userProfile);
            }
          } catch (error) {
            console.warn(`Error cargando perfil de ${username}:`, error);
          }
        }
        
        if (userProfile) {
          this.updateCardAvatar(avatarElement, userProfile);
          console.log(`✅ Avatar actualizado para ${username}`);
        }
      }
    }
  }
  
  // Método público para sincronizar después de cargar dibujos
  syncCardsAfterLoad() {
    setTimeout(() => {
      this.syncAllDrawingCards();
    }, 1000);
  }
  
  updateCardAvatar(avatarElement, profile) {
    // Limpiar estilos previos
    avatarElement.style.backgroundImage = 'none';
    avatarElement.textContent = '';
    
    if (profile.avatarType === 'image' && profile.avatarImage) {
      avatarElement.style.backgroundImage = `url(${profile.avatarImage})`;
      avatarElement.style.backgroundSize = 'cover';
      avatarElement.style.backgroundPosition = 'center';
      avatarElement.textContent = '';
    } else {
      avatarElement.textContent = profile.avatar || '👤';
      avatarElement.style.backgroundImage = 'none';
    }
  }
  
  updateProfileCircle() {
    const circle = document.getElementById('profileCircle');
    if (circle) {
      // Limpiar estilos previos
      circle.style.backgroundImage = 'none';
      circle.textContent = '';
      
      if (this.currentProfile.avatarType === 'image' && this.currentProfile.avatarImage) {
        circle.style.backgroundImage = `url(${this.currentProfile.avatarImage})`;
        circle.style.backgroundSize = 'cover';
        circle.style.backgroundPosition = 'center';
        circle.style.backgroundColor = 'transparent';
      } else {
        circle.textContent = this.currentProfile.avatar || '👤';
        circle.style.backgroundColor = '';
      }
      
      // Mostrar estado de sesión
      const status = this.currentProfile.isLoggedIn ? '🟢' : '🔴';
      circle.title = this.currentProfile.username ? 
        `${this.currentProfile.username} ${status}` : 
        'Mi Perfil (No conectado)';
        
      // Indicador visual de sesión
      if (this.currentProfile.isLoggedIn) {
        circle.style.border = '3px solid #28a745';
        circle.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
      } else {
        circle.style.border = '3px solid rgba(255, 255, 255, 0.2)';
        circle.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
      }
      
      console.log('🔄 Perfil actualizado:', {
        avatarType: this.currentProfile.avatarType,
        hasImage: !!this.currentProfile.avatarImage,
        username: this.currentProfile.username
      });
    }
  }
  
  setupProfileButton() {
    const useProfileBtn = document.getElementById('useProfileName');
    if (useProfileBtn) {
      useProfileBtn.addEventListener('click', () => {
        if (this.currentProfile.isLoggedIn && this.currentProfile.username) {
          document.getElementById('authorName').value = this.currentProfile.username;
        } else {
          alert('⚠️ Inicia sesión primero');
          this.showProfileModal();
        }
      });
    }
  }
  
  showProfileModal() {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const content = document.createElement('div');
    content.className = 'profile-content';
    content.style.cssText = `
      background: var(--bg-light);
      border-radius: 20px;
      padding: 30px;
      max-width: 600px;
      width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      border: 2px solid var(--primary);
    `;
    
    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div class="profile-avatar" id="profileAvatar" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(45deg, var(--primary), #ff8c42); display: flex; align-items: center; justify-content: center; font-size: 2em; color: white; margin: 0 auto 20px; border: 3px solid rgba(255, 255, 255, 0.2);">
          ${this.currentProfile.avatarType === 'emoji' ? this.currentProfile.avatar : ''}
        </div>
        <h3 style="color: var(--primary); margin: 0;">${this.currentProfile.username || 'Usuario Anónimo'}</h3>
        <p style="color: var(--text-secondary); margin: 5px 0 0 0; font-size: 0.9em;">
          ${this.currentProfile.isLoggedIn ? 
            `🟢 Conectado - Miembro desde ${this.formatJoinDate(this.currentProfile.joinDate)}` : 
            '🔴 No conectado - Registrate o inicia sesión'
          }
        </p>
      </div>
      
      ${!this.currentProfile.isLoggedIn ? `
        <div id="authTabs" style="display: flex; margin-bottom: 20px; border-bottom: 1px solid var(--primary);">
          <button id="loginTab" class="auth-tab active" style="flex: 1; padding: 10px; background: var(--primary); color: white; border: none; cursor: pointer;">🔑 Iniciar Sesión</button>
          <button id="registerTab" class="auth-tab" style="flex: 1; padding: 10px; background: var(--bg-dark); color: var(--text-primary); border: none; cursor: pointer;">🎆 Registrarse</button>
        </div>
        
        <div id="loginForm" class="auth-form">
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">👤 Usuario</label>
            <input type="text" id="loginUsername" placeholder="Tu nombre de usuario" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">🔒 Contraseña</label>
            <input type="password" id="loginPassword" placeholder="Tu contraseña" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
          </div>
        </div>
        
        <div id="registerForm" class="auth-form" style="display: none;">
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">👤 Usuario</label>
            <input type="text" id="registerUsername" placeholder="Elige un nombre de usuario" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">📧 Email (opcional)</label>
            <input type="email" id="registerEmail" placeholder="tu@email.com" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">🔒 Contraseña</label>
            <input type="password" id="registerPassword" placeholder="Mínimo 4 caracteres" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">🔒 Confirmar Contraseña</label>
            <input type="password" id="confirmPassword" placeholder="Repite tu contraseña" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
          </div>
        </div>
      ` : `
        <div style="margin-bottom: 20px;">
          <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">👤 Usuario: ${this.currentProfile.username}</label>
          <small style="color: var(--text-secondary);">Para cambiar usuario, cierra sesión y crea una nueva cuenta</small>
        </div>
      `}
      
      ${this.currentProfile.isLoggedIn ? `
      <div style="margin-bottom: 20px;">
        <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">😀 Avatar</label>
        <div style="margin-bottom: 10px;">
          <button id="useEmojiAvatar" style="padding: 6px 12px; margin-right: 10px; background: ${this.currentProfile.avatarType === 'emoji' ? 'var(--primary)' : 'var(--bg-dark)'}; color: white; border: 1px solid var(--primary); border-radius: 5px; cursor: pointer; font-size: 0.8em;">📱 Emoji</button>
          <button id="useImageAvatar" style="padding: 6px 12px; background: ${this.currentProfile.avatarType === 'image' ? 'var(--primary)' : 'var(--bg-dark)'}; color: white; border: 1px solid var(--primary); border-radius: 5px; cursor: pointer; font-size: 0.8em;">🖼️ Imagen</button>
        </div>
        
        <div id="emojiAvatars" style="display: ${this.currentProfile.avatarType === 'emoji' ? 'flex' : 'none'}; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
          ${['👤', '😀', '😎', '🤓', '🎨', '🖌️', '🎭', '🦄', '🐱', '🐶', '🦊', '🐼'].map(emoji => `
            <button class="avatar-btn" data-avatar="${emoji}" style="width: 40px; height: 40px; border: 2px solid ${this.currentProfile.avatar === emoji && this.currentProfile.avatarType === 'emoji' ? 'var(--primary)' : 'transparent'}; background: var(--bg-dark); border-radius: 50%; cursor: pointer; font-size: 1.2em;">
              ${emoji}
            </button>
          `).join('')}
        </div>
        
        <div id="imageAvatarSection" style="display: ${this.currentProfile.avatarType === 'image' ? 'block' : 'none'};">
          <input type="file" id="avatarImageUpload" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px; margin-bottom: 10px;">
          <small style="color: var(--text-secondary); display: block;">Sube una imagen PNG/JPG (máx 1MB)</small>
        </div>
      </div>
      ` : ''}
      
      ${this.currentProfile.isLoggedIn && this.currentProfile.totalDrawings > 0 ? `
        <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-dark); border-radius: 10px; border: 1px solid var(--primary);">
          <h4 style="color: var(--primary); margin: 0 0 10px 0;">📊 Estadísticas</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; text-align: center;">
            <div><span style="color: var(--text-secondary);">🎨 Dibujos:</span><br><strong style="color: var(--primary);">${this.currentProfile.totalDrawings}</strong></div>
            <div><span style="color: var(--text-secondary);">❤️ Likes:</span><br><strong style="color: var(--primary);">${this.currentProfile.totalLikes}</strong></div>
            <div><span style="color: var(--text-secondary);">💬 Comentarios:</span><br><strong style="color: var(--primary);">${this.currentProfile.totalComments}</strong></div>
          </div>
          ${this.currentProfile.achievements.length > 0 ? `
            <div style="margin-top: 15px;">
              <h5 style="color: var(--text-primary); margin: 0 0 8px 0;">🏆 Logros</h5>
              <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${this.currentProfile.achievements.map(achievement => `
                  <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 15px; font-size: 0.8em;">${achievement}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        ${!this.currentProfile.isLoggedIn ? `
          <button id="loginBtn" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">🔑 Iniciar Sesión</button>
          <button id="registerBtn" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer;">🎆 Registrarse</button>
        ` : `
          <button id="saveProfile" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">💾 Actualizar Perfil</button>
          <button id="logoutProfile" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">🚪 Cerrar Sesión</button>
          <button id="deleteAccount" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em;">🗑️ Eliminar Cuenta</button>
        `}
        <button id="closeProfile" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">❌ Cerrar</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    this.setupModalEvents(modal);
  }
  
  setupModalEvents(modal) {
    // Tabs de autenticación
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginTab && registerTab) {
      loginTab.addEventListener('click', () => {
        loginTab.style.background = 'var(--primary)';
        registerTab.style.background = 'var(--bg-dark)';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      });
      
      registerTab.addEventListener('click', () => {
        registerTab.style.background = 'var(--primary)';
        loginTab.style.background = 'var(--bg-dark)';
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
      });
    }
    
    // Avatar controls (solo si está logueado)
    if (this.currentProfile.isLoggedIn) {
      document.getElementById('useEmojiAvatar').addEventListener('click', () => {
        this.currentProfile.avatarType = 'emoji';
        document.getElementById('useEmojiAvatar').style.background = 'var(--primary)';
        document.getElementById('useImageAvatar').style.background = 'var(--bg-dark)';
        document.getElementById('emojiAvatars').style.display = 'flex';
        document.getElementById('imageAvatarSection').style.display = 'none';
      });
      
      document.getElementById('useImageAvatar').addEventListener('click', () => {
        this.currentProfile.avatarType = 'image';
        document.getElementById('useImageAvatar').style.background = 'var(--primary)';
        document.getElementById('useEmojiAvatar').style.background = 'var(--bg-dark)';
        document.getElementById('emojiAvatars').style.display = 'none';
        document.getElementById('imageAvatarSection').style.display = 'block';
      });
      
      document.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.avatar-btn').forEach(b => b.style.border = '2px solid transparent');
          btn.style.border = '2px solid var(--primary)';
          this.currentProfile.avatar = btn.dataset.avatar;
          this.currentProfile.avatarType = 'emoji';
        });
      });
      
      document.getElementById('avatarImageUpload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          if (file.size > 1024 * 1024) {
            alert('🚫 Imagen muy grande. Máximo 1MB.');
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentProfile.avatarImage = event.target.result;
            this.currentProfile.avatarType = 'image';
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    // Botones de acción
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const saveBtn = document.getElementById('saveProfile');
    const logoutBtn = document.getElementById('logoutProfile');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.handleLogin(modal));
    }
    
    if (registerBtn) {
      registerBtn.addEventListener('click', () => this.handleRegister(modal));
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await this.saveProfile();
        this.updateProfileCircle();
        alert('✅ Perfil actualizado');
        modal.remove();
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('¿Cerrar sesión?')) {
          this.logout();
          modal.remove();
        }
      });
    }
    
    const deleteBtn = document.getElementById('deleteAccount');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (this.deleteAccount()) {
          modal.remove();
        }
      });
    }
    
    document.getElementById('closeProfile').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  async handleLogin(modal) {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
      alert('⚠️ Completa todos los campos');
      return;
    }
    
    const user = this.users.get(username.toLowerCase());
    if (!user) {
      alert('❌ Usuario no encontrado');
      return;
    }
    
    if (user.passwordHash !== this.hashPassword(password)) {
      alert('❌ Contraseña incorrecta');
      return;
    }
    
    // Cargar perfil desde Firebase
    try {
      const firebaseProfile = await this.firebase.getUserProfile(username);
      if (firebaseProfile) {
        user.avatar = firebaseProfile.avatar || user.avatar;
        user.avatarType = firebaseProfile.avatarType || user.avatarType;
        user.avatarImage = firebaseProfile.avatarImage || user.avatarImage;
        user.totalDrawings = firebaseProfile.totalDrawings || user.totalDrawings;
        user.totalLikes = firebaseProfile.totalLikes || user.totalLikes;
        user.achievements = firebaseProfile.achievements || user.achievements;
      }
    } catch (error) {
      console.warn('Error cargando perfil desde Firebase:', error);
    }
    
    // Login exitoso
    this.currentProfile = {
      ...this.currentProfile,
      ...user,
      isLoggedIn: true,
      lastLogin: Date.now(),
      sessionToken: this.generateSessionToken()
    };
    
    await this.saveProfile();
    this.updateProfileCircle();
    alert(`✅ ¡Bienvenido de vuelta, ${user.username}!`);
    modal.remove();
  }
  
  handleRegister(modal) {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!username || !password) {
      alert('⚠️ Usuario y contraseña son obligatorios');
      return;
    }
    
    if (username.length < 3) {
      alert('⚠️ El usuario debe tener al menos 3 caracteres');
      return;
    }
    
    if (password.length < 4) {
      alert('⚠️ La contraseña debe tener al menos 4 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('⚠️ Las contraseñas no coinciden');
      return;
    }
    
    if (this.users.has(username.toLowerCase())) {
      alert('❌ Este usuario ya existe');
      return;
    }
    
    // Crear nuevo usuario
    const newUser = {
      id: Date.now().toString(),
      username: username,
      email: email,
      passwordHash: this.hashPassword(password),
      avatar: '👤',
      avatarType: 'emoji',
      avatarImage: null,
      totalDrawings: 0,
      totalLikes: 0,
      totalComments: 0,
      joinDate: Date.now(),
      achievements: [],
      lastLogin: Date.now()
    };
    
    this.users.set(username.toLowerCase(), newUser);
    this.saveUsers();
    
    // Auto-login
    this.currentProfile = {
      ...this.currentProfile,
      ...newUser,
      isLoggedIn: true,
      sessionToken: this.generateSessionToken()
    };
    
    this.saveProfile();
    this.updateProfileCircle();
    alert(`✅ ¡Cuenta creada! Bienvenido, ${username}`);
    modal.remove();
  }
  
  updateStats(allDrawings) {
    const userDrawings = allDrawings.filter(d => 
      d.data.autor.toLowerCase() === this.currentProfile.username.toLowerCase()
    );
    
    this.currentProfile.totalDrawings = userDrawings.length;
    this.currentProfile.totalLikes = userDrawings.reduce((sum, d) => sum + (d.data.likes || 0), 0);
    this.currentProfile.totalComments = userDrawings.reduce((sum, d) => sum + (d.data.comments?.length || 0), 0);
    
    // Actualizar logros
    this.currentProfile.achievements = [];
    if (this.currentProfile.totalDrawings >= 1) this.currentProfile.achievements.push('🎨 Primer Dibujo');
    if (this.currentProfile.totalDrawings >= 5) this.currentProfile.achievements.push('🖌️ Artista Activo');
    if (this.currentProfile.totalDrawings >= 10) this.currentProfile.achievements.push('🏆 Maestro del Arte');
    if (this.currentProfile.totalLikes >= 10) this.currentProfile.achievements.push('❤️ Popular');
    if (this.currentProfile.totalLikes >= 50) this.currentProfile.achievements.push('⭐ Estrella');
    if (this.currentProfile.totalComments >= 20) this.currentProfile.achievements.push('💬 Conversador');
    
    this.saveProfile();
  }
  
  logout(showAlert = true) {
    const username = this.currentProfile.username;
    
    // Resetear perfil actual
    this.currentProfile = {
      id: null,
      username: '',
      email: '',
      avatar: '👤',
      avatarType: 'emoji',
      avatarImage: null,
      totalDrawings: 0,
      totalLikes: 0,
      totalComments: 0,
      joinDate: Date.now(),
      favoriteCategory: 'Arte',
      achievements: [],
      isLoggedIn: false,
      lastLogin: null,
      sessionToken: null
    };
    
    // Limpiar localStorage
    localStorage.removeItem('userProfile');
    localStorage.removeItem('sessionToken');
    
    this.updateProfileCircle();
    
    // Limpiar campo de autor si tenía el nombre del perfil
    const authorField = document.getElementById('authorName');
    if (authorField && authorField.value === username) {
      authorField.value = '';
    }
    
    console.log('🚪 Sesión cerrada');
    if (showAlert) {
      alert('🚪 Sesión cerrada correctamente');
    }
  }
  
  isLoggedIn() {
    return this.currentProfile.isLoggedIn;
  }
  
  getUsername() {
    return this.currentProfile.isLoggedIn ? this.currentProfile.username : null;
  }
  
  // Métodos adicionales para gestión de usuarios
  getUserCount() {
    return this.users.size;
  }
  
  getAllUsers() {
    return Array.from(this.users.values()).map(user => ({
      username: user.username,
      joinDate: user.joinDate,
      totalDrawings: user.totalDrawings || 0,
      achievements: user.achievements || []
    }));
  }
  
  deleteAccount() {
    if (!this.currentProfile.isLoggedIn) return false;
    
    if (confirm('⚠️ ¿Estás seguro? Esta acción no se puede deshacer.')) {
      const username = this.currentProfile.username.toLowerCase();
      this.users.delete(username);
      this.saveUsers();
      this.logout(false);
      alert('✅ Cuenta eliminada correctamente');
      return true;
    }
    return false;
  }
  
  formatJoinDate(timestamp) {
    try {
      if (!timestamp || isNaN(timestamp)) {
        return 'hace poco';
      }
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'hace poco';
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'hace poco';
    }
  }
}