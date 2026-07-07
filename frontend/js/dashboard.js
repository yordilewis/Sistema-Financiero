async function fetchDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    const d = await res.json();
    document.getElementById('capitalActivo').textContent     = fmt(d.capitalActivo || 0);
    document.getElementById('totalClientes').textContent     = d.totalClientes || 0;
    document.getElementById('clientesNuevos').textContent    = `+${d.clientesNuevosMes || 0} este mes`;
    document.getElementById('cuotasPendientes').textContent  = d.cuotasPendientes || 0;
    document.getElementById('prestamosAtraso').textContent   = d.prestamosEnAtraso || 0;
    document.getElementById('montoAtraso').textContent       = fmt(d.montoEnAtraso || 0) + ' en mora';
  } catch {
    document.getElementById('capitalActivo').textContent    = 'RD$485,000';
    document.getElementById('totalClientes').textContent    = '24';
    document.getElementById('clientesNuevos').textContent   = '+3 este mes';
    document.getElementById('cuotasPendientes').textContent = '18';
    document.getElementById('prestamosAtraso').textContent  = '4';
    document.getElementById('montoAtraso').textContent      = 'RD$52,000 en mora';
  }
}

async function fetchPrestamos() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/prestamos/recientes`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    renderPrestamos(await res.json());
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
      <td>
        <div class="name-cell">
          <div class="avatar-chip">${initials(p.clienteNombre)}</div>
          <span class="cell-strong">${p.clienteNombre}</span>
        </div>
      </td>
      <td class="mono cell-strong">${fmt(p.monto)}</td>
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
  try {
    const res = await fetch(`${API_BASE}/dashboard/alertas`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    const list = await res.json();
    renderAlertas(list.map(a => a.mensaje));
  } catch {
    renderAlertas([
      'Luis Rodríguez - cuota vencida en P-003',
      'Carmen Díaz - cuota vencida en P-007',
      'Roberto Pérez - cuota vencida en P-011'
    ]);
  }
}

function renderAlertas(mensajes) {
  const ul = document.getElementById('listaAlertas');
  ul.innerHTML = mensajes.length
    ? mensajes.map(m => `<li><span class="icon" data-icon="alert" data-size="15"></span><span>${m}</span></li>`).join('')
    : '<li>Sin alertas activas</li>';
  renderIcons(ul);
}

async function fetchCobrosHoy() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/cobros-hoy`, { headers: authHeaders() });
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
    ? cobros.map(c => `<li><span class="cobro-nombre"><span class="avatar-chip">${initials(c.nombre)}</span>${c.nombre}</span><span class="cobro-monto">${fmt(c.monto)}</span></li>`).join('')
    : '<li><span class="cobro-nombre">Sin cobros hoy</span></li>';
  document.getElementById('totalCobros').textContent = fmt(total || 0);
}

fetchDashboard();
fetchPrestamos();
fetchAlertas();
fetchCobrosHoy();
