import { auth, db } from '../../js/firebase.js';
import {
  query, collection, where, getDocs, orderBy, Timestamp, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

function getMentorName() {
  return auth.currentUser?.email || '';
}

async function loadMentorSessions(fromDate, toDate) {
  const mentor = getMentorName();
  let q;
  if (fromDate && toDate) {
    q = query(
      collection(db, 'sessions'),
      where('mentor', '==', mentor),
      where('datetime', '>=', Timestamp.fromDate(new Date(fromDate))),
      where('datetime', '<=', Timestamp.fromDate(new Date(toDate))),
      orderBy('datetime', 'desc')
    );
  } else {
    q = query(
      collection(db, 'sessions'),
      where('mentor', '==', mentor),
      orderBy('datetime', 'desc')
    );
  }
  const snap = await getDocs(q);

  const tbody = document.getElementById('mentor-session-table').querySelector('tbody');
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `<tr>
      <td>${new Date(d.datetime.seconds * 1000).toLocaleString()}</td>
      <td>${d.type}</td>
      <td>${d.duration}</td>
      <td>${d.payout}</td>
      <td>${d.status ? d.status : 'Pending'}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary" data-session="${doc.id}">Download</button>
      </td>
      <td>
        <button class="btn btn-sm btn-danger" data-dispute="${doc.id}">Dispute</button>
      </td>
    </tr>`;
  });

  // Receipt download logic
  Array.from(document.querySelectorAll('[data-session]')).forEach(btn => {
    btn.onclick = async () => {
      const sessionDoc = snap.docs.find(d => d.id === btn.dataset.session);
      if (!sessionDoc) return;
      const d = sessionDoc.data();
      const html = `
        <div class="p-3">
          <h4>Session Receipt</h4>
          <div><b>Date/Time:</b> ${new Date(d.datetime.seconds * 1000).toLocaleString()}</div>
          <div><b>Mentor:</b> ${d.mentor}</div>
          <div><b>Type:</b> ${d.type}</div>
          <div><b>Duration:</b> ${d.duration} mins</div>
          <div><b>Payout:</b> ₹${d.payout}</div>
          <div><b>Status:</b> ${d.status ? d.status : 'Pending'}</div>
          <hr>
          <div style="font-size:0.9em;color:#888;">Generated on: ${new Date().toLocaleString()}</div>
        </div>
      `;
      const win = window.open('', '', 'width=700,height=600');
      win.document.write(`<html><head><title>Receipt</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"></head><body>
        ${html}</body></html>`);
      win.document.close();
      win.print();
    };
  });

  // Dispute logic
  Array.from(document.querySelectorAll('[data-dispute]')).forEach(btn => {
    btn.onclick = async () => {
      const reason = prompt('Describe your payout dispute or correction request:');
      if (!reason) return;
      await addDoc(collection(db, 'disputes'), {
        sessionId: btn.dataset.dispute,
        mentor: getMentorName(),
        reason,
        status: "Open",
        created: serverTimestamp()
      });
      alert('Dispute submitted! Admin will review.');
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial load
  loadMentorSessions();

  // Date filter
  document.getElementById('mentor-filter-form').onsubmit = (e) => {
    e.preventDefault();
    const from = document.getElementById('mentor-from').value;
    const to = document.getElementById('mentor-to').value;
    loadMentorSessions(from, to);
  };

  // Logout
  document.getElementById('logout-btn').onclick = () => auth.signOut();
});