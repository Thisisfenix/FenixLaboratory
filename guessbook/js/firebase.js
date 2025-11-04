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
      await addDoc(collection(this.db, 'dibujos'), drawingData);
      return true;
    } catch (error) {
      console.error('Error guardando dibujo:', error);
      throw error;
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
  
  async deleteDrawing(id) {
    try {
      await deleteDoc(doc(this.db, 'dibujos', id));
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
      // Intentar crear documento en admin_auth con la contraseña
      await addDoc(collection(this.db, 'admin_auth'), {
        domain: 'thisisfenix.github.io',
        adminPassword: password,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      // Si falla, la contraseña es incorrecta
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
}