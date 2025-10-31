// Fix para la navegación entre vistas
document.addEventListener('DOMContentLoaded', () => {
  // Event listeners para navegación
  const creditsBtn = document.getElementById('credits-btn');
  const updatesBtn = document.getElementById('updates-btn');
  const navbarBrand = document.querySelector('.navbar-brand');
  
  if (creditsBtn) {
    creditsBtn.addEventListener('click', showCredits);
  }
  
  if (updatesBtn) {
    updatesBtn.addEventListener('click', showUpdates);
  }
  
  if (navbarBrand) {
    navbarBrand.addEventListener('click', (e) => {
      e.preventDefault();
      showMainContent();
    });
  }
});