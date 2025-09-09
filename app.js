// ===============================
// 100% FRONTEND (sin backend)
// ===============================

// --- Referencias de UI
const aparicionSel = document.getElementById('aparicion');
const gravedadSel  = document.getElementById('gravedad');
const btnCalcular  = document.getElementById('btnCalcular');
const btnLimpiar   = document.getElementById('btnLimpiar');
const btnErrorSentry = document.getElementById('btnErrorSentry');

const resultado    = document.getElementById('resultado');
const rNivel       = document.getElementById('resultadoNivel');
const rValor       = document.getElementById('resultadoValor');
const rRecom       = document.getElementById('resultadoRecom');
const rIcono       = document.getElementById('resultadoIcono');

const desc         = document.getElementById('descripcion');
const descContador = document.getElementById('descContador');
const tablaMatriz  = document.getElementById('tablaMatriz');

// --- Catálogos
const DATA_NIVELES_APARICION = [
  { nombre: 'MUY BAJA', valor: 1, descripcion: 'Ocurre rara vez' },
  { nombre: 'BAJA',     valor: 2, descripcion: 'Ocurre poco' },
  { nombre: 'MEDIA',    valor: 3, descripcion: 'Ocurre ocasionalmente' },
  { nombre: 'ALTA',     valor: 4, descripcion: 'Ocurre frecuentemente' },
  { nombre: 'MUY ALTA', valor: 5, descripcion: 'Ocurre casi siempre' },
];

const DATA_NIVELES_GRAVEDAD = [
  { nombre: 'MUY BAJO', valor: 1, descripcion: 'Impacto mínimo' },
  { nombre: 'BAJO',     valor: 2, descripcion: 'Impacto menor' },
  { nombre: 'MEDIO',    valor: 3, descripcion: 'Impacto moderado' },
  { nombre: 'ALTO',     valor: 4, descripcion: 'Impacto alto' },
  { nombre: 'MUY ALTO', valor: 5, descripcion: 'Impacto crítico' },
];

// Contador de caracteres
desc?.addEventListener('input', () => {
  const v = desc.value.slice(0, 300);
  if (v !== desc.value) desc.value = v;
  descContador.textContent = `${v.length}/300`;
});

// Helpers UI
function fillSelect(select, items, placeholder) {
  if (!select) return;
  select.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = placeholder;
  select.appendChild(opt0);

  items.forEach((n) => {
    const opt = document.createElement('option');
    opt.value = n.valor;
    opt.textContent = `${n.nombre} (${n.valor}) - ${n.descripcion}`;
    select.appendChild(opt);
  });
}

function resetResultado() {
  if (!resultado) return;
  resultado.hidden = true;
  rNivel.textContent = '—';
  rValor.textContent = '—';
  rRecom.textContent = '—';
  rIcono.className = 'bi';
}

function limpiarSeleccion() {
  tablaMatriz?.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
}

function resaltarCelda(a, g) {
  if (!tablaMatriz) return;
  limpiarSeleccion();
  const box = tablaMatriz.querySelector(`td[data-aparicion="${a}"][data-gravedad="${g}"] .cell`);
  if (box) box.classList.add('selected');
}

function onSelectChange() {
  if (!aparicionSel.value || !gravedadSel.value) {
    resetResultado();
    limpiarSeleccion();
  } else {
    resaltarCelda(aparicionSel.value, gravedadSel.value);
  }
}
aparicionSel?.addEventListener('change', onSelectChange);
gravedadSel ?.addEventListener('change', onSelectChange);

function cargarNivelesLocal() {
  fillSelect(aparicionSel, DATA_NIVELES_APARICION, 'Selecciona un nivel…');
  fillSelect(gravedadSel,  DATA_NIVELES_GRAVEDAD,  'Selecciona un nivel…');
  aparicionSel.disabled = false;
  gravedadSel.disabled  = false;
}

// Render de la matriz 5x5
function renderMatriz() {
  if (!tablaMatriz) return;
  tablaMatriz.innerHTML = '';

  const thead = document.createElement('thead');
  const tr1 = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  corner.rowSpan = 2;
  corner.innerHTML = `🎯 APARICIÓN<br><small>(PROBABILIDAD)</small>`;
  tr1.appendChild(corner);

  const hgh = document.createElement('th');
  hgh.className = 'hgh';
  hgh.colSpan = 5;
  hgh.textContent = '💥 GRAVEDAD (IMPACTO)';
  tr1.appendChild(hgh);
  thead.appendChild(tr1);

  const tr2 = document.createElement('tr');
  getLabelsGravedad().forEach((t, i) => {
    const th = document.createElement('th');
    th.innerHTML = `${t}<br><small>${i + 1}</small>`;
    tr2.appendChild(th);
  });
  thead.appendChild(tr2);
  tablaMatriz.appendChild(thead);

  const tbody = document.createElement('tbody');
  const labelsA = getLabelsAparicion();
  for (let a = 5; a >= 1; a--) {
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.className = 'lbl-ap';
    th.innerHTML = `${labelsA[5 - a]}<br><small>${a}</small>`;
    tr.appendChild(th);

    for (let g = 1; g <= 5; g++) {
      const td = document.createElement('td');
      td.dataset.aparicion = a;
      td.dataset.gravedad  = g;

      const value = a * g;
      td.className = nivelClass(value);

      const box = document.createElement('div');
      box.className = 'cell';
      box.textContent = value;

      td.addEventListener('click', () => {
        aparicionSel.value = String(a);
        gravedadSel.value  = String(g);
        resaltarCelda(aparicionSel.value, gravedadSel.value);
      });

      td.appendChild(box);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
  tablaMatriz.appendChild(tbody);
}

function getLabelsGravedad() { return ['MUY BAJO', 'BAJO', 'MEDIO', 'ALTO', 'MUY ALTO']; }
function getLabelsAparicion() { return ['MUY ALTA', 'ALTA', 'MEDIA', 'BAJA', 'MUY BAJA']; }
function nivelClass(v) {
  if (v <= 3)  return 'marginal';
  if (v <= 8)  return 'aceptable';
  if (v <= 16) return 'importante';
  return 'muygrave';
}

// Lógica de cálculo
function calcularLocal(apar, grav) {
  const valor = apar * grav;
  let nivel, recomendacion;

  if (valor <= 3) { nivel = 'Marginal'; recomendacion = 'Monitoreo normal.'; }
  else if (valor <= 8) { nivel = 'Aceptable'; recomendacion = 'Mitigar cuando sea posible.'; }
  else if (valor <= 16) { nivel = 'Importante'; recomendacion = 'Planificar acciones de reducción.'; }
  else { nivel = 'Muy Grave'; recomendacion = 'Acción inmediata.'; }

  return { valor, nivel, recomendacion };
}

async function calcular() {
  const apar = parseInt(aparicionSel.value, 10);
  const grav = parseInt(gravedadSel.value, 10);
  if (!apar || !grav) return;

  // Log a Sentry (nivel info)
  Sentry.captureMessage('[Riesgo] Inicio de cálculo', {
    level: 'info',
    extra: {
      apar, grav, descripcion: (desc?.value || '')
    }
  });

  btnCalcular.disabled = true;
  btnCalcular.innerHTML = '<i class="bi bi-hourglass-split"></i> Calculando...';

  try {
    const data = calcularLocal(apar, grav);

    resultado.hidden = false;
    rNivel.textContent = data.nivel ?? '—';
    rValor.textContent = data.valor ?? '—';
    rRecom.textContent = data.recomendacion ?? '—';

    rIcono.className = 'bi';
    const lvl = (data.nivel || '').toUpperCase();
    if (lvl.includes('MARGINAL'))        rIcono.classList.add('bi-emoji-smile');
    else if (lvl.includes('ACEPTABLE'))  rIcono.classList.add('bi-emoji-neutral');
    else if (lvl.includes('IMPORTANTE')) rIcono.classList.add('bi-emoji-dizzy');
    else if (lvl.includes('MUY GRAVE'))  rIcono.classList.add('bi-emoji-angry');
    else                                 rIcono.classList.add('bi-question-circle');

    resaltarCelda(apar, grav);

    // Log de resultado
    Sentry.captureMessage('[Riesgo] Cálculo completado', {
      level: 'info',
      extra: { valor: data.valor, nivel: data.nivel, recomendacion: data.recomendacion }
    });

  } finally {
    btnCalcular.disabled = false;
    btnCalcular.innerHTML = '<i class="bi bi-rocket-takeoff"></i> Calcular';
  }
}

function limpiar() {
  aparicionSel.selectedIndex = 0;
  gravedadSel.selectedIndex  = 0;
  if (desc) { desc.value = ''; descContador.textContent = '0/300'; }
  resetResultado();
  limpiarSeleccion();
}

// --- Botón: error de prueba hacia Sentry ---
btnErrorSentry?.addEventListener('click', async () => {
  try {
    const ctx = {
      descripcion: desc?.value || '',
      aparicion: aparicionSel?.value || null,
      gravedad: gravedadSel?.value || null,
    };

    const err = new Error('UIManualTestError: error de prueba desde el botón');
    err.name = 'UIManualTestError';

    // Usar la nueva función helper
    sendErrorToSentry(err, {
      source: 'ui-test-button',
      context: ctx
    });

    await new Promise(r => setTimeout(r, 1200));
    alert('✅ Se envió un error de prueba a Sentry. Revisa Issues.');
  } catch (e) {
    console.error('No se pudo enviar a Sentry', e);
    alert('⚠️ No se pudo enviar el error a Sentry (ver consola).');
  }
});

btnCalcular?.addEventListener('click', calcular);
btnLimpiar ?.addEventListener('click', limpiar);

// Boot
renderMatriz();
cargarNivelesLocal();
resetResultado();

// Un mensaje de arranque (log informativo a Sentry)
Sentry.captureMessage('[Riesgo] App lista', {
  level: 'info',
  extra: { 
    href: location.href,
    env: 'production' // Valor fijo en lugar de usar getCurrentHub
  }
});

// Función helper para logs
function sendToSentry(message, level = 'info', extra = {}) {
  if (window.Sentry) {
    Sentry.captureMessage(message, {
      level: level,
      extra: extra
    });
  }
}

// Función helper para errores
function sendErrorToSentry(error, extra = {}) {
  if (window.Sentry) {
    Sentry.captureException(error, {
      extra: extra
    });
  }
}
