const API_BASE = 'http://localhost:5000/api';

function togglePassword() {
  const pw = document.getElementById('password');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btnLogin');
  const errDiv = document.getElementById('loginError');
  errDiv.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  const usuario = document.getElementById('usuario').value.trim();
  const clave   = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: usuario, clave })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.mensaje || 'Credenciales incorrectas');
    }

    const data = await res.json();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', data.token);
    storage.setItem('usuario', JSON.stringify(data.usuario));
    window.location.href = 'dashboard.html';
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
}
