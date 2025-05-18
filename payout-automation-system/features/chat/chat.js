import { db, auth } from '../../js/firebase.js';
import {
  addDoc, collection, serverTimestamp, query,
  where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// For this demo, we assume a unique chat room per mentor-admin pair, named by mentor email.
function getChatRoomId() {
  // For Mentor: their own email. For Admin, select a mentor or prefill.
  return auth.currentUser?.email;
}

let unsubscribe;

function setupChat() {
  const roomId = getChatRoomId();
  if (!roomId) return;

  const q = query(
    collection(db, 'chats'),
    where('room', '==', roomId),
    orderBy('created', 'asc')
  );

  // Real-time listener
  unsubscribe = onSnapshot(q, (snap) => {
    const chatDiv = document.getElementById('chat-window');
    chatDiv.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const theirs = d.sender !== auth.currentUser.email;
      chatDiv.innerHTML += `
        <div class="mb-1" style="text-align:${theirs?'left':'right'};">
          <span class="px-2 py-1 rounded ${theirs?'bg-secondary text-white':'bg-primary text-white'}">${d.message}</span>
          <span class="small text-muted ms-1">${new Date(d.created?.toDate()).toLocaleString()}</span>
        </div>
      `;
    });
    chatDiv.scrollTop = chatDiv.scrollHeight;
  });
}

async function sendMessage(e) {
  e.preventDefault();
  const msg = document.getElementById('chat-message').value.trim();
  if (!msg) return;
  await addDoc(collection(db, 'chats'), {
    room: getChatRoomId(),
    sender: auth.currentUser.email,
    message: msg, // (simple, not actually encrypted, just a label; add encryption if preferred)
    created: serverTimestamp(),
  });
  document.getElementById('chat-message').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  setupChat();
  document.getElementById('chat-form').onsubmit = sendMessage;
});

// If you want to support admin selecting a mentor to chat with, adjust `getChatRoomId` accordingly.