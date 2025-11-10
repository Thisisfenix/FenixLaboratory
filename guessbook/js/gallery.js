export class GalleryManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.currentFilter = 'all';
    this.allDrawings = [];
    this.filteredDrawings = [];
    this.realTimeUpdateInterval = null;
    
    // Hacer disponible globalmente
    window.galleryManager = this;
  }

  async init() {
    await this.loadGallery();
    this.setupEventListeners();
    this.startRealTimeUpdates();
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
      
      // Sincronizar perfiles después de mostrar la galería
      setTimeout(() => {
        if (window.guestbookApp && window.guestbookApp.profiles) {
          window.guestbookApp.profiles.syncCardsAfterLoad();
        }
      }, 500);
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
    
    // Obtener avatar del perfil
    const profileAvatar = drawing.data.profileAvatar || '👤';
    const profilePicture = drawing.data.profilePicture;
    const isLoggedUser = drawing.data.isLoggedUser || false;
    const userProfile = drawing.data.userProfile;
    
    // Detectar si tiene contenido animado o stickers GIF
    const hasBackgroundGif = drawing.data.backgroundGif && drawing.data.backgroundGif !== '';
    const hasGifStickers = drawing.data.gifStickers && Array.isArray(drawing.data.gifStickers) && drawing.data.gifStickers.length > 0;
    const isAnimated = hasBackgroundGif || drawing.data.isAnimated || hasGifStickers;
    
    // Debug: Log para verificar datos de stickers
    if (hasGifStickers) {
      console.log(`Dibujo ${drawing.id} tiene ${drawing.data.gifStickers.length} stickers GIF:`, drawing.data.gifStickers);
    }
    
    // Crear contenedor de imagen EXACTO como guestbook-old
    let imageContent = '';
    
    if (hasBackgroundGif || hasGifStickers) {
      imageContent = `
        <div style="position: relative; width: 100%; height: 200px; background: white; border-radius: 4px; overflow: hidden;">
          ${hasBackgroundGif ? `<img src="${drawing.data.backgroundGif}" style="position: absolute; width: 100%; height: 100%; object-fit: contain; z-index: 1; image-rendering: auto;" alt="Fondo GIF animado" loading="lazy">` : ''}
          <img src="${drawing.data.imagenData}" style="position: absolute; width: 100%; height: 100%; object-fit: contain; z-index: 2; ${hasBackgroundGif ? 'mix-blend-mode: multiply; opacity: 0.9;' : ''}" alt="Dibujo de ${drawing.data.autor}" loading="lazy">
          ${hasGifStickers ? drawing.data.gifStickers.map(sticker => `<img src="${sticker.src}" style="position: absolute; left: ${(sticker.x / 600) * 100}%; top: ${(sticker.y / 400) * 100}%; width: ${(sticker.width / 600) * 100}%; height: ${(sticker.height / 400) * 100}%; z-index: 3; image-rendering: auto; pointer-events: none;" alt="Sticker GIF" loading="lazy">`).join('') : ''}
        </div>
      `;
    } else {
      imageContent = `<img src="${drawing.data.imagenData}" class="drawing-img" style="width: 100%; height: 200px; object-fit: contain; background: white; border-radius: 4px; transition: transform 0.3s ease; image-rendering: auto; -webkit-image-rendering: auto;" loading="lazy">`;
    }
    
    const animatedBadge = isAnimated ? `
      <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(255, 107, 53, 0.9); color: white; padding: 4px 8px; border-radius: 15px; font-size: 0.7em; font-weight: bold; z-index: 10;">
        🎬 ${hasGifStickers && hasBackgroundGif ? 'GIF+Stickers' : hasGifStickers ? 'Stickers' : 'GIF'}
      </div>
    ` : '';
    
    return `
      <div class="col-lg-4 col-md-6 col-sm-12 mb-4">
        <div class="card drawing-card h-100 ${rankClass}" data-id="${drawing.id}" style="background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-dark) 100%); border: 2px solid var(--primary); border-radius: 15px; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative;">
          ${rankBadge}
          <div style="position: relative; overflow: hidden; cursor: pointer; transition: transform 0.3s ease;" onclick="viewImage('${drawing.data.imagenData.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${drawing.id}', ${isAnimated}, '${hasBackgroundGif ? drawing.data.backgroundGif.replace(/'/g, "\\'").replace(/"/g, '&quot;') : ''}', ${hasGifStickers ? JSON.stringify(drawing.data.gifStickers).replace(/"/g, '&quot;').replace(/'/g, "\\'") : 'null'})" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            ${imageContent}
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
            <div class="d-flex align-items-center mb-3" style="gap: 10px;">
              <div class="author-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden; ${isLoggedUser ? 'border: 2px solid #28a745;' : ''}">
                ${profilePicture ? `<img src="${profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : `<span>${profileAvatar || '👤'}</span>`}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div class="author-name" style="color: var(--text-primary); font-weight: 600; font-size: 0.9em; display: flex; align-items: center; gap: 5px;">
                  ${drawing.data.autor}
                  ${isLoggedUser ? '<span style="color: #28a745; font-size: 0.7em;" title="Usuario registrado">✓</span>' : ''}
                  ${this.getUserRoleBadge(drawing.data.userRole)}
                </div>
                ${userProfile ? `<small style="color: var(--text-secondary); font-size: 0.75em;">Miembro desde ${new Date(userProfile.joinDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</small>` : ''}
              </div>
            </div>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <div class="d-flex gap-2">
                <button class="btn btn-sm like-btn ${isLiked ? 'liked' : ''}" data-id="${drawing.id}" style="background: ${isLiked ? 'var(--primary)' : 'transparent'}; color: ${isLiked ? 'white' : 'var(--primary)'}; border: 2px solid var(--primary); border-radius: 25px; padding: 6px 12px; transition: all 0.3s ease; font-size: 0.8em;">
                  ❤️ <span class="like-count">${likes}</span>
                </button>
                <button class="btn btn-sm" onclick="event.stopPropagation(); viewImage('${drawing.data.imagenData.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${drawing.id}', ${isAnimated}, '${hasBackgroundGif ? drawing.data.backgroundGif.replace(/'/g, "\\'").replace(/"/g, '&quot;') : ''}', ${hasGifStickers ? JSON.stringify(drawing.data.gifStickers).replace(/"/g, '&quot;').replace(/'/g, "\\'") : 'null'})" style="background: transparent; color: var(--text-secondary); border: 2px solid var(--text-secondary); border-radius: 25px; padding: 6px 12px; transition: all 0.3s ease; font-size: 0.8em;" title="Ver comentarios">
                  💬 ${comments.length}
                </button>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm" onclick="event.stopPropagation(); reportDrawing('${drawing.id}', '${drawing.data.autor}')" style="background: transparent; color: #ffc107; border: 2px solid #ffc107; border-radius: 25px; padding: 4px 8px; transition: all 0.3s ease; font-size: 0.7em;" title="Reportar dibujo">
                  ⚠️
                </button>
                <button class="btn btn-sm delete-drawing-btn" onclick="event.stopPropagation(); deleteDrawing('${drawing.id}', '${drawing.data.autor}')" style="background: transparent; color: #dc3545; border: 2px solid #dc3545; border-radius: 25px; padding: 4px 8px; transition: all 0.3s ease; font-size: 0.7em; display: none;" title="Eliminar dibujo">
                  🗑️
                </button>
                <small style="color: var(--text-secondary); font-size: 0.75em;">${new Date(drawing.data.timestamp).toLocaleDateString()}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupLikeButtons() {
    // Mostrar/ocultar botones de eliminar según permisos
    this.updateDeleteButtons();
    
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
          
          // Actualizar datos locales inmediatamente
          const drawingIndex = this.allDrawings.findIndex(d => d.id === drawingId);
          if (drawingIndex !== -1) {
            this.allDrawings[drawingIndex].data.likes = Math.max(0, currentLikes + (isLiked ? -1 : 1));
          }
          
          // Actualizar rankings si es necesario
          setTimeout(() => this.updateRankingsSection(), 500);
          
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
    
    // Filtros de búsqueda
    const searchAuthor = document.getElementById('searchAuthor');
    const filterCategory = document.getElementById('filterCategory');
    const clearFilters = document.getElementById('clearFilters');
    
    if (searchAuthor) {
      searchAuthor.addEventListener('input', () => this.applySearchFilters());
    }
    
    if (filterCategory) {
      filterCategory.addEventListener('change', () => this.applySearchFilters());
    }
    
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        if (searchAuthor) searchAuthor.value = '';
        if (filterCategory) filterCategory.value = '';
        this.applySearchFilters();
      });
    }
  }

  getUserRoleBadge(userRole) {
    if (!userRole) return '';
    
    const badges = {
      'admin': '<span class="badge ms-1" style="background: linear-gradient(45deg, #ff6b35, #ff8c42); color: white; font-size: 0.6em; padding: 2px 6px;">👑 ADMIN</span>',
      'moderator': '<span class="badge ms-1" style="background: linear-gradient(45deg, #28a745, #20c997); color: white; font-size: 0.6em; padding: 2px 6px;">🛡️ MOD</span>'
    };
    
    return badges[userRole] || '';
  }
  
  updateDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-drawing-btn');
    const hasPermission = window.hasPermission && window.hasPermission('delete_drawings');
    
    deleteButtons.forEach(btn => {
      btn.style.display = hasPermission ? 'inline-block' : 'none';
    });
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
  
  // Actualizaciones en tiempo real
  startRealTimeUpdates() {
    // Actualizar cada 30 segundos
    this.realTimeUpdateInterval = setInterval(() => {
      this.updateGalleryData();
    }, 30000);
  }
  
  stopRealTimeUpdates() {
    if (this.realTimeUpdateInterval) {
      clearInterval(this.realTimeUpdateInterval);
      this.realTimeUpdateInterval = null;
    }
  }
  
  async updateGalleryData() {
    try {
      const newDrawings = await this.firebase.getDrawings();
      const hasChanges = this.checkForChanges(newDrawings);
      
      if (hasChanges) {
        this.allDrawings = newDrawings.sort((a, b) => b.data.timestamp - a.data.timestamp);
        this.applyFilter();
        this.displayGallery();
        this.displayRankings();
        
        // Actualización silenciosa
      }
    } catch (error) {
      console.error('Error en actualización en tiempo real:', error);
    }
  }
  
  checkForChanges(newDrawings) {
    if (newDrawings.length !== this.allDrawings.length) {
      return true;
    }
    
    // Verificar cambios en likes o comentarios
    let hasChanges = false;
    for (let i = 0; i < newDrawings.length; i++) {
      const newDrawing = newDrawings[i];
      const oldDrawing = this.allDrawings.find(d => d.id === newDrawing.id);
      
      if (!oldDrawing) {
        hasChanges = true;
        continue;
      }
      
      const oldLikes = oldDrawing.data.likes || 0;
      const newLikes = newDrawing.data.likes || 0;
      const oldComments = oldDrawing.data.comments?.length || 0;
      const newComments = newDrawing.data.comments?.length || 0;
      
      if (newLikes !== oldLikes || newComments !== oldComments) {
        hasChanges = true;
        
        // Mostrar indicador de cambio
        if (newLikes > oldLikes) {
          this.showChangeIndicator(newDrawing.id, 'like', newLikes - oldLikes);
        }
        if (newComments > oldComments) {
          this.showChangeIndicator(newDrawing.id, 'comment', newComments - oldComments);
        }
      }
    }
    
    return hasChanges;
  }
  
  showChangeIndicator(drawingId, type, count) {
    // Buscar la tarjeta del dibujo
    const drawingCard = document.querySelector(`[data-id="${drawingId}"]`);
    if (!drawingCard) return;
    
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute; top: -5px; right: -5px; z-index: 100;
      background: ${type === 'like' ? '#ff4757' : '#3742fa'};
      color: white; border-radius: 50%; width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7em; font-weight: bold;
      animation: bounce 0.6s ease-in-out;
    `;
    indicator.innerHTML = type === 'like' ? '❤️' : '💬';
    
    drawingCard.style.position = 'relative';
    drawingCard.appendChild(indicator);
    
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => indicator.remove(), 300);
      }
    }, 3000);
  }
  

  
  showRandomSuggestion() {
    const suggestions = [
      '💡 ¿Sabías que puedes hacer doble clic en una imagen para verla en pantalla completa?',
      '✨ Prueba los filtros de búsqueda para encontrar dibujos específicos',
      '🎨 Los dibujos con más likes aparecen destacados con efectos especiales',
      '💬 Deja comentarios en los dibujos para interactuar con otros artistas',
      '🔄 La galería se actualiza automáticamente cada 30 segundos',
      '🏆 Revisa los rankings para ver quiénes son los artistas más populares',
      '📱 El guestbook está optimizado para dispositivos móviles',
      '🎆 Usa el botón de capturar frames para crear GIFs animados'
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    const suggestionDiv = document.createElement('div');
    suggestionDiv.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      background: linear-gradient(135deg, #4CAF50, #45a049); color: white;
      padding: 12px 16px; border-radius: 10px; font-size: 0.85em;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3); max-width: 300px;
      animation: slideIn 0.3s ease-out; cursor: pointer;
    `;
    suggestionDiv.innerHTML = randomSuggestion;
    
    suggestionDiv.addEventListener('click', () => {
      suggestionDiv.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => suggestionDiv.remove(), 300);
    });
    
    document.body.appendChild(suggestionDiv);
    
    setTimeout(() => {
      if (suggestionDiv.parentNode) {
        suggestionDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => suggestionDiv.remove(), 300);
      }
    }, 5000);
  }
  
  // Filtros de búsqueda
  applySearchFilters() {
    const searchTerm = document.getElementById('searchAuthor')?.value.toLowerCase().trim() || '';
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    
    this.filteredDrawings = this.allDrawings.filter(drawing => {
      const matchesAuthor = !searchTerm || (drawing.data.autor || '').toLowerCase().includes(searchTerm);
      const matchesCategory = !categoryFilter || drawing.data.categoria === categoryFilter;
      return matchesAuthor && matchesCategory;
    });
    
    this.currentPage = 1;
    this.displayGallery();
  }
}

// Funciones globales
// Función para generar avatar con PNG o emoji
async function generateAvatar(author, profilePicture, profileAvatar = null) {
  // Intentar cargar datos actualizados de Firebase si no se proporcionan
  if (!profilePicture && !profileAvatar && window.guestbookApp && window.guestbookApp.firebase) {
    try {
      const userProfile = await window.guestbookApp.firebase.getUserProfile(author);
      if (userProfile) {
        profilePicture = userProfile.avatarImage;
        profileAvatar = userProfile.avatar;
      }
    } catch (error) {
      // Silenciar error y usar fallback
    }
  }
  
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

// Versión síncrona para compatibilidad
function generateAvatarSync(author, profilePicture, profileAvatar = null) {
  if (profilePicture) {
    return `<img src="${profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
  }
  
  if (profileAvatar && profileAvatar !== '👤') {
    return `<span style="font-size: 1.2em;">${profileAvatar}</span>`;
  }
  
  const avatarEmojis = ['🎨', '🖌️', '🎭', '🌟', '🎪', '🦄', '🌈', '⭐', '🎯', '🎲', '🎮', '🎸', '🎺', '🎻', '🎤', '🎧', '🎬', '📸'];
  
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

window.viewImage = async function(imageData, drawingId, isAnimated = false, backgroundGif = '', gifStickers = null) {
  isAnimated = isAnimated === 'true' || isAnimated === true;
  const existingModal = document.querySelector('.image-modal');
  if (existingModal) existingModal.remove();
  
  // Parsear stickers GIF si existen
  let parsedGifStickers = null;
  if (gifStickers && gifStickers !== 'null' && gifStickers !== 'undefined') {
    try {
      if (typeof gifStickers === 'string') {
        // Decodificar HTML entities si es necesario
        const decodedStickers = gifStickers.replace(/&quot;/g, '"');
        parsedGifStickers = JSON.parse(decodedStickers);
      } else if (Array.isArray(gifStickers)) {
        parsedGifStickers = gifStickers;
      }
      console.log('Stickers GIF parseados:', parsedGifStickers);
    } catch (e) {
      console.warn('Error parseando gifStickers:', e, 'Datos originales:', gifStickers);
    }
  }
  
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
  const isSmallMobile = window.innerWidth <= 480;
  
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex; ${isMobile ? 'flex-direction: column;' : ''}
    max-width: ${isMobile ? '100%' : '90vw'}; max-height: ${isMobile ? '100%' : '90vh'};
    background: var(--bg-light); border-radius: ${isMobile ? '0' : '15px'}; overflow: hidden;
    border: 2px solid var(--primary); width: 100%; height: ${isMobile ? '100vh' : 'auto'};
    ${isMobile ? 'margin: 0;' : ''}
  `;
  
  const imageSection = document.createElement('div');
  imageSection.style.cssText = `
    ${isMobile ? 'flex: 0 0 35vh;' : 'flex: 1;'}
    padding: ${isMobile ? '10px' : '20px'}; text-align: center;
    display: flex; flex-direction: column; justify-content: center;
    background: white; position: relative;
    ${isMobile ? 'min-height: 0; overflow: hidden;' : ''}
  `;
  
  const commentsSection = document.createElement('div');
  commentsSection.style.cssText = `
    ${isMobile ? 'flex: 1; min-height: 0;' : 'width: 400px; min-width: 400px;'}
    padding: ${isMobile ? '10px' : '20px'};
    ${isMobile ? 'border-top: 2px solid var(--primary);' : 'border-left: 2px solid var(--primary);'}
    overflow-y: auto; background: var(--bg-dark);
    display: flex; flex-direction: column;
    -webkit-overflow-scrolling: touch;
  `;
  
  const hasGifStickers = parsedGifStickers && parsedGifStickers.length > 0;
  const hasBackgroundGif = backgroundGif && backgroundGif !== '';
  
  const animatedBadge = isAnimated ? `
    <div style="position: absolute; top: 15px; right: 15px; background: rgba(255, 107, 53, 0.9); color: white; padding: 8px 12px; border-radius: 20px; font-size: 0.9em; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
      🎬 ${hasGifStickers ? 'GIF + Stickers' : 'GIF Animado'}
    </div>
  ` : '';
  
  // Crear contenido de imagen optimizado para móvil
  let imageContent = '';
  const maxImageHeight = isMobile ? (isSmallMobile ? '20vh' : '25vh') : '70vh';
  
  if (hasBackgroundGif || hasGifStickers) {
    const containerStyle = `position: relative; max-width: 100%; max-height: ${maxImageHeight}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); background: white; display: inline-block; ${isMobile ? 'width: 100%;' : 'aspect-ratio: 3/2;'}`;
    
    imageContent = `
      <div style="${containerStyle}">
        ${hasBackgroundGif ? `<img src="${backgroundGif}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 1; image-rendering: auto;" loading="lazy">` : ''}
        <img src="${imageData}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; z-index: 2; ${hasBackgroundGif ? 'mix-blend-mode: multiply; opacity: 0.9;' : ''}" loading="lazy">
        ${hasGifStickers ? parsedGifStickers.map(sticker => `<img src="${sticker.src}" style="position: absolute; left: ${(sticker.x / 600) * 100}%; top: ${(sticker.y / 400) * 100}%; width: ${(sticker.width / 600) * 100}%; height: ${(sticker.height / 400) * 100}%; z-index: 3; image-rendering: auto; pointer-events: none;" loading="lazy">`).join('') : ''}
      </div>
    `;
  } else {
    imageContent = `<img src="${imageData}" style="max-width: 100%; max-height: ${maxImageHeight}; border-radius: 12px; object-fit: contain; box-shadow: 0 4px 20px rgba(0,0,0,0.3); background: white; image-rendering: auto; -webkit-image-rendering: auto; ${isMobile ? 'width: 100%;' : ''}" loading="lazy">`;
  }
  
  imageSection.innerHTML = `
    ${animatedBadge}
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; ${isMobile ? 'min-height: 0;' : ''}">
      ${imageContent}
    </div>
    <div style="margin-top: ${isMobile ? '5px' : '20px'}; display: flex; gap: ${isMobile ? '5px' : '12px'}; justify-content: center; flex-wrap: wrap;">
      <button onclick="this.closest('.image-modal').remove()" class="btn btn-secondary btn-sm" style="${isMobile ? 'min-height: 36px; font-size: 14px; padding: 0.4rem 0.8rem;' : ''}">
        ${isMobile ? '✖️' : '✖️ Cerrar'}
      </button>
      <button onclick="downloadImage('${imageData.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', 'dibujo')" class="btn btn-primary btn-sm" style="${isMobile ? 'min-height: 36px; font-size: 14px; padding: 0.4rem 0.8rem;' : ''}">
        ${isMobile ? '💾' : '💾 Descargar'}
      </button>
    </div>
  `;
  
  // Obtener avatar actualizado del perfil
  let modalAvatar = '👤';
  let modalAvatarType = 'emoji';
  
  // Intentar obtener datos actualizados del perfil
  if (window.guestbookApp && window.guestbookApp.profiles) {
    const profiles = window.guestbookApp.profiles;
    const userProfile = profiles.users.get(drawingData?.autor?.toLowerCase());
    if (userProfile) {
      modalAvatar = userProfile.avatar || '👤';
      modalAvatarType = userProfile.avatarType || 'emoji';
      if (modalAvatarType === 'image' && userProfile.avatarImage) {
        drawingData.profilePicture = userProfile.avatarImage;
      }
    }
  }
  
  // Crear sección de perfil del usuario (compacta y clickeable)
  const userProfileHTML = drawingData ? `
    <div style="border-bottom: 1px solid var(--primary); padding-bottom: ${isMobile ? '8px' : '10px'}; margin-bottom: ${isMobile ? '10px' : '15px'};">
      <div onclick="showUserProfile('${drawingData.autor}', '${drawingData.profilePicture || ''}', '${drawingData.timestamp}', ${drawingData.likes || 0}, ${drawingData.comments?.length || 0}, '${drawingData.categoria}')" style="display: flex; align-items: center; gap: ${isMobile ? '8px' : '10px'}; margin-bottom: ${isMobile ? '5px' : '8px'}; cursor: pointer; padding: ${isMobile ? '3px' : '5px'}; border-radius: 6px; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
        <div style="width: ${isMobile ? '32px' : '40px'}; height: ${isMobile ? '32px' : '40px'}; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: ${isMobile ? '0.8em' : '1em'}; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden;">
          ${modalAvatarType === 'image' && drawingData.profilePicture ? `<img src="${drawingData.profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : `<span>${modalAvatar}</span>`}
        </div>
        <div style="flex: 1; min-width: 0;">
          <h6 style="color: var(--primary); margin: 0; font-weight: 600; font-size: ${isMobile ? '0.85em' : '0.95em'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${drawingData.autor || 'Anónimo'} ${isMobile ? '' : '<span style="font-size: 0.7em; opacity: 0.7;">ℹ️</span>'}</h6>
          <small style="color: var(--text-secondary); font-size: ${isMobile ? '0.7em' : '0.75em'};">${new Date(drawingData.timestamp).toLocaleDateString('es-ES')}</small>
        </div>
        <div style="display: flex; gap: ${isMobile ? '6px' : '8px'}; font-size: ${isMobile ? '0.7em' : '0.75em'}; color: var(--text-secondary);">
          <span>❤️ ${drawingData.likes || 0}</span>
          <span>💬 ${drawingData.comments?.length || 0}</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: ${isMobile ? '8px' : '15px'};">
      <h6 style="color: var(--primary); margin: 0; font-weight: 600; font-size: ${isMobile ? '0.8em' : '0.9em'};">💬 Comentarios</h6>
    </div>
  ` : `
    <div style="border-bottom: 1px solid var(--primary); padding-bottom: ${isMobile ? '8px' : '10px'}; margin-bottom: ${isMobile ? '10px' : '15px'}; text-align: center;">
      <h6 style="color: var(--primary); margin: 0; font-weight: 600; font-size: ${isMobile ? '0.8em' : '0.9em'};">💬 Comentarios</h6>
    </div>
  `;
  
  if (isMobile) {
    // Layout horizontal para móviles: comentarios izquierda, formulario derecha
    commentsSection.innerHTML = `
      ${userProfileHTML}
      <div style="display: flex; gap: 10px; flex: 1; min-height: 0;">
        <div style="flex: 1; display: flex; flex-direction: column;">
          <div style="text-align: center; margin-bottom: 8px;">
            <small style="color: var(--primary); font-weight: 600; font-size: 0.75em;">💬 Comentarios</small>
          </div>
          <div id="commentsContainer" class="comments-container" style="flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--primary) transparent; min-height: 0;">
            <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
              <div class="spinner-border" style="color: var(--primary); width: 1.5rem; height: 1.5rem;" role="status"></div>
              <p class="mt-2 mb-0" style="font-size: 0.9em;">Cargando comentarios...</p>
            </div>
          </div>
        </div>
        <div style="width: 45%; display: flex; flex-direction: column; border-left: 2px solid var(--primary); padding-left: 10px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <small style="color: var(--primary); font-weight: 600; font-size: 0.75em;">✍️ Comentar</small>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <input type="text" id="commentAuthor" placeholder="Tu nombre" class="form-control" style="background: var(--bg-light); border: 2px solid var(--primary); color: var(--text-primary); font-size: 14px; min-height: 36px; padding: 0.5rem;" maxlength="50">
            <textarea id="newComment" placeholder="Escribe un comentario..." class="form-control" rows="3" style="background: var(--bg-light); border: 2px solid var(--primary); color: var(--text-primary); resize: none; font-size: 14px; flex: 1; padding: 0.5rem;" maxlength="500"></textarea>
            <small style="color: var(--text-secondary); font-size: 0.7em; text-align: center;">Máx 500 chars</small>
            <button onclick="addComment('${drawingId}')" class="btn btn-primary" style="padding: 0.5rem; font-weight: 600; border-radius: 6px; min-height: 36px; font-size: 14px; margin-top: auto;">💭 Enviar</button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Layout vertical para desktop
    commentsSection.innerHTML = `
      ${userProfileHTML}
      <div id="commentsContainer" class="comments-container" style="flex: 1; overflow-y: auto; margin-bottom: 20px; scrollbar-width: thin; scrollbar-color: var(--primary) transparent; min-height: 0;">
        <div style="text-align: center; color: var(--text-secondary); padding: 40px;">
          <div class="spinner-border" style="color: var(--primary);" role="status"></div>
          <p class="mt-3 mb-0" style="font-size: 1em;">Cargando comentarios...</p>
        </div>
      </div>
      <div style="border-top: 2px solid var(--primary); padding-top: 20px; margin-top: auto; flex-shrink: 0;">
        <div class="mb-2">
          <input type="text" id="commentAuthor" placeholder="Tu nombre (opcional)" class="form-control mb-2" style="background: var(--bg-light); border: 2px solid var(--primary); color: var(--text-primary); font-size: 16px; padding: 0.5rem;" maxlength="50">
          <textarea id="newComment" placeholder="Escribe un comentario..." class="form-control" rows="3" style="background: var(--bg-light); border: 2px solid var(--primary); color: var(--text-primary); resize: none; font-size: 16px; padding: 0.5rem;" maxlength="500"></textarea>
          <small style="color: var(--text-secondary); font-size: 0.8em;">Máximo 500 caracteres</small>
        </div>
        <button onclick="addComment('${drawingId}')" class="btn btn-primary w-100" style="padding: 12px; font-weight: 600; border-radius: 8px; font-size: 14px;">💭 Comentar</button>
      </div>
    `;
  }
  
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
window.showUserProfile = async function(author, profilePicture, timestamp, likes, comments, category) {
  const existingProfileModal = document.querySelector('.profile-modal');
  if (existingProfileModal) existingProfileModal.remove();
  
  // Cargar datos actualizados del perfil desde Firebase
  let userProfile = null;
  let joinDate = timestamp;
  let avatar = null;
  let avatarType = 'emoji';
  
  try {
    if (window.guestbookApp && window.guestbookApp.firebase) {
      userProfile = await window.guestbookApp.firebase.getUserProfile(author);
      if (userProfile) {
        joinDate = userProfile.joinDate || timestamp;
        avatar = userProfile.avatarImage || userProfile.avatar;
        avatarType = userProfile.avatarType || 'emoji';
        profilePicture = userProfile.avatarImage || profilePicture;
      }
    }
  } catch (error) {
    console.warn('Error cargando perfil desde Firebase:', error);
  }
  
  // Formatear fecha correctamente
  const formatJoinDate = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'hace poco';
    }
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'hace poco';
      }
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    } catch (error) {
      return 'hace poco';
    }
  };
  
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
  
  // Generar avatar actualizado
  const avatarHTML = (avatarType === 'image' && profilePicture) ? 
    `<img src="${profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
    `<span style="font-size: 2em;">${avatar || '👤'}</span>`;
  
  profileCard.innerHTML = `
    <button onclick="this.closest('.profile-modal').remove()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer;">&times;</button>
    
    <div style="margin-bottom: 20px;">
      <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 2em; color: white; font-weight: bold; margin: 0 auto 15px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        ${avatarHTML}
      </div>
      <h4 style="color: var(--primary); margin: 0 0 5px; font-weight: 600;">${author}</h4>
      <small style="color: var(--text-secondary);">Miembro desde ${formatJoinDate(joinDate)}</small>
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
    
    // Usar solo el sistema antiguo de comentarios
    const drawing = await window.guestbookApp.firebase.getDrawing(drawingId);
    
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    // Solo comentarios del documento del dibujo
    const allComments = drawing?.data?.comments || [];
    
    console.log('Comentarios encontrados:', allComments.length);
    
    if (allComments.length === 0) {
      const isMobile = window.innerWidth <= 768;
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: ${isMobile ? '15px 5px' : '40px'};">
          <i class="fas fa-comments" style="font-size: ${isMobile ? '1.2em' : '2em'}; margin-bottom: ${isMobile ? '8px' : '15px'}; opacity: 0.5;"></i>
          <p style="font-size: ${isMobile ? '0.8em' : '1em'}; margin: ${isMobile ? '0 0 5px 0' : '0 0 10px 0'};">No hay comentarios</p>
          <p style="font-size: ${isMobile ? '0.7em' : '0.9em'}; margin: 0;">¡Sé el primero!</p>
        </div>
      `;
      return;
    }
    
    // Ordenar comentarios por timestamp
    const sortedComments = allComments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const isMobile = window.innerWidth <= 768;
    container.innerHTML = sortedComments.map(comment => {
      const author = comment.autor || comment.author || 'Anónimo';
      const text = comment.texto || comment.text || '';
      const timestamp = comment.timestamp || Date.now();
      const profilePicture = comment.profilePicture;
      const profileAvatar = comment.profileAvatar;
      const isLoggedUser = comment.isLoggedUser || false;
      
      return `
        <div class="comment-item" style="background: var(--bg-light); border-radius: ${isMobile ? '6px' : '8px'}; padding: ${isMobile ? '8px' : '10px'}; margin-bottom: ${isMobile ? '8px' : '10px'}; border-left: 3px solid ${isLoggedUser ? '#28a745' : 'var(--primary)'}; transition: all 0.2s ease;">
          <div style="display: flex; align-items: flex-start; gap: ${isMobile ? '6px' : '8px'};">
            <div style="width: ${isMobile ? '28px' : '32px'}; height: ${isMobile ? '28px' : '32px'}; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: ${isMobile ? '0.6em' : '0.7em'}; color: white; font-weight: bold; flex-shrink: 0; position: relative; overflow: hidden; ${isLoggedUser ? 'border: 2px solid #28a745;' : ''}">
              ${profilePicture ? `<img src="${profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : `<span>${profileAvatar || '👤'}</span>`}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${isMobile ? '3px' : '4px'};">
                <div style="display: flex; align-items: center; gap: 3px;">
                  <strong style="color: var(--primary); font-size: ${isMobile ? '0.8em' : '0.85em'};">${author}</strong>
                  ${isLoggedUser ? '<span style="color: #28a745; font-size: 0.65em;" title="Usuario registrado">✓</span>' : ''}
                </div>
                <small style="color: var(--text-secondary); font-size: ${isMobile ? '0.7em' : '0.75em'};">${formatCommentDate(timestamp)}</small>
              </div>
              <p style="color: var(--text-primary); margin: 0; line-height: ${isMobile ? '1.2' : '1.3'}; word-wrap: break-word; font-size: ${isMobile ? '0.8em' : '0.85em'};">${text}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Error loading comments:', error);
    const container = document.getElementById('commentsContainer');
    if (container) {
      const isMobile = window.innerWidth <= 768;
      container.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: ${isMobile ? '15px' : '20px'}; font-size: ${isMobile ? '0.9em' : '1em'};">Error cargando comentarios</p>`;
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
  
  // Usar datos del perfil si está logueado
  let author = authorInput?.value.trim() || 'Anónimo';
  let profilePicture = null;
  let profileAvatar = null;
  
  if (window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()) {
    const profile = window.guestbookApp.profiles.currentProfile;
    author = profile.username || author;
    if (profile.avatarType === 'image' && profile.avatarImage) {
      profilePicture = profile.avatarImage;
    } else if (profile.avatarType === 'emoji' && profile.avatar) {
      profileAvatar = profile.avatar;
    }
  } else {
    // Fallback al sistema anterior
    profilePicture = localStorage.getItem('user-profile-picture');
  }
  
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
  
  // Prevención de comentarios duplicados
  try {
    const drawing = await window.guestbookApp.firebase.getDrawing(drawingId);
    const existingComments = drawing?.data?.comments || [];
    
    // Verificar duplicado exacto en los últimos 5 minutos
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const isDuplicate = existingComments.some(existingComment => 
      existingComment.texto === comment && 
      existingComment.autor === author &&
      existingComment.timestamp > fiveMinutesAgo
    );
    
    if (isDuplicate) {
      alert('Ya enviaste este comentario recientemente. Espera un poco antes de comentar lo mismo.');
      return;
    }
  } catch (error) {
    console.warn('Error verificando duplicados:', error);
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
      profilePicture: profilePicture,
      profileAvatar: profileAvatar,
      isLoggedUser: window.guestbookApp && window.guestbookApp.profiles && window.guestbookApp.profiles.isLoggedIn()
    };
    
    console.log('Enviando comentario:', commentData);
    
    // Solo usar el sistema antiguo (dentro del documento del dibujo)
    const drawing = await window.guestbookApp.firebase.getDrawing(drawingId);
    if (drawing) {
      const currentComments = drawing.data.comments || [];
      
      // Verificación final antes de guardar
      const finalCheck = currentComments.some(c => 
        c.texto === commentData.texto && 
        c.autor === commentData.autor &&
        Math.abs(c.timestamp - commentData.timestamp) < 10000
      );
      
      if (finalCheck) {
        throw new Error('Comentario duplicado detectado');
      }
      
      await window.guestbookApp.firebase.updateDrawing(drawingId, {
        comments: [...currentComments, commentData]
      });
      console.log('Comentario guardado en documento del dibujo');
    }
    
    // Limpiar campos
    if (authorInput) authorInput.value = '';
    if (textarea) textarea.value = '';
    
    // Actualizar datos locales inmediatamente
    if (window.galleryManager) {
      const drawingIndex = window.galleryManager.allDrawings.findIndex(d => d.id === drawingId);
      if (drawingIndex !== -1) {
        if (!window.galleryManager.allDrawings[drawingIndex].data.comments) {
          window.galleryManager.allDrawings[drawingIndex].data.comments = [];
        }
        window.galleryManager.allDrawings[drawingIndex].data.comments.push(commentData);
        
        // Actualizar contador en la galería - buscar por data-id
        const galleryCard = document.querySelector(`[data-id="${drawingId}"]`);
        if (galleryCard) {
          const commentBtn = galleryCard.querySelector('button[onclick*="viewImage"]');
          if (commentBtn && commentBtn.innerHTML.includes('💬')) {
            const currentCount = parseInt(commentBtn.textContent.match(/\d+/)?.[0] || '0');
            commentBtn.innerHTML = `💬 ${currentCount + 1}`;
          }
        }
        
        // Actualizar contador en el modal si está abierto
        const modalCommentCount = document.querySelector('#imageModal .comment-count');
        if (modalCommentCount) {
          const currentCount = parseInt(modalCommentCount.textContent.match(/\d+/)?.[0] || '0');
          modalCommentCount.textContent = `💬 ${currentCount + 1} comentarios`;
        }
        
        // Actualizar rankings
        setTimeout(() => window.galleryManager.updateRankingsSection(), 500);
      }
    }
    
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

// Función de debug para verificar datos de stickers
window.debugGifStickers = function(drawingId) {
  if (!window.galleryManager) {
    console.log('Gallery manager no disponible');
    return;
  }
  
  const drawing = window.galleryManager.allDrawings.find(d => d.id === drawingId);
  if (!drawing) {
    console.log('Dibujo no encontrado:', drawingId);
    return;
  }
  
  console.log('Datos del dibujo:', drawing.data);
  console.log('GIF Stickers:', drawing.data.gifStickers);
  console.log('Background GIF:', drawing.data.backgroundGif);
  console.log('Is Animated:', drawing.data.isAnimated);
};

// Función para testear la visualización de stickers
window.testGifStickers = function() {
  const testData = {
    imagenData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    backgroundGif: null,
    gifStickers: [
      {
        src: 'data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wjRLEuQRNnGeFl+2iSJZmUq2fqTFqAAlhMa/ruJqUUn9ZGo/XQHAkp2ynqQAAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wjRLEuQRNnGeFl+2iSJZmUq2fqTFqAAlhMa/ruJqUUn9ZGo/XQHAkp2ynqQAAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpFI5TAAAOw==',
        x: 100,
        y: 100,
        width: 50,
        height: 50
      }
    ]
  };
  
  viewImage(testData.imagenData, 'test-id', true, '', JSON.stringify(testData.gifStickers));
};

// Agregar estilos para animaciones
if (!document.getElementById('gallery-animations')) {
  const style = document.createElement('style');
  style.id = 'gallery-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.8); }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    .comment-item:hover {
      background: var(--bg-dark) !important;
      transform: translateX(5px);
    }
    
    .comments-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .comments-container::-webkit-scrollbar-track {
      background: var(--bg-light);
      border-radius: 3px;
    }
    
    .comments-container::-webkit-scrollbar-thumb {
      background: var(--primary);
      border-radius: 3px;
    }
    
    .comments-container::-webkit-scrollbar-thumb:hover {
      background: var(--secondary);
    }
  `;
  document.head.appendChild(style);
}