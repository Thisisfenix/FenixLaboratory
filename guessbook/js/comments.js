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
      
      // Ordenar comentarios por timestamp
      const sortedComments = comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      container.innerHTML = sortedComments.map(comment => {
        const author = comment.autor || comment.author || 'Anónimo';
        const text = comment.texto || comment.text || '';
        const timestamp = comment.timestamp || Date.now();
        const profilePicture = comment.profilePicture;
        const profileAvatar = comment.profileAvatar;
        const isLoggedUser = comment.isLoggedUser || false;
        
        return `
          <div style="background: var(--bg-light); border-radius: 8px; padding: 10px; margin-bottom: 10px; border-left: 3px solid ${isLoggedUser ? '#28a745' : 'var(--primary)'}; transition: all 0.2s ease;">
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 0.7em; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden; ${isLoggedUser ? 'border: 2px solid #28a745;' : ''}">
                ${this.generateAvatar(author, profilePicture, profileAvatar)}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <strong style="color: var(--primary); font-size: 0.85em;">${author}</strong>
                    ${isLoggedUser ? '<span style="color: #28a745; font-size: 0.7em;" title="Usuario registrado">✓</span>' : ''}
                  </div>
                  <small style="color: var(--text-secondary); font-size: 0.75em;">${this.formatDate(timestamp)}</small>
                </div>
                <p style="color: var(--text-primary); margin: 0; line-height: 1.3; word-wrap: break-word; font-size: 0.85em;">${text}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Error cargando comentarios</p>';
    }
  }
  
  generateAvatar(author, profilePicture, profileAvatar = null) {
    // Prioridad: 1. Imagen de perfil, 2. Avatar emoji del perfil, 3. Avatar generado
    if (profilePicture) {
      return `<img src="${profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    }
    
    if (profileAvatar && profileAvatar !== '👤') {
      return `<span style="font-size: 1.2em;">${profileAvatar}</span>`;
    }
    
    // Lista de emojis para avatares (fallback)
    const avatarEmojis = ['🎨', '🖌️', '🎭', '🌟', '🎪', '🦄', '🌈', '⭐', '🎯', '🎲', '🎮', '🎸', '🎺', '🎻', '🎤', '🎧', '🎬', '📸'];
    
    // Generar emoji basado en el nombre del autor
    let hash = 0;
    for (let i = 0; i < author.length; i++) {
      hash = author.charCodeAt(i) + ((hash << 5) - hash);
    }
    const emojiIndex = Math.abs(hash) % avatarEmojis.length;
    
    return `<span style="font-size: 1.2em;">${avatarEmojis[emojiIndex]}</span>`;
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
    
    // Obtener datos del perfil si está logueado
    let profilePicture = null;
    let profileAvatar = null;
    let isLoggedUser = false;
    
    if (window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()) {
      const profile = window.guestbookApp.profiles.currentProfile;
      author = profile.username || author;
      isLoggedUser = true;
      
      if (profile.avatarType === 'image' && profile.avatarImage) {
        profilePicture = profile.avatarImage;
      } else if (profile.avatarType === 'emoji' && profile.avatar) {
        profileAvatar = profile.avatar;
      }
    }
    
    const comment = {
      autor: author || 'Anónimo',
      texto: text.trim(),
      timestamp: Date.now(),
      profilePicture: profilePicture,
      profileAvatar: profileAvatar,
      isLoggedUser: isLoggedUser
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