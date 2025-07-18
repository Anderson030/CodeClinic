const API_URL = 'http://localhost:3000/tickets';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
  window.location.href = 'login.html';
}

window.addEventListener('load', () => {
  document.getElementById('welcome-user').textContent = `Bienvenido, ${user.username} (${user.role})`;

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });

  document.getElementById('ticket-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value;

    const newTicket = {
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
      body: JSON.stringify(newTicket)
    });

    e.target.reset();
    loadTickets();
  });

  document.getElementById('filter')?.addEventListener('change', loadTickets);

  if (user.role === 'TEAM_LEADER') {
    document.getElementById('stackoverflow-search').style.display = 'block';
  }

  loadTickets();
});

async function loadTickets() {
  const filterValue = document.getElementById('filter')?.value || 'all';
  let url = API_URL;

  if (filterValue !== 'all') {
    url += `?type=${filterValue}`;
  }

  const res = await fetch(url);
  const tickets = await res.json();

  const list = document.getElementById('ticket-list');
  list.innerHTML = '';

  tickets.forEach(t => {
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
        <button onclick="addComment('${t.id}')">Comentar</button>
      </div>
    `;

    // Solo mostrar botones si el ticket es del usuario actual
    if (t.username.toLowerCase() === user.username.toLowerCase()) {
      const btnContainer = document.createElement('div');
      btnContainer.style.marginTop = '10px';

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️ Editar';
      editBtn.onclick = () => editTicket(t.id);
      editBtn.classList.add('edit-btn');

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️ Eliminar';
      deleteBtn.onclick = () => deleteTicket(t.id);
      deleteBtn.classList.add('delete-btn');

      btnContainer.appendChild(editBtn);
      btnContainer.appendChild(deleteBtn);
      li.appendChild(btnContainer);
    }

    li.appendChild(document.createElement('hr'));
    list.appendChild(li);
  });
}

async function addComment(ticketId) {
  const commentInput = document.getElementById(`comment-${ticketId}`);
  const commentText = commentInput.value.trim();
  if (!commentText) return;

  const res = await fetch(`${API_URL}/${ticketId}`);
  const ticket = await res.json();

  const updatedComments = [...(ticket.comments || []), {
    author: user.username,
    text: commentText
  }];

  await fetch(`${API_URL}/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments: updatedComments })
  });

  commentInput.value = '';
  loadTickets();
}

async function deleteTicket(id) {
  const confirmDelete = confirm('¿Estás seguro de eliminar este ticket?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('No se pudo eliminar');
    loadTickets();
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
}

async function editTicket(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const ticket = await res.json();

  const nuevoTitulo = prompt('Nuevo título:', ticket.title);
  if (nuevoTitulo === null) return;

  const nuevaDescripcion = prompt('Nueva descripción:', ticket.description);
  if (nuevaDescripcion === null) return;

  await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: nuevoTitulo,
      description: nuevaDescripcion
    })
  });

  loadTickets();
}

async function buscarEnStackOverflow() {
  const query = document.getElementById('so-query').value.trim();
  if (!query) return;

  const res = await fetch(`https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow`);
  const data = await res.json();

  const resultContainer = document.getElementById('so-results');
  resultContainer.innerHTML = '';

  data.items.slice(0, 5).forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
    resultContainer.appendChild(li);
  });
}
