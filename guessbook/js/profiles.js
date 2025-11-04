// Sistema de perfiles
export class ProfileManager {
  constructor(firebaseManager) {
    this.firebase = firebaseManager;
    this.currentProfile = {
      username: '',
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
      lastLogin: null
    };
    
    this.init();
  }
  
  init() {
    this.loadProfile();
    this.createProfileCircle();
    this.setupProfileButton();
  }
  
  loadProfile() {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      this.currentProfile = { ...this.currentProfile, ...JSON.parse(saved) };
      
      // Verificar si la sesión sigue válida (30 días)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (this.currentProfile.lastLogin && this.currentProfile.lastLogin > thirtyDaysAgo) {
        this.currentProfile.isLoggedIn = true;
        console.log('✅ Sesión restaurada para:', this.currentProfile.username);
      } else {
        this.currentProfile.isLoggedIn = false;
        console.log('⚠️ Sesión expirada');
      }
    }
    this.updateProfileCircle();
  }
  
  async saveProfile() {
    localStorage.setItem('userProfile', JSON.stringify(this.currentProfile));
    
    if (this.currentProfile.username) {
      try {
        const profileData = {
          username: this.currentProfile.username,
          avatar: this.currentProfile.avatar,
          avatarType: this.currentProfile.avatarType,
          avatarImage: this.currentProfile.avatarImage,
          totalDrawings: this.currentProfile.totalDrawings || 0,
          totalLikes: this.currentProfile.totalLikes || 0,
          achievements: this.currentProfile.achievements || [],
          domain: 'thisisfenix.github.io',
          joinDate: this.currentProfile.joinDate || Date.now(),
          lastUpdated: Date.now()
        };
        
        // Guardar en Firebase (implementar según necesidades)
        console.log('Perfil guardado:', profileData);
      } catch (error) {
        console.log('Error guardando perfil:', error);
      }
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
  
  updateProfileCircle() {
    const circle = document.getElementById('profileCircle');
    if (circle) {
      if (this.currentProfile.avatarType === 'image' && this.currentProfile.avatarImage) {
        circle.style.backgroundImage = `url(${this.currentProfile.avatarImage})`;
        circle.style.backgroundSize = 'cover';
        circle.style.backgroundPosition = 'center';
        circle.textContent = '';
      } else {
        circle.style.backgroundImage = 'none';
        circle.textContent = this.currentProfile.avatar;
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
            `🟢 Conectado - Miembro desde ${new Date(this.currentProfile.joinDate).toLocaleDateString('es-ES')}` : 
            '🔴 No conectado - Inicia sesión para guardar tu progreso'
          }
        </p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="color: var(--text-primary); display: block; margin-bottom: 5px;">👤 Nombre de Usuario</label>
        <input type="text" id="profileUsername" value="${this.currentProfile.username}" placeholder="Tu nombre de usuario" style="width: 100%; padding: 8px; border: 1px solid var(--primary); background: var(--bg-dark); color: var(--text-primary); border-radius: 5px;">
      </div>
      
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
      
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button id="saveProfile" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
          ${this.currentProfile.isLoggedIn ? '💾 Actualizar' : '🚀 Iniciar Sesión'}
        </button>
        ${this.currentProfile.isLoggedIn ? 
          '<button id="logoutProfile" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">🚪 Cerrar Sesión</button>' : 
          ''
        }
        <button id="closeProfile" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer;">❌ Cerrar</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    this.setupModalEvents(modal);
  }
  
  setupModalEvents(modal) {
    // Event listeners para el modal
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
    
    document.getElementById('saveProfile').addEventListener('click', async () => {
      const username = document.getElementById('profileUsername').value.trim();
      if (username) {
        this.currentProfile.username = username;
        this.currentProfile.isLoggedIn = true;
        this.currentProfile.lastLogin = Date.now();
        await this.saveProfile();
        this.updateProfileCircle();
        alert('✅ Perfil guardado - Sesión iniciada');
        modal.remove();
      } else {
        alert('⚠️ Ingresa un nombre de usuario');
      }
    });
    
    document.getElementById('closeProfile').addEventListener('click', () => {
      modal.remove();
    });
    
    // Botón de cerrar sesión (si existe)
    const logoutBtn = document.getElementById('logoutProfile');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('¿Cerrar sesión? Perderás el acceso rápido a tu perfil.')) {
          this.logout();
          modal.remove();
        }
      });
    }
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
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
  
  logout() {
    this.currentProfile.isLoggedIn = false;
    this.currentProfile.lastLogin = null;
    this.saveProfile();
    this.updateProfileCircle();
    
    // Limpiar campo de autor si tenía el nombre del perfil
    const authorField = document.getElementById('authorName');
    if (authorField && authorField.value === this.currentProfile.username) {
      authorField.value = '';
    }
    
    console.log('🚪 Sesión cerrada');
    alert('🚪 Sesión cerrada correctamente');
  }
  
  isLoggedIn() {
    return this.currentProfile.isLoggedIn;
  }
  
  getUsername() {
    return this.currentProfile.isLoggedIn ? this.currentProfile.username : null;
  }
}