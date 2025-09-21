// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
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
const db = getFirestore(app);
const storage = getStorage(app);

// Firestore Collections References
const usersCollection = collection(db, 'users');
const routesCollection = collection(db, 'routes');
const placesCollection = collection(db, 'places');
const reviewsCollection = collection(db, 'reviews');
const tipsCollection = collection(db, 'tips');

// Helper Functions for Database Operations

// Users Functions
export const createUserProfile = async (userId, userData) => {
  try {
    const userDoc = doc(usersCollection, userId);
    await setDoc(userDoc, userData);
  } catch (error) {
    throw error;
  }
};

export const saveRoute = async (userId, routeData) => {
  try {
    const docData = {
      ...routeData,
      userId: userId,
      createdAt: routeData.createdAt || new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(routesCollection, docData);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const deleteRoute = async (routeId) => {
  try {
    await deleteDoc(doc(db, 'routes', routeId));
  } catch (error) {
    throw error;
  }
};

export const getUserRoutes = async (userId) => {
  try {
    const q = query(
      routesCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const routes = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      routes.push({
        id: doc.id,
        ...data
      });
    });
    
    return routes;
  } catch (error) {
    throw error;
  }
};

export const addPlace = async (placeData) => {
  try {
    const docRef = await addDoc(placesCollection, {
      ...placeData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const addReview = async (reviewData) => {
  try {
    const docRef = await addDoc(reviewsCollection, {
      ...reviewData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const uploadPhoto = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

export const addTip = async (tipData) => {
  try {
    const docRef = await addDoc(tipsCollection, {
      ...tipData,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getTipsByCategory = async (category, limitCount = 20) => {
  try {
    let q;
    if (category === 'Todos') {
      q = query(tipsCollection, orderBy('createdAt', 'desc'), limit(limitCount));
    } else {
      q = query(tipsCollection, where('category', '==', category), orderBy('createdAt', 'desc'), limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const tips = [];
    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() });
    });
    return tips;
  } catch (error) {
    throw error;
  }
};

export const updateRoute = async (routeId, routeData) => {
  try {
    const routeRef = doc(db, 'routes', routeId);
    await updateDoc(routeRef, {
      ...routeData,
      updatedAt: new Date()
    });
    return routeId;
  } catch (error) {
    throw error;
  }
};

// Export auth for use in other components
export { auth };