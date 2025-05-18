import { auth, db } from '../../js/firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

async function isAdminUser(user) {
  if (!user || !user.email) return false;
  const adminSnap = await getDoc(doc(db, 'admins', user.email));
  return adminSnap.exists();
}

async function renderAdminDashboard() {
  // Load the admin dashboard HTML
  const response = await fetch('features/dashboard/dashboard.html');
  const html = await response.text();
  // Replace the main content
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = html;
  // Now attach nav listeners
  setupAdminNav();
}

function setupAdminNav() {
  const nav = document.getElementById('dashboard-nav');
  if (nav) {
    nav.addEventListener('click', async (e) => {
      if (e.target.dataset.feature) {
        [...nav.children].forEach(link => link.classList.remove('active'));
        e.target.classList.add('active');
        await loadFeature(e.target.dataset.feature);
      }
    });
    // Load default view
    loadFeature('session');
  }
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => auth.signOut();
  }
}

async function loadFeature(name) {
  const view = document.getElementById('feature-view');
  if (!view) return;
  try {
    const html = await fetch(`features/${name}/${name}.html`).then(r => r.text());
    view.innerHTML = html;
    try {
      await import(`../features/${name}/${name}.js`);
    } catch (e) {}
  } catch {
    view.innerHTML = `<div class="alert alert-danger">Could not load feature view (${name})</div>`;
  }
}

// Main entry
document.addEventListener('DOMContentLoaded', async () => {
  let user = auth.currentUser;
  if (!user) {
    await new Promise(resolve => {
      const unsub = auth.onAuthStateChanged(u => {
        user = u;
        unsub();
        resolve();
      });
    });
  }
  if (!user) return;

  if (await isAdminUser(user)) {
    // Render admin dashboard and then set up JS listeners
    await renderAdminDashboard();
  } else {
    // Mentor dashboard logic (as in prior code)
    let container = document.getElementById('app');
    if (container) {
      const mentorView = await fetch('features/dashboard/mentordashboard.html').then(r => r.text());
      container.innerHTML = mentorView;
      setTimeout(() => {
        import('../features/dashboard/mentordashboard.js');
      }, 0);
    }
  }
});