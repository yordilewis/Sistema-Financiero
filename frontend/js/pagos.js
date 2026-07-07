let pagosData = [];

function methodChip(m) {
  const cls = m === 'Efectivo' ? 'method-efectivo' : 'method-transferencia';
  return `<span class="method-chip ${cls}">${m}</span>`;
}

async function fetchPagos() {
  try {
    const res = await fetch(`${API_BASE}/pagos`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    pagosData = await res.json();
  } catch {
    pagosData = [
      { recibo: 'PG-098', cliente: 'Carlos Mendoza', prestamo: 'P-001', monto: 2500, fecha: '15 May 2026', metodo: 'Efectivo' },
      { recibo: 'PG-097', cliente: 'Ana Jiménez',    prestamo: 'P-002', monto: 2200, fecha: '14 May 2026', metodo: 'Transferencia' },
      { recibo: 'PG-096', cliente: 'Luisa Pérez',    prestamo: 'P-004', monto: 4100, fecha: '13 May 2026', metodo: 'Efectivo' },
      { recibo: 'PG-095', cliente: 'Carlos Mendoza', prestamo: 'P-001', monto: 2500, fecha: '01 May 2026', metodo: 'Efectivo' },
      { recibo: 'PG-094', cliente: 'Miguel Torres',  prestamo: 'P-005', monto: 1400, fecha: '28 Abr 2026', metodo: 'Transferencia' },
    ];
  }
  renderPagos();
  poblarSelects();
}

function renderPagos() {
  const tbody = document.getElementById('tablaPagos');
  if (!pagosData.length) { tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Sin pagos registrados</td></tr>'; return; }
  tbody.innerHTML = pagosData.map(p => `
    <tr>
      <td class="mono" style="color:var(--slate)">${p.recibo}</td>
      <td class="cell-strong">${p.cliente}</td>
      <td class="mono" style="color:var(--gold)">${p.prestamo}</td>
      <td class="mono" style="color:var(--green); font-weight:700">${fmt(p.monto)}</td>
      <td style="color:var(--slate)">${p.fecha}</td>
      <td>${methodChip(p.metodo)}</td>
    </tr>`).join('');
}

function poblarSelects() {
  const clientes = [...new Set(pagosData.map(p => p.cliente))];
  const prestamos = [...new Set(pagosData.map(p => p.prestamo))];
  const selCliente = document.getElementById('pagoCliente');
  const selPrestamo = document.getElementById('pagoPrestamo');
  clientes.forEach(c => selCliente.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
  prestamos.forEach(p => selPrestamo.insertAdjacentHTML('beforeend', `<option value="${p}">${p}</option>`));
}

async function handleRegistrarPago(e) {
  e.preventDefault();
  const cliente  = document.getElementById('pagoCliente').value;
  const prestamo = document.getElementById('pagoPrestamo').value;
  const monto    = parseFloat(document.getElementById('pagoMonto').value.replace(/[^\d.]/g, '')) || 0;
  const fecha    = document.getElementById('pagoFecha').value;
  const metodo   = document.getElementById('pagoMetodo').value;

  if (!cliente || !prestamo || !monto) return;

  const nuevoPago = {
    cliente, prestamo, monto, metodo,
    recibo: 'PG-' + Math.floor(100 + Math.random() * 900),
    fecha: fecha ? fmtFecha(fecha) : fmtFecha(new Date()),
  };

  try {
    const res = await fetch(`${API_BASE}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ cliente, prestamo, monto, fecha, metodo }),
    });
    if (!res.ok) throw new Error();
  } catch {
    // Sin backend disponible para pagos todavía: refleja el registro localmente.
  }

  pagosData.unshift(nuevoPago);
  renderPagos();
  document.getElementById('formPago').reset();
}

fetchPagos();
