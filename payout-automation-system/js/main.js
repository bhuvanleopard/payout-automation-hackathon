// js/main.js
import { auth } from './firebase.js';

// Simple SPA loader
const appDiv = document.getElementById('app');

function loadHTML(path) {
  return fetch(path)
    .then(res => res.text())
    .then(html => {
      appDiv.innerHTML = html;
    });
}

// function checkAuthAndLoad() {
//   auth.onAuthStateChanged(user => {
//     if (user) {
//       // Load dashboard or admin home (stub)
//       loadHTML('features/dashboard/dashboard.html');
//       // Optionally import and init dashboard.js here
//     } else {
//       // Load auth form
//       loadHTML('features/auth/auth.html').then(() => {
//         import('../features/auth/auth.js').then(mod => mod.initAuth && mod.initAuth());
//       });
//     }
//   });
// }

// // Initial load
// checkAuthAndLoad();

// ...existing code...
function checkAuthAndLoad() {
  auth.onAuthStateChanged(user => {
    if (user) {
      loadHTML('features/dashboard/dashboard.html').then(() => {
        import('../features/dashboard/dashboard.js');
      });
    } else {
      loadHTML('features/auth/auth.html').then(() => {
        import('../features/auth/auth.js').then(mod => mod.initAuth && mod.initAuth());
      });
    }
  });
}

// checkAuthAndLoad()