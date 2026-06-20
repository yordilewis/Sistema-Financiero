const API_BASE = 'http://localhost:5000/api';

function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

function logout() {
  sessionStorage.clear(); localStorage.removeItem('token'); localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

function fmt(n) {
  return 'RD$' + Number(n).toLocaleString('es-DO', { minimumFractionDigits: 0 });
}

function badgeEstado(e) {
  const map = { 'Activo':'badge-activo','Pagado':'badge-pagado','Atrasado':'badge-atraso','Pendiente':'badge-pending' };
  return `<span class="badge ${map[e]||'badge-pending'}">${e}</span>`;
}

function fmtFecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' });
}

// Cargar info usuario
(function() {
  const u = JSON.parse(sessionStorage.getItem('usuario') || localStorage.getItem('usuario') || '{}');
  if (u.nombreCompleto) {
    document.getElementById('userName').textContent = u.nombreCompleto;
    document.getElementById('userRole').textContent = u.nombreRol || '';
    document.getElementById('userAvatar').textContent = u.nombreCompleto.charAt(0).toUpperCase();
  }
})();

async function fetchDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error();
    const d = await res.json();
    document.getElementById('capitalActivo').textContent     = fmt(d.capitalActivo || 0);
    document.getElementById('totalClientes').textContent     = d.totalClientes || 0;
    document.getElementById('clientesNuevos').textContent    = `+${d.clientesNuevosMes || 0} este mes`;
    document.getElementById('cuotasPendientes').textContent  = d.cuotasPendientes || 0;
    document.getElementById('prestamosAtraso').textContent   = d.prestamosEnAtraso || 0;
    document.getElementById('montoAtraso').textContent       = fmt(d.montoEnAtraso || 0) + ' en mora';
  } catch {
    // demo
    document.getElementById('capitalActivo').textContent    = 'RD$485,000';
    document.getElementById('totalClientes').textContent    = '24';
    document.getElementById('clientesNuevos').textContent   = '+3 este mes';
    document.getElementById('cuotasPendientes').textContent = '18';
    document.getElementById('prestamosAtraso').textContent  = '4';
    document.getElementById('montoAtraso').textContent      = 'RD$52,000 en mora';
  }
}

async function fetchPrestamos() {
  const tbody = document.getElementById('tablaPrestamos');
  try {
    const res = await fetch(`${API_BASE}/dashboard/prestamos/recientes`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error();
    const list = await res.json();
    renderPrestamos(list);
  } catch {
    renderPrestamos([
      { idPrestamo:1, clienteNombre:'Carlos Mendoza', monto:25000, progreso:58, estado:'Activo', proximoPago:'2025-07-15' },
      { idPrestamo:2, clienteNombre:'Ana Jiménez',    monto:12000, progreso:50, estado:'Activo', proximoPago:'2025-07-10' },
      { idPrestamo:3, clienteNombre:'Luis Rodríguez', monto:40000, progreso:20, estado:'Atrasado', proximoPago:null },
      { idPrestamo:4, clienteNombre:'María García',   monto:8000,  progreso:100, estado:'Pagado', proximoPago:null },
      { idPrestamo:5, clienteNombre:'Pedro Santos',   monto:18000, progreso:33, estado:'Activo', proximoPago:'2025-07-20' },
    ]);
  }
}

function renderPrestamos(list) {
  const tbody = document.getElementById('tablaPrestamos');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Sin préstamos</td></tr>'; return; }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${p.clienteNombre}</td>
      <td>${fmt(p.monto)}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${p.progreso}%"></div></div>
          <span class="progress-pct">${p.progreso}%</span>
        </div>
      </td>
      <td>${badgeEstado(p.estado)}</td>
      <td>${fmtFecha(p.proximoPago)}</td>
    </tr>`).join('');
}

async function fetchAlertas() {
  const ul = document.getElementById('listaAlertas');
  try {
    const res = await fetch(`${API_BASE}/dashboard/alertas`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error();
    const list = await res.json();
    ul.innerHTML = list.length
      ? list.map(a => `<li>${a.mensaje}</li>`).join('')
      : '<li>Sin alertas activas</li>';
  } catch {
    ul.innerHTML = [
      'Luis Rodríguez - cuota vencida en P-003',
      'Carmen Díaz - cuota vencida en P-007',
      'Roberto Pérez - cuota vencida en P-011'
    ].map(m => `<li>${m}</li>`).join('');
  }
}

async function fetchCobrosHoy() {
  const ul = document.getElementById('listaCobros');
  try {
    const res = await fetch(`${API_BASE}/dashboard/cobros-hoy`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderCobros(data.cobros, data.total);
  } catch {
    renderCobros([
      { nombre:'Ana Jiménez',  monto:2000 },
      { nombre:'Pedro Santos', monto:3500 },
    ], 5500);
  }
}

function renderCobros(cobros, total) {
  const ul = document.getElementById('listaCobros');
  ul.innerHTML = cobros.length
    ? cobros.map(c => `<li><span class="cobro-nombre">${c.nombre}</span><span class="cobro-monto">${fmt(c.monto)}</span></li>`).join('')
    : '<li><span class="cobro-nombre">Sin cobros hoy</span></li>';
  document.getElementById('totalCobros').textContent = fmt(total || 0);
}

fetchDashboard();
fetchPrestamos();
fetchAlertas();
fetchCobrosHoy();
