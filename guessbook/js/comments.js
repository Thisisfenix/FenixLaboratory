// Sistema de comentarios
export class CommentsManager {
  constructor(firebaseManager) {
    this.firebase = firebaseManager;
  }
  
  async loadComments(drawingId, container) {
    try {
      const drawing = await this.firebase.getDrawing(drawingId);
      if (!drawing) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No se pudo cargar el dibujo</p>';
        return;
      }
      
      const comments = drawing.data.comments || [];
      
      if (comments.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
            <p>💬 Aún no hay comentarios</p>
            <small>¡Sé el primero en comentar!</small>
          </div>
        `;
        return;
      }
      
      container.innerHTML = comments.map(comment => `
        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--primary);">
          <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 5px;">
            <strong style="color: var(--primary); font-size: 0.9em;">👤 ${comment.autor || comment.author || 'Anónimo'}</strong>
            <small style="color: var(--text-secondary); margin-left: auto;">${this.formatDate(comment.timestamp)}</small>
          </div>
          <p style="color: var(--text-primary); margin: 0; font-size: 0.9em; line-height: 1.4;">${comment.texto || comment.text || ''}</p>
        </div>
      `).join('');
      
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Error cargando comentarios</p>';
    }
  }
  
  formatDate(timestamp) {
    if (!timestamp) return 'Fecha desconocida';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'hace un momento';
    if (diff < 3600000) return `hace ${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return `hace ${Math.floor(diff/3600000)}h`;
    if (diff < 604800000) return `hace ${Math.floor(diff/86400000)}d`;
    return date.toLocaleDateString('es-ES');
  }
  
  async addComment(drawingId, author, text) {
    if (!text || !text.trim()) return false;
    
    const comment = {
      autor: author || 'Anónimo',
      texto: text.trim(),
      timestamp: Date.now()
    };
    
    try {
      await this.firebase.addComment(drawingId, comment);
      return true;
    } catch (error) {
      console.error('Error agregando comentario:', error);
      return false;
    }
  }
}

// Función global para comentarios
window.addComment = async function(drawingId) {
  const input = document.getElementById('commentInput');
  const authorInput = document.getElementById('commentAuthor');
  
  if (!input || !input.value.trim()) return;
  
  const commentsManager = new (await import('./comments.js')).CommentsManager(
    window.guestbookApp?.firebase
  );
  
  const success = await commentsManager.addComment(
    drawingId,
    authorInput?.value.trim(),
    input.value.trim()
  );
  
  if (success) {
    input.value = '';
    authorInput.value = '';
    // Recargar comentarios
    const panel = input.closest('div').parentElement;
    commentsManager.loadComments(drawingId, panel);
  }
};