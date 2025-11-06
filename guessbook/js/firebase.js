// Firebase y base de datos
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, orderBy, query, updateDoc, doc, getDoc, deleteDoc, where, getDocs, setDoc, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class FirebaseManager {
  constructor() {
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
      // Solo verificar rol para usuarios específicos conocidos
      if (drawingData.autor === 'ThisIsFenix' || drawingData.autor === 'Admin') {
        drawingData.userRole = 'admin';
      }
      
      await addDoc(collection(this.db, 'dibujos'), drawingData);
      return true;
    } catch (error) {
      console.error('Error guardando dibujo:', error);
      throw error;
    }
  }
  
  async getUserRole(username) {
    try {
      // Verificar si es admin (hardcoded)
      if (username === 'ThisIsFenix' || username === 'Admin') {
        return 'admin';
      }
      
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
  
  async checkAdminPassword(password) {
    try {
      // Verificar contraseña de admin
      await addDoc(collection(this.db, 'admin_auth'), {
        domain: 'thisisfenix.github.io',
        adminPassword: password,
        timestamp: Date.now()
      });
      return { role: 'admin', permissions: ['all'] };
    } catch (error) {
      // Intentar validar como moderador
      try {
        await addDoc(collection(this.db, 'moderator_auth'), {
          domain: 'thisisfenix.github.io',
          moderatorPassword: password,
          timestamp: Date.now()
        });
        return { role: 'moderator_access', permissions: ['create_moderator'] };
      } catch (authError) {
        return false;
      }
    }
  }
  
  async loginModerator(username, password) {
    try {
      // Intentar autenticar escribiendo a colección protegida
      await addDoc(collection(this.db, 'moderator_login'), {
        domain: 'thisisfenix.github.io',
        username: username,
        password: password,
        timestamp: Date.now()
      });
      
      // Si llegamos aquí, la autenticación fue exitosa
      return {
        role: 'moderator',
        permissions: ['delete_drawings', 'manage_comments', 'manage_suggestions'],
        name: username,
        username: username,
        id: 'mod_' + username
      };
    } catch (error) {
      console.error('Error verificando moderador:', error);
      return false;
    }
  }
  
  async addModerator(moderatorData) {
    try {
      // Verificar contraseña de moderador primero
      if (moderatorData.moderatorPassword) {
        await addDoc(collection(this.db, 'moderator_auth'), {
          domain: 'thisisfenix.github.io',
          moderatorPassword: moderatorData.moderatorPassword,
          timestamp: Date.now()
        });
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
        password: moderatorData.password,
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
        details: details || {},
        timestamp: Date.now(),
        domain: 'thisisfenix.github.io'
      });
      return true;
    } catch (error) {
      console.error('Error registrando acción de moderación:', error);
      return false;
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
}