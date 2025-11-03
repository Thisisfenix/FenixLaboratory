// Sistema de updates para Guestbook v1.0.3 - Sistema de Perfiles
class GuestbookUpdates {
  constructor() {
    this.readmeUrl = 'README.md';
    this.init();
  }

  init() {
    this.createUpdatesButton();
  }

  createUpdatesButton() {
    // Crear botón de updates
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

    updatesBtn.addEventListener('mouseenter', () => {
      updatesBtn.style.background = 'var(--primary)';
      updatesBtn.style.color = 'var(--bg-dark)';
      updatesBtn.style.transform = 'scale(1.05)';
    });

    updatesBtn.addEventListener('mouseleave', () => {
      updatesBtn.style.background = 'rgba(45, 45, 45, 0.9)';
      updatesBtn.style.color = 'var(--primary)';
      updatesBtn.style.transform = 'scale(1)';
    });

    updatesBtn.addEventListener('click', () => this.showUpdatesModal());
    document.body.appendChild(updatesBtn);
  }

  async loadReadme() {
    try {
      const response = await fetch(this.readmeUrl);
      if (!response.ok) throw new Error('No se pudo cargar el README');
      const markdown = await response.text();
      return this.parseMarkdown(markdown);
    } catch (error) {
      console.error('Error cargando README:', error);
      return this.getFallbackContent();
    }
  }

  parseMarkdown(markdown) {
    // Parser básico de Markdown a HTML
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h5 style="color: var(--primary); margin: 20px 0 10px 0;">$1</h5>')
      .replace(/^## (.*$)/gim, '<h4 style="color: var(--primary); margin: 25px 0 15px 0;">$1</h4>')
      .replace(/^# (.*$)/gim, '<h3 style="color: var(--primary); margin: 30px 0 20px 0; text-align: center;">$1</h3>')
      
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--primary);">$1</strong>')
      
      // Code blocks
      .replace(/`([^`]+)`/g, '<code style="background: var(--bg-dark); padding: 2px 6px; border-radius: 4px; color: var(--primary);">$1</code>')
      
      // Lists
      .replace(/^- (.*$)/gim, '<li style="margin: 5px 0; color: var(--text-primary);">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin: 5px 0; color: var(--text-primary);">$2</li>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--primary); text-decoration: none;" target="_blank">$1</a>')
      
      // Line breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    // Wrap lists
    html = html.replace(/((<li[^>]*>.*?<\/li>\s*)+)/gs, '<ul style="margin: 10px 0; padding-left: 20px;">$1</ul>');

    return html;
  }

  getFallbackContent() {
    return `
      <h3 style="color: var(--primary); text-align: center;">🎨 Guestbook de Dibujos v1.0.3</h3>
      <p style="color: var(--text-primary); text-align: center; margin-bottom: 30px;">
        <strong>Sistema de Perfiles y Comunidad Artística</strong>
      </p>
      
      <div style="background: var(--bg-dark); padding: 20px; border-radius: 10px; border: 2px solid var(--primary); margin-bottom: 30px;">
        <h4 style="color: var(--primary); text-align: center; margin-bottom: 15px;">🆕 Novedades v1.0.3</h4>
        <ul style="color: var(--text-primary); margin: 0; padding-left: 20px;">
          <li>👤 <strong>Sistema de Perfiles Completo</strong>: Avatares personalizados, estadísticas</li>
          <li>🏆 <strong>Logros y Achievements</strong>: Desbloquea insignias por actividad</li>
          <li>👥 <strong>Sistema de Seguimiento</strong>: Sigue a tus artistas favoritos</li>
          <li>📊 <strong>Estadísticas Avanzadas</strong>: Tracking completo de actividad</li>
          <li>🎨 <strong>Galería Personal</strong>: Ve todos tus dibujos en un lugar</li>
          <li>📱 <strong>Avatares Emoji e Imagen</strong>: Personalización total</li>
        </ul>
      </div>
      
      <h4 style="color: var(--primary);">✨ Características Principales</h4>
      <ul style="color: var(--text-primary); margin: 15px 0; padding-left: 20px;">
        <li>🖌️ <strong>50+ herramientas de dibujo</strong>: Pincel, Spray, Formas, Efectos avanzados</li>
        <li>🎨 <strong>Personalización completa</strong>: Colores, tamaños, 5 temas dinámicos</li>
        <li>🖼️ <strong>Contenido multimedia</strong>: PNG, GIF animados, stickers</li>
        <li>📱 <strong>Optimizado para móvil</strong>: Touch events, responsive, pantalla completa</li>
        <li>🌐 <strong>Sistema social avanzado</strong>: Likes, comentarios, rankings múltiples</li>
        <li>📄 <strong>Galería interactiva</strong>: Paginación, filtros, búsqueda, fijados</li>
        <li>🛡️ <strong>Seguridad robusta</strong>: Moderación IA, cooldown, validaciones</li>
        <li>✨ <strong>Efectos visuales</strong>: Sparkles, confetti, animaciones CSS</li>
      </ul>
      
      <h4 style="color: var(--primary);">👤 Sistema de Perfiles</h4>
      <ul style="color: var(--text-primary); margin: 15px 0; padding-left: 20px;">
        <li>🎭 <strong>Avatares personalizados</strong>: 12 emojis + subida de imagen</li>
        <li>📈 <strong>Estadísticas detalladas</strong>: Dibujos, likes, comentarios</li>
        <li>🏆 <strong>Sistema de logros</strong>: 6+ achievements desbloqueables</li>
        <li>👥 <strong>Red social</strong>: Seguir artistas, ver perfiles</li>
        <li>🎨 <strong>Galería personal</strong>: Todos tus dibujos organizados</li>
        <li>💾 <strong>Persistencia</strong>: Datos guardados en localStorage + Firebase</li>
      </ul>
      
      <h4 style="color: var(--primary);">🚀 Tecnologías</h4>
      <p style="color: var(--text-primary);">
        HTML5 Canvas, JavaScript ES6+, Bootstrap 5.3.3, Firebase Firestore v10.7.1, CSS Grid/Flexbox
      </p>
      
      <h4 style="color: var(--primary);">📊 Estadísticas v1.0.3</h4>
      <ul style="color: var(--text-primary); margin: 15px 0; padding-left: 20px;">
        <li>~2,500 líneas de JavaScript</li>
        <li>50+ herramientas y funciones</li>
        <li>5 temas visuales dinámicos</li>
        <li>Sistema completo de perfiles</li>
        <li>20+ atajos de teclado</li>
        <li>Soporte completo para móvil</li>
      </ul>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: var(--bg-dark); border-radius: 10px; border: 1px solid var(--primary);">
        <p style="color: var(--text-secondary); margin: 0;">
          <strong style="color: var(--primary);">👨💻 Desarrollado por ThisIsFenix</strong><br>
          Diciembre 2024 - Parte del ecosistema FenixLaboratory v2.0.7<br>
          <small>Sistema de Perfiles y Comunidad Artística</small>
        </p>
      </div>
    `;
  }

  async showUpdatesModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0,0,0,0.95) !important;
      z-index: 99999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(5px) !important;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 90vw !important;
      max-height: 90vh !important;
      background: var(--bg-light) !important;
      border-radius: 20px !important;
      padding: 30px !important;
      overflow-y: auto !important;
      border: 2px solid var(--primary) !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
    `;

    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute !important;
      top: 20px !important;
      right: 30px !important;
      color: white !important;
      font-size: 30px !important;
      cursor: pointer !important;
      background: rgba(0,0,0,0.7) !important;
      border-radius: 50% !important;
      width: 50px !important;
      height: 50px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 100000 !important;
      transition: all 0.3s ease !important;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'var(--primary) !important';
      closeBtn.style.transform = 'scale(1.1) !important';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(0,0,0,0.7) !important';
      closeBtn.style.transform = 'scale(1) !important';
    });

    // Loading
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div class="spinner-border" style="color: var(--primary);" role="status">
          <span class="visually-hidden">Cargando información...</span>
        </div>
        <p style="color: var(--text-primary); margin-top: 15px;">Cargando información del proyecto...</p>
      </div>
    `;

    modal.appendChild(container);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);

    // Load content
    const content = await this.loadReadme();
    container.innerHTML = content;

    // Events
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target === closeBtn) {
        modal.remove();
      }
    });

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Smooth scroll to top
    container.scrollTop = 0;
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new GuestbookUpdates();
});

// También inicializar si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GuestbookUpdates();
  });
} else {
  new GuestbookUpdates();
}