import { db } from '../../js/firebase.js';
import {
  collection, getDocs, query, where, Timestamp
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// CSV array → string
function toCSV(rows) {
  return rows.map(r => r.map(f => `"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n');
}

async function exportCSV(e) {
  e.preventDefault();
  const mentor = document.getElementById('export-mentor-name').value.trim();
  const from = new Date(document.getElementById('export-from').value);
  const to = new Date(document.getElementById('export-to').value);

  let q = query(
    collection(db, 'sessions'),
    where('datetime', '>=', Timestamp.fromDate(from)),
    where('datetime', '<=', Timestamp.fromDate(to))
  );
  if (mentor) {
    q = query(
      collection(db, 'sessions'),
      where('mentor', '==', mentor),
      where('datetime', '>=', Timestamp.fromDate(from)),
      where('datetime', '<=', Timestamp.fromDate(to))
    );
  }
  const snap = await getDocs(q);
  if (snap.size === 0) {
    document.getElementById('export-status').innerHTML = '<div class="alert alert-warning">No sessions found.</div>';
    return;
  }

  // Header row
  const rows = [[
    "Mentor", "Date/Time", "Type", "Duration (min)", "Rate/hr", "Payout", "Status"
  ]];
  snap.forEach(doc => {
    const d = doc.data();
    rows.push([
      d.mentor,
      new Date(d.datetime.seconds * 1000).toLocaleString(),
      d.type,
      d.duration,
      d.rate,
      d.payout,
      d.status || 'Pending'
    ]);
  });

  const csvData = toCSV(rows);
  // Download file
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `payouts_${mentor || 'all'}_${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  document.getElementById('export-status').innerHTML = '<div class="alert alert-success">CSV exported.</div>';
}

// Webhook demo trigger (stub)
document.getElementById('webhook-btn').onclick = async () => {
  // POST sample data to some URL (replace with real endpoint)
  const url = 'https://webhook.site/your-unique-url'; // <- replace with real
  const data = { event: "payout_finalized", time: new Date().toISOString() };
  try {
    await fetch(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
    document.getElementById('export-status').innerHTML = '<div class="alert alert-info">Webhook triggered!</div>';
  } catch {
    document.getElementById('export-status').innerHTML = '<div class="alert alert-danger">Webhook failed.</div>';
  }
};

document.getElementById('export-form').onsubmit = exportCSV;