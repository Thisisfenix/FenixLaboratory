// Admin Panel Standalone - FenixLaboratory Guestbook
// Sistema de administración independiente

class AdminPanel {
  constructor(firebase) {
    this.firebase = firebase;
    this.isLoggedIn = false;
    this.currentUser = null;
    this.allDrawings = [];
    this.allUsers = [];
    this.allReports = [];
    this.init();
  }

  init() {
    this.createAdminButton();
    this.createAdminModal();
    this.setupEventListeners();
  }

  createAdminButton() {
    const adminBtn = document.createElement('button');
    adminBtn.id = 'adminToggle';
    adminBtn.className = 'btn btn-outline-danger btn-sm ms-2';
    adminBtn.innerHTML = '🔐 Admin';
    adminBtn.onclick = () => this.showAdminModal();
    
    const versionToggle = document.querySelector('.version-toggle');
    if (versionToggle) {
      versionToggle.appendChild(adminBtn);
    }
  }

  createAdminModal() {
    const modalHTML = `
      <div id="adminPanel" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content" style="background: var(--bg-dark); border: 2px solid #dc3545;">
            <div class="modal-header" style="border-bottom: 1px solid #dc3545;">
              <h5 class="modal-title" style="color: #dc3545;">🔐 Panel de Administración</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div id="adminLogin" class="text-center">
                <h6>Acceso Administrativo</h6>
                <input type="password" id="adminPassword" class="form-control mb-3" placeholder="Contraseña de administrador">
                <button class="btn btn-danger" onclick="adminPanel.login()">Iniciar Sesión</button>
              </div>
              <div id="adminContent" style="display: none;">
                <div class="d-flex justify-content-between mb-3">
                  <div class="btn-group" role="group">
                    <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.showTab('stats')">📊 Estadísticas</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.showTab('drawings')">🎨 Dibujos</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.showTab('users')">👥 Usuarios</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.showTab('reports')">📋 Reportes</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.showTab('config')">⚙️ Config</button>
                  </div>
                  <button class="btn btn-outline-secondary btn-sm" onclick="adminPanel.exportData()">📤 Exportar</button>
                </div>
                
                <div id="adminStats" class="admin-tab">
                  <div class="row mb-4">
                    <div class="col-md-3">
                      <div class="card text-center">
                        <div class="card-body">
                          <h5 class="card-title text-primary" id="totalDrawings">0</h5>
                          <p class="card-text">Total Dibujos</p>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="card text-center">
                        <div class="card-body">
                          <h5 class="card-title text-success" id="totalUsers">0</h5>
                          <p class="card-text">Usuarios Únicos</p>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="card text-center">
                        <div class="card-body">
                          <h5 class="card-title text-warning" id="totalReports">0</h5>
                          <p class="card-text">Reportes</p>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="card text-center">
                        <div class="card-body">
                          <h5 class="card-title text-info" id="totalComments">0</h5>
                          <p class="card-text">Comentarios</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div id="adminCharts"></div>
                </div>
                
                <div id="adminDrawings" class="admin-tab" style="display: none;">
                  <div class="d-flex justify-content-between mb-3">
                    <div class="d-flex gap-2">
                      <input type="text" id="drawingSearch" class="form-control" placeholder="Buscar por autor..." style="width: 200px;">
                      <select id="drawingFilter" class="form-select" style="width: 150px;">
                        <option value="">Todas las categorías</option>
                        <option value="Arte">Arte</option>
                        <option value="Meme">Meme</option>
                        <option value="Divertido">Divertido</option>
                        <option value="Abstracto">Abstracto</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <button class="btn btn-outline-primary btn-sm" onclick="adminPanel.filterDrawings()">🔍 Filtrar</button>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.bulkDeleteDrawings()">🗑️ Eliminar Seleccionados</button>
                  </div>
                  <div id="adminDrawingsList"></div>
                </div>
                
                <div id="adminUsers" class="admin-tab" style="display: none;">
                  <div class="d-flex justify-content-between mb-3">
                    <input type="text" id="userSearch" class="form-control" placeholder="Buscar usuario..." style="width: 200px;">
                    <div class="btn-group">
                      <button class="btn btn-outline-warning btn-sm" onclick="adminPanel.showBlockedUsers()">🚫 Bloqueados</button>
                      <button class="btn btn-outline-info btn-sm" onclick="adminPanel.exportUsers()">📤 Exportar</button>
                    </div>
                  </div>
                  <div id="adminUsersList"></div>
                </div>
                
                <div id="adminReports" class="admin-tab" style="display: none;">
                  <div class="d-flex justify-content-between mb-3">
                    <div class="btn-group">
                      <button class="btn btn-outline-warning btn-sm" onclick="adminPanel.filterReports('pending')">⏳ Pendientes</button>
                      <button class="btn btn-outline-success btn-sm" onclick="adminPanel.filterReports('resolved')">✅ Resueltos</button>
                      <button class="btn btn-outline-danger btn-sm" onclick="adminPanel.filterReports('rejected')">❌ Rechazados</button>
                    </div>
                    <button class="btn btn-outline-primary btn-sm" onclick="adminPanel.clearOldReports()">🧹 Limpiar Antiguos</button>
                  </div>
                  <div id="adminReportsList"></div>
                </div>
                
                <div id="adminConfig" class="admin-tab" style="display: none;">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">🔧 Configuración General</div>
                        <div class="card-body">
                          <div class="mb-3">
                            <label class="form-label">Máximo de dibujos por usuario/día</label>
                            <input type="number" id="maxDrawingsPerDay" class="form-control" value="10">
                          </div>
                          <div class="mb-3">
                            <label class="form-label">Tamaño máximo de imagen (KB)</label>
                            <input type="number" id="maxImageSize" class="form-control" value="800">
                          </div>
                          <div class="mb-3">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" id="enableAutoModeration">
                              <label class="form-check-label">Activar moderación automática</label>
                            </div>
                          </div>
                          <button class="btn btn-primary" onclick="adminPanel.saveConfig()">💾 Guardar</button>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">🛡️ Filtros de Contenido</div>
                        <div class="card-body">
                          <div class="mb-3">
                            <label class="form-label">Palabras prohibidas (separadas por comas)</label>
                            <textarea id="bannedWords" class="form-control" rows="3"></textarea>
                          </div>
                          <div class="mb-3">
                            <label class="form-label">IPs bloqueadas</label>
                            <textarea id="blockedIPs" class="form-control" rows="3"></textarea>
                          </div>
                          <button class="btn btn-warning" onclick="adminPanel.saveFilters()">🛡️ Actualizar Filtros</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  showAdminModal() {
    const modal = new bootstrap.Modal(document.getElementById('adminPanel'));
    modal.show();
  }

  async login() {
    const password = document.getElementById('adminPassword').value;
    if (password === 'fenix2024admin') {
      this.isLoggedIn = true;
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminContent').style.display = 'block';
      await this.loadAdminData();
      this.showTab('stats');
    } else {
      alert('Contraseña incorrecta');
    }
  }

  showTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none');
    document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).style.display = 'block';
  }

  async loadAdminData() {
    await this.loadDrawings();
    await this.loadUsers();
    await this.loadReports();
    this.updateStats();
  }

  async loadDrawings() {
    try {
      this.allDrawings = await this.firebase.getAllDrawings();
      this.displayDrawings(this.allDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  }

  displayDrawings(drawings) {
    const container = document.getElementById('adminDrawingsList');
    container.innerHTML = drawings.map((d, index) => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="row">
            <div class="col-md-2">
              <input type="checkbox" class="form-check-input" data-drawing-id="${d.id}">
              <img src="${d.imagenData}" class="img-thumbnail" style="width: 80px; height: 60px; object-fit: cover;">
            </div>
            <div class="col-md-6">
              <h6>${d.titulo}</h6>
              <p><strong>Autor:</strong> ${d.autor} | <strong>Categoría:</strong> ${d.categoria}</p>
              <p><strong>Fecha:</strong> ${new Date(d.timestamp).toLocaleString()}</p>
              <p><strong>Likes:</strong> ${d.likes || 0} | <strong>Comentarios:</strong> ${d.comments?.length || 0}</p>
            </div>
            <div class="col-md-4 text-end">
              <div class="btn-group-vertical">
                <button class="btn btn-sm btn-outline-primary" onclick="adminPanel.viewDrawing('${d.id}')">👁️ Ver</button>
                <button class="btn btn-sm btn-outline-warning" onclick="adminPanel.editDrawing('${d.id}')">✏️ Editar</button>
                <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteDrawing('${d.id}')">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadUsers() {
    try {
      const drawings = this.allDrawings || await this.firebase.getAllDrawings();
      const userMap = new Map();
      
      drawings.forEach(d => {
        if (!userMap.has(d.autor)) {
          userMap.set(d.autor, {
            name: d.autor,
            drawings: 0,
            totalLikes: 0,
            lastActivity: d.timestamp,
            isBlocked: false
          });
        }
        const user = userMap.get(d.autor);
        user.drawings++;
        user.totalLikes += d.likes || 0;
        if (d.timestamp > user.lastActivity) {
          user.lastActivity = d.timestamp;
        }
      });
      
      this.allUsers = Array.from(userMap.values());
      this.displayUsers(this.allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  displayUsers(users) {
    const container = document.getElementById('adminUsersList');
    container.innerHTML = users.map(u => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-6">
              <h6>${u.name} ${u.isBlocked ? '<span class="badge bg-danger">BLOQUEADO</span>' : ''}</h6>
              <p><strong>Dibujos:</strong> ${u.drawings} | <strong>Likes totales:</strong> ${u.totalLikes}</p>
              <p><strong>Última actividad:</strong> ${new Date(u.lastActivity).toLocaleString()}</p>
            </div>
            <div class="col-md-6 text-end">
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-info" onclick="adminPanel.viewUserHistory('${u.name}')">📊 Historial</button>
                <button class="btn btn-sm btn-outline-warning" onclick="adminPanel.warnUser('${u.name}')">⚠️ Advertir</button>
                <button class="btn btn-sm ${u.isBlocked ? 'btn-success' : 'btn-danger'}" onclick="adminPanel.toggleBlockUser('${u.name}')">
                  ${u.isBlocked ? '✅ Desbloquear' : '🚫 Bloquear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadReports() {
    try {
      this.allReports = await this.firebase.getReports() || [];
      this.displayReports(this.allReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      this.allReports = [];
    }
  }

  displayReports(reports) {
    const container = document.getElementById('adminReportsList');
    if (!reports || reports.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay reportes</p>';
      return;
    }
    
    container.innerHTML = reports.map(r => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="row">
            <div class="col-md-8">
              <h6>Reporte: ${r.type || 'General'}</h6>
              <p><strong>Reportado por:</strong> ${r.reporter} | <strong>Usuario reportado:</strong> ${r.reportedUser}</p>
              <p><strong>Razón:</strong> ${r.reason}</p>
              <p><strong>Fecha:</strong> ${new Date(r.timestamp).toLocaleString()}</p>
              <span class="badge ${r.status === 'pending' ? 'bg-warning' : r.status === 'resolved' ? 'bg-success' : 'bg-danger'}">
                ${r.status === 'pending' ? '⏳ Pendiente' : r.status === 'resolved' ? '✅ Resuelto' : '❌ Rechazado'}
              </span>
            </div>
            <div class="col-md-4 text-end">
              <div class="btn-group-vertical">
                <button class="btn btn-sm btn-success" onclick="adminPanel.resolveReport('${r.id}')">✅ Resolver</button>
                <button class="btn btn-sm btn-danger" onclick="adminPanel.rejectReport('${r.id}')">❌ Rechazar</button>
                <button class="btn btn-sm btn-outline-info" onclick="adminPanel.viewReportDetails('${r.id}')">👁️ Detalles</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateStats() {
    document.getElementById('totalDrawings').textContent = this.allDrawings.length;
    document.getElementById('totalUsers').textContent = this.allUsers.length;
    document.getElementById('totalReports').textContent = this.allReports.length;
    
    const totalComments = this.allDrawings.reduce((sum, d) => sum + (d.comments?.length || 0), 0);
    document.getElementById('totalComments').textContent = totalComments;
  }

  filterDrawings() {
    const search = document.getElementById('drawingSearch').value.toLowerCase();
    const filter = document.getElementById('drawingFilter').value;
    
    let filtered = this.allDrawings;
    
    if (search) {
      filtered = filtered.filter(d => d.autor.toLowerCase().includes(search));
    }
    
    if (filter) {
      filtered = filtered.filter(d => d.categoria === filter);
    }
    
    this.displayDrawings(filtered);
  }

  async deleteDrawing(drawingId) {
    if (confirm('¿Eliminar este dibujo permanentemente?')) {
      try {
        await this.firebase.deleteDrawing(drawingId);
        await this.loadDrawings();
        this.updateStats();
        alert('Dibujo eliminado');
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  }

  async bulkDeleteDrawings() {
    const checkboxes = document.querySelectorAll('input[data-drawing-id]:checked');
    if (checkboxes.length === 0) {
      alert('Selecciona al menos un dibujo');
      return;
    }
    
    if (confirm(`¿Eliminar ${checkboxes.length} dibujos seleccionados?`)) {
      for (const checkbox of checkboxes) {
        try {
          await this.firebase.deleteDrawing(checkbox.dataset.drawingId);
        } catch (error) {
          console.error('Error deleting drawing:', error);
        }
      }
      await this.loadDrawings();
      this.updateStats();
      alert('Dibujos eliminados');
    }
  }

  viewDrawing(drawingId) {
    const drawing = this.allDrawings.find(d => d.id === drawingId);
    if (drawing) {
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div class="modal fade" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${drawing.titulo}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body text-center">
                <img src="${drawing.imagenData}" class="img-fluid" style="max-height: 400px;">
                <p class="mt-3"><strong>Autor:</strong> ${drawing.autor}</p>
                <p><strong>Fecha:</strong> ${new Date(drawing.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const bootstrapModal = new bootstrap.Modal(modal.querySelector('.modal'));
      bootstrapModal.show();
      modal.addEventListener('hidden.bs.modal', () => modal.remove());
    }
  }

  async toggleBlockUser(username) {
    const user = this.allUsers.find(u => u.name === username);
    if (user) {
      user.isBlocked = !user.isBlocked;
      // Aquí guardarías el estado en Firebase
      this.displayUsers(this.allUsers);
      alert(`Usuario ${user.isBlocked ? 'bloqueado' : 'desbloqueado'}`);
    }
  }

  warnUser(username) {
    const reason = prompt('Razón de la advertencia:');
    if (reason) {
      alert(`Advertencia enviada a ${username}: ${reason}`);
      // Aquí enviarías la advertencia
    }
  }

  viewUserHistory(username) {
    const userDrawings = this.allDrawings.filter(d => d.autor === username);
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Historial de ${username}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                ${userDrawings.map(d => `
                  <div class="col-md-4 mb-3">
                    <div class="card">
                      <img src="${d.imagenData}" class="card-img-top" style="height: 150px; object-fit: cover;">
                      <div class="card-body">
                        <h6 class="card-title">${d.titulo}</h6>
                        <p class="card-text small">${new Date(d.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal.querySelector('.modal'));
    bootstrapModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
  }

  async resolveReport(reportId) {
    const report = this.allReports.find(r => r.id === reportId);
    if (report) {
      report.status = 'resolved';
      // Aquí actualizarías en Firebase
      this.displayReports(this.allReports);
      alert('Reporte marcado como resuelto');
    }
  }

  async rejectReport(reportId) {
    const report = this.allReports.find(r => r.id === reportId);
    if (report) {
      report.status = 'rejected';
      // Aquí actualizarías en Firebase
      this.displayReports(this.allReports);
      alert('Reporte rechazado');
    }
  }

  filterReports(status) {
    const filtered = this.allReports.filter(r => r.status === status);
    this.displayReports(filtered);
  }

  saveConfig() {
    const config = {
      maxDrawingsPerDay: document.getElementById('maxDrawingsPerDay').value,
      maxImageSize: document.getElementById('maxImageSize').value,
      enableAutoModeration: document.getElementById('enableAutoModeration').checked
    };
    
    localStorage.setItem('guestbook-admin-config', JSON.stringify(config));
    alert('Configuración guardada');
  }

  saveFilters() {
    const filters = {
      bannedWords: document.getElementById('bannedWords').value.split(',').map(w => w.trim()),
      blockedIPs: document.getElementById('blockedIPs').value.split('\n').map(ip => ip.trim())
    };
    
    localStorage.setItem('guestbook-filters', JSON.stringify(filters));
    alert('Filtros actualizados');
  }

  exportData() {
    const data = {
      drawings: this.allDrawings,
      users: this.allUsers,
      reports: this.allReports,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guestbook-admin-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  setupEventListeners() {
    // Filtros en tiempo real
    document.addEventListener('input', (e) => {
      if (e.target.id === 'drawingSearch') {
        this.filterDrawings();
      }
    });
    
    document.addEventListener('change', (e) => {
      if (e.target.id === 'drawingFilter') {
        this.filterDrawings();
      }
    });
  }
}

// Inicializar cuando esté disponible Firebase
window.adminPanel = null;

// Función global para inicializar admin panel
window.initAdminPanel = function(firebase) {
  if (!window.adminPanel) {
    window.adminPanel = new AdminPanel(firebase);
  }
};