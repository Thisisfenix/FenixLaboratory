export class FriendsSystem {
  constructor(firebase, profiles) {
    this.firebase = firebase;
    this.profiles = profiles;
    this.friends = new Map();
    this.pendingRequests = new Map();
  }

  async sendFriendRequest(targetUsername) {
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      throw new Error('Sistema de amistades no disponible en este dominio');
    }
    
    if (!this.profiles.isLoggedIn()) {
      throw new Error('Debes estar logueado');
    }

    const currentUser = this.profiles.currentProfile.username;
    if (currentUser.toLowerCase() === targetUsername.toLowerCase()) {
      throw new Error('No puedes enviarte solicitud a ti mismo');
    }

    // Verificar que el usuario objetivo tenga perfil
    const targetProfile = await this.firebase.getUserProfile(targetUsername);
    if (!targetProfile) {
      throw new Error('El usuario no tiene perfil creado');
    }

    try {
      const requestData = {
        from: currentUser,
        to: targetUsername,
        timestamp: Date.now(),
        status: 'pending'
      };

      await this.firebase.saveFriendRequest(requestData);
      return true;
    } catch (error) {
      if (error.code === 'permission-denied') {
        throw new Error('Sistema de amistades no disponible en este momento');
      }
      throw error;
    }
  }

  async acceptFriendRequest(fromUsername) {
    if (!this.profiles.isLoggedIn()) return false;
    
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return false;
    }

    const currentUser = this.profiles.currentProfile.username;
    
    // Crear amistad bidireccional
    await this.firebase.createFriendship(currentUser, fromUsername);
    await this.firebase.updateFriendRequestStatus(fromUsername, currentUser, 'accepted');
    
    return true;
  }

  async rejectFriendRequest(fromUsername) {
    if (!this.profiles.isLoggedIn()) return false;
    
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return false;
    }

    const currentUser = this.profiles.currentProfile.username;
    await this.firebase.updateFriendRequestStatus(fromUsername, currentUser, 'rejected');
    
    return true;
  }

  async removeFriend(friendUsername) {
    if (!this.profiles.isLoggedIn()) return false;
    
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return false;
    }

    const currentUser = this.profiles.currentProfile.username;
    await this.firebase.removeFriendship(currentUser, friendUsername);
    
    return true;
  }

  async getFriends() {
    if (!this.profiles.isLoggedIn()) return [];
    
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return [];
    }

    try {
      const currentUser = this.profiles.currentProfile.username;
      return await this.firebase.getUserFriends(currentUser);
    } catch (error) {
      console.warn('Error obteniendo amigos:', error);
      return [];
    }
  }

  async getPendingRequests() {
    if (!this.profiles.isLoggedIn()) return [];
    
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return [];
    }

    try {
      const currentUser = this.profiles.currentProfile.username;
      return await this.firebase.getPendingFriendRequests(currentUser);
    } catch (error) {
      console.warn('Error obteniendo solicitudes:', error);
      return [];
    }
  }

  async getFriendStatus(username) {
    if (!this.profiles.isLoggedIn()) return 'none';
    
    // Verificar dominio autorizado
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return 'none';
    }

    try {
      const currentUser = this.profiles.currentProfile.username;
      return await this.firebase.getFriendshipStatus(currentUser, username);
    } catch (error) {
      console.warn('Error verificando estado de amistad:', error);
      return 'none';
    }
  }

  showFriendsModal() {
    if (!this.profiles.isLoggedIn()) {
      alert('Inicia sesión para ver tus amigos');
      return;
    }
    
    // Verificar si el sistema está disponible
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      alert('Sistema de amistades no disponible en este dominio');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content" style="background: var(--bg-dark); border: 2px solid var(--primary);">
          <div class="modal-header">
            <h5 class="modal-title" style="color: var(--primary);">👥 Mis Amigos</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(1);"></button>
          </div>
          <div class="modal-body">
            <ul class="nav nav-tabs mb-3">
              <li class="nav-item">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#friends-list">👥 Amigos</button>
              </li>
              <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#friend-requests">📩 Solicitudes</button>
              </li>
              <li class="nav-item">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#add-friend">➕ Agregar</button>
              </li>
            </ul>
            
            <div class="tab-content">
              <div class="tab-pane fade show active" id="friends-list">
                <div id="friendsList">Cargando...</div>
              </div>
              
              <div class="tab-pane fade" id="friend-requests">
                <div id="requestsList">Cargando...</div>
              </div>
              
              <div class="tab-pane fade" id="add-friend">
                <div class="mb-3">
                  <input type="text" id="friendUsername" class="form-control" placeholder="Nombre de usuario">
                </div>
                <button class="btn btn-primary" onclick="window.friendsSystem.sendRequest()">📤 Enviar Solicitud</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    modal.addEventListener('hidden.bs.modal', () => modal.remove());

    this.loadFriendsData();
  }

  async loadFriendsData() {
    try {
      const [friends, requests] = await Promise.all([
        this.getFriends(),
        this.getPendingRequests()
      ]);

      this.renderFriendsList(friends);
      this.renderRequestsList(requests);
    } catch (error) {
      console.error('Error loading friends data:', error);
    }
  }

  renderFriendsList(friends) {
    const container = document.getElementById('friendsList');
    if (!container) return;

    if (!friends || friends.length === 0) {
      container.innerHTML = '<div class="text-muted text-center">No tienes amigos aún</div>';
      return;
    }

    container.innerHTML = friends.map(friend => `
      <div class="card mb-2" style="background: var(--bg-light); border: 1px solid var(--primary);">
        <div class="card-body p-2">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; margin-right: 10px; color: white;">
                ${friend.avatar || '👤'}
              </div>
              <div>
                <strong class="text-light">${friend.username}</strong>
                <div class="small text-muted">Amigos desde ${new Date(friend.friendsSince).toLocaleDateString()}</div>
              </div>
            </div>
            <button class="btn btn-outline-danger btn-sm" onclick="window.friendsSystem.removeFriendConfirm('${friend.username}')">
              ❌
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderRequestsList(requests) {
    const container = document.getElementById('requestsList');
    if (!container) return;

    if (!requests || requests.length === 0) {
      container.innerHTML = '<div class="text-muted text-center">No hay solicitudes pendientes</div>';
      return;
    }

    container.innerHTML = requests.map(request => `
      <div class="card mb-2" style="background: var(--bg-light); border: 1px solid var(--primary);">
        <div class="card-body p-2">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <strong class="text-light">${request.from}</strong>
              <div class="small text-muted">Solicitud enviada ${new Date(request.timestamp).toLocaleDateString()}</div>
            </div>
            <div>
              <button class="btn btn-success btn-sm me-1" onclick="window.friendsSystem.acceptRequest('${request.from}')">
                ✅
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.friendsSystem.rejectRequest('${request.from}')">
                ❌
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async sendRequest() {
    const username = document.getElementById('friendUsername').value.trim();
    if (!username) return;

    try {
      await this.sendFriendRequest(username);
      document.getElementById('friendUsername').value = '';
      alert('✅ Solicitud enviada');
    } catch (error) {
      alert('❌ ' + error.message);
    }
  }

  async acceptRequest(username) {
    try {
      await this.acceptFriendRequest(username);
      this.loadFriendsData();
      alert('✅ Solicitud aceptada');
    } catch (error) {
      alert('❌ Error aceptando solicitud');
    }
  }

  async rejectRequest(username) {
    try {
      await this.rejectFriendRequest(username);
      this.loadFriendsData();
      alert('❌ Solicitud rechazada');
    } catch (error) {
      alert('❌ Error rechazando solicitud');
    }
  }

  async removeFriendConfirm(username) {
    if (!confirm(`¿Eliminar a ${username} de tus amigos?`)) return;

    try {
      await this.removeFriend(username);
      this.loadFriendsData();
      alert('❌ Amigo eliminado');
    } catch (error) {
      alert('❌ Error eliminando amigo');
    }
  }

  // Agregar botón de amigos al perfil
  addFriendButtonToProfile(username, container) {
    if (!this.profiles.isLoggedIn() || this.profiles.currentProfile.username === username) {
      return;
    }
    
    // Verificar si el sistema está disponible
    const currentDomain = window.location.hostname;
    const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
    
    if (!authorizedDomains.includes(currentDomain)) {
      return; // No mostrar botón si no está disponible
    }

    this.getFriendStatus(username).then(status => {
      let button = '';
      
      switch (status) {
        case 'friends':
          button = `<button class="btn btn-success btn-sm" onclick="window.friendsSystem.removeFriendConfirm('${username}')">👥 Amigos</button>`;
          break;
        case 'pending_sent':
          button = `<button class="btn btn-warning btn-sm" disabled>⏳ Solicitud enviada</button>`;
          break;
        case 'pending_received':
          button = `<button class="btn btn-info btn-sm" onclick="window.friendsSystem.acceptRequest('${username}')">✅ Aceptar solicitud</button>`;
          break;
        default:
          button = `<button class="btn btn-outline-primary btn-sm" onclick="window.friendsSystem.sendFriendRequestTo('${username}')">➕ Agregar amigo</button>`;
      }

      const friendButtonContainer = document.createElement('div');
      friendButtonContainer.className = 'mt-2';
      friendButtonContainer.innerHTML = button;
      container.appendChild(friendButtonContainer);
    }).catch(error => {
      console.warn('Error cargando estado de amistad:', error);
      // No mostrar botón si hay error
    });
  }

  async sendFriendRequestTo(username) {
    try {
      await this.sendFriendRequest(username);
      alert('✅ Solicitud de amistad enviada');
      // Recargar el modal si está abierto
      const modal = document.querySelector('.modal.show');
      if (modal) {
        modal.querySelector('.btn-close').click();
      }
    } catch (error) {
      alert('❌ ' + error.message);
    }
  }
}