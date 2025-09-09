/* =========================================================================
   Calculadora de Riesgo (100% frontend, sin backend)
   - Lógica de UI
   - Logs útiles a consola (Sentry los levanta con consoleLoggingIntegration)
   - Traza manual básica con Sentry.startSpan (si está disponible)
   - Botón de “error de prueba” que envía un evento a Sentry
   ========================================================================= */

'use strict';

const S = window.Sentry; // acceso corto

// Utilidad: marcar migas en Sentry (no obligatorio pero útil)
function breadcrumb(category, message, data) {
  try {
    S?.addBreadcrumb?.({ level: 'info', category, message, data });
  } catch {}
}

// Utilidad: span manual si existe Tracing
async function withSpan(name, fn) {
  if (S?.startSpan) {
    return S.startSpan({ name }, fn);
  }
  return fn();
}

/* =============================
   Referencias a elementos
============================= */
const aparicionSel    = document.getElementById('aparicion');
const gravedadSel     = document.getElementById('gravedad');
const btnCalcular     = document.getElementById('btnCalcular');
const btnLimpiar      = document.getElementById('btnLimpiar');
const btnErrorSentry  = document.getElementById('btnErrorSentry');

const resultado       = document.getElementById('resultado');
const rNivel          = document.getElementById('resultadoNivel');
const rValor          = document.getElementById('resultadoValor');
const rRecom          = document.getElementById('resultadoRecom');
const rIcono          = document.getElementById('resultadoIcono');

const desc            = document.getElementById('descripcion');
const descContador    = document.getElementById('descContador');
const tablaMatriz     = document.getElementById('tablaMatriz');

/* =============================
   Datos base
============================= */
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

/* =============================
   UI: helpers
============================= */
desc?.addEventListener('input', () => {
  const v = desc.value.slice(0, 300);
  if (v !== desc.value) desc.value = v;
  if (descContador) descContador.textContent = `${v.length}/300`;
});

function fillSelect(select, items, placeholder) {
  if (!select) return;
  select.innerHTML = '';
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = placeholder;
  select.appendChild(opt0);

  for (const n of items) {
    const opt = document.createElement('option');
    opt.value = n.valor;
    opt.textContent = `${n.nombre} (${n.valor}) - ${n.descripcion}`;
    select.appendChild(opt);
  }
}

function resetResultado() {
  if (!resultado) return;
  resultado.hidden = true;
  if (rNivel) rNivel.textContent = '—';
  if (rValor) rValor.textContent = '—';
  if (rRecom) rRecom.textContent = '—';
  if (rIcono) rIcono.className = 'bi';
}

function limpiarSeleccion() {
  tablaMatriz?.querySelectorAll('.cell.selected').forEach((el) => el.classList.remove('selected'));
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
  if (aparicionSel) aparicionSel.disabled = false;
  if (gravedadSel) gravedadSel.disabled  = false;
  if (btnCalcular) btnCalcular.disabled  = false;
}

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
        if (aparicionSel) aparicionSel.value = String(a);
        if (gravedadSel)  gravedadSel.value  = String(g);
        resaltarCelda(a, g);
        breadcrumb('ui.select', 'Seleccionada celda matriz', { aparicion: a, gravedad: g });
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

/* =============================
   Cálculo
============================= */
function calcularLocal(apar, grav) {
  const valor = apar * grav;
  let nivel, recomendacion;

  if (valor <= 3)      { nivel = 'Marginal';   recomendacion = 'Monitoreo normal.'; }
  else if (valor <= 8) { nivel = 'Aceptable';  recomendacion = 'Mitigar cuando sea posible.'; }
  else if (valor <= 16){ nivel = 'Importante'; recomendacion = 'Planificar acciones de reducción.'; }
  else                 { nivel = 'Muy Grave';  recomendacion = 'Acción inmediata.'; }

  return { valor, nivel, recomendacion };
}

async function calcular() {
  if (!aparicionSel || !gravedadSel) return;
  const apar = parseInt(aparicionSel.value, 10);
  const grav = parseInt(gravedadSel.value, 10);
  if (!apar || !grav) return;

  btnCalcular.disabled = true;
  btnCalcular.innerHTML = '<i class="bi bi-hourglass-split"></i> Calculando...';

  breadcrumb('calc.start', 'Inicio de cálculo', { apar, grav });
  console.log('[Riesgo] Inicio de cálculo', { apar, grav });

  try {
    const data = await withSpan('calcularLocal', () => calcularLocal(apar, grav));

    if (resultado) resultado.hidden = false;
    if (rNivel) rNivel.textContent = data.nivel ?? '—';
    if (rValor) rValor.textContent = data.valor ?? '—';
    if (rRecom) rRecom.textContent = data.recomendacion ?? '—';

    if (rIcono) {
      rIcono.className = 'bi';
      const lvl = (data.nivel || '').toUpperCase();
      if (lvl.includes('MARGINAL'))        rIcono.classList.add('bi-emoji-smile');
      else if (lvl.includes('ACEPTABLE'))  rIcono.classList.add('bi-emoji-neutral');
      else if (lvl.includes('IMPORTANTE')) rIcono.classList.add('bi-emoji-dizzy');
      else if (lvl.includes('MUY GRAVE'))  rIcono.classList.add('bi-emoji-angry');
      else                                 rIcono.classList.add('bi-question-circle');
    }

    resaltarCelda(apar, grav);

    breadcrumb('calc.done', 'Cálculo completado', { result: data });
    console.log('[Riesgo] Cálculo completado', data);

  } finally {
    btnCalcular.disabled = false;
    btnCalcular.innerHTML = '<i class="bi bi-rocket-takeoff"></i> Calcular';
  }
}

function limpiar() {
  if (aparicionSel) aparicionSel.selectedIndex = 0;
  if (gravedadSel)  gravedadSel.selectedIndex  = 0;
  if (desc) { desc.value = ''; if (descContador) descContador.textContent = '0/300'; }
  resetResultado();
  limpiarSeleccion();
  breadcrumb('ui.clear', 'Formulario limpiado');
}

/* =============================
   Botón de error de prueba
============================= */
btnErrorSentry?.addEventListener('click', async () => {
  try {
    const ctx = {
      descripcion: desc?.value || '',
      aparicion: aparicionSel?.value || null,
      gravedad: gravedadSel?.value || null,
    };

    const err = new Error('UIManualTestError: error de prueba desde el botón');
    err.name = 'UIManualTestError';

    let eventId = null;
    S?.withScope?.((scope) => {
      scope.setLevel?.('error');
      scope.setTag?.('source', 'ui-test-button');
      scope.setContext?.('form', ctx);
      scope.setFingerprint?.(['ui-manual-test-error']);
      eventId = S.captureException?.(err);
    });

    const hub = S?.getCurrentHub?.();
    const client = hub?.getClient?.();
    if (client?.flush)      await client.flush(3000);
    else if (client?.close) await client.close(3000);
    else                    await new Promise((r) => setTimeout(r, 1200));

    console.log('[Sentry] EventId:', eventId);
    alert('✅ Se envió un error de prueba a Sentry. Revisa Issues.');
  } catch (e) {
    console.error('No se pudo enviar a Sentry', e);
    alert('⚠️ No se pudo enviar el error a Sentry (ver consola).');
  }
});

/* =============================
   Acciones
============================= */
btnCalcular?.addEventListener('click', calcular);
btnLimpiar ?.addEventListener('click', limpiar);

renderMatriz();
cargarNivelesLocal();
resetResultado();

// Log de arranque (útil para Sentry Logs)
console.log('[Riesgo] App lista', {
  href: location.href,
  env: (location.hostname === 'localhost' || location.hostname.startsWith('127.')) ? 'development' : 'production'
});
