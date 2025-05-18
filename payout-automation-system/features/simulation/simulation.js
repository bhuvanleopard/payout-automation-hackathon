import { db } from '../../js/firebase.js';
import {
  collection, query, where, getDocs, Timestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

function getSettings() {
  return JSON.parse(localStorage.getItem('payoutSettings')) || { fee: 5, gst: 18, deductions: 0 };
}

async function simulatePayout(e) {
  e.preventDefault();
  const mentor = document.getElementById('sim-mentor-name').value.trim();
  const fromDate = new Date(document.getElementById('sim-from').value);
  const toDate = new Date(document.getElementById('sim-to').value);
  if (!mentor || !fromDate || !toDate) return;

  const s = getSettings();

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
      <td>₹${d.payout}</td>
    </tr>`;
  });

  const platformFee = +(total * (s.fee / 100)).toFixed(2);
  const gst = +((total - platformFee) * (s.gst / 100)).toFixed(2);
  const deductions = +s.deductions;
  const final = +(total - platformFee - deductions + gst).toFixed(2);

  document.getElementById('simulation-result').innerHTML = snap.size === 0
    ? `<div class="alert alert-warning">No sessions found for this mentor/range.</div>`
    : `<h5>Simulation Result for <b>${mentor}</b></h5>
      <table class="table table-bordered">
        <thead>
          <tr><th>Date/Time</th><th>Type</th><th>Duration</th><th>Payout (₹)</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div><b>Total:</b> ₹${total.toFixed(2)}</div>
      <div><b>Platform Fee (${s.fee}%):</b> -₹${platformFee}</div>
      <div><b>Deductions:</b> -₹${deductions}</div>
      <div><b>GST (${s.gst}%):</b> +₹${gst}</div>
      <div class="fs-5 mt-2"><b>Final Payable:</b> ₹${final}</div>
      <div class="alert alert-success mt-2">This was a simulation only. No records were updated or sent.</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('simulation-form').onsubmit = simulatePayout;
});