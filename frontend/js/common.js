const API_BASE = '/api';

function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

function logout() {
  sessionStorage.clear(); localStorage.removeItem('token'); localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

function fmt(n) {
  return 'RD$' + Number(n).toLocaleString('es-DO', { minimumFractionDigits: 0 });
}

function badgeEstado(e) {
  const map = { 'Activo':'badge-activo','Pagado':'badge-pagado','Saldado':'badge-saldado','Atrasado':'badge-atraso','Pendiente':'badge-pending' };
  return `<span class="badge ${map[e]||'badge-pending'}">${e}</span>`;
}

function fmtFecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' });
}

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

(function() {
  const u = JSON.parse(sessionStorage.getItem('usuario') || localStorage.getItem('usuario') || '{}');
  if (u.nombreCompleto) {
    document.getElementById('userName').textContent = u.nombreCompleto;
    document.getElementById('userRole').textContent = u.nombreRol || '';
    document.getElementById('userAvatar').textContent = u.nombreCompleto.charAt(0).toUpperCase();
  }
})();

// ── Modal helpers ────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  renderIcons(el);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});
