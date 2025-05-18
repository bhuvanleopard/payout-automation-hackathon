// features/auth/auth.js
import { auth } from '../../js/firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

export function initAuth() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const messageDiv = document.getElementById('auth-message');

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    messageDiv.textContent = '';
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // auth state change will reload dashboard
    } catch (err) {
      messageDiv.textContent = err.message;
    }
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    messageDiv.textContent = '';
    const email = document.getElementById('register-email').value;
    const pass = document.getElementById('register-password').value;
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      // auth state change will reload dashboard
    } catch (err) {
      messageDiv.textContent = err.message;
    }
  };
}