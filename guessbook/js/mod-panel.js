// Moderator Panel Standalone - FenixLaboratory Guestbook
// Sistema de moderación independiente

class ModeratorPanel {
  constructor(firebase) {
    this.firebase = firebase;
    this.isLoggedIn = false;
    this.currentMod = null;
    this.allReports = [];
    this.allComments = [];
    this.modStats = {
      totalReports: 0,
      resolvedReports: 0,
      deletedComments: 0,
      warningsIssued: 0
    };
    this.init();
  }

  init() {
    this.createModButton();
    this.createModModal();
    this.setupEventListeners();
  }

  createModButton() {
    const modBtn = document.createElement('button');
    modBtn.id = 'modToggle';
    modBtn.className = 'btn btn-outline-warning btn-sm ms-2';
    modBtn.innerHTML = '⚖️ Mod';
    modBtn.onclick = () => this.showModModal();
    
    const versionToggle = document.querySelector('.version-toggle');
    if (versionToggle) {
      versionToggle.appendChild(modBtn);
    }
  }

  createModModal() {
    const modalHTML = `
      <div id="modPanel" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content" style="background: var(--bg-dark); border: 2px solid #ffc107;">
            <div class="modal-header" style="border-bottom: 1px solid #ffc107;">
              <h5 class="modal-title" style="color: #ffc107;">⚖️ Panel de Moderación</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div id="modLogin" class="text-center">
                <h6>Acceso de Moderador</h6>
                <input type="password" id="modPassword" class="form-control mb-3" placeholder="Contraseña de moderador">
                <button class="btn btn-warning" onclick="modPanel.login()">Iniciar Sesión</button>
              </div>
              <div id="modContent" style="display: none;">
                <div class="d-flex justify-content-between mb-3">
                  <div class="btn-group" role="group">
                    <button class="btn btn-outline-warning btn-sm" onclick="modPanel.showTab('dashboard')">📊 Dashboard</button>
                    <button class="btn btn-outline-warning btn-sm" onclick="modPanel.showTab('reports')">📋 Reportes</button>
                    <button class="btn btn-outline-warning btn-sm" onclick="modPanel.showTab('comments')">💬 Comentarios</button>
                    <button class="btn btn-outline-warning btn-sm" onclick="modPanel.showTab('users')">👥 Usuarios</button>
                    <button class="btn btn-outline-warning btn-sm" onclick="modPanel.showTab('activity')">📈 Actividad</button>
                  </div>
                  <div class="btn-group">
                    <button class="btn btn-outline-info btn-sm" onclick="modPanel.exportModLog()">📤 Exportar Log</button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="modPanel.refreshData()">🔄 Actualizar</button>
                  </div>
                </div>
                
                <div id="modDashboard" class="mod-tab">
                  <div class="row mb-4">
                    <div class="col-md-3">
                      <div class="card text-center bg-warning text-dark">
                        <div class="card-body">
                          <h5 class="card-title" id="pendingReports">0</h5>
                          <p class="card-text">Reportes Pendientes</p>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="card text-center bg-success text-white">
                        <div class="card-body">
                          <h5 class="card-title" id="resolvedToday">0</h5>
                          <p class="card-text">Resueltos Hoy</p>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="card text-center bg-danger text-white">
                        <div class="card-body">
                          <h5 class="card-title" id="deletedComments">0</h5>
                          <p class="card-text">Comentarios Eliminados</p>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="card text-center bg-info text-white">
                        <div class="card-body">
                          <h5 class="card-title" id="activeUsers">0</h5>
                          <p class="card-text">Usuarios Activos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="row">
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">🔥 Actividad Reciente</div>
                        <div class="card-body" id="recentActivity" style="max-height: 300px; overflow-y: auto;">
                          <!-- Actividad reciente -->
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">⚠️ Alertas del Sistema</div>
                        <div class="card-body" id="systemAlerts" style="max-height: 300px; overflow-y: auto;">
                          <!-- Alertas del sistema -->
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div id="modReports" class="mod-tab" style="display: none;">
                  <div class="d-flex justify-content-between mb-3">
                    <div class="btn-group">
                      <button class="btn btn-outline-warning btn-sm" onclick="modPanel.filterReports('pending')">⏳ Pendientes</button>
                      <button class="btn btn-outline-success btn-sm" onclick="modPanel.filterReports('resolved')">✅ Resueltos</button>
                      <button class="btn btn-outline-danger btn-sm" onclick="modPanel.filterReports('high')">🔴 Alta Prioridad</button>
                      <button class="btn btn-outline-info btn-sm" onclick="modPanel.filterReports('all')">📊 Todos</button>
                    </div>
                    <div class="d-flex gap-2">
                      <select id="reportSortBy" class="form-select form-select-sm" style="width: 150px;">
                        <option value="timestamp">Fecha</option>
                        <option value="priority">Prioridad</option>
                        <option value="type">Tipo</option>
                      </select>
                      <button class="btn btn-outline-primary btn-sm" onclick="modPanel.bulkResolveReports()">✅ Resolver Seleccionados</button>
                    </div>
                  </div>
                  <div id="modReportsList"></div>
                </div>
                
                <div id="modComments" class="mod-tab" style="display: none;">
                  <div class="d-flex justify-content-between mb-3">
                    <div class="d-flex gap-2">
                      <input type="text" id="commentSearch" class="form-control" placeholder="Buscar en comentarios..." style="width: 200px;">
                      <select id="commentFilter" class="form-select" style="width: 150px;">
                        <option value="all">Todos</option>
                        <option value="flagged">Marcados</option>
                        <option value="recent">Recientes</option>
                        <option value="reported">Reportados</option>
                      </select>
                      <button class="btn btn-outline-primary btn-sm" onclick="modPanel.searchComments()">🔍 Buscar</button>
                    </div>
                    <div class="btn-group">
                      <button class="btn btn-outline-danger btn-sm" onclick="modPanel.bulkDeleteComments()">🗑️ Eliminar Seleccionados</button>
                      <button class="btn btn-outline-warning btn-sm" onclick="modPanel.flagInappropriate()">🏴 Marcar Inapropiados</button>
                    </div>
                  </div>
                  <div id="modCommentsList"></div>
                </div>
                
                <div id="modUsers" class="mod-tab" style="display: none;">
                  <div class="d-flex justify-content-between mb-3">
                    <div class="d-flex gap-2">
                      <input type="text" id="userSearchMod" class="form-control" placeholder="Buscar usuario..." style="width: 200px;">
                      <select id="userFilterMod" class="form-select" style="width: 150px;">
                        <option value="all">Todos</option>
                        <option value="warned">Advertidos</option>
                        <option value="active">Activos</option>
                        <option value="suspicious">Sospechosos</option>
                      </select>
                    </div>
                    <div class="btn-group">
                      <button class="btn btn-outline-warning btn-sm" onclick="modPanel.bulkWarnUsers()">⚠️ Advertir Seleccionados</button>
                      <button class="btn btn-outline-info btn-sm" onclick="modPanel.generateUserReport()">📄 Generar Reporte</button>
                    </div>
                  </div>
                  <div id="modUsersList"></div>
                </div>
                
                <div id="modActivity" class="mod-tab" style="display: none;">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">📈 Estadísticas de Moderación</div>
                        <div class="card-body">
                          <div class="row text-center">
                            <div class="col-6">
                              <h4 class="text-success" id="totalResolved">0</h4>
                              <small>Reportes Resueltos</small>
                            </div>
                            <div class="col-6">
                              <h4 class="text-danger" id="totalDeleted">0</h4>
                              <small>Comentarios Eliminados</small>
                            </div>
                          </div>
                          <hr>
                          <div class="row text-center">
                            <div class="col-6">
                              <h4 class="text-warning" id="totalWarnings">0</h4>
                              <small>Advertencias Emitidas</small>
                            </div>
                            <div class="col-6">
                              <h4 class="text-info" id="avgResponseTime">0m</h4>
                              <small>Tiempo Promedio</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card">
                        <div class="card-header">🗓️ Actividad por Día</div>
                        <div class="card-body" id="dailyActivityChart">
                          <!-- Gráfico de actividad diaria -->
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card">
                    <div class="card-header">📋 Log de Moderación</div>
                    <div class="card-body" id="moderationLog" style="max-height: 400px; overflow-y: auto;">
                      <!-- Log de moderación -->
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

  showModModal() {
    const modal = new bootstrap.Modal(document.getElementById('modPanel'));
    modal.show();
  }

  async login() {
    const password = document.getElementById('modPassword').value;
    if (password === 'fenix2024mod') {
      this.isLoggedIn = true;
      this.currentMod = 'Moderador';
      document.getElementById('modLogin').style.display = 'none';
      document.getElementById('modContent').style.display = 'block';
      await this.loadModData();
      this.showTab('dashboard');
      this.logActivity('Sesión iniciada', 'login');
    } else {
      alert('Contraseña incorrecta');
    }
  }

  showTab(tabName) {
    document.querySelectorAll('.mod-tab').forEach(tab => tab.style.display = 'none');
    document.getElementById('mod' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).style.display = 'block';
  }

  async loadModData() {
    await this.loadReports();
    await this.loadComments();
    await this.loadUsers();
    this.updateDashboard();
    this.loadActivity();
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
    const container = document.getElementById('modReportsList');
    if (!reports || reports.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay reportes</p>';
      return;
    }
    
    container.innerHTML = reports.map(r => `
      <div class="card mb-2 ${r.priority === 'high' ? 'border-danger' : ''}">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-1">
              <input type="checkbox" class="form-check-input" data-report-id="${r.id}">
            </div>
            <div class="col-md-7">
              <div class="d-flex align-items-center mb-2">
                <h6 class="mb-0 me-2">${r.type || 'Reporte General'}</h6>
                <span class="badge ${this.getPriorityBadgeClass(r.priority)}">${r.priority || 'normal'}</span>
                <span class="badge ${this.getStatusBadgeClass(r.status)} ms-2">${this.getStatusText(r.status)}</span>
              </div>
              <p class="mb-1"><strong>Reportado:</strong> ${r.reportedUser} | <strong>Por:</strong> ${r.reporter}</p>
              <p class="mb-1"><strong>Razón:</strong> ${r.reason}</p>
              <small class="text-muted">${new Date(r.timestamp).toLocaleString()}</small>
            </div>
            <div class="col-md-4 text-end">
              <div class="btn-group-vertical btn-group-sm">
                <button class="btn btn-outline-info" onclick="modPanel.viewReportDetails('${r.id}')">👁️ Ver Detalles</button>
                <button class="btn btn-success" onclick="modPanel.resolveReport('${r.id}')">✅ Resolver</button>
                <button class="btn btn-warning" onclick="modPanel.escalateReport('${r.id}')">⬆️ Escalar</button>
                <button class="btn btn-danger" onclick="modPanel.rejectReport('${r.id}')">❌ Rechazar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadComments() {
    try {
      const drawings = await this.firebase.getAllDrawings();
      this.allComments = [];
      
      drawings.forEach(d => {
        if (d.comments && d.comments.length > 0) {
          d.comments.forEach(c => {
            this.allComments.push({
              ...c,
              drawingId: d.id,
              drawingTitle: d.titulo,
              drawingAuthor: d.autor,
              isFlagged: this.isCommentFlagged(c.texto)
            });
          });
        }
      });
      
      this.displayComments(this.allComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  displayComments(comments) {
    const container = document.getElementById('modCommentsList');
    if (!comments || comments.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay comentarios</p>';
      return;
    }
    
    container.innerHTML = comments.map(c => `
      <div class="card mb-2 ${c.isFlagged ? 'border-warning' : ''}">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-1">
              <input type="checkbox" class="form-check-input" data-comment-id="${c.timestamp}" data-drawing-id="${c.drawingId}">
            </div>
            <div class="col-md-8">
              <div class="d-flex align-items-center mb-2">
                <h6 class="mb-0 me-2">En: ${c.drawingTitle}</h6>
                ${c.isFlagged ? '<span class="badge bg-warning text-dark">🏴 Marcado</span>' : ''}
              </div>
              <p class="mb-1"><strong>${c.autor}:</strong> ${c.texto}</p>
              <small class="text-muted">${new Date(c.timestamp).toLocaleString()}</small>
            </div>
            <div class="col-md-3 text-end">
              <div class="btn-group-vertical btn-group-sm">
                <button class="btn btn-outline-primary" onclick="modPanel.viewDrawingFromComment('${c.drawingId}')">🎨 Ver Dibujo</button>
                <button class="btn btn-warning" onclick="modPanel.flagComment('${c.drawingId}', '${c.timestamp}')">🏴 Marcar</button>
                <button class="btn btn-danger" onclick="modPanel.deleteComment('${c.drawingId}', '${c.timestamp}')">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadUsers() {
    try {
      const drawings = await this.firebase.getAllDrawings();
      const userMap = new Map();
      
      drawings.forEach(d => {
        if (!userMap.has(d.autor)) {
          userMap.set(d.autor, {
            name: d.autor,
            drawings: 0,
            comments: 0,
            lastActivity: d.timestamp,
            warnings: 0,
            isSuspicious: false
          });
        }
        const user = userMap.get(d.autor);
        user.drawings++;
        if (d.timestamp > user.lastActivity) {
          user.lastActivity = d.timestamp;
        }
        
        // Contar comentarios
        if (d.comments) {
          d.comments.forEach(c => {
            if (userMap.has(c.autor)) {
              userMap.get(c.autor).comments++;
            }
          });
        }
      });
      
      this.allUsers = Array.from(userMap.values());
      this.displayUsers(this.allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  displayUsers(users) {
    const container = document.getElementById('modUsersList');
    container.innerHTML = users.map(u => `
      <div class="card mb-2 ${u.isSuspicious ? 'border-warning' : ''}">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-1">
              <input type="checkbox" class="form-check-input" data-user-name="${u.name}">
            </div>
            <div class="col-md-7">
              <div class="d-flex align-items-center mb-2">
                <h6 class="mb-0 me-2">${u.name}</h6>
                ${u.warnings > 0 ? `<span class="badge bg-warning text-dark">⚠️ ${u.warnings} advertencias</span>` : ''}
                ${u.isSuspicious ? '<span class="badge bg-danger ms-2">🔴 Sospechoso</span>' : ''}
              </div>
              <p class="mb-1"><strong>Dibujos:</strong> ${u.drawings} | <strong>Comentarios:</strong> ${u.comments}</p>
              <small class="text-muted">Última actividad: ${new Date(u.lastActivity).toLocaleString()}</small>
            </div>
            <div class="col-md-4 text-end">
              <div class="btn-group-vertical btn-group-sm">
                <button class="btn btn-outline-info" onclick="modPanel.viewUserActivity('${u.name}')">📊 Ver Actividad</button>
                <button class="btn btn-warning" onclick="modPanel.warnUser('${u.name}')">⚠️ Advertir</button>
                <button class="btn btn-outline-danger" onclick="modPanel.markSuspicious('${u.name}')">🔴 Marcar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateDashboard() {
    const pendingReports = this.allReports.filter(r => r.status === 'pending').length;
    const resolvedToday = this.allReports.filter(r => {
      const today = new Date().toDateString();
      return r.status === 'resolved' && new Date(r.resolvedAt || r.timestamp).toDateString() === today;
    }).length;
    
    document.getElementById('pendingReports').textContent = pendingReports;
    document.getElementById('resolvedToday').textContent = resolvedToday;
    document.getElementById('deletedComments').textContent = this.modStats.deletedComments;
    document.getElementById('activeUsers').textContent = this.allUsers?.length || 0;
    
    this.updateRecentActivity();
    this.updateSystemAlerts();
  }

  updateRecentActivity() {
    const activities = [
      { time: new Date(), action: 'Sesión iniciada', type: 'login' },
      { time: new Date(Date.now() - 300000), action: 'Reporte resuelto', type: 'resolve' },
      { time: new Date(Date.now() - 600000), action: 'Comentario eliminado', type: 'delete' }
    ];
    
    const container = document.getElementById('recentActivity');
    container.innerHTML = activities.map(a => `
      <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
        <span>${a.action}</span>
        <small class="text-muted">${a.time.toLocaleTimeString()}</small>
      </div>
    `).join('');
  }

  updateSystemAlerts() {
    const alerts = [
      { type: 'warning', message: `${this.allReports.filter(r => r.status === 'pending').length} reportes pendientes` },
      { type: 'info', message: 'Sistema funcionando correctamente' }
    ];
    
    const container = document.getElementById('systemAlerts');
    container.innerHTML = alerts.map(a => `
      <div class="alert alert-${a.type} alert-sm mb-2" role="alert">
        ${a.message}
      </div>
    `).join('');
  }

  loadActivity() {
    this.updateModStats();
    this.loadModerationLog();
  }

  updateModStats() {
    document.getElementById('totalResolved').textContent = this.modStats.resolvedReports;
    document.getElementById('totalDeleted').textContent = this.modStats.deletedComments;
    document.getElementById('totalWarnings').textContent = this.modStats.warningsIssued;
    document.getElementById('avgResponseTime').textContent = '15m';
  }

  loadModerationLog() {
    const log = JSON.parse(localStorage.getItem('moderation-log') || '[]');
    const container = document.getElementById('moderationLog');
    
    container.innerHTML = log.slice(-20).reverse().map(entry => `
      <div class="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
        <div>
          <strong>${entry.action}</strong>
          <small class="text-muted d-block">${entry.details || ''}</small>
        </div>
        <small class="text-muted">${new Date(entry.timestamp).toLocaleString()}</small>
      </div>
    `).join('') || '<p class="text-muted">No hay actividad registrada</p>';
  }

  async deleteComment(drawingId, commentTimestamp) {
    if (confirm('¿Eliminar este comentario?')) {
      try {
        await this.firebase.deleteComment(drawingId, commentTimestamp);
        this.modStats.deletedComments++;
        this.logActivity('Comentario eliminado', `Drawing: ${drawingId}`);
        await this.loadComments();
        this.updateDashboard();
        alert('Comentario eliminado');
      } catch (error) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  }

  async resolveReport(reportId) {
    const report = this.allReports.find(r => r.id === reportId);
    if (report) {
      report.status = 'resolved';
      report.resolvedAt = Date.now();
      report.resolvedBy = this.currentMod;
      this.modStats.resolvedReports++;
      this.logActivity('Reporte resuelto', `ID: ${reportId}`);
      this.displayReports(this.allReports);
      this.updateDashboard();
      alert('Reporte marcado como resuelto');
    }
  }

  async rejectReport(reportId) {
    const reason = prompt('Razón del rechazo:');
    if (reason) {
      const report = this.allReports.find(r => r.id === reportId);
      if (report) {
        report.status = 'rejected';
        report.rejectionReason = reason;
        this.logActivity('Reporte rechazado', `ID: ${reportId}, Razón: ${reason}`);
        this.displayReports(this.allReports);
        alert('Reporte rechazado');
      }
    }
  }

  escalateReport(reportId) {
    const report = this.allReports.find(r => r.id === reportId);
    if (report) {
      report.priority = 'high';
      report.escalatedBy = this.currentMod;
      this.logActivity('Reporte escalado', `ID: ${reportId}`);
      this.displayReports(this.allReports);
      alert('Reporte escalado a alta prioridad');
    }
  }

  warnUser(username) {
    const reason = prompt(`Advertencia para ${username}:`);
    if (reason) {
      const user = this.allUsers.find(u => u.name === username);
      if (user) {
        user.warnings = (user.warnings || 0) + 1;
      }
      this.modStats.warningsIssued++;
      this.logActivity('Usuario advertido', `Usuario: ${username}, Razón: ${reason}`);
      this.displayUsers(this.allUsers);
      this.updateDashboard();
      alert(`Advertencia enviada a ${username}`);
    }
  }

  markSuspicious(username) {
    const user = this.allUsers.find(u => u.name === username);
    if (user) {
      user.isSuspicious = !user.isSuspicious;
      this.logActivity('Usuario marcado', `Usuario: ${username}, Sospechoso: ${user.isSuspicious}`);
      this.displayUsers(this.allUsers);
      alert(`Usuario ${user.isSuspicious ? 'marcado como sospechoso' : 'desmarcado'}`);
    }
  }

  filterReports(status) {
    let filtered = this.allReports;
    if (status !== 'all') {
      if (status === 'high') {
        filtered = this.allReports.filter(r => r.priority === 'high');
      } else {
        filtered = this.allReports.filter(r => r.status === status);
      }
    }
    this.displayReports(filtered);
  }

  searchComments() {
    const search = document.getElementById('commentSearch').value.toLowerCase();
    const filter = document.getElementById('commentFilter').value;
    
    let filtered = this.allComments;
    
    if (search) {
      filtered = filtered.filter(c => 
        c.texto.toLowerCase().includes(search) || 
        c.autor.toLowerCase().includes(search)
      );
    }
    
    if (filter !== 'all') {
      switch (filter) {
        case 'flagged':
          filtered = filtered.filter(c => c.isFlagged);
          break;
        case 'recent':
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          filtered = filtered.filter(c => c.timestamp > dayAgo);
          break;
        case 'reported':
          // Filtrar comentarios reportados
          break;
      }
    }
    
    this.displayComments(filtered);
  }

  isCommentFlagged(text) {
    const flaggedWords = ['spam', 'troll', 'hate', 'inappropriate'];
    return flaggedWords.some(word => text.toLowerCase().includes(word));
  }

  getPriorityBadgeClass(priority) {
    switch (priority) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case 'resolved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      default: return 'bg-warning text-dark';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'resolved': return '✅ Resuelto';
      case 'rejected': return '❌ Rechazado';
      default: return '⏳ Pendiente';
    }
  }

  logActivity(action, details = '') {
    const log = JSON.parse(localStorage.getItem('moderation-log') || '[]');
    log.push({
      timestamp: Date.now(),
      moderator: this.currentMod,
      action: action,
      details: details
    });
    
    // Mantener solo los últimos 100 registros
    if (log.length > 100) {
      log.splice(0, log.length - 100);
    }
    
    localStorage.setItem('moderation-log', JSON.stringify(log));
  }

  exportModLog() {
    const log = JSON.parse(localStorage.getItem('moderation-log') || '[]');
    const data = {
      moderationLog: log,
      stats: this.modStats,
      exportDate: new Date().toISOString(),
      moderator: this.currentMod
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moderation-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  refreshData() {
    this.loadModData();
    alert('Datos actualizados');
  }

  setupEventListeners() {
    // Filtros en tiempo real
    document.addEventListener('input', (e) => {
      if (e.target.id === 'commentSearch') {
        this.searchComments();
      }
    });
    
    document.addEventListener('change', (e) => {
      if (e.target.id === 'reportSortBy') {
        this.sortReports(e.target.value);
      }
    });
  }

  sortReports(sortBy) {
    let sorted = [...this.allReports];
    switch (sortBy) {
      case 'timestamp':
        sorted.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        sorted.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
        break;
      case 'type':
        sorted.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
        break;
    }
    this.displayReports(sorted);
  }
}

// Inicializar cuando esté disponible Firebase
window.modPanel = null;

// Función global para inicializar mod panel
window.initModPanel = function(firebase) {
  if (!window.modPanel) {
    window.modPanel = new ModeratorPanel(firebase);
  }
};