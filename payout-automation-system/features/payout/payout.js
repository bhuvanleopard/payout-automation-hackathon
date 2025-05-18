import { db } from '../../js/firebase.js';
import {
  query, collection, where, getDocs, Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";


// import { addDoc, collection,  } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { auth } from '../../js/firebase.js';



const settingsKey = 'payoutSettings';

// --- Settings Load/Save ---
function loadSettings() {
  const s = JSON.parse(localStorage.getItem(settingsKey)) || { fee: 5, gst: 18, deductions: 0 };
  document.getElementById('platform-fee').value = s.fee;
  document.getElementById('gst').value = s.gst;
  document.getElementById('deductions').value = s.deductions;
}

function saveSettings(e) {
  e.preventDefault();
  const fee = parseFloat(document.getElementById('platform-fee').value) || 0;
  const gst = parseFloat(document.getElementById('gst').value) || 0;
  const deductions = parseFloat(document.getElementById('deductions').value) || 0;
  localStorage.setItem(settingsKey, JSON.stringify({ fee, gst, deductions }));
  alert("Settings saved!");
}

// --- Payout Calculation ---
async function calculatePayout(e) {
  e.preventDefault();
  const mentor = document.getElementById('payout-mentor-name').value.trim();
  const fromDate = new Date(document.getElementById('payout-from').value);
  const toDate = new Date(document.getElementById('payout-to').value);
  if (!mentor || !fromDate || !toDate) return;
  const s = JSON.parse(localStorage.getItem(settingsKey)) || { fee: 5, gst: 18, deductions: 0 };

  const q = query(
    collection(db, 'sessions'),
    where('mentor', '==', mentor),
    where('datetime', '>=', Timestamp.fromDate(fromDate)),
    where('datetime', '<=', Timestamp.fromDate(toDate))
  );
  const snap = await getDocs(q);

  let total = 0, rows = '';
  snap.forEach(doc => {
    const d = doc.data();
    total += d.payout;
    rows += `<tr>
      <td>${new Date(d.datetime.seconds * 1000).toLocaleString()}</td>
      <td>${d.type}</td>
      <td>${d.duration} mins</td>
      <td>${d.payout}</td>
    </tr>`;
  });

  const platformFee = +(total * (s.fee / 100)).toFixed(2);
  const gst = +((total - platformFee) * (s.gst / 100)).toFixed(2);
  const deductions = +s.deductions;
  const final = +(total - platformFee - deductions + gst).toFixed(2);

  document.getElementById('payout-breakdown').innerHTML = snap.size === 0
    ? `<div class="alert alert-warning">No sessions found for this mentor/range.</div>`
    : `<h5>Payout Breakdown for <b>${mentor}</b></h5>
      <table class="table table-bordered">
        <thead>
          <tr><th>Date/Time</th><th>Type</th><th>Duration</th><th>Payout (₹)</th></tr>
        </thead><tbody>${rows}</tbody>
      </table>
      <div><b>Total:</b> ₹${total.toFixed(2)}</div>
      <div><b>Platform Fee (${s.fee}%):</b> -₹${platformFee}</div>
      <div><b>Deductions:</b> -₹${deductions}</div>
      <div><b>GST (${s.gst}%):</b> +₹${gst}</div>
      <div class="fs-5 mt-2"><b>Final Payable:</b> ₹${final}</div>`;

}

// --- Wiring ---
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('payout-settings-form').onsubmit = saveSettings;
  document.getElementById('mentor-payout-form').onsubmit = calculatePayout;
});


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


async function loadDisputes() {
  const snap = await getDocs(collection(db, 'disputes'));
  const div = document.getElementById('dispute-list');
  div.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    div.innerHTML += `
      <div class="border p-2 mb-2">
        <b>Mentor:</b> ${d.mentor}<br/>
        <b>Session:</b> ${d.sessionId}<br/>
        <b>Reason:</b> ${d.reason}<br/>
        <b>Status:</b> ${d.status}<br/>
        <button class="btn btn-sm btn-success" onclick="resolveDispute('${doc.id}')">Mark as Resolved</button>
      </div>`;
  });
}
window.resolveDispute = async function(id) {
  await updateDoc(doc(db, "disputes", id), { status: "Resolved" });
  loadDisputes();
};
document.addEventListener('DOMContentLoaded', loadDisputes);