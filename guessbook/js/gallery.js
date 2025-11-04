export class GalleryManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.currentFilter = 'all';
    this.allDrawings = [];
    this.filteredDrawings = [];
    
    // Hacer disponible globalmente
    window.galleryManager = this;
  }

  async init() {
    await this.loadGallery();
    this.setupEventListeners();
  }
  
  // Alias para compatibilidad
  async loadDrawings() {
    return this.loadGallery();
  }

  async loadGallery() {
    try {
      const drawings = await this.firebase.getDrawings();
      this.allDrawings = drawings.sort((a, b) => b.data.timestamp - a.data.timestamp);
      this.applyFilter();
      this.displayGallery();
      this.displayRankings();
    } catch (error) {
      console.error('Error loading gallery:', error);
      this.showError('Error cargando la galería');
    }
  }

  applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredDrawings = [...this.allDrawings];
    } else {
      this.filteredDrawings = this.allDrawings.filter(drawing => 
        drawing.data.categoria === this.currentFilter
      );
    }
    this.currentPage = 1;
  }

  displayGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    let pageDrawings = this.filteredDrawings.slice(startIndex, endIndex);

    if (pageDrawings.length === 0) {
      gallery.innerHTML = `
        <div class="col-12 text-center py-5">
          <div style="color: var(--text-secondary); font-size: 1.2em;">
            <i class="fas fa-palette" style="font-size: 3em; margin-bottom: 20px; opacity: 0.5;"></i>
            <p>No hay dibujos para mostrar</p>
          </div>
        </div>
      `;
      return;
    }

    // Obtener top 3 por likes para primera página
    let topDrawings = [];
    if (this.currentPage === 1 && this.currentFilter === 'all') {
      topDrawings = [...this.allDrawings]
        .filter(d => (d.data.likes || 0) > 0)
        .sort((a, b) => (b.data.likes || 0) - (a.data.likes || 0))
        .slice(0, 3);
      
      // Remover top 3 de pageDrawings si están presentes
      const topIds = topDrawings.map(d => d.id);
      pageDrawings = pageDrawings.filter(d => !topIds.includes(d.id));
    }

    let galleryHTML = '';
    
    // Agregar top 3 al principio si es primera página
    if (topDrawings.length > 0) {
      galleryHTML += topDrawings.map((drawing, index) => 
        this.createDrawingCard(drawing, index + 1)
      ).join('');
    }
    
    // Agregar resto de dibujos
    galleryHTML += pageDrawings.map(drawing => this.createDrawingCard(drawing)).join('');
    
    gallery.innerHTML = galleryHTML;
    this.setupLikeButtons();
    this.updatePagination();
  }

  createDrawingCard(drawing, rank = null) {
    const likes = drawing.data.likes || 0;
    const comments = drawing.data.comments || [];
    const isLiked = localStorage.getItem(`liked_${drawing.id}`) === 'true';
    
    const rankClass = rank ? `top-drawing rank-${rank}` : '';
    const rankBadge = rank ? `<div class="rank-badge rank-${rank}">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</div>` : '';
    
    // Detectar si es GIF animado
    const isAnimated = drawing.data.backgroundGif || drawing.data.isAnimated;
    const imageSource = isAnimated ? (drawing.data.backgroundGif || drawing.data.imagenData) : drawing.data.imagenData;
    const animatedBadge = isAnimated ? `
      <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(255, 107, 53, 0.9); color: white; padding: 4px 8px; border-radius: 15px; font-size: 0.7em; font-weight: bold;">
        🎬 GIF
      </div>
    ` : '';
    
    return `
      <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
        <div class="card h-100 ${rankClass}" style="background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-dark) 100%); border: 2px solid var(--primary); border-radius: 15px; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative;">
          ${rankBadge}
          <div style="position: relative; overflow: hidden;">
            <img src="${imageSource}" class="card-img-top drawing-img" style="height: 200px; object-fit: contain; background: white; cursor: pointer; transition: transform 0.3s ease; image-rendering: auto; -webkit-image-rendering: auto;" onclick="viewImage('${imageSource}', '${drawing.id}', '${isAnimated}')" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" loading="lazy">
            <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8em;">
              ${drawing.data.categoria}
            </div>
            ${comments.length > 0 ? `
              <div style="position: absolute; top: 10px; left: 10px; background: rgba(255, 107, 53, 0.9); color: white; padding: 4px 8px; border-radius: 15px; font-size: 0.7em; font-weight: bold;">
                💬 ${comments.length}
              </div>
            ` : ''}
            ${animatedBadge}
          </div>
          <div class="card-body d-flex flex-column" style="padding: 15px;">
            <h6 class="card-title" style="color: var(--primary); margin-bottom: 10px; font-weight: 600;">${drawing.data.titulo}</h6>
            <p class="card-text" style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px;">Por: <strong style="color: var(--text-primary);">${drawing.data.autor}</strong></p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <div class="d-flex gap-2">
                <button class="btn btn-sm like-btn ${isLiked ? 'liked' : ''}" data-id="${drawing.id}" style="background: ${isLiked ? 'var(--primary)' : 'transparent'}; color: ${isLiked ? 'white' : 'var(--primary)'}; border: 2px solid var(--primary); border-radius: 25px; padding: 6px 12px; transition: all 0.3s ease; font-size: 0.8em;">
                  ❤️ <span class="like-count">${likes}</span>
                </button>
                <button class="btn btn-sm" onclick="viewImage('${imageSource}', '${drawing.id}', '${isAnimated}')" style="background: transparent; color: var(--text-secondary); border: 2px solid var(--text-secondary); border-radius: 25px; padding: 6px 12px; transition: all 0.3s ease; font-size: 0.8em;" title="Ver comentarios">
                  💬 ${comments.length}
                </button>
              </div>
              <small style="color: var(--text-secondary); font-size: 0.75em;">${new Date(drawing.data.timestamp).toLocaleDateString()}</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupLikeButtons() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const drawingId = btn.dataset.id;
        const isLiked = btn.classList.contains('liked');
        const likeCountSpan = btn.querySelector('.like-count');
        const currentLikes = parseInt(likeCountSpan.textContent);

        // Optimistic update
        if (isLiked) {
          btn.classList.remove('liked');
          btn.style.background = 'transparent';
          btn.style.color = 'var(--primary)';
          likeCountSpan.textContent = Math.max(0, currentLikes - 1);
          localStorage.removeItem(`liked_${drawingId}`);
        } else {
          btn.classList.add('liked');
          btn.style.background = 'var(--primary)';
          btn.style.color = 'white';
          likeCountSpan.textContent = currentLikes + 1;
          localStorage.setItem(`liked_${drawingId}`, 'true');
        }

        try {
          await this.firebase.toggleLike(drawingId, !isLiked);
        } catch (error) {
          // Revert on error
          if (isLiked) {
            btn.classList.add('liked');
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
            likeCountSpan.textContent = currentLikes;
            localStorage.setItem(`liked_${drawingId}`, 'true');
          } else {
            btn.classList.remove('liked');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--primary)';
            likeCountSpan.textContent = currentLikes;
            localStorage.removeItem(`liked_${drawingId}`);
          }
          console.error('Error toggling like:', error);
        }
      });
    });
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredDrawings.length / this.itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination || totalPages <= 1) {
      if (pagination) pagination.innerHTML = '';
      return;
    }

    let paginationHTML = '';
    
    if (this.currentPage > 1) {
      paginationHTML += `<button class="btn btn-outline-primary me-2" onclick="galleryManager.goToPage(${this.currentPage - 1})">← Anterior</button>`;
    }
    
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
      paginationHTML += `<button class="btn ${i === this.currentPage ? 'btn-primary' : 'btn-outline-primary'} me-2" onclick="galleryManager.goToPage(${i})">${i}</button>`;
    }
    
    if (this.currentPage < totalPages) {
      paginationHTML += `<button class="btn btn-outline-primary" onclick="galleryManager.goToPage(${this.currentPage + 1})">Siguiente →</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
  }

  goToPage(page) {
    this.currentPage = page;
    this.displayGallery();
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
  }

  filterByCategory(category) {
    this.currentFilter = category;
    this.applyFilter();
    this.displayGallery();
  }

  async displayRankings() {
    // Los rankings se muestran en la sección dedicada del HTML, no en la galería
    this.updateRankingsSection();
  }
  
  updateRankingsSection() {
    const topArtists = document.getElementById('topArtists');
    const topLiked = document.getElementById('topLiked');
    const topActive = document.getElementById('topActive');
    
    if (!topArtists || !topLiked || !topActive || this.allDrawings.length === 0) return;
    
    // Top artistas por cantidad de dibujos
    const artistCounts = {};
    this.allDrawings.forEach(drawing => {
      const author = drawing.data.autor || 'Anónimo';
      artistCounts[author] = (artistCounts[author] || 0) + 1;
    });
    
    const topArtistsList = Object.entries(artistCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    topArtists.innerHTML = topArtistsList.map(([author, count], index) => {
      const medals = ['🥇', '🥈', '🥉'];
      return `<div class="d-flex justify-content-between mb-1">
        <span>${medals[index]} ${author}</span>
        <span>${count} dibujos</span>
      </div>`;
    }).join('') || '<div class="text-muted">Sin datos</div>';
    
    // Top más populares por likes
    const topLikedList = [...this.allDrawings]
      .filter(drawing => (drawing.data.likes || 0) > 0)
      .sort((a, b) => (b.data.likes || 0) - (a.data.likes || 0))
      .slice(0, 3);
    
    topLiked.innerHTML = topLikedList.map((drawing, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      return `<div class="d-flex justify-content-between mb-1">
        <span>${medals[index]} ${drawing.data.autor}</span>
        <span>❤️ ${drawing.data.likes}</span>
      </div>`;
    }).join('') || '<div class="text-muted">Sin datos</div>';
    
    // Top más activos (por comentarios)
    const activeList = [...this.allDrawings]
      .filter(drawing => (drawing.data.comments?.length || 0) > 0)
      .sort((a, b) => (b.data.comments?.length || 0) - (a.data.comments?.length || 0))
      .slice(0, 3);
    
    topActive.innerHTML = activeList.map((drawing, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      return `<div class="d-flex justify-content-between mb-1">
        <span>${medals[index]} ${drawing.data.autor}</span>
        <span>💬 ${drawing.data.comments?.length || 0}</span>
      </div>`;
    }).join('') || '<div class="text-muted">Sin datos</div>';
  }

  setupEventListeners() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.filterByCategory(e.target.value);
      });
    }
  }

  showError(message) {
    const gallery = document.getElementById('gallery');
    if (gallery) {
      gallery.innerHTML = `
        <div class="col-12 text-center py-5">
          <div style="color: var(--text-secondary);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 20px; color: #dc3545;"></i>
            <p>${message}</p>
          </div>
        </div>
      `;
    }
  }
}

// Funciones globales
// Función para generar avatar con PNG o emoji
function generateAvatar(author, profilePicture) {
  if (profilePicture) {
    return `<img src="${profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
  }
  
  // Lista de emojis para avatares
  const avatarEmojis = ['🎨', '🖌️', '🎭', '🌟', '🎪', '🎨', '🦄', '🌈', '⭐', '🎯', '🎲', '🎮', '🎸', '🎺', '🎻', '🎤', '🎧', '🎬', '📸', '🎨'];
  
  // Generar emoji basado en el nombre del autor
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  const emojiIndex = Math.abs(hash) % avatarEmojis.length;
  
  return `<span style="font-size: 1.2em;">${avatarEmojis[emojiIndex]}</span>`;
}

window.downloadImage = function(imageData, author) {
  const link = document.createElement('a');
  link.download = `dibujo-${author}-${Date.now()}.png`;
  link.href = imageData;
  link.click();
};

window.viewImage = async function(imageData, drawingId, isAnimated = 'false') {
  isAnimated = isAnimated === 'true' || isAnimated === true;
  const existingModal = document.querySelector('.image-modal');
  if (existingModal) existingModal.remove();
  
  // Obtener información del dibujo para mostrar perfil del usuario
  let drawingData = null;
  try {
    const drawing = await window.guestbookApp.firebase.getDrawing(drawingId);
    drawingData = drawing?.data;
  } catch (error) {
    console.error('Error obteniendo datos del dibujo:', error);
  }
  
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.95); z-index: 99999; display: flex;
    align-items: center; justify-content: center; padding: 10px;
  `;
  
  const isMobile = window.innerWidth <= 768;
  
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex; ${isMobile ? 'flex-direction: column;' : ''}
    max-width: ${isMobile ? '100%' : '90vw'}; max-height: ${isMobile ? '100%' : '90vh'};
    background: var(--bg-light); border-radius: 15px; overflow: hidden;
    border: 2px solid var(--primary); width: 100%; height: ${isMobile ? '100%' : 'auto'};
  `;
  
  const imageSection = document.createElement('div');
  imageSection.style.cssText = `
    ${isMobile ? 'flex: 0 0 50%;' : 'flex: 1;'}
    padding: 20px; text-align: center;
    display: flex; flex-direction: column; justify-content: center;
    background: white; position: relative;
  `;
  
  const commentsSection = document.createElement('div');
  commentsSection.style.cssText = `
    ${isMobile ? 'flex: 1; min-height: 0;' : 'width: 400px; min-width: 400px;'}
    padding: 20px;
    ${isMobile ? 'border-top: 2px solid var(--primary);' : 'border-left: 2px solid var(--primary);'}
    overflow-y: auto; background: var(--bg-dark);
    display: flex; flex-direction: column;
  `;
  
  const animatedBadge = isAnimated ? `
    <div style="position: absolute; top: 15px; right: 15px; background: rgba(255, 107, 53, 0.9); color: white; padding: 8px 12px; border-radius: 20px; font-size: 0.9em; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
      🎬 GIF Animado
    </div>
  ` : '';
  
  imageSection.innerHTML = `
    ${animatedBadge}
    <img src="${imageData}" style="max-width: 100%; max-height: ${isMobile ? '35vh' : '70vh'}; border-radius: 12px; object-fit: contain; box-shadow: 0 4px 20px rgba(0,0,0,0.3); background: white; image-rendering: auto; -webkit-image-rendering: auto;" loading="lazy">
    <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <button onclick="this.closest('.image-modal').remove()" class="btn btn-secondary">✖️ Cerrar</button>
      <button onclick="downloadImage('${imageData}', 'dibujo')" class="btn btn-primary">💾 Descargar</button>
    </div>
  `;
  
  // Crear sección de perfil del usuario (compacta y clickeable)
  const userProfileHTML = drawingData ? `
    <div style="border-bottom: 1px solid var(--primary); padding-bottom: 10px; margin-bottom: 15px;">
      <div onclick="showUserProfile('${drawingData.autor}', '${drawingData.profilePicture || ''}', '${drawingData.timestamp}', ${drawingData.likes || 0}, ${drawingData.comments?.length || 0}, '${drawingData.categoria}')" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; cursor: pointer; padding: 5px; border-radius: 8px; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 1em; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden;">
          ${generateAvatar(drawingData.autor || 'Anónimo', drawingData.profilePicture)}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h6 style="color: var(--primary); margin: 0; font-weight: 600; font-size: 0.95em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${drawingData.autor || 'Anónimo'} <span style="font-size: 0.7em; opacity: 0.7;">ℹ️</span></h6>
          <small style="color: var(--text-secondary); font-size: 0.75em;">${new Date(drawingData.timestamp).toLocaleDateString('es-ES')}</small>
        </div>
        <div style="display: flex; gap: 8px; font-size: 0.75em; color: var(--text-secondary);">
          <span>❤️ ${drawingData.likes || 0}</span>
          <span>💬 ${drawingData.comments?.length || 0}</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 15px;">
      <h6 style="color: var(--primary); margin: 0; font-weight: 600; font-size: 0.9em;">💬 Comentarios</h6>
    </div>
  ` : `
    <div style="border-bottom: 1px solid var(--primary); padding-bottom: 10px; margin-bottom: 15px; text-align: center;">
      <h6 style="color: var(--primary); margin: 0; font-weight: 600; font-size: 0.9em;">💬 Comentarios</h6>
    </div>
  `;
  
  commentsSection.innerHTML = `
    ${userProfileHTML}
    <div id="commentsContainer" class="comments-container" style="flex: 1; overflow-y: auto; margin-bottom: 20px; scrollbar-width: thin; scrollbar-color: var(--primary) transparent;">
      <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
        <div class="spinner-border" style="color: var(--primary);"></div>
        <p class="mt-3 mb-0">Cargando comentarios...</p>
      </div>
    </div>
    <div style="border-top: 2px solid var(--primary); padding-top: 20px;">
      <div class="mb-3">
        <input type="text" id="commentAuthor" placeholder="Tu nombre (opcional)" class="form-control mb-2" style="background: var(--bg-light); border: 2px solid var(--primary); color: var(--text-primary); font-size: ${isMobile ? '16px' : '14px'};" maxlength="50">
        <textarea id="newComment" placeholder="Escribe un comentario..." class="form-control" rows="3" style="background: var(--bg-light); border: 2px solid var(--primary); color: var(--text-primary); resize: none; font-size: ${isMobile ? '16px' : '14px'};" maxlength="500"></textarea>
        <small style="color: var(--text-secondary); font-size: 0.8em;">Máximo 500 caracteres</small>
      </div>
      <button onclick="addComment('${drawingId}')" class="btn btn-primary w-100" style="padding: 12px; font-weight: 600; border-radius: 8px;">💭 Comentar</button>
    </div>
  `;
  
  container.appendChild(imageSection);
  container.appendChild(commentsSection);
  modal.appendChild(container);
  document.body.appendChild(modal);
  
  // Cargar comentarios
  setTimeout(() => {
    console.log('Iniciando carga de comentarios para:', drawingId);
    loadComments(drawingId);
  }, 100);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
};

// Función para mostrar perfil de usuario
window.showUserProfile = function(author, profilePicture, timestamp, likes, comments, category) {
  const existingProfileModal = document.querySelector('.profile-modal');
  if (existingProfileModal) existingProfileModal.remove();
  
  const profileModal = document.createElement('div');
  profileModal.className = 'profile-modal';
  profileModal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.9); z-index: 100000; display: flex;
    align-items: center; justify-content: center; padding: 20px;
  `;
  
  const profileCard = document.createElement('div');
  profileCard.style.cssText = `
    background: var(--bg-light); border: 2px solid var(--primary);
    border-radius: 15px; padding: 30px; max-width: 400px; width: 100%;
    text-align: center; position: relative;
  `;
  
  profileCard.innerHTML = `
    <button onclick="this.closest('.profile-modal').remove()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
    
    <div style="margin-bottom: 20px;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 2em; color: white; font-weight: bold; margin: 0 auto 15px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        ${generateAvatar(author, profilePicture)}
      </div>
      <h4 style="color: var(--primary); margin: 0 0 5px; font-weight: 600;">${author}</h4>
      <small style="color: var(--text-secondary);">Miembro desde ${new Date(timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</small>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
      <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
        <div style="color: var(--primary); font-weight: bold; font-size: 1.2em;">${likes}</div>
        <div style="color: var(--text-secondary); font-size: 0.8em;">❤️ Likes</div>
      </div>
      <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
        <div style="color: var(--primary); font-weight: bold; font-size: 1.2em;">${comments}</div>
        <div style="color: var(--text-secondary); font-size: 0.8em;">💬 Comentarios</div>
      </div>
      <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
        <div style="color: var(--primary); font-weight: bold; font-size: 0.9em;">${category}</div>
        <div style="color: var(--text-secondary); font-size: 0.8em;">🎨 Categoría</div>
      </div>
    </div>
    
    <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
      <div style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 10px;">🎨 Perfil del Artista</div>
      <div style="color: var(--text-primary); font-size: 0.85em; line-height: 1.4;">
        ${author} es un artista creativo que forma parte de la comunidad FenixLaboratory. 
        ${likes > 0 ? `Sus obras han recibido ${likes} likes` : 'Está comenzando su journey artístico'} 
        ${comments > 0 ? `y ha generado ${comments} comentarios de la comunidad.` : 'y está explorando nuevas formas de expresión.'}
      </div>
    </div>
  `;
  
  profileModal.appendChild(profileCard);
  document.body.appendChild(profileModal);
  
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) profileModal.remove();
  });
};

async function loadComments(drawingId) {
  try {
    console.log('Cargando comentarios para:', drawingId);
    
    // Intentar obtener comentarios de ambas fuentes
    const [drawing, separateComments] = await Promise.all([
      window.guestbookApp.firebase.getDrawing(drawingId),
      window.guestbookApp.firebase.getComments(drawingId)
    ]);
    
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    // Combinar comentarios de ambas fuentes
    const drawingComments = drawing?.data?.comments || [];
    const allComments = [...drawingComments, ...separateComments.map(c => c.data)];
    
    console.log('Comentarios encontrados:', allComments.length);
    
    if (allComments.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
          <i class="fas fa-comments" style="font-size: 2em; margin-bottom: 15px; opacity: 0.5;"></i>
          <p>No hay comentarios aún</p>
          <p style="font-size: 0.9em;">¡Sé el primero en comentar!</p>
        </div>
      `;
      return;
    }
    
    // Ordenar comentarios por timestamp
    const sortedComments = allComments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    container.innerHTML = sortedComments.map(comment => {
      const author = comment.autor || comment.author || 'Anónimo';
      const text = comment.texto || comment.text || '';
      const timestamp = comment.timestamp || Date.now();
      const profilePicture = comment.profilePicture;
      
      return `
        <div class="comment-item" style="background: var(--bg-light); border-radius: 8px; padding: 10px; margin-bottom: 10px; border-left: 3px solid var(--primary); transition: all 0.2s ease;">
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 0.7em; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden;">
              ${generateAvatar(author, profilePicture)}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: var(--primary); font-size: 0.85em;">${author}</strong>
                <small style="color: var(--text-secondary); font-size: 0.75em;">${formatCommentDate(timestamp)}</small>
              </div>
              <p style="color: var(--text-primary); margin: 0; line-height: 1.3; word-wrap: break-word; font-size: 0.85em;">${text}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading comments:', error);
    const container = document.getElementById('commentsContainer');
    if (container) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Error cargando comentarios</p>';
    }
  }
}

function formatCommentDate(timestamp) {
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

window.addComment = async function(drawingId) {
  const authorInput = document.getElementById('commentAuthor');
  const textarea = document.getElementById('newComment');
  const author = authorInput?.value.trim() || 'Anónimo';
  const comment = textarea?.value.trim();
  
  console.log('Intentando agregar comentario:', { drawingId, author, comment });
  
  if (!comment) {
    if (textarea) {
      textarea.style.borderColor = '#dc3545';
      textarea.focus();
      setTimeout(() => textarea.style.borderColor = 'var(--primary)', 2000);
    }
    return;
  }
  
  // Validación básica
  if (comment.length > 500) {
    alert('El comentario es muy largo (máximo 500 caracteres)');
    return;
  }
  
  const btn = document.querySelector(`button[onclick="addComment('${drawingId}')"]`);
  if (!btn) {
    console.error('No se encontró el botón de comentar');
    return;
  }
  
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Enviando...';
  btn.disabled = true;
  
  try {
    const commentData = {
      autor: author,
      texto: comment,
      timestamp: Date.now(),
      profilePicture: localStorage.getItem('user-profile-picture') || null
    };
    
    console.log('Enviando comentario:', commentData);
    
    // Intentar ambos métodos para compatibilidad
    try {
      // Método 1: Colección separada
      await window.guestbookApp.firebase.addComment(drawingId, commentData);
      console.log('Comentario guardado en colección separada');
    } catch (separateError) {
      console.log('Error en colección separada, intentando en documento:', separateError);
      
      // Método 2: Dentro del documento del dibujo
      const drawing = await window.guestbookApp.firebase.getDrawing(drawingId);
      if (drawing) {
        const currentComments = drawing.data.comments || [];
        await window.guestbookApp.firebase.updateDrawing(drawingId, {
          comments: [...currentComments, commentData]
        });
        console.log('Comentario guardado en documento del dibujo');
      }
    }
    
    // Limpiar campos
    if (authorInput) authorInput.value = '';
    if (textarea) textarea.value = '';
    
    // Recargar comentarios
    await loadComments(drawingId);
    
    // Feedback visual
    btn.innerHTML = '✅ Enviado';
    btn.style.background = '#28a745';
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 1500);
    
  } catch (error) {
    console.error('Error adding comment:', error);
    btn.innerHTML = '❌ Error';
    btn.style.background = '#dc3545';
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
    
    // Mostrar error específico
    if (error.code === 'permission-denied') {
      alert('Error: No tienes permisos para comentar');
    } else {
      alert('Error al enviar comentario. Inténtalo de nuevo.');
    }
  }
};

// Hacer galleryManager disponible globalmente
window.galleryManager = null;