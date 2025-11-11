// Sistema de comentarios mejorado
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
      
      const allComments = drawing.data.comments || [];
      
      if (allComments.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
            <p>💬 Aún no hay comentarios</p>
            <small>¡Sé el primero en comentar!</small>
          </div>
        `;
        return;
      }
      
      // Separar comentarios principales y respuestas
      const mainComments = allComments.filter(c => !c.parentId);
      const replies = allComments.filter(c => c.parentId);
      
      // Ordenar comentarios principales por timestamp
      const sortedComments = mainComments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      const isMobile = window.innerWidth <= 768;
      container.innerHTML = sortedComments.map(comment => {
        const commentReplies = replies.filter(r => r.parentId === comment.id).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return this.renderComment(comment, commentReplies, drawingId, isMobile);
      }).join('');
      
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Error cargando comentarios</p>';
    }
  }
  
  renderComment(comment, replies, drawingId, isMobile) {
    const author = comment.autor || comment.author || 'Anónimo';
    const text = this.processCommentText(comment.texto || comment.text || '');
    const timestamp = comment.timestamp || Date.now();
    const profilePicture = comment.profilePicture;
    const profileAvatar = comment.profileAvatar;
    const isLoggedUser = comment.isLoggedUser || false;
    const commentId = comment.id || `comment_${timestamp}`;
    const likes = comment.likes || 0;
    const dislikes = comment.dislikes || 0;
    const attachedImage = comment.attachedImage;
    
    const repliesHtml = replies.length > 0 ? `
      <div style="margin-left: ${isMobile ? '20px' : '30px'}; margin-top: 8px; border-left: 2px solid var(--primary); padding-left: ${isMobile ? '8px' : '12px'};">
        ${replies.map(reply => this.renderReply(reply, isMobile)).join('')}
      </div>
    ` : '';
    
    return `
      <div class="comment-item" data-comment-id="${commentId}" style="background: var(--bg-light); border-radius: ${isMobile ? '6px' : '8px'}; padding: ${isMobile ? '8px' : '10px'}; margin-bottom: ${isMobile ? '8px' : '10px'}; border-left: 3px solid ${isLoggedUser ? '#28a745' : 'var(--primary)'}; transition: all 0.2s ease;">
        <div style="display: flex; align-items: flex-start; gap: ${isMobile ? '6px' : '8px'};">
          <div style="width: ${isMobile ? '28px' : '32px'}; height: ${isMobile ? '28px' : '32px'}; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: ${isMobile ? '0.6em' : '0.7em'}; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden; ${isLoggedUser ? 'border: 2px solid #28a745;' : ''}">
            ${this.generateAvatar(author, profilePicture, profileAvatar)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${isMobile ? '3px' : '4px'};">
              <div style="display: flex; align-items: center; gap: 3px;">
                <strong style="color: var(--primary); font-size: ${isMobile ? '0.8em' : '0.85em'};">${author}</strong>
                ${isLoggedUser ? '<span style="color: #28a745; font-size: 0.65em;" title="Usuario registrado">✓</span>' : ''}
              </div>
              <small style="color: var(--text-secondary); font-size: ${isMobile ? '0.7em' : '0.75em'};">${this.formatDate(timestamp)}</small>
            </div>
            <div style="color: var(--text-primary); margin: 0 0 8px 0; line-height: ${isMobile ? '1.2' : '1.3'}; word-wrap: break-word; font-size: ${isMobile ? '0.8em' : '0.85em'};">${text}</div>
            ${attachedImage ? `<img src="${attachedImage}" style="max-width: 100%; max-height: 150px; border-radius: 6px; margin-bottom: 8px; cursor: pointer;" onclick="viewAttachedImage('${attachedImage}')" loading="lazy">` : ''}
            <div style="display: flex; align-items: center; gap: ${isMobile ? '8px' : '12px'}; font-size: ${isMobile ? '0.7em' : '0.75em'};">
              <button onclick="reactToComment('${drawingId}', '${commentId}', 'like')" style="background: none; border: none; color: ${localStorage.getItem(`comment_like_${commentId}`) === 'true' ? '#28a745' : 'var(--text-secondary)'}; cursor: pointer; display: flex; align-items: center; gap: 3px; padding: 2px 4px; border-radius: 3px; transition: all 0.2s ease;">
                👍 ${likes > 0 ? likes : ''}
              </button>
              <button onclick="reactToComment('${drawingId}', '${commentId}', 'dislike')" style="background: none; border: none; color: ${localStorage.getItem(`comment_dislike_${commentId}`) === 'true' ? '#dc3545' : 'var(--text-secondary)'}; cursor: pointer; display: flex; align-items: center; gap: 3px; padding: 2px 4px; border-radius: 3px; transition: all 0.2s ease;">
                👎 ${dislikes > 0 ? dislikes : ''}
              </button>
              <button onclick="showReplyForm('${commentId}', '${author}')" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: ${isMobile ? '0.7em' : '0.75em'}; padding: 2px 4px; border-radius: 3px; transition: all 0.2s ease;">
                💬 Responder
              </button>
              ${replies.length > 0 ? `<span style="color: var(--text-secondary); font-size: 0.7em;">${replies.length} respuesta${replies.length > 1 ? 's' : ''}</span>` : ''}
            </div>
          </div>
        </div>
        ${repliesHtml}
        <div id="replyForm_${commentId}" style="display: none; margin-top: 8px; margin-left: ${isMobile ? '20px' : '30px'};"></div>
      </div>
    `;
  }
  
  renderReply(reply, isMobile) {
    const author = reply.autor || reply.author || 'Anónimo';
    const text = this.processCommentText(reply.texto || reply.text || '');
    const timestamp = reply.timestamp || Date.now();
    const profilePicture = reply.profilePicture;
    const profileAvatar = reply.profileAvatar;
    const isLoggedUser = reply.isLoggedUser || false;
    const likes = reply.likes || 0;
    const dislikes = reply.dislikes || 0;
    const attachedImage = reply.attachedImage;
    
    return `
      <div class="reply-item" style="background: var(--bg-dark); border-radius: 6px; padding: ${isMobile ? '6px' : '8px'}; margin-bottom: 6px; border-left: 2px solid var(--secondary);">
        <div style="display: flex; align-items: flex-start; gap: ${isMobile ? '4px' : '6px'};">
          <div style="width: ${isMobile ? '24px' : '28px'}; height: ${isMobile ? '24px' : '28px'}; border-radius: 50%; background: linear-gradient(135deg, var(--secondary), var(--primary)); display: flex; align-items: center; justify-content: center; font-size: ${isMobile ? '0.5em' : '0.6em'}; color: white; font-weight: bold; flex-shrink: 0; overflow: hidden;">
            ${this.generateAvatar(author, profilePicture, profileAvatar)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <strong style="color: var(--secondary); font-size: ${isMobile ? '0.7em' : '0.8em'};">${author}</strong>
              <small style="color: var(--text-secondary); font-size: ${isMobile ? '0.6em' : '0.7em'};">${this.formatDate(timestamp)}</small>
            </div>
            <div style="color: var(--text-primary); margin: 0 0 6px 0; line-height: 1.2; word-wrap: break-word; font-size: ${isMobile ? '0.7em' : '0.8em'};">${text}</div>
            ${attachedImage ? `<img src="${attachedImage}" style="max-width: 100%; max-height: 120px; border-radius: 4px; margin-bottom: 6px; cursor: pointer;" onclick="viewAttachedImage('${attachedImage}')" loading="lazy">` : ''}
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.65em;">
              <button onclick="reactToComment('${reply.drawingId}', '${reply.id}', 'like', true)" style="background: none; border: none; color: ${localStorage.getItem(`comment_like_${reply.id}`) === 'true' ? '#28a745' : 'var(--text-secondary)'}; cursor: pointer; display: flex; align-items: center; gap: 2px; padding: 1px 3px; border-radius: 2px;">
                👍 ${likes > 0 ? likes : ''}
              </button>
              <button onclick="reactToComment('${reply.drawingId}', '${reply.id}', 'dislike', true)" style="background: none; border: none; color: ${localStorage.getItem(`comment_dislike_${reply.id}`) === 'true' ? '#dc3545' : 'var(--text-secondary)'}; cursor: pointer; display: flex; align-items: center; gap: 2px; padding: 1px 3px; border-radius: 2px;">
                👎 ${dislikes > 0 ? dislikes : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  processCommentText(text) {
    // Procesar menciones @usuario
    return text.replace(/@(\w+)/g, '<span style="color: var(--primary); font-weight: bold; background: rgba(255,107,53,0.1); padding: 1px 4px; border-radius: 3px;">@$1</span>');
  }
  
  generateAvatar(author, profilePicture, profileAvatar = null) {
    // Prioridad: 1. avatarImage, 2. avatarType=text, 3. emoji fallback
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
  
  async addComment(drawingId, author, text, attachedImage = null) {
    if (!text || !text.trim()) return false;
    
    // Auto-moderación antes de agregar
    if (window.autoModeration) {
      const modResult = await window.autoModeration.moderateContent(text, author, 'comment');
      
      if (modResult.blocked) {
        if (window.guestbookApp?.ui) {
          window.guestbookApp.ui.showNotification(
            `🛡️ Comentario bloqueado: ${modResult.reasons.join(', ')}`,
            'error'
          );
        }
        return false;
      }
      
      if (modResult.flagged) {
        if (window.guestbookApp?.ui) {
          window.guestbookApp.ui.showNotification(
            '⚠️ Comentario marcado para revisión',
            'warning'
          );
        }
      }
      
      text = window.autoModeration.filterContent(text);
    }
    
    // Obtener datos del perfil si está logueado
    let profilePicture = null;
    let profileAvatar = null;
    let isLoggedUser = false;
    
    if (window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()) {
      const profile = window.guestbookApp.profiles.currentProfile;
      author = profile.username || author;
      isLoggedUser = true;
      
      if (profile.avatarImage) {
        profilePicture = profile.avatarImage;
      } else if (profile.avatarType === 'text' && profile.avatar) {
        profileAvatar = profile.avatar;
      } else if (profile.avatar) {
        profileAvatar = profile.avatar;
      }
    }
    
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      autor: author || 'Anónimo',
      texto: text.trim(),
      timestamp: Date.now(),
      profilePicture: profilePicture,
      profileAvatar: profileAvatar,
      isLoggedUser: isLoggedUser,
      likes: 0,
      dislikes: 0,
      attachedImage: attachedImage
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

// Funciones globales para comentarios mejorados
window.addCommentLegacy = async function(drawingId) {
  const input = document.getElementById('commentInput');
  const authorInput = document.getElementById('commentAuthor');
  const imageInput = document.getElementById('commentImage');
  
  if (!input || !input.value.trim()) return;
  
  // Auto-moderación antes de procesar
  if (window.autoModeration) {
    const text = input.value.trim();
    const author = authorInput?.value?.trim() || 'Anónimo';
    
    const modResult = await window.autoModeration.moderateContent(text, author, 'comment');
    
    if (modResult.blocked) {
      if (window.guestbookApp?.ui) {
        window.guestbookApp.ui.showNotification(
          `🛡️ Comentario bloqueado: ${modResult.reasons.join(', ')}`,
          'error'
        );
      } else {
        alert(`🛡️ Comentario bloqueado: ${modResult.reasons.join(', ')}`);
      }
      return false;
    }
    
    if (modResult.flagged) {
      if (window.guestbookApp?.ui) {
        window.guestbookApp.ui.showNotification(
          '⚠️ Comentario marcado para revisión',
          'warning'
        );
      }
    }
    
    const filteredText = window.autoModeration.filterContent(text);
    input.value = filteredText;
  }
  
  let attachedImage = null;
  if (imageInput?.files[0]) {
    const file = imageInput.files[0];
    if (file.size > 500 * 1024) {
      alert('🚫 Imagen muy grande. Máximo 500KB.');
      return;
    }
    
    const reader = new FileReader();
    attachedImage = await new Promise(resolve => {
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
  
  const commentsManager = new (await import('./comments.js')).CommentsManager(
    window.guestbookApp?.firebase
  );
  
  const success = await commentsManager.addComment(
    drawingId,
    authorInput?.value.trim(),
    input.value.trim(),
    attachedImage
  );
  
  if (success) {
    input.value = '';
    if (authorInput) authorInput.value = '';
    if (imageInput) {
      imageInput.value = '';
      const preview = document.getElementById('commentImagePreview');
      if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
      }
    }
    
    const panel = input.closest('div').parentElement;
    commentsManager.loadComments(drawingId, panel);
  }
};

// Funciones globales para comentarios mejorados
window.reactToComment = async function(drawingId, commentId, reaction, isReply = false) {
  try {
    const storageKey = `comment_${reaction}_${commentId}`;
    const hasReacted = localStorage.getItem(storageKey) === 'true';
    
    if (hasReacted) {
      if (window.guestbookApp?.ui) {
        window.guestbookApp.ui.showNotification(
          `Ya has dado ${reaction === 'like' ? '👍' : '👎'} a este comentario`,
          'warning'
        );
      }
      return;
    }
    
    localStorage.setItem(storageKey, 'true');
    
    if (window.guestbookApp?.firebase) {
      await window.guestbookApp.firebase.updateCommentReaction(drawingId, commentId, reaction, 1);
    }
    
    const button = document.querySelector(`button[onclick*="reactToComment('${drawingId}', '${commentId}', '${reaction}')"]`);
    if (button) {
      button.style.color = reaction === 'like' ? '#28a745' : '#dc3545';
      const currentText = button.textContent.trim();
      const emoji = reaction === 'like' ? '👍' : '👎';
      const currentCount = parseInt(currentText.replace(emoji, '').trim()) || 0;
      button.innerHTML = `${emoji} ${currentCount + 1}`;
    }
    
    if (window.guestbookApp?.ui) {
      window.guestbookApp.ui.showNotification(
        `${reaction === 'like' ? '👍' : '👎'} Reacción agregada`,
        'success'
      );
    }
    
  } catch (error) {
    console.error('Error reaccionando a comentario:', error);
  }
};

window.showReplyForm = function(commentId, authorName) {
  const formContainer = document.getElementById(`replyForm_${commentId}`);
  if (!formContainer) return;
  
  if (formContainer.style.display !== 'none') {
    formContainer.style.display = 'none';
    return;
  }
  
  const isMobile = window.innerWidth <= 768;
  
  formContainer.innerHTML = `
    <div style="background: var(--bg-dark); border-radius: 6px; padding: ${isMobile ? '8px' : '10px'}; border: 1px solid var(--primary);">
      <div style="margin-bottom: 8px;">
        <small style="color: var(--text-secondary);">Respondiendo a <strong style="color: var(--primary);">@${authorName}</strong></small>
      </div>
      <div style="margin-bottom: 8px;">
        <textarea id="replyText_${commentId}" placeholder="Escribe tu respuesta..." style="width: 100%; min-height: ${isMobile ? '60px' : '80px'}; background: var(--bg-light); border: 1px solid var(--primary); color: var(--text-primary); border-radius: 4px; padding: 8px; resize: vertical; font-size: ${isMobile ? '14px' : '16px'};" maxlength="500"></textarea>
      </div>
      <div style="margin-bottom: 8px;">
        <input type="text" id="replyAuthor_${commentId}" placeholder="Tu nombre (opcional)" style="width: 100%; background: var(--bg-light); border: 1px solid var(--primary); color: var(--text-primary); border-radius: 4px; padding: 6px; font-size: ${isMobile ? '12px' : '14px'};" maxlength="50">
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button onclick="hideReplyForm('${commentId}')" style="background: var(--bg-light); border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: ${isMobile ? '12px' : '14px'};">
          Cancelar
        </button>
        <button onclick="submitReply('${commentId}')" style="background: var(--primary); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: ${isMobile ? '12px' : '14px'};">
          💬 Responder
        </button>
      </div>
    </div>
  `;
  
  formContainer.style.display = 'block';
  
  if (window.guestbookApp?.profiles?.isLoggedIn()) {
    const authorInput = document.getElementById(`replyAuthor_${commentId}`);
    if (authorInput) {
      authorInput.value = window.guestbookApp.profiles.currentProfile.username;
    }
  }
  
  const textarea = document.getElementById(`replyText_${commentId}`);
  if (textarea) {
    textarea.focus();
  }
};

window.hideReplyForm = function(commentId) {
  const formContainer = document.getElementById(`replyForm_${commentId}`);
  if (formContainer) {
    formContainer.style.display = 'none';
    formContainer.innerHTML = '';
  }
};

window.submitReply = async function(commentId) {
  const textArea = document.getElementById(`replyText_${commentId}`);
  const authorInput = document.getElementById(`replyAuthor_${commentId}`);
  
  const text = textArea?.value?.trim();
  const author = authorInput?.value?.trim() || 'Anónimo';
  
  if (!text) {
    if (window.guestbookApp?.ui) {
      window.guestbookApp.ui.showNotification('✏️ Escribe tu respuesta primero', 'error');
    }
    return;
  }
  
  const submitBtn = document.querySelector(`button[onclick="submitReply('${commentId}')"]`);
  if (submitBtn) {
    submitBtn.innerHTML = '⏳ Enviando...';
    submitBtn.disabled = true;
  }
  
  try {
    let profilePicture = null;
    let profileAvatar = null;
    let isLoggedUser = false;
    let finalAuthor = author;
    
    if (window.guestbookApp?.profiles?.isLoggedIn()) {
      const profile = window.guestbookApp.profiles.currentProfile;
      finalAuthor = profile.username || author;
      isLoggedUser = true;
      
      if (profile.avatarImage) {
        profilePicture = profile.avatarImage;
      } else if (profile.avatar) {
        profileAvatar = profile.avatar;
      }
    }
    
    const reply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      parentId: commentId,
      autor: finalAuthor,
      texto: text,
      timestamp: Date.now(),
      profilePicture: profilePicture,
      profileAvatar: profileAvatar,
      isLoggedUser: isLoggedUser,
      likes: 0,
      dislikes: 0
    };
    
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    const drawingId = commentElement?.closest('.image-modal')?.dataset?.drawingId;
    
    if (!drawingId) {
      throw new Error('No se pudo obtener el ID del dibujo');
    }
    
    if (window.guestbookApp?.firebase) {
      await window.guestbookApp.firebase.addComment(drawingId, reply);
    }
    
    hideReplyForm(commentId);
    
    if (window.guestbookApp?.gallery) {
      const modal = document.querySelector('.image-modal');
      if (modal) {
        const commentsContainer = modal.querySelector('.comments-container');
        if (commentsContainer && window.CommentsManager) {
          const commentsManager = new window.CommentsManager(window.guestbookApp.firebase);
          await commentsManager.loadComments(drawingId, commentsContainer);
        }
      }
    }
    
    if (window.guestbookApp?.ui) {
      window.guestbookApp.ui.showNotification('✅ Respuesta enviada', 'success');
    }
    
  } catch (error) {
    console.error('Error enviando respuesta:', error);
    if (submitBtn) {
      submitBtn.innerHTML = '💬 Responder';
      submitBtn.disabled = false;
    }
  }
};

window.viewAttachedImage = function(imageSrc) {
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.style.zIndex = '9999';
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content" style="background: var(--bg-dark); border: 2px solid var(--primary);">
        <div class="modal-header" style="border-bottom: 1px solid var(--primary);">
          <h5 class="modal-title" style="color: var(--primary);">🖼️ Imagen Adjunta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(1);"></button>
        </div>
        <div class="modal-body text-center">
          <img src="${imageSrc}" class="img-fluid" style="max-height: 70vh; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        </div>
        <div class="modal-footer" style="border-top: 1px solid var(--primary);">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          <a href="${imageSrc}" download="imagen-comentario.jpg" class="btn btn-primary">💾 Descargar</a>
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
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.CommentsManager = CommentsManager;
}