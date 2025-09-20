// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

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

export { auth, analytics };
export default app;