// repos.js - Sistema de gestión de repositorios de GitHub
// Extraído de index.html para mejor organización

const user = 'thisisfenix';
let allRepos = [];
let filteredRepos = [];
let currentPage = 1;
const reposPerPage = 4;

// Cache para repos
const CACHE_KEY = 'fenix-repos-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function loadImage(imgElement, localSrc, remoteSrc, placeholderSrc) {
  imgElement.src = localSrc;
  imgElement.onerror = () => {
    imgElement.onerror = () => imgElement.src = placeholderSrc;
    imgElement.src = remoteSrc;
  };
}

function displayRepos(repos, page = 1) {
  const container = document.getElementById('repos-container');
  container.innerHTML = '';

  // Project Ankaro card
  if (page === 1) {
    const ankaroCard = document.createElement('div');
    ankaroCard.className = 'card';
    ankaroCard.style.border = '2px solid var(--primary)';
    ankaroCard.innerHTML = `
      <div class="card-img-top" style="background: linear-gradient(135deg, #1a1a2e, #16213e); height: 180px; display: flex; align-items: center; justify-content: center; font-size: 4rem;">🎮</div>
      <div class="card-body">
        <h3 class="card-title">Project Ankaro</h3>
        <p class="card-text">Juego multijugador 3D de horror con voz en tiempo real, mecánicas de supervivencia y soporte para móvil/gamepad.</p>
        <div class="btn-group">
          <a href="Projectankaro/index.html" class="btn btn-outline-neon"><i class="bi bi-joystick me-1"></i> Jugar</a>
        </div>
      </div>
    `;
    container.appendChild(ankaroCard);
  }

  const startIndex = (page - 1) * reposPerPage;
  const endIndex = startIndex + reposPerPage;
  const paginatedRepos = repos.slice(startIndex, endIndex);

  paginatedRepos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('data-language', repo.language ? repo.language.toLowerCase() : 'other');

    const img = document.createElement('img');
    img.className = 'card-img-top';
    img.alt = `Vista previa de ${repo.name}`;

    const localImagePath = `img/localPreviews/${repo.name}.png`;
    const remoteImagePath = `https://raw.githubusercontent.com/${user}/${repo.name}/main/preview.png`;
    const placeholderImage = 'placeholder/GHbDEIgXMAACVEi.jpg';

    loadImage(img, localImagePath, remoteImagePath, placeholderImage);

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = repo.name.replace(/-/g, ' ');

    const timeline = document.createElement('div');
    timeline.className = 'card-timeline';
    const commitDate = new Date(repo.updated_at);
    const daysSince = Math.floor((new Date() - commitDate) / (1000 * 60 * 60 * 24));
    timeline.innerHTML = `
      <div class="commit-dot"></div>
      <span>Actualizado hace ${daysSince} días</span>
    `;

    const desc = document.createElement('p');
    desc.className = 'card-text';
    desc.textContent = repo.description || 'Sin descripción';

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';

    const btnCode = document.createElement('a');
    btnCode.className = 'btn btn-outline-neon';
    btnCode.href = repo.html_url;
    btnCode.target = '_blank';
    btnCode.innerHTML = '<i class="bi bi-code me-1"></i> Código';

    const btnDemo = document.createElement('a');
    btnDemo.className = 'btn btn-outline-neon';
    btnDemo.href = `https://${user}.github.io/${repo.name}`;
    btnDemo.target = '_blank';
    btnDemo.innerHTML = '<i class="bi bi-box-arrow-up-right me-1"></i> Demo';

    btnGroup.appendChild(btnCode);
    btnGroup.appendChild(btnDemo);

    body.appendChild(title);
    body.appendChild(timeline);
    body.appendChild(desc);
    body.appendChild(btnGroup);

    card.appendChild(img);
    card.appendChild(body);
    container.appendChild(card);
    
    // Tracking para logros
    card.addEventListener('click', () => {
      if (typeof gameData !== 'undefined') {
        gameData.projectsViewed.add(repo.name);
        if (typeof updateWeeklyChallenge === 'function') updateWeeklyChallenge('project-master');
        if (typeof updateBadgeProgress === 'function') {
          updateBadgeProgress('explorer', 1);
          updateBadgeProgress('developer', 1);
        }
        if (gameData.projectsViewed.size >= 5 && typeof checkAchievement === 'function') {
          checkAchievement('project-hunter');
        }
        if (typeof saveGameData === 'function') saveGameData();
      }
    });
    
    btnCode.addEventListener('click', () => {
      if (typeof trackCodeView === 'function') trackCodeView(repo.name);
    });
    btnDemo.addEventListener('click', () => {
      if (typeof trackDemo === 'function') trackDemo(repo.name);
    });
  });

  // Añadir card de "Próximamente" al final
  const comingSoonCard = document.createElement('div');
  comingSoonCard.className = 'card';
  comingSoonCard.style.cssText = 'border: 2px dashed var(--primary); opacity: 0.7;';
  
  const comingSoonImg = document.createElement('div');
  comingSoonImg.className = 'card-img-top';
  comingSoonImg.style.cssText = `
    background-image: url('placeholder/GzyBNcWWsAEcgbH.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  `;
  
  const comingSoonBody = document.createElement('div');
  comingSoonBody.className = 'card-body';
  comingSoonBody.innerHTML = `
    <h5 class="card-title" style="text-align: center;">Próximamente</h5>
    <p class="card-text" style="text-align: center;">Algo relacionado con awshuck está en camino... 👀<br><small style="opacity: 0.7;">Más detalles en updates.json</small></p>
    <div class="d-flex justify-content-center align-items-center mb-3">
      <small style="color: var(--text-secondary);">
        <i class="fas fa-clock me-1"></i>En desarrollo
      </small>
    </div>
    <div class="btn-group">
      <button class="btn btn-outline-neon" disabled>
        <i class="fas fa-hourglass-half me-1"></i>Esperando
      </button>
    </div>
  `;
  
  comingSoonCard.appendChild(comingSoonImg);
  comingSoonCard.appendChild(comingSoonBody);
  container.appendChild(comingSoonCard);

  updatePagination(repos.length, page);
}

function updatePagination(totalRepos, currentPage) {
  const pagination = document.getElementById('pagination');
  const totalPages = Math.ceil(totalRepos / reposPerPage);

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  if (currentPage > 1) {
    paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})">Anterior</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === currentPage ? 'active' : '';
    paginationHTML += `<button class="page-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
  }

  if (currentPage < totalPages) {
    paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Siguiente</button>`;
  }

  pagination.innerHTML = paginationHTML;
}

function changePage(page) {
  currentPage = page;
  displayRepos(filteredRepos, page);
}

function filterRepos(language) {
  if (language === 'all') {
    filteredRepos = allRepos;
  } else {
    filteredRepos = allRepos.filter(repo =>
      repo.language && repo.language.toLowerCase() === language
    );
  }
  currentPage = 1;
  displayRepos(filteredRepos, 1);
}

function searchRepos(query) {
  if (!query) {
    filteredRepos = allRepos;
  } else {
    filteredRepos = allRepos.filter(repo =>
      repo.name.toLowerCase().includes(query.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(query.toLowerCase()))
    );
  }
  currentPage = 1;
  displayRepos(filteredRepos, 1);
}

function sortRepos(sortBy) {
  filteredRepos.sort((a, b) => {
    switch (sortBy) {
      case 'stars':
        return b.stargazers_count - a.stargazers_count;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'updated':
      default:
        return new Date(b.updated_at) - new Date(a.updated_at);
    }
  });
  currentPage = 1;
  displayRepos(filteredRepos, 1);
}

async function fetchRepos() {
  try {
    // Verificar cache primero
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        allRepos = data;
        filteredRepos = data;
        displayRepos(data);
        return;
      }
    }
    
    const response = await fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=100`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);

    const repos = await response.json();
    
    // Guardar en cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: repos,
      timestamp: Date.now()
    }));
    
    allRepos = repos;
    filteredRepos = repos;
    displayRepos(repos);

  } catch (error) {
    console.error('Error al cargar repositorios:', error);
    const container = document.getElementById('repos-container');
    container.innerHTML = '<p class="text-center">Error al cargar los proyectos. Intente más tarde.</p>';
  }
}
