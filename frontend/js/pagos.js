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
    pagosData = [];
  }
  renderPagos();
  poblarPrestamos();
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

async function poblarPrestamos() {
  const selPrestamo = document.getElementById('pagoPrestamo');
  const selCliente  = document.getElementById('pagoCliente');
  selPrestamo.length = 1; // conserva "Seleccionar préstamo"
  selCliente.length  = 1; // conserva "Seleccionar cliente"
  try {
    const res = await fetch(`${API_BASE}/prestamos`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    const prestamos = await res.json();
    prestamos.forEach(p => selPrestamo.insertAdjacentHTML('beforeend',
      `<option value="${p.idPrestamo}">${p.id} · ${p.cliente}</option>`));
    [...new Set(prestamos.map(p => p.cliente))].forEach(c =>
      selCliente.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
  } catch {}
}

async function handleRegistrarPago(e) {
  e.preventDefault();
  const idPrestamo = parseInt(document.getElementById('pagoPrestamo').value) || 0;
  const monto  = parseFloat(document.getElementById('pagoMonto').value.replace(/[^\d.]/g, '')) || 0;
  const fecha  = document.getElementById('pagoFecha').value;
  const metodo = document.getElementById('pagoMetodo').value;
  if (!idPrestamo || !monto) { alert('Selecciona un préstamo e ingresa el monto.'); return; }

  try {
    const res = await fetch(`${API_BASE}/pagos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ idPrestamo, monto, fecha: fecha || null, metodo })
    });
    if (!res.ok) throw new Error();
  } catch {
    alert('No se pudo registrar el pago. Verifica que el servidor esté activo.');
    return;
  }

  document.getElementById('formPago').reset();
  fetchPagos();
}

fetchPagos();