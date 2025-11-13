// Sistema de updates para Guestbook - Soporte JSON
class GuestbookUpdates {
  constructor() {
    this.updatesUrl = './updates.json';
    this.init();
  }

  init() {
    this.createUpdatesButton();
  }

  createUpdatesButton() {
    const updatesBtn = document.createElement('button');
    updatesBtn.innerHTML = '📋 Ver Información';
    updatesBtn.className = 'btn btn-outline-info btn-sm';
    updatesBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      border-radius: 25px;
      padding: 8px 16px;
      font-size: 0.9em;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      background: rgba(45, 45, 45, 0.9);
      border: 1px solid var(--primary);
      color: var(--primary);
      transition: all 0.3s ease;
    `;

    updatesBtn.addEventListener('click', () => this.showUpdatesModal());
    document.body.appendChild(updatesBtn);
  }

  async loadUpdates() {
    try {
      const response = await fetch(this.updatesUrl);
      if (!response.ok) throw new Error('No se pudo cargar updates.json');
      const data = await response.json();
      return this.renderUpdates(data);
    } catch (error) {
      console.error('Error cargando updates:', error);
      return this.getFallbackContent();
    }
  }

  renderUpdates(data) {
    const currentVersion = data.info_version_actual;
    const updates = data.updates.slice(0, 3);
    
    let html = `
      <h3 style="color: var(--primary); text-align: center; margin-bottom: 20px;">
        🎨 ${data.proyecto} v${data.version}
      </h3>
      
      <div style="background: var(--bg-dark); padding: 20px; border-radius: 10px; border: 2px solid var(--primary); margin-bottom: 30px;">
        <h4 style="color: var(--primary); text-align: center; margin-bottom: 15px;">
          🆕 Versión Actual: ${currentVersion.numero} (${currentVersion.fecha})
        </h4>
        <div style="color: var(--text-primary); margin-bottom: 15px;">
          <strong>Tipo:</strong> ${currentVersion.tipo} | <strong>Estado:</strong> ${currentVersion.estado}
        </div>
        <ul style="color: var(--text-primary); margin: 0; padding-left: 20px;">
    `;
    
    currentVersion.cambios_principales.forEach(cambio => {
      html += `<li>${cambio}</li>`;
    });
    
    html += `
        </ul>
      </div>
      
      <h4 style="color: var(--primary); margin-bottom: 20px;">📋 Historial de Versiones</h4>
    `;
    
    updates.forEach(update => {
      const typeColors = {
        'major': '#ff6b6b',
        'minor': '#4ecdc4', 
        'fix': '#45b7d1',
        'new': '#96ceb4',
        'release': '#feca57'
      };
      
      html += `
        <div style="background: var(--bg-dark); border-left: 4px solid ${typeColors[update.type] || '#666'}; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h5 style="color: var(--primary); margin: 0;">${update.title}</h5>
            <span style="background: ${typeColors[update.type] || '#666'}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; text-transform: uppercase;">
              ${update.type}
            </span>
          </div>
          <div style="color: var(--text-secondary); margin-bottom: 15px; font-size: 14px;">
            📅 ${update.date} | v${update.version}
          </div>
      `;
      
      if (update.features && update.features.length > 0) {
        html += `
          <div style="margin-bottom: 15px;">
            <strong style="color: var(--primary);">✨ Nuevas características:</strong>
            <ul style="margin: 8px 0; padding-left: 20px; color: var(--text-primary);">
        `;
        update.features.slice(0, 5).forEach(feature => {
          html += `<li style="margin: 4px 0;">${feature}</li>`;
        });
        html += `</ul></div>`;
      }
      
      if (update.fixes && update.fixes.length > 0) {
        html += `
          <div>
            <strong style="color: var(--primary);">🔧 Correcciones:</strong>
            <ul style="margin: 8px 0; padding-left: 20px; color: var(--text-primary);">
        `;
        update.fixes.slice(0, 3).forEach(fix => {
          html += `<li style="margin: 4px 0;">${fix}</li>`;
        });
        html += `</ul></div>`;
      }
      
      html += `</div>`;
    });
    
    html += `
      <div style="background: var(--bg-dark); padding: 20px; border-radius: 10px; border: 1px solid var(--primary); margin-top: 30px;">
        <h4 style="color: var(--primary); text-align: center; margin-bottom: 15px;">📊 Estadísticas del Proyecto</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; color: var(--text-primary);">
          <div><strong>Versiones totales:</strong> ${data.estadisticas_proyecto.total_versiones}</div>
          <div><strong>Tiempo desarrollo:</strong> ${data.estadisticas_proyecto.tiempo_desarrollo}</div>
          <div><strong>Líneas de código:</strong> ${data.estadisticas_proyecto.lineas_codigo_aprox}</div>
          <div><strong>Archivos principales:</strong> ${data.estadisticas_proyecto.archivos_principales}</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: var(--bg-dark); border-radius: 10px; border: 1px solid var(--primary);">
        <p style="color: var(--text-secondary); margin: 0;">
          <strong style="color: var(--primary);">👨💻 ${data.autor}</strong><br>
          ${data.lastUpdate} - <a href="${data.repositorio}" target="_blank" style="color: var(--primary);">GitHub</a><br>
          <small>${data.notas_desarrollador.mensaje}</small>
        </p>
      </div>
    `;
    
    return html;
  }

  getFallbackContent() {
    return `
      <h3 style="color: var(--primary); text-align: center;">🎨 Guestbook de Dibujos v3.2.1</h3>
      <div style="background: var(--bg-dark); padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h4 style="color: var(--primary);">🆕 Novedades v3.2.1</h4>
        <ul style="color: var(--text-primary);">
          <li>Sistema de Amistades Completo</li>
          <li>Corrección de Errores JavaScript</li>
          <li>Seguridad mejorada</li>
        </ul>
      </div>
    `;
  }

  async showUpdatesModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      background: var(--bg-light);
      border-radius: 15px;
      padding: 30px;
      overflow-y: auto;
      position: relative;
      border: 2px solid var(--primary);
    `;

    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 15px;
      right: 20px;
      cursor: pointer;
      font-size: 24px;
      color: var(--primary);
    `;
    closeBtn.onclick = () => modal.remove();

    const content = await this.loadUpdates();
    container.innerHTML = content;
    container.appendChild(closeBtn);
    
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
  }
}

function toggleUpdatesPanel() {
  if (!window.guestbookUpdates) {
    window.guestbookUpdates = new GuestbookUpdates();
  }
  window.guestbookUpdates.showUpdatesModal();
}

document.addEventListener('DOMContentLoaded', () => {
  window.guestbookUpdates = new GuestbookUpdates();
});