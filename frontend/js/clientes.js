let clientesData = [];
let clienteSeleccionado = null;

async function fetchClientes() {
  try {
    const res = await fetch(`${API_BASE}/clientes`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    clientesData = await res.json();
  } catch {
    clientesData = [
      { id: 'C-001', nombre: 'Carlos',  apellido: 'Mendoza', telefono: '809-555-0101', cedula: '012-3456789-1', estado: 'Activo'   },
      { id: 'C-002', nombre: 'Ana',     apellido: 'Jiménez', telefono: '809-555-0202', cedula: '023-4567890-2', estado: 'Activo'   },
      { id: 'C-003', nombre: 'Roberto', apellido: 'Sosa',    telefono: '809-555-0303', cedula: '034-5678901-3', estado: 'Atrasado' },
      { id: 'C-004', nombre: 'Luisa',   apellido: 'Pérez',   telefono: '809-555-0404', cedula: '045-6789012-4', estado: 'Activo'   },
      { id: 'C-005', nombre: 'Miguel',  apellido: 'Torres',  telefono: '809-555-0505', cedula: '056-7890123-5', estado: 'Saldado'  },
    ];
  }
  renderClientes();
}

function valFiltro(id) { return (document.getElementById(id).value || '').trim().toLowerCase(); }

function renderClientes() {
  const f = {
    id: valFiltro('fId'), cedula: valFiltro('fCedula'), nombre: valFiltro('fNombre'),
    apellido: valFiltro('fApellido'), telefono: valFiltro('fTelefono'),
  };
  const list = clientesData.filter(c =>
    c.id.toLowerCase().includes(f.id) &&
    c.cedula.toLowerCase().includes(f.cedula) &&
    c.nombre.toLowerCase().includes(f.nombre) &&
    c.apellido.toLowerCase().includes(f.apellido) &&
    c.telefono.toLowerCase().includes(f.telefono)
  );
  const tbody = document.getElementById('tablaClientes');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Sin resultados</td></tr>'; return; }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td class="mono" style="color:var(--gold); font-weight:700">${c.id}</td>
      <td>
        <div class="name-cell">
          <div class="avatar-chip">${initials(c.nombre + ' ' + c.apellido)}</div>
          <span class="cell-strong">${c.nombre}</span>
        </div>
      </td>
      <td class="cell-strong">${c.apellido}</td>
      <td class="mono">${c.telefono}</td>
      <td class="mono" style="color:var(--slate)">${c.cedula}</td>
      <td>${badgeEstado(c.estado)}</td>
      <td style="text-align:right">
        <button class="btn-dark" onclick='abrirCrearPrestamo(${JSON.stringify(c)})'>
          <span class="icon" data-icon="plus" data-size="12"></span> Crear Préstamo
        </button>
      </td>
    </tr>`).join('');
  renderIcons(tbody);
}

// ── Registro de cliente ──────────────────────────────────────
function abrirRegistro() { openModal('modalRegistro'); }

async function guardarCliente(e) {
  e.preventDefault();
  const nombre   = document.getElementById('rNombre').value.trim();
  const apellido = document.getElementById('rApellido').value.trim();
  const telefono = document.getElementById('rTelefono').value.trim();
  const cedula   = document.getElementById('rCedula').value.trim() || '000-0000000-0';
  if (!nombre || !apellido || !telefono) return;

  try {
    const res = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ nombre, apellido, telefono, cedula, direccion: '' })
    });
    if (!res.ok) throw new Error();
  } catch {
    alert('No se pudo registrar el cliente. Verifica que el servidor esté activo.');
    return;
  }

  document.getElementById('formRegistro').reset();
  closeModal('modalRegistro');
  fetchClientes(); // recarga la lista desde la base de datos
}

// ── Crear préstamo ───────────────────────────────────────────
function abrirCrearPrestamo(cliente) {
  clienteSeleccionado = cliente;
  document.getElementById('prestamoModalTitle').textContent = 'Crear Préstamo';
  document.getElementById('prestamoFormView').classList.remove('hidden');
  document.getElementById('prestamoSuccessView').classList.add('hidden');
  document.getElementById('formPrestamo').reset();

  const badgeClass = cliente.estado === 'Atrasado' ? 'badge-atraso' : cliente.estado === 'Saldado' ? 'badge-saldado' : 'badge-activo';
  document.getElementById('prestamoClienteCard').innerHTML = `
    <div class="entity-main">
      <div class="entity-avatar">${initials(cliente.nombre + ' ' + cliente.apellido)}</div>
      <div class="entity-meta">
        <div class="entity-tag">ID Cliente</div>
        <div class="entity-id">${cliente.id}</div>
        <div class="entity-name">${cliente.nombre} ${cliente.apellido}</div>
      </div>
    </div>
    <div class="entity-side">
      <span class="badge ${badgeClass}">Cliente ${cliente.estado}</span>
      <div class="entity-phone"><span class="icon" data-icon="phone" data-size="13"></span>${cliente.telefono}</div>
    </div>`;
  openModal('modalPrestamo');
}

async function aprobarPrestamo(e) {
  e.preventDefault();
  const montoRaw   = document.getElementById('pMonto').value.replace(/[^\d.]/g, '');
  const monto      = parseFloat(montoRaw) || 0;
  const plazo      = parseInt(document.getElementById('pPlazo').value) || 0;
  const interesRaw = document.getElementById('pInteres').value.replace(/[^\d.]/g, '');
  const interes    = parseFloat(interesRaw) || 0;
  const frecuencia = document.getElementById('pFrecuencia').value;
  if (!monto || !plazo) return;

  let idPrestamo = '';
  try {
    const res = await fetch(`${API_BASE}/prestamos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        idCliente: clienteSeleccionado.idCliente || parseInt(String(clienteSeleccionado.id).replace(/\D/g, '')),
        monto, interes, cantidadCuotas: plazo, frecuencia
      })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    idPrestamo = 'P-' + String(data.idPrestamo).padStart(3, '0');
  } catch {
    alert('No se pudo crear el préstamo. Verifica que el servidor esté activo.');
    return;
  }

  document.getElementById('approveId').textContent      = idPrestamo;
  document.getElementById('approveMonto').textContent   = fmt(monto);
  document.getElementById('approveInteres').textContent = interes + '%';
  document.getElementById('approveCuotas').textContent  = `${plazo} pagos`;
  document.getElementById('prestamoModalTitle').textContent = 'Confirmación Préstamo';
  document.getElementById('prestamoFormView').classList.add('hidden');
  const success = document.getElementById('prestamoSuccessView');
  success.classList.remove('hidden');
  renderIcons(success);
}

// Filtrado en vivo a medida que se escribe.
['fId', 'fCedula', 'fNombre', 'fApellido', 'fTelefono'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderClientes);
});

fetchClientes();