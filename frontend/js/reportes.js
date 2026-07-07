async function fetchReportes() {
  try {
    const res = await fetch(`${API_BASE}/reportes`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderBarChart(data.meses, data.peakIndex);
    renderRevCards(data.metricas);
  } catch {
    renderBarChart([
      { mes: 'Ene', pct: 65 }, { mes: 'Feb', pct: 80 }, { mes: 'Mar', pct: 55 }, { mes: 'Abr', pct: 90 },
      { mes: 'May', pct: 70 }, { mes: 'Jun', pct: 85 }, { mes: 'Jul', pct: 75 }, { mes: 'Ago', pct: 60 },
      { mes: 'Sep', pct: 95 }, { mes: 'Oct', pct: 78 }, { mes: 'Nov', pct: 88 }, { mes: 'Dic', pct: 72 },
    ], 4);
    renderRevCards([
      { label: 'Intereses cobrados (Mayo)', value: 8400,  delta: '+12% vs Abril', good: true },
      { label: 'Capital recuperado',         value: 31200, delta: '+8% vs Abril',  good: true },
      { label: 'Pérdidas por atraso',        value: 1200,  delta: '+4% vs Abril',  good: false },
    ]);
  }
}

function renderBarChart(meses, peakIndex) {
  const el = document.getElementById('barChart');
  el.innerHTML = meses.map((m, i) => `
    <div class="bar-col">
      <div class="bar-fill ${i === peakIndex ? 'peak' : ''}" style="height:${m.pct}%"></div>
      <span class="bar-label ${i === peakIndex ? 'peak' : ''}">${m.mes}</span>
    </div>`).join('');
}

function renderRevCards(metricas) {
  const el = document.getElementById('revCards');
  el.innerHTML = metricas.map(r => `
    <div class="rev-card">
      <div class="rev-label">${r.label}</div>
      <div class="rev-value">${fmt(r.value)}</div>
      <div class="rev-delta ${r.good ? 'good' : 'bad'}">${r.delta}</div>
    </div>`).join('');
}

fetchReportes();
