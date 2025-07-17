const API_URL = 'http://localhost:3001/tickets';
const user = JSON.parse(localStorage.getItem('user'));

// Si no hay usuario logueado, redirigir
if (!user) {
  window.location.href = './views/dashboard.html';
}

// Mostrar nombre del usuario
document.addEventListener('DOMContentLoaded', () => {
  const welcome = document.getElementById('welcome-user');
  if (welcome) {
    welcome.textContent = `Bienvenido, ${user.username} (${user.role})`;
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }

  const form = document.getElementById('ticket-form');
  const filter = document.getElementById('filter');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const type = document.getElementById('type').value;
      const description = document.getElementById('description').value;

      const ticket = {
        title,
        type,
        description,
        createdAt: new Date().toISOString(),
        username: user.username,
        comments: []
      };

      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });

      form.reset();
      loadTickets();
    });
  }

  if (filter) {
    filter.addEventListener('change', loadTickets);
  }

  loadTickets();
});

async function loadTickets() {
  const res = await fetch(API_URL);
  let tickets = await res.json();

  const filterValue = document.getElementById('filter')?.value || 'all';
  const list = document.getElementById('ticket-list');
  list.innerHTML = '';

  tickets
    .filter(t => filterValue === 'all' || t.type === filterValue)
    .forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = `
        <b>${t.title}</b> [${t.type}]<br>
        ${t.description}<br>
        <small>Por ${t.username} – ${new Date(t.createdAt).toLocaleString()}</small>

        <div style="margin-top: 10px;">
          <h4>Comentarios:</h4>
          <ul id="comments-${t.id}">
            ${(t.comments || []).map(c => `<li><b>${c.author}:</b> ${c.text}</li>`).join('')}
          </ul>
          <input type="text" id="comment-${t.id}" placeholder="Escribe un comentario" style="width: 80%;">
          <button onclick="addComment(${t.id})">Comentar</button>
        </div>
        <hr>`;
      list.appendChild(li);
    });
}

async function addComment(ticketId) {
  const commentInput = document.getElementById(`comment-${ticketId}`);
  const commentText = commentInput.value.trim();

  if (!commentText) return;

  const res = await fetch(`${API_URL}/${ticketId}`);
  const ticket = await res.json();

  const newComment = {
    author: user.username,
    text: commentText
  };

  const updatedComments = [...(ticket.comments || []), newComment];

  await fetch(`${API_URL}/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments: updatedComments })
  });

  commentInput.value = '';
  loadTickets();
}
