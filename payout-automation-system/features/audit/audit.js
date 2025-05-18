import { db, auth } from '../../js/firebase.js';
import {
  collection, query, orderBy, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// import { auth } from '../../js/firebase.js';


// Load and display audit logs (latest first)
async function loadAuditLogs() {
  const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);

  const tbody = document.getElementById('audit-table').querySelector('tbody');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `
      <tr>
        <td>${d.timestamp?.toDate ? d.timestamp.toDate().toLocaleString() : ''}</td>
        <td>${d.user}</td>
        <td>${d.action}</td>
        <td>${d.target}</td>
        <td><pre style="white-space:pre-wrap;">${JSON.stringify(d.details, null, 2)}</pre></td>
      </tr>
    `;
  });
}

document.addEventListener('DOMContentLoaded', loadAuditLogs);

async function logAudit(action, target, details) {
  await addDoc(collection(db, 'audit_logs'), {
    timestamp: serverTimestamp(),
    user: auth.currentUser?.email || 'unknown',
    action,           // e.g., "create", "update", "delete"
    target,           // e.g., "session", "receipt", session/receipt id
    details           // e.g., what changed (fields/values before-after)
  });
}

// Call logAudit(...) after every create/update/delete operation.