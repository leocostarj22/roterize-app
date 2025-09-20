// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-WO1YJ6Qzoo6yjuGgrZqukI3IUs9QVNY",
  authDomain: "roterize-7d439.firebaseapp.com",
  projectId: "roterize-7d439",
  storageBucket: "roterize-7d439.firebasestorage.app",
  messagingSenderId: "45325126503",
  appId: "1:45325126503:web:71341960c9407342f83dc2",
  measurementId: "G-LKYXPJEG7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Firestore Collections References
const usersCollection = collection(db, 'users');
const routesCollection = collection(db, 'routes');
const placesCollection = collection(db, 'places');
const reviewsCollection = collection(db, 'reviews');

// Helper Functions for Database Operations

// Users Functions
export const createUserProfile = async (userId, userData) => {
  try {
    await addDoc(usersCollection, {
      userId,
      ...userData,
      createdAt: new Date(),
      totalContributions: 0,
      badges: [],
      level: 1
    });
    console.log('Perfil do usuário criado com sucesso');
  } catch (error) {
    console.error('Erro ao criar perfil do usuário:', error);
    throw error;
  }
};

// Routes Functions
export const saveRoute = async (userId, routeData) => {
  try {
    console.log('🔥 FIREBASE: Iniciando salvamento');
    console.log('🔥 FIREBASE: UserID:', userId);
    console.log('🔥 FIREBASE: RouteData:', routeData);
    console.log('🔥 FIREBASE: Collection:', routesCollection);
    
    const docData = {
      userId,
      ...routeData,
      createdAt: new Date(),
      likes: 0,
      views: 0,
      isPublic: false
    };
    
    console.log('🔥 FIREBASE: Dados finais para salvar:', docData);
    
    const docRef = await addDoc(routesCollection, docData);
    console.log('🔥 FIREBASE: Documento criado com ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('🔥 FIREBASE: Erro ao salvar:', error);
    console.error('🔥 FIREBASE: Código:', error.code);
    console.error('🔥 FIREBASE: Mensagem:', error.message);
    throw error;
  }
};

export const deleteRoute = async (routeId) => {
  try {
    await deleteDoc(doc(db, 'routes', routeId));
    console.log('Roteiro excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir roteiro:', error);
    throw error;
  }
};

export const getUserRoutes = async (userId) => {
  try {
    console.log('🔥 FIREBASE: Iniciando busca para userId:', userId);
    const q = query(routesCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    console.log('🔥 FIREBASE: Documentos encontrados:', querySnapshot.size);
    
    const routes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const route = { id: doc.id, ...data };
      console.log('🔥 FIREBASE: Roteiro:', route.name, 'ID:', doc.id);
      routes.push(route);
    });
    
    console.log('🔥 FIREBASE: Retornando', routes.length, 'roteiros');
    return routes;
  } catch (error) {
    console.error('🔥 FIREBASE: Erro na busca:', error);
    throw error;
  }
};

export const getPublicRoutes = async (limitCount = 10) => {
  try {
    const q = query(
      routesCollection, 
      where('isPublic', '==', true), 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const routes = [];
    querySnapshot.forEach((doc) => {
      routes.push({ id: doc.id, ...doc.data() });
    });
    return routes;
  } catch (error) {
    console.error('Erro ao buscar roteiros públicos:', error);
    throw error;
  }
};

// Places Functions
export const addPlace = async (placeData) => {
  try {
    const docRef = await addDoc(placesCollection, {
      ...placeData,
      createdAt: new Date(),
      averageRating: 0,
      totalReviews: 0,
      photos: []
    });
    console.log('Local adicionado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar local:', error);
    throw error;
  }
};

export const getPlacesByCategory = async (category) => {
  try {
    const q = query(placesCollection, where('category', '==', category), orderBy('averageRating', 'desc'));
    const querySnapshot = await getDocs(q);
    const places = [];
    querySnapshot.forEach((doc) => {
      places.push({ id: doc.id, ...doc.data() });
    });
    return places;
  } catch (error) {
    console.error('Erro ao buscar locais por categoria:', error);
    throw error;
  }
};

// Reviews Functions
export const addReview = async (reviewData) => {
  try {
    const docRef = await addDoc(reviewsCollection, {
      ...reviewData,
      createdAt: new Date(),
      likes: 0,
      isVerified: false
    });
    console.log('Avaliação adicionada com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar avaliação:', error);
    throw error;
  }
};

export const getPlaceReviews = async (placeId) => {
  try {
    const q = query(reviewsCollection, where('placeId', '==', placeId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    return reviews;
  } catch (error) {
    console.error('Erro ao buscar avaliações do local:', error);
    throw error;
  }
};

// Storage Functions for Photo Upload
export const uploadPhoto = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Foto enviada com sucesso:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao enviar foto:', error);
    throw error;
  }
};

export { auth, analytics, db, storage };
export default app;