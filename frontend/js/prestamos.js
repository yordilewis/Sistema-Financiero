let prestamosData = [];
let filtroEstado = 'Todos';
let busquedaPrestamo = '';
let gestionActual = null;   // préstamo en gestión
let accionSeleccionada = null;

async function fetchPrestamosFull() {
  try {
    const res = await fetch(`${API_BASE}/prestamos`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    prestamosData = await res.json();
  } catch {
    prestamosData = [
      { id: 'P-001', cliente: 'Carlos Mendoza', telefono: '809-555-0101', monto: 25000, tasa: '5%', cuotas: 12, pagadas: 7,  estado: 'Activo',   proximoPago: '22 May' },
      { id: 'P-002', cliente: 'Ana Jiménez',    telefono: '809-555-0202', monto: 12000, tasa: '4%', cuotas: 6,  pagadas: 3,  estado: 'Activo',   proximoPago: '18 May' },
      { id: 'P-003', cliente: 'Roberto Sosa',   telefono: '809-555-0303', monto: 30000, tasa: '5%', cuotas: 18, pagadas: 5,  estado: 'Atrasado', proximoPago: 'Vencida' },
      { id: 'P-004', cliente: 'Luisa Pérez',    telefono: '809-555-0404', monto: 50000, tasa: '6%', cuotas: 24, pagadas: 12, estado: 'Activo',   proximoPago: '25 May' },
      { id: 'P-005', cliente: 'Miguel Torres',  telefono: '809-555-0505', monto: 15000, tasa: '4%', cuotas: 12, pagadas: 12, estado: 'Saldado',  proximoPago: '—' },
    ];
  }
  
  renderPrestamosFull();
}

function pct(l) { return l.cuotas ? Math.round((l.pagadas / l.cuotas) * 100) : 0; }

function renderStats() {
  const activos = prestamosData.filter(l => l.estado === 'Activo');
  document.getElementById('sumActivos').textContent  = activos.length;
  document.getElementById('sumAtraso').textContent   = prestamosData.filter(l => l.estado === 'Atrasado').length;
  document.getElementById('sumSaldados').textContent = prestamosData.filter(l => l.estado === 'Saldado').length;
  document.getElementById('sumCapital').textContent  = fmt(activos.reduce((s, l) => s + l.monto, 0));
}

function renderPrestamosFull() {
  renderStats();
  const list = prestamosData.filter(l =>
    (filtroEstado === 'Todos' || l.estado === filtroEstado) &&
    (l.cliente.toLowerCase().includes(busquedaPrestamo) || l.id.toLowerCase().includes(busquedaPrestamo))
  );
  const tbody = document.getElementById('tablaPrestamosFull');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" class="loading-row">Sin préstamos</td></tr>'; return; }
  tbody.innerHTML = list.map(l => {
    const p = pct(l);
    const vencida = l.proximoPago === 'Vencida';
    return `
    <tr>
      <td class="mono" style="color:var(--gold); font-weight:700">${l.id}</td>
      <td class="cell-strong">${l.cliente}</td>
      <td class="mono cell-strong">${fmt(l.monto)}</td>
      <td style="color:var(--slate)">${l.tasa}</td>
      <td style="width:150px">
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>
          <span class="progress-pct">${p}%</span>
        </div>
      </td>
      <td>${badgeEstado(l.estado)}</td>
      <td style="${vencida ? 'color:var(--red);font-weight:700' : 'color:var(--slate)'}">${l.proximoPago}</td>
      <td style="text-align:right"><button class="btn-outline" onclick="abrirGestion('${l.id}')">Gestionar</button></td>
    </tr>`;
  }).join('');
  renderIcons(tbody);
}

// ── Gestionar préstamo ───────────────────────────────────────
function abrirGestion(id) {
  gestionActual = prestamosData.find(l => l.id === id);
  if (!gestionActual) return;
  accionSeleccionada = null;

  const l = gestionActual;
  const p = pct(l);
  const badgeClass = l.estado === 'Atrasado' ? 'badge-atraso' : l.estado === 'Saldado' ? 'badge-saldado' : 'badge-activo';
  document.getElementById('gestionCard').className = 'entity-card' + (l.estado === 'Atrasado' ? ' warn' : '');
  document.getElementById('gestionCard').innerHTML = `
    <div class="entity-main">
      <div class="entity-avatar">${initials(l.cliente)}</div>
      <div class="entity-meta">
        <div class="entity-tag">Préstamo ${l.id}</div>
        <div class="entity-name">${l.cliente}</div>
        <div class="entity-phone"><span class="icon" data-icon="phone" data-size="13"></span>${l.telefono}</div>
        <div class="entity-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>
          ${p}% · ${l.pagadas} de ${l.cuotas} cuotas
        </div>
      </div>
    </div>
    <div class="entity-side">
      <span class="badge ${badgeClass}">${l.estado}</span>
      <div class="entity-tag">Monto Original</div>
      <div class="entity-amount">${fmt(l.monto)}</div>
    </div>`;

  // Reset acciones/detalle
  document.querySelectorAll('#accionesList .action-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('detallePago').classList.add('hidden');
  document.getElementById('gMonto').value = '';
  document.getElementById('gMetodo').value = 'Efectivo';
  openModal('modalGestion');
}

function seleccionarAccion(el) {
  document.querySelectorAll('#accionesList .action-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  accionSeleccionada = el.dataset.action;
  document.getElementById('detallePago').classList.toggle('hidden', accionSeleccionada !== 'Parcial');
}

function confirmarGestion() {
  if (!gestionActual || !accionSeleccionada) return;
  const l = gestionActual;

  if (accionSeleccionada === 'Atrasado') {
    l.estado = 'Atrasado';
    l.proximoPago = 'Vencida';
  } else if (accionSeleccionada === 'Saldado') {
    l.estado = 'Saldado';
    l.pagadas = l.cuotas;
    l.proximoPago = '—';
  } else if (accionSeleccionada === 'Parcial') {
    l.pagadas = Math.min(l.pagadas + 1, l.cuotas);
    if (l.pagadas >= l.cuotas) {
      l.estado = 'Saldado';
      l.proximoPago = '—';
    } else {
      l.estado = 'Activo';
    }
  }

  persistirCambios();
  closeModal('modalGestion');
  renderPrestamosFull();
}

// Persiste cambios de préstamos originados en esta sesión (los "nuevos" en localStorage).
function persistirCambios() {
  const nuevosIds = new Set(JSON.parse(localStorage.getItem('nuevosPrestamos') || '[]').map(p => p.id));
  const actualizados = prestamosData.filter(p => nuevosIds.has(p.id));
  if (actualizados.length) localStorage.setItem('nuevosPrestamos', JSON.stringify(actualizados));
}

// ── Filtros ──────────────────────────────────────────────────
document.getElementById('filterGroup').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filtroEstado = btn.dataset.filter;
  renderPrestamosFull();
});

document.getElementById('buscarPrestamo').addEventListener('input', (e) => {
  busquedaPrestamo = e.target.value.trim().toLowerCase();
  renderPrestamosFull();
});

fetchPrestamosFull();
