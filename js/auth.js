const API_USERS = 'http://localhost:3001/users';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      const res = await fetch(`${API_USERS}?username=${username}&password=${password}`);
      const users = await res.json();

      if (users.length > 0) {
        localStorage.setItem('user', JSON.stringify(users[0]));
        window.location.href = 'index.html';
      } else {
        alert('Credenciales incorrectas');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;

      const user = { username, password, role };
      await fetch(API_USERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      alert('Usuario registrado, ahora inicia sesión');
      window.location.href = 'login.html';
    });
  }
});
