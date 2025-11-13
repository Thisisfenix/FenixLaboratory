// Firebase y base de datos
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, getDoc, deleteDoc, where, getDocs, setDoc, limit, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class FirebaseManager {
  constructor() {
    this.autoModeration = window.autoModeration;
    this.firebaseConfig = {
      apiKey: "AIzaSyCZk8rs_Vq9ZGgOEiP3_P6zUvZoM1QQOAM",
      authDomain: "fenix-guestbook.firebaseapp.com",
      projectId: "fenix-guestbook",
      storageBucket: "fenix-guestbook.firebasestorage.app",
      messagingSenderId: "90606615201",
      appId: "1:90606615201:web:7126a42ca59b57bdc58ee0"
    };
    
    this.app = initializeApp(this.firebaseConfig);
    this.db = getFirestore(this.app);
    this.testConnection();
  }
  
  async testConnection() {
    try {
      const testQuery = query(collection(this.db, 'dibujos'), orderBy('timestamp', 'desc'));
      console.log('✅ Conexión a Firebase exitosa');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a Firebase:', error);
      return false;
    }
  }
  
  async saveDrawing(drawingData) {
    try {
      await addDoc(collection(this.db, 'dibujos'), drawingData);
      return true;
    } catch (error) {
      console.error('Error guardando dibujo:', error);
      throw error;
    }
  }
  
  async getUserRole(username) {
    try {
      // Solo verificar moderadores si estamos autenticados
      if (window.currentUser && window.currentUser.role) {
        const q = query(collection(this.db, 'moderators'), where('username', '==', username), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          return 'moderator';
        }
      }
      
      return null;
    } catch (error) {
      // Silenciar error de permisos para usuarios normales
      return null;
    }
  }
  
  async updateDrawing(id, data) {
    try {
      await updateDoc(doc(this.db, 'dibujos', id), data);
      return true;
    } catch (error) {
      console.error('Error actualizando dibujo:', error);
      throw error;
    }
  }
  
  async deleteDrawing(id, moderator = null, reason = '') {
    try {
      await deleteDoc(doc(this.db, 'dibujos', id));
      
      if (moderator && typeof moderator === 'string') {
        await this.logModeratorAction('delete_drawing', moderator, id, { reason });
      }
      
      return true;
    } catch (error) {
      console.error('Error eliminando dibujo:', error);
      throw error;
    }
  }
  
  onDrawingsChange(callback) {
    const q = query(collection(this.db, 'dibujos'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, callback);
  }
  
  async getDrawing(id) {
    try {
      console.log('Obteniendo dibujo con ID:', id);
      const docSnap = await getDoc(doc(this.db, 'dibujos', id));
      if (docSnap.exists()) {
        const drawing = { id: docSnap.id, data: docSnap.data() };
        console.log('Dibujo encontrado, comentarios en documento:', drawing.data.comments?.length || 0);
        return drawing;
      }
      console.log('Dibujo no encontrado');
      return null;
    } catch (error) {
      console.error('Error obteniendo dibujo:', error);
      throw error;
    }
  }
  
  async addComment(drawingId, comment) {
    try {
      // Auto-moderación antes de agregar
      if (comment.texto && this.autoModeration) {
        const modResult = await this.autoModeration.moderateContent(comment.texto, comment.autor || 'Anónimo', 'comment');
        
        if (modResult.blocked) {
          throw new Error(`Comentario bloqueado: ${modResult.reasons.join(', ')}`);
        }
        
        if (modResult.flagged) {
          comment.flagged = true;
          comment.flagReason = modResult.reasons.join(', ');
        }
        
        comment.texto = this.autoModeration.filterContent(comment.texto);
      }
      
      const docRef = doc(this.db, 'dibujos', drawingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentComments = docSnap.data().comments || [];
        await updateDoc(docRef, {
          comments: [...currentComments, comment]
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error agregando comentario:', error);
      throw error;
    }
  }
  
  async addLike(drawingId) {
    try {
      const docRef = doc(this.db, 'dibujos', drawingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentLikes = docSnap.data().likes || 0;
        await updateDoc(docRef, {
          likes: currentLikes + 1
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error agregando like:', error);
      throw error;
    }
  }
  
  async saveSuggestion(suggestionData) {
    try {
      const docRef = await addDoc(collection(this.db, 'sugerencias'), suggestionData);
      return docRef.id;
    } catch (error) {
      console.error('Error guardando sugerencia:', error);
      throw error;
    }
  }
  
  async getRecentSuggestions(limitCount = 10) {
    try {
      console.log(`📝 Cargando ${limitCount} sugerencias...`);
      
      const q = query(
        collection(this.db, 'sugerencias'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const suggestions = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.texto) {
          suggestions.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`✅ Cargadas ${suggestions.length} sugerencias`);
      return suggestions;
    } catch (error) {
      console.error('❌ Error obteniendo sugerencias:', error);
      return [];
    }
  }
  
  async getAllDrawings() {
    try {
      console.log('🎨 Cargando todos los dibujos...');
      
      const q = query(collection(this.db, 'dibujos'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const drawings = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.autor && data.imagenData) {
          drawings.push({
            id: doc.id,
            data: data
          });
        }
      });
      
      console.log(`✅ Cargados ${drawings.length} dibujos`);
      return drawings;
    } catch (error) {
      console.error('❌ Error obteniendo todos los dibujos:', error);
      return [];
    }
  }
  
  async getDrawings() {
    return this.getAllDrawings();
  }
  
  async getComments(drawingId) {
    try {
      console.log('Buscando comentarios para drawingId:', drawingId);
      
      const q = query(
        collection(this.db, 'comments'),
        where('drawingId', '==', drawingId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      console.log(`Encontrados ${comments.length} comentarios en colección separada`);
      return comments;
    } catch (error) {
      console.error('Error obteniendo comentarios de colección separada:', error);
      return [];
    }
  }
  
  async addComment(drawingId, commentData) {
    try {
      console.log('Agregando comentario a colección separada:', { drawingId, commentData });
      
      // Auto-moderación antes de agregar
      if (commentData.texto && this.autoModeration) {
        const modResult = await this.autoModeration.moderateContent(commentData.texto, commentData.autor || 'Anónimo', 'comment');
        
        if (modResult.blocked) {
          throw new Error(`Comentario bloqueado: ${modResult.reasons.join(', ')}`);
        }
        
        if (modResult.flagged) {
          commentData.flagged = true;
          commentData.flagReason = modResult.reasons.join(', ');
        }
        
        commentData.texto = this.autoModeration.filterContent(commentData.texto);
      }
      
      const comment = {
        ...commentData,
        drawingId: drawingId,
        domain: 'thisisfenix.github.io'
      };
      
      const docRef = await addDoc(collection(this.db, 'comments'), comment);
      console.log('Comentario agregado con ID:', docRef.id);
      return true;
    } catch (error) {
      console.error('Error agregando comentario a colección separada:', error);
      throw error;
    }
  }
  
  async toggleLike(drawingId, isLiked) {
    try {
      const docRef = doc(this.db, 'dibujos', drawingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentLikes = docSnap.data().likes || 0;
        const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        
        await updateDoc(docRef, {
          likes: newLikes
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }
  
  async checkAdminAccess() {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (authorizedDomains.includes(currentDomain)) {
        return { role: 'admin', permissions: ['all'] };
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando acceso:', error);
      return false;
    }
  }
  
  async checkModeratorAccess(username) {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (authorizedDomains.includes(currentDomain) && username) {
        return {
          role: 'moderator',
          permissions: ['delete_drawings', 'manage_comments', 'manage_suggestions'],
          name: username,
          username: username,
          id: 'mod_' + username
        };
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando moderador:', error);
      return false;
    }
  }
  
  async addModerator(moderatorData) {
    try {
      // Verificar acceso de admin
      const hasAccess = await this.checkAdminAccess();
      if (!hasAccess) {
        throw new Error('Sin permisos de administrador');
      }
      
      // Verificar que el username no exista
      const q = query(collection(this.db, 'moderators'), where('username', '==', moderatorData.username));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        throw new Error('El nombre de usuario ya existe');
      }
      
      const docRef = await addDoc(collection(this.db, 'moderators'), {
        name: moderatorData.name,
        username: moderatorData.username,
        permissions: moderatorData.permissions || [],
        createdAt: Date.now(),
        active: true,
        domain: 'thisisfenix.github.io'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error añadiendo moderador:', error);
      throw error;
    }
  }
  
  async getModerators() {
    try {
      const q = query(collection(this.db, 'moderators'), orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const moderators = [];
      
      querySnapshot.forEach((doc) => {
        moderators.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return moderators;
    } catch (error) {
      console.error('Error obteniendo moderadores:', error);
      return [];
    }
  }
  
  async updateModerator(moderatorId, data) {
    try {
      await updateDoc(doc(this.db, 'moderators', moderatorId), {
        ...data,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error actualizando moderador:', error);
      throw error;
    }
  }
  
  async deleteModerator(moderatorId) {
    try {
      await deleteDoc(doc(this.db, 'moderators', moderatorId));
      return true;
    } catch (error) {
      console.error('Error eliminando moderador:', error);
      throw error;
    }
  }
  
  async logModeratorAction(action, moderator, target, details = {}) {
    try {
      // Validar que moderator no sea undefined
      if (!moderator || typeof moderator !== 'string') {
        console.warn('Moderator inválido para log:', moderator);
        moderator = 'Sistema';
      }
      
      await addDoc(collection(this.db, 'moderation_logs'), {
        moderator: String(moderator),
        action: String(action),
        target: String(target),
        reason: details.reason || '',
        timestamp: Date.now(),
        domain: 'thisisfenix.github.io'
      });
      return true;
    } catch (error) {
      console.error('Error registrando acción de moderación:', error);
      return false;
    }
  }
  
  async getModerationLogs() {
    try {
      const q = query(collection(this.db, 'moderation_logs'), orderBy('timestamp', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return logs;
    } catch (error) {
      console.error('Error obteniendo logs de moderación:', error);
      return [];
    }
  }
  
  async updateSuggestionStatus(suggestionId, status) {
    try {
      await updateDoc(doc(this.db, 'sugerencias', suggestionId), {
        status: status,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error actualizando estado de sugerencia:', error);
      throw error;
    }
  }
  
  async getAllSuggestions() {
    try {
      const q = query(collection(this.db, 'sugerencias'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const suggestions = [];
      
      querySnapshot.forEach((doc) => {
        suggestions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return suggestions;
    } catch (error) {
      console.error('Error obteniendo todas las sugerencias:', error);
      return [];
    }
  }
  
  async deleteDrawing(drawingId, moderatorName, reason = '') {
    try {
      await deleteDoc(doc(this.db, 'dibujos', drawingId));
      
      await this.logModeratorAction(
        'delete_drawing',
        moderatorName,
        drawingId,
        { reason }
      );
      
      return true;
    } catch (error) {
      console.error('Error eliminando dibujo:', error);
      throw error;
    }
  }
  
  async reportDrawing(reportData) {
    try {
      // Validar datos del reporte
      if (!reportData.drawingId || !reportData.reason) {
        throw new Error('Datos del reporte incompletos');
      }
      
      const docRef = await addDoc(collection(this.db, 'reports'), {
        ...reportData,
        domain: 'thisisfenix.github.io',
        status: 'pending',
        timestamp: reportData.timestamp || Date.now(),
        reviewedBy: null,
        reviewedAt: null
      });
      
      console.log('Reporte enviado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error enviando reporte:', error);
      throw error;
    }
  }
  
  async getAllReports() {
    try {
      const q = query(collection(this.db, 'reports'), orderBy('timestamp', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return reports;
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      return [];
    }
  }
  
  async updateReportStatus(reportId, status, reviewerName = null) {
    try {
      const updateData = {
        status: status,
        updatedAt: Date.now()
      };
      
      if (reviewerName) {
        updateData.reviewedBy = reviewerName;
        updateData.reviewedAt = Date.now();
      }
      
      await updateDoc(doc(this.db, 'reports', reportId), updateData);
      
      // Log de la acción de moderación
      if (reviewerName) {
        await this.logModeratorAction(
          'update_report_status',
          reviewerName,
          reportId,
          { newStatus: status }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error actualizando reporte:', error);
      throw error;
    }
  }
  
  async saveUserProfile(profileData) {
    try {
      const docRef = doc(this.db, 'user_profiles', profileData.username.toLowerCase());
      await setDoc(docRef, {
        username: profileData.username,
        avatar: profileData.avatar,
        avatarType: profileData.avatarType,
        avatarImage: profileData.avatarImage,
        bannerImage: profileData.bannerImage,
        bio: profileData.bio,
        favoriteCategory: profileData.favoriteCategory,
        totalDrawings: profileData.totalDrawings,
        totalLikes: profileData.totalLikes,
        achievements: profileData.achievements,
        lastLogin: profileData.lastLogin,
        userTags: profileData.userTags || [],
        domain: 'thisisfenix.github.io',
        updatedAt: Date.now()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error guardando perfil de usuario:', error);
      throw error;
    }
  }
  
  async getUserProfile(username) {
    try {
      const docRef = doc(this.db, 'user_profiles', username.toLowerCase());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo perfil de usuario:', error);
      return null;
    }
  }
  
  async saveAllUsers(usersArray) {
    try {
      const docRef = doc(this.db, 'system_data', 'registered_users');
      await setDoc(docRef, {
        users: usersArray,
        domain: 'thisisfenix.github.io',
        updatedAt: Date.now(),
        totalUsers: usersArray.length
      });
      console.log(`✅ ${usersArray.length} usuarios guardados en Firebase`);
      return true;
    } catch (error) {
      console.error('Error guardando usuarios en Firebase:', error);
      throw error;
    }
  }
  
  async getAllUsers() {
    try {
      const docRef = doc(this.db, 'system_data', 'registered_users');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`✅ ${data.users?.length || 0} usuarios cargados desde Firebase`);
        return data.users || [];
      }
      console.log('📄 No hay usuarios en Firebase aún');
      return [];
    } catch (error) {
      console.error('Error cargando usuarios desde Firebase:', error);
      throw error;
    }
  }
  
  async saveUserCredentials(username, passwordHash, userData) {
    try {
      const docRef = doc(this.db, 'user_credentials', username.toLowerCase());
      await setDoc(docRef, {
        username: userData.username,
        passwordHash: passwordHash,
        email: userData.email || '',
        joinDate: userData.joinDate || Date.now(),
        domain: 'thisisfenix.github.io',
        createdAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error guardando credenciales:', error);
      throw error;
    }
  }
  
  async getUserCredentials(username) {
    try {
      const docRef = doc(this.db, 'user_credentials', username.toLowerCase());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo credenciales:', error);
      return null;
    }
  }
  
  async getAllComments() {
    try {
      const q = query(collection(this.db, 'comments'), orderBy('timestamp', 'desc'), limit(1000));
      const querySnapshot = await getDocs(q);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          data: doc.data()
        });
      });
      
      return comments;
    } catch (error) {
      console.error('Error obteniendo todos los comentarios:', error);
      return [];
    }
  }
  
  async updateUserProfile(username, updateData) {
    try {
      const docRef = doc(this.db, 'user_profiles', username.toLowerCase());
      await updateDoc(docRef, {
        ...updateData,
        domain: 'thisisfenix.github.io',
        updatedAt: Date.now()
      });
      
      console.log(`✅ Perfil de ${username} actualizado con:`, updateData);
      return true;
    } catch (error) {
      console.error('Error actualizando perfil de usuario:', error);
      throw error;
    }
  }
  
  // Sistema de amistades
  async saveFriendRequest(requestData) {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (!authorizedDomains.includes(currentDomain)) {
        throw new Error('Dominio no autorizado');
      }
      
      await addDoc(collection(this.db, 'friend_requests'), {
        ...requestData,
        domain: 'thisisfenix.github.io'
      });
      return true;
    } catch (error) {
      console.error('Error enviando solicitud de amistad:', error);
      throw error;
    }
  }
  
  async createFriendship(user1, user2) {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (!authorizedDomains.includes(currentDomain)) {
        throw new Error('Dominio no autorizado');
      }
      
      const friendshipData = {
        users: [user1.toLowerCase(), user2.toLowerCase()],
        user1: user1,
        user2: user2,
        timestamp: Date.now(),
        domain: 'thisisfenix.github.io'
      };
      
      await addDoc(collection(this.db, 'friendships'), friendshipData);
      return true;
    } catch (error) {
      console.error('Error creando amistad:', error);
      throw error;
    }
  }
  
  async updateFriendRequestStatus(from, to, status) {
    try {
      const q = query(
        collection(this.db, 'friend_requests'),
        where('from', '==', from),
        where('to', '==', to),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        await updateDoc(doc(this.db, 'friend_requests', docSnap.id), {
          status: status,
          updatedAt: Date.now()
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      throw error;
    }
  }
  
  async removeFriendship(user1, user2) {
    try {
      const q = query(
        collection(this.db, 'friendships'),
        where('users', 'array-contains', user1.toLowerCase())
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.users.includes(user2.toLowerCase())) {
          await deleteDoc(doc(this.db, 'friendships', docSnap.id));
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error eliminando amistad:', error);
      throw error;
    }
  }
  
  async getUserFriends(username) {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (!authorizedDomains.includes(currentDomain)) {
        console.warn('Dominio no autorizado para amistades');
        return [];
      }
      
      const q = query(
        collection(this.db, 'friendships'),
        where('users', 'array-contains', username.toLowerCase())
      );
      
      const querySnapshot = await getDocs(q);
      const friends = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const friendUsername = data.users.find(u => u !== username.toLowerCase());
        
        if (friendUsername) {
          const profile = await this.getUserProfile(friendUsername);
          friends.push({
            username: profile?.username || friendUsername,
            avatar: profile?.avatar || '👤',
            friendsSince: data.timestamp
          });
        }
      }
      
      return friends;
    } catch (error) {
      console.error('Error obteniendo amigos:', error);
      return [];
    }
  }
  
  async getPendingFriendRequests(username) {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (!authorizedDomains.includes(currentDomain)) {
        console.warn('Dominio no autorizado para solicitudes');
        return [];
      }
      
      const q = query(
        collection(this.db, 'friend_requests'),
        where('to', '==', username),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return requests;
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      return [];
    }
  }
  
  async getFriendshipStatus(user1, user2) {
    try {
      // Verificar dominio autorizado
      const currentDomain = window.location.hostname;
      const authorizedDomains = ['thisisfenix.github.io', 'localhost', '127.0.0.1'];
      
      if (!authorizedDomains.includes(currentDomain)) {
        console.warn('Dominio no autorizado para verificar amistad');
        return 'none';
      }
      
      // Verificar si son amigos
      const friendshipQuery = query(
        collection(this.db, 'friendships'),
        where('users', 'array-contains', user1.toLowerCase())
      );
      
      const friendshipSnapshot = await getDocs(friendshipQuery);
      for (const doc of friendshipSnapshot.docs) {
        if (doc.data().users.includes(user2.toLowerCase())) {
          return 'friends';
        }
      }
      
      // Verificar solicitudes pendientes
      const sentQuery = query(
        collection(this.db, 'friend_requests'),
        where('from', '==', user1),
        where('to', '==', user2),
        where('status', '==', 'pending')
      );
      
      const sentSnapshot = await getDocs(sentQuery);
      if (!sentSnapshot.empty) {
        return 'pending_sent';
      }
      
      const receivedQuery = query(
        collection(this.db, 'friend_requests'),
        where('from', '==', user2),
        where('to', '==', user1),
        where('status', '==', 'pending')
      );
      
      const receivedSnapshot = await getDocs(receivedQuery);
      if (!receivedSnapshot.empty) {
        return 'pending_received';
      }
      
      return 'none';
    } catch (error) {
      console.error('Error verificando estado de amistad:', error);
      return 'none';
    }
  }
}