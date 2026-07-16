
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // 1. Adicionado GoogleAuthProvider aqui

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyDVwwrJf5OZL759jGHbahTZBDKEUonaQ",
  authDomain: "locafesta-b30be.firebaseapp.com",
  projectId: "locafesta-b30be",
  storageBucket: "locafesta-b30be.firebasestorage.app",
  messagingSenderId: "747090984462",
  appId: "1:747090984462:web:714daf859a9e34f227865f",
  measurementId: "G-VRY0BSMXH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializa o serviço de autenticação
const auth = getAuth(app);

// 2. Inicializa o provedor de autenticação do Google
const googleProvider = new GoogleAuthProvider();

// Configurações opcionais para o Google (forçar seleção de conta)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 3. IMPORTANTE: Exporta o auth E o googleProvider para serem usados no auth.jsx
export { auth, googleProvider, analytics };