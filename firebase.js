import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : window.__ENV__ || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

let firebaseApp = null;
let auth = null;

if (hasFirebaseConfig) {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
}

export { auth, firebaseApp, firebaseConfig, hasFirebaseConfig };
