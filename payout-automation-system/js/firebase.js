// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Replace with your config
const firebaseConfig = {
  apiKey: "AIzaSyCMwq1Jti70EkW6bVoc4CVekDRiFL6zz7Y",
  authDomain: "payroll-1ae78.firebaseapp.com",
  projectId: "payroll-1ae78",
  storageBucket: "payroll-1ae78.firebasestorage.app",
  messagingSenderId: "190772079288",
  appId: "1:190772079288:web:cd705a19be4cf942bc224d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };