import { db } from '../../js/firebase.js';
import {
  query, collection, where, getDocs, Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// import { addDoc, collection,  } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { auth } from '../../js/firebase.js';


function getSettings() {
  return JSON.parse(localStorage.getItem('payoutSettings')) || { fee: 5, gst: 18, deductions: 0 };
}

async function generateReceipt(e) {
  e.preventDefault();
  const mentor = document.getElementById('receipt-mentor-name').value.trim();
  const fromDate = new Date(document.getElementById('receipt-from').value);
  const toDate = new Date(document.getElementById('receipt-to').value);
  const customMsg = document.getElementById('custom-message').value.trim();
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

  const html = snap.size === 0
    ? `<div class="alert alert-warning">No session data for this mentor/date range.</div>`
    : `<div class="border p-3 bg-light" id="receipt-content">
        <div class="mb-1">
          <strong>Mentor Name:</strong> ${mentor} <br>
          <strong>Date Range:</strong> ${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Payout (₹)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div>
          <b>Total:</b> ₹${total.toFixed(2)} <br>
          <b>Platform Fee (${s.fee}%):</b> -₹${platformFee} <br>
          <b>Deductions:</b> -₹${deductions} <br>
          <b>GST (${s.gst}%):</b> +₹${gst} <br>
          <span class="fs-5"><b>Final Payout:</b> ₹${final}</span>
        </div>
        <hr>
        <div><strong>Note:</strong> ${customMsg || '(none)'}</div>
        <div style="font-size:0.9em;color:#888;">Generated on: ${new Date().toLocaleString()}</div>
      </div>`;
  document.getElementById('receipt-view').innerHTML = html;
  document.getElementById('download-receipt').style.display = snap.size ? '' : 'none';
  document.getElementById('send-receipt-email').style.display = snap.size ? '' : 'none';
}

// Simple text-to-PDF using browser print, could use html2pdf for real PDF
function downloadPDF() {
  const receiptHTML = document.getElementById('receipt-content');
  if (!receiptHTML) return;
  const win = window.open('', '', 'width=800,height=700');
  win.document.write(`<html><head><title>Mentor Receipt</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
      </head><body>${receiptHTML.outerHTML}</body></html>`);
  win.document.close();
  win.print();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('receipt-form').onsubmit = generateReceipt;
  document.getElementById('download-receipt').onclick = downloadPDF;
  document.getElementById('send-receipt-email').onclick = () => {
    alert('Marking as sent (email stub). Email sending requires backend or Cloud Functions.');
  };
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