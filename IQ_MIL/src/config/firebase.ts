import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDVTdZlwKUpsvkKNbTMEJR0wHjPLyIWlyk",
  authDomain: "iq-analitica.firebaseapp.com",
  projectId: "iq-analitica",
  storageBucket: "iq-analitica.firebasestorage.app",
  messagingSenderId: "73469724535",
  appId: "1:73469724535:web:37d060435d6f2f9ff7c372",
  measurementId: "G-H5974018HF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();