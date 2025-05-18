import { db } from '../../js/firebase.js';
import {
  collection, addDoc, query, where, getDocs, Timestamp, orderBy,serverTimestamp, doc, getDoc
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// import { addDoc, collection,  } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import { auth } from '../../js/firebase.js';


// import {  } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";


// Helpers
function breakdownPayout(duration, ratePerHour) {
  return ((duration / 60) * ratePerHour).toFixed(2); // e.g. 30 min of 4000/hr => 2000
}

function getDateRange(days) {
  const now = new Date();
  const from = new Date();
  from.setDate(now.getDate() - Number(days));
  return [from, now];
}

// async function addSession(e) {
//   e.preventDefault();
//   const mentor = document.getElementById('mentor-name').value.trim();
//   const datetime = document.getElementById('session-datetime').value;
//   const type = document.getElementById('session-type').value;
//   const duration = Number(document.getElementById('duration').value);
//   const rate = Number(document.getElementById('rate').value);

//   if (!mentor || !datetime || !duration || !rate) return;

//   const payout = Number(breakdownPayout(duration, rate));

//   await addDoc(collection(db, 'sessions'), {
//     mentor, datetime: Timestamp.fromDate(new Date(datetime)),
//     type, duration, rate, payout
//   });

//   document.getElementById('session-message').textContent = "Session added!";
//   document.getElementById('session-form').reset();
//   loadSessions(currentRange);
// }

// CSV upload (extremely basic, expects: mentor,datetime,type,duration,rate rows)
document.getElementById('csv-upload-form').onsubmit = async function(e) {
  e.preventDefault();
  const file = document.getElementById('csv-input').files[0];
  if (!file) return;
  const text = await file.text();
  const rows = text.split('\n').slice(1); // skip header
  for (let row of rows) {
    const [mentor, datetime, type, duration, rate] = row.split(',');
    if (!mentor || !datetime || !duration || !rate) continue;
    await addDoc(collection(db, 'sessions'), {
      mentor: mentor.trim(),
      datetime: Timestamp.fromDate(new Date(datetime)),
      type: type.trim(),
      duration: Number(duration),
      rate: Number(rate),
      payout: Number(breakdownPayout(Number(duration), Number(rate)))
    });
  }
  document.getElementById('session-message').textContent = "CSV uploaded!";
  loadSessions(currentRange);
};

// Date range filter state
let currentRange = 7;

document.getElementById('date-filter').onchange = function() {
  if (this.value === 'custom') {
    document.getElementById('custom-from').style.display = '';
    document.getElementById('custom-to').style.display = '';
  } else {
    document.getElementById('custom-from').style.display = 'none';
    document.getElementById('custom-to').style.display = 'none';
  }
};

document.getElementById('filter-btn').onclick = function() {
  currentRange = document.getElementById('date-filter').value;
  loadSessions(currentRange);
};

async function loadSessions(range) {
  let q;
  const table = document.getElementById('session-table').querySelector('tbody');
  table.innerHTML = '';
  let fromDate, toDate;
  if (range === 'custom') {
    fromDate = new Date(document.getElementById('custom-from').value);
    toDate = new Date(document.getElementById('custom-to').value);
  } else {
    [fromDate, toDate] = getDateRange(range);
  }

  q = query(
    collection(db, 'sessions'),
    where('datetime', '>=', Timestamp.fromDate(fromDate)),
    where('datetime', '<=', Timestamp.fromDate(toDate)),
    orderBy('datetime', 'desc')
  );

  const snap = await getDocs(q);
  let total = 0;
  snap.forEach(doc => {
    const data = doc.data();
    total += data.payout;
    table.innerHTML += `<tr>
      <td>${data.mentor}</td>
      <td>${new Date(data.datetime.seconds * 1000).toLocaleString()}</td>
      <td>${data.type}</td>
      <td>${data.duration}</td>
      <td>${data.rate}</td>
      <td>${data.payout}</td>
    </tr>`;
  });
  document.getElementById('total-payout').textContent = total.toFixed(2);
}

// Event binding
document.getElementById('session-form').onsubmit = addSession;
loadSessions(currentRange);


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

async function addSession(e) {
  e.preventDefault();
  const mentor = document.getElementById('mentor-name').value.trim();
  const datetime = document.getElementById('session-datetime').value;
  const type = document.getElementById('session-type').value;
  const duration = Number(document.getElementById('duration').value);
  let rate = Number(document.getElementById('rate').value);
  const overrideRate = Number(document.getElementById('mentor-rate-override')?.value);

  // If override, use it (and store mapping, see below)
  if (overrideRate) {
    rate = overrideRate;
    // store mentor-rate override in Firestore (one-time, not per session)
    await setDoc(doc(db, "mentor_rates", mentor), { rate: overrideRate });
  }

  const payout = Number(breakdownPayout(duration, rate));
  await addDoc(collection(db, 'sessions'), {
    mentor, datetime: Timestamp.fromDate(new Date(datetime)),
    type, duration, rate, payout
  });

  document.getElementById('session-message').textContent = "Session added!";
  document.getElementById('session-form').reset();
  loadSessions(currentRange);
}

async function fetchMentorDefaultRate(mentorName) {
  const docSnap = await getDoc(doc(db, "mentor_rates", mentorName));
  return docSnap.exists() ? docSnap.data().rate : null;
}