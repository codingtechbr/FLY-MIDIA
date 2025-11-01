// Importa módulos necessários
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBn58dQwxfp-WAIpU3jcGQJ1ZFhs7AHjTk",
  authDomain: "flymidia-ccd8f.firebaseapp.com",
  projectId: "flymidia-ccd8f",
  storageBucket: "flymidia-ccd8f.firebasestorage.app",
  messagingSenderId: "79513987797",
  appId: "1:79513987797:web:1f3854bcaaf4500001d05c",
  measurementId: "G-S89Y3ZTEG6"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializa módulos principais
export const auth = getAuth(app);
export const db = getFirestore(app);
