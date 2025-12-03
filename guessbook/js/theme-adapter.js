// Adaptador de temas para Guestbook
function loadGuestbookTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setGuestbookTheme(savedTheme);
}

function setGuestbookTheme(theme) {
  const body = document.body;
  const themes = ['light-theme', 'neon-theme', 'cyberpunk-theme', 'matrix-theme', 'synthwave-theme', 'ocean-theme', 'forest-theme', 'sunset-theme', 'christmas-theme', 'halloween-theme', 'valentine-theme', 'easter-theme', 'summer-theme', 'autumn-theme', 'funkyatlas-theme', 'funkyatlas-christmas-theme', 'galaxy-theme', 'gold-theme', 'rainbow-theme', 'diamond-theme', 'custom-theme', 'vaporwave-theme', 'hacker-theme', 'neon-city-theme', 'space-theme', 'fire-theme', 'ice-theme', 'toxic-theme', 'royal-theme', 'steampunk-theme', 'hologram-theme', 'legendary-theme'];
  
  themes.forEach(t => body.classList.remove(t));
  
  if (theme !== 'dark') {
    body.classList.add(theme + '-theme');
  }
  
  // Crear copos de nieve para temas navideños
  if (theme === 'christmas' || theme === 'funkyatlas-christmas') {
    createSnowflakes();
  } else {
    removeSnowflakes();
  }
  
  localStorage.setItem('theme', theme);
}

function createSnowflakes() {
  // Eliminar copos existentes primero
  removeSnowflakes();
  
  const snowflakeCount = 50;
  const snowflakes = ['❄', '❅', '❆'];
  
  for (let i = 0; i < snowflakeCount; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
    snowflake.style.left = Math.random() * 100 + '%';
    snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
    snowflake.style.animationDelay = Math.random() * 5 + 's';
    snowflake.style.fontSize = (Math.random() * 1 + 0.5) + 'em';
    snowflake.style.opacity = Math.random() * 0.6 + 0.4;
    document.body.appendChild(snowflake);
  }
}

function removeSnowflakes() {
  document.querySelectorAll('.snowflake').forEach(snowflake => snowflake.remove());
}

// Sincronizar con cambios del index
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    const newTheme = e.newValue || 'dark';
    setGuestbookTheme(newTheme);
  }
});

// Cargar tema al iniciar
document.addEventListener('DOMContentLoaded', loadGuestbookTheme);
