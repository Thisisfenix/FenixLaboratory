// Sistema de login de Admin/Mod usando perfiles con tags

window.loginAdmin = async function() {
  const password = document.getElementById('adminPassword').value.trim();
  
  if (!password) {
    alert('Por favor ingresa tu contraseña');
    return;
  }
  
  try {
    if (!window.guestbookApp || !window.guestbookApp.profiles) {
      alert('❌ Sistema de perfiles no disponible');
      return;
    }
    
    // Verificar si hay un perfil logueado
    if (!window.guestbookApp.profiles.isLoggedIn()) {
      alert('❌ Debes iniciar sesión con tu perfil primero\n\n1. Haz clic en el botón de perfil (👤)\n2. Inicia sesión con tu usuario y contraseña\n3. Luego vuelve a intentar acceder al panel de admin');
      return;
    }
    
    const currentProfile = window.guestbookApp.profiles.currentProfile;
    
    // Obtener usuario de la base de datos
    const user = window.guestbookApp.profiles.users.get(currentProfile.username.toLowerCase());
    if (!user) {
      alert('❌ Error: Usuario no encontrado en la base de datos');
      return;
    }
    
    // Verificar contraseña del perfil (hasheada)
    const passwordHash = await window.guestbookApp.profiles.hashPassword(password);
    const legacyHash = window.guestbookApp.profiles.legacyHashPassword(password);
    
    if (user.passwordHash !== passwordHash && user.passwordHash !== legacyHash) {
      alert('❌ Contraseña incorrecta');
      return;
    }
    
    // Verificar tags OWNER o ADMIN
    const userTags = currentProfile.userTags || [];
    const isOwner = userTags.includes('OWNER');
    const isAdmin = userTags.includes('ADMIN');
    
    if (!isOwner && !isAdmin) {
      alert('❌ Este usuario no tiene permisos de administrador\n\nContacta al owner para obtener permisos.');
      return;
    }
    
    // Login exitoso
    window.currentUser = {
      name: currentProfile.username,
      username: currentProfile.username,
      role: isOwner ? 'owner' : 'admin',
      permissions: ['all']
    };
    
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    
    const roleText = isOwner ? '👑 OWNER' : '🔐 ADMIN';
    document.getElementById('adminToggle').innerHTML = `${roleText} ${currentProfile.username}`;
    document.getElementById('adminToggle').classList.remove('btn-outline-danger');
    document.getElementById('adminToggle').classList.add('btn-success');
    
    document.getElementById('userInfo').textContent = `${roleText}: ${currentProfile.username}`;
    
    // Cargar datos del panel
    if (window.guestbookApp) {
      window.guestbookApp.loadAdminSuggestions();
      window.guestbookApp.loadAdminDrawings();
      window.guestbookApp.loadAdminReports();
    }
    
    // Cargar usuarios con tags si es OWNER
    if (isOwner && window.loadTaggedUsers) {
      window.loadTaggedUsers();
    }
    
    window.updateUIForUser();
    
    alert(`✅ Bienvenido ${roleText} ${currentProfile.username}`);
    
  } catch (error) {
    console.error('Error login admin:', error);
    alert('❌ Error iniciando sesión');
  }
};

window.logoutAdmin = function() {
  window.currentUser = null;
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminContent').style.display = 'none';
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminToggle').innerHTML = '🔐 Admin';
  document.getElementById('adminToggle').classList.remove('btn-success');
  document.getElementById('adminToggle').classList.add('btn-outline-danger');
  
  if (window.guestbookApp && window.guestbookApp.ui) {
    window.guestbookApp.ui.showNotification('🚪 Sesión cerrada', 'info');
  }
};
