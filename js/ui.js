// =====================================================================
//  Interfaz HTML: etiquetas flotantes, tarjeta de área, entradas,
//  aviso dinámico, progreso y ayuda inicial. Todos los textos vienen
//  de TEXTOS (config.js).
// =====================================================================
import * as THREE from 'three';
import { TEXTOS, AREAS } from './config.js';
import { ANCLAS } from './layout.js';

const $ = (sel) => document.querySelector(sel);
const CLAVE_AYUDA = 'tienda-en-marcha:ayuda-vista';

const ICONOS = {
  ads: '<svg viewBox="0 0 24 24"><path d="M4 10v4h3l6 4V6L7 10H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  org: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
};

const SVGNS = 'http://www.w3.org/2000/svg';
// elementos de la interfaz que las etiquetas no deben tapar (panel: si el ancla
// queda debajo, el área está cubierta y su etiqueta se oculta en vez de moverse)
const OBSTACULOS = [
  ['.marca', false], ['.progreso', false], ['.botonera', false], ['#aviso', false], ['#liberado', false],
  ['#btnEntradas', false], ['#giro', false], ['#entradas', 'panelSiAbierto'], ['#tarjeta', true],
];
const esBaja = () => document.documentElement.classList.contains('baja');
const cruza = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const solape = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

function leer(ruta) {
  return ruta.split('.').reduce((o, k) => (o ? o[k] : undefined), TEXTOS);
}

export class UI {
  constructor(app) {
    this.app = app;
    this.abierta = null;
    this.avisoActual = null;
    this.avisoCandidato = null;
    this.avisoDesde = 0;
    this.tAviso = 0;
    this.v = new THREE.Vector3();
    this.p = new THREE.Vector3();

    // textos estáticos con data-t
    document.querySelectorAll('[data-t]').forEach((el) => {
      const t = leer(el.dataset.t);
      if (typeof t === 'string') el.textContent = t;
    });
    document.title = TEXTOS.meta.titulo;
    $('#liberadoTxt').textContent = TEXTOS.liberado;
    $('#btnVista').setAttribute('aria-label', TEXTOS.botones.vistaGeneral);
    $('#btnReiniciar').setAttribute('aria-label', TEXTOS.botones.reiniciar);
    $('#btnAyuda').setAttribute('aria-label', TEXTOS.botones.ayuda);
    $('#giro').setAttribute('aria-label', TEXTOS.botones.girar);
    for (const [id, txt, sentido] of [['#btnGiroIzq', TEXTOS.botones.girarIzq, 1], ['#btnGiroDer', TEXTOS.botones.girarDer, -1]]) {
      const b = $(id);
      b.setAttribute('aria-label', txt);
      b.title = txt;
      b.addEventListener('click', () => app.escena.girar(sentido));
    }

    this.crearEtiquetas();
    this.crearEntradas();
    this.crearAyuda();
    this.crearPanelBajo();

    $('#btnVista').addEventListener('click', () => { this.cerrarTarjeta(); app.vistaGeneral(); });
    $('#btnReiniciar').addEventListener('click', () => app.reiniciar());
    $('#btnAyuda').addEventListener('click', () => this.mostrarAyuda());
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('#ayuda').hidden) this.cerrarAyuda();
      else if ($('#entradas').classList.contains('abierto')) this.plegarEntradas();
      else if (this.abierta) { this.cerrarTarjeta(); app.vistaGeneral(); }
    });

    this.refrescar();
  }

  // ---------------- Etiquetas flotantes ----------------
  crearEtiquetas() {
    const cont = $('#etiquetas');
    this.guias = document.createElementNS(SVGNS, 'svg');
    this.guias.setAttribute('class', 'guias');
    this.guias.setAttribute('aria-hidden', 'true');
    cont.appendChild(this.guias);
    this.etiquetas = [];
    const ids = [...AREAS, 'cofre'];
    for (const id of ids) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'etiqueta' + (id === 'cofre' ? ' cofre' : '');
      const nombre = id === 'cofre' ? TEXTOS.cofre.nombre : TEXTOS.areas[id].nombre;
      b.innerHTML = `<span class="edot" aria-hidden="true"></span><span>${nombre}</span>`;
      b.addEventListener('click', () => {
        if (performance.now() - (this.tragarToque || 0) < 1000) return; // el toque solo cerró un panel
        if (this.app.escena.vieneDeArrastre()) return; // fue un giro que empezó sobre la etiqueta
        this.app.enfocar(id);
      });
      cont.appendChild(b);
      this.etiquetas.push({ id, el: b, ancla: new THREE.Vector3(...ANCLAS[id]), nombre, prio: 1 });
    }
    for (const id of ['ads', 'org']) {
      const s = document.createElement('div');
      s.className = 'etiqueta fuente';
      s.textContent = TEXTOS.etiquetasEscena[id];
      cont.appendChild(s);
      this.etiquetas.push({ id, el: s, ancla: new THREE.Vector3(...ANCLAS[id]), fuente: true, prio: 2, corta: false });
    }
    for (const e of this.etiquetas) {
      Object.assign(e, { dx: 0, dy: 0, odx: 0, ody: 0, visible: true });
      e.linea = document.createElementNS(SVGNS, 'line');
      e.punto = document.createElementNS(SVGNS, 'circle');
      e.punto.setAttribute('r', '3');
      this.guias.append(e.linea, e.punto);
    }
    this.medirEtiquetas();
  }

  // ancho y alto sin escalar (se repite al cambiar de tamaño o de diseño)
  medirEtiquetas() {
    for (const e of this.etiquetas) {
      if (e.fuente) {
        e.el.textContent = TEXTOS.etiquetasEscenaCortas[e.id];
        e.wCorto = e.el.offsetWidth;
        e.el.textContent = TEXTOS.etiquetasEscena[e.id];
        e.wLargo = e.el.offsetWidth;
        e.corta = false;
      }
      e.w = e.el.offsetWidth;
      e.h = e.el.offsetHeight;
    }
  }

  obstaculos() {
    const lista = [];
    const W = window.innerWidth, H = window.innerHeight;
    for (const [sel, panel] of OBSTACULOS) {
      const el = $(sel);
      if (!el || el.hidden) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.right <= 0 || r.left >= W || r.bottom <= 0 || r.top >= H) continue;
      if (sel === '#entradas' && esBaja() && !el.classList.contains('abierto')) continue;
      const esPanel = panel === true || (panel === 'panelSiAbierto' && esBaja());
      lista.push({ l: r.left - 4, t: r.top - 4, r: r.right + 4, b: r.bottom + 4, panel: esPanel });
    }
    return lista;
  }

  // Coloca las etiquetas sobre su ancla; si chocan entre sí o con la interfaz,
  // busca el hueco libre más cercano (con línea guía), acorta o, como último
  // recurso, oculta las de menor prioridad (entradas).
  posicionarEtiquetas(dt = 0) {
    const esc = this.app.escena;
    const W = window.innerWidth, H = window.innerHeight;
    const obst = this.obstaculos();
    const ocupadas = [];
    const activas = [];
    for (const e of this.etiquetas) {
      e.mostrar = false;
      // con una tarjeta abierta, las etiquetas de las entradas sobran
      if (e.fuente && this.abierta) continue;
      if (!esc.proyectar(e.ancla, this.p) || Math.abs(this.p.x) > 1.1 || Math.abs(this.p.y) > 1.1) continue;
      e.ax = (this.p.x * 0.5 + 0.5) * W;
      e.ay = (-this.p.y * 0.5 + 0.5) * H;
      // área tapada por la tarjeta o el panel abierto: no se muestra su etiqueta
      if (obst.some((o) => o.panel && e.ax > o.l && e.ax < o.r && e.ay > o.t && e.ay < o.b)) continue;
      const d = esc.camera.position.distanceTo(e.ancla);
      e.s = Math.max(0.78, Math.min(1.05, 26 / d + 0.35));
      activas.push(e);
    }
    // prioridad: la etiqueta enfocada, luego áreas y Ganancias, luego entradas
    activas.sort((a, b) => (a.id === this.abierta ? -1 : 0) - (b.id === this.abierta ? -1 : 0) || a.prio - b.prio);
    const rect = (e, dx, dy, w) => {
      const ww = w * e.s, hh = e.h * e.s, x = e.ax + dx, y = e.ay + dy;
      return { l: x - ww / 2 - 3, r: x + ww / 2 + 3, t: y - hh - 3, b: y + 7 * e.s };
    };
    const libre = (r) => r.l >= 4 && r.r <= W - 4 && r.t >= 4 && r.b <= H - 4 && !obst.some((o) => cruza(r, o)) && !ocupadas.some((o) => cruza(r, o));
    for (const e of activas) {
      const anchos = e.fuente ? [e.wLargo, e.wCorto] : [e.w];
      let elegido = null;
      for (let k = 0; k < anchos.length && !elegido; k++) {
        const w = anchos[k];
        const sx = (w * e.s) / 2 + 6, sy = e.h * e.s + 8;
        // 1) en su lugar; 2) donde estaba el cuadro anterior; 3) el hueco libre más cercano
        const costo = ([x, y]) => Math.hypot(x, y * 1.15) + (y > 0 ? 10 : 0);
        const resto = [];
        for (let j = -6; j <= 5; j++) for (let i = -4; i <= 4; i++) if (i || j) resto.push([i * sx, j * sy]);
        resto.sort((a, b) => costo(a) - costo(b));
        const cands = [[0, 0], [e.odx, e.ody], ...resto];
        for (const [dx, dy] of cands) {
          const r = rect(e, dx, dy, w);
          if (libre(r)) { elegido = { dx, dy, r, corta: k === 1 }; break; }
        }
      }
      if (!elegido && e.id === this.abierta) {
        // la etiqueta del área enfocada nunca se oculta: va a la posición que menos tapa
        let mejor = Infinity;
        for (let j = -5; j <= 4; j++) for (let i = -3; i <= 3; i++) {
          const dx = i * ((e.w * e.s) / 2 + 6), dy = j * (e.h * e.s + 8);
          const r = rect(e, dx, dy, e.w);
          const fuera = Math.max(0, 4 - r.l) + Math.max(0, r.r - W + 4) + Math.max(0, 4 - r.t) + Math.max(0, r.b - H + 4);
          const costo = obst.reduce((a, o) => a + solape(r, o) * 4, 0) + ocupadas.reduce((a, o) => a + solape(r, o), 0) + fuera * 400 + Math.hypot(dx, dy);
          if (costo < mejor) { mejor = costo; elegido = { dx, dy, r, corta: false }; }
        }
      }
      // sin hueco libre (pantalla muy llena, p. ej. con la tarjeta abierta): se oculta
      // antes que quedar debajo de la cabecera, el aviso, el panel o la tarjeta
      if (!elegido) continue;
      e.mostrar = true;
      e.odx = elegido.dx; e.ody = elegido.dy;
      ocupadas.push(elegido.r);
      if (e.fuente && elegido.corta !== e.corta) {
        e.corta = elegido.corta;
        e.el.textContent = e.corta ? TEXTOS.etiquetasEscenaCortas[e.id] : TEXTOS.etiquetasEscena[e.id];
      }
    }
    // pintar (con suavizado del desplazamiento)
    const k = this.app.reducido || !dt ? 1 : 1 - Math.exp(-14 * dt);
    for (const e of this.etiquetas) {
      if (!e.mostrar) {
        if (e.visible) { e.el.style.visibility = 'hidden'; e.linea.style.display = 'none'; e.punto.style.display = 'none'; e.visible = false; }
        continue;
      }
      if (!e.visible) { e.el.style.visibility = ''; e.visible = true; e.dx = e.odx; e.dy = e.ody; }
      e.dx += (e.odx - e.dx) * k;
      e.dy += (e.ody - e.dy) * k;
      const x = e.ax + e.dx, y = e.ay + e.dy;
      e.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${e.s.toFixed(3)})`;
      const lejos = Math.hypot(e.dx, e.dy) > 8;
      e.el.classList.toggle('desplazada', lejos);
      e.linea.style.display = lejos ? '' : 'none';
      e.punto.style.display = lejos ? '' : 'none';
      if (lejos) {
        // la línea sale del borde más cercano de la etiqueta hacia su ancla
        const yb = e.dy < 0 ? y : y - e.h * e.s;
        e.linea.setAttribute('x1', e.ax.toFixed(1)); e.linea.setAttribute('y1', e.ay.toFixed(1));
        e.linea.setAttribute('x2', x.toFixed(1)); e.linea.setAttribute('y2', yb.toFixed(1));
        e.punto.setAttribute('cx', e.ax.toFixed(1)); e.punto.setAttribute('cy', e.ay.toFixed(1));
      }
    }
  }

  // ---------------- Entradas ----------------
  crearEntradas() {
    const cont = $('#filasEntradas');
    const tit = $('#entradasTit');
    tit.innerHTML = `<span>${TEXTOS.entradas.titulo}</span><span class="progreso-movil"><span class="pdot"></span><span id="progresoMovil"></span></span>`;
    this.filas = {};
    for (const f of ['ads', 'org']) {
      const fila = document.createElement('div');
      fila.className = 'fila-entrada';
      const nombre = TEXTOS.entradas[f];
      fila.innerHTML = `
        <button type="button" class="switch" role="switch" aria-checked="true" aria-label="${nombre}"></button>
        <span class="fe-nombre"><span class="fe-ico" aria-hidden="true">${ICONOS[f]}</span><span>${nombre}</span></span>
        <span class="seg" role="group" aria-label="${nombre}">
          ${TEXTOS.entradas.niveles.map((n, i) => `<button type="button" data-n="${i}" aria-pressed="false">${n}</button>`).join('')}
        </span>`;
      const sw = fila.querySelector('.switch');
      sw.addEventListener('click', () => {
        const on = sw.getAttribute('aria-checked') !== 'true';
        this.app.setFuente(f, { on });
      });
      fila.querySelectorAll('.seg button').forEach((b) => {
        b.addEventListener('click', () => this.app.setFuente(f, { on: true, nivel: Number(b.dataset.n) }));
      });
      cont.appendChild(fila);
      this.filas[f] = { fila, sw, botones: [...fila.querySelectorAll('.seg button')] };
    }
  }

  // ---------------- Pantallas bajas: panel de entradas plegable y aviso de una línea ----------------
  crearPanelBajo() {
    const E = TEXTOS.entradas;
    $('#btnEntradasTxt').textContent = E.abrir;
    $('#btnEntradasCerrar').setAttribute('aria-label', E.cerrar);
    $('#btnEntradasIcos').innerHTML = `<span data-f="ads">${ICONOS.ads}</span><span data-f="org">${ICONOS.org}</span>`;
    $('#btnEntradas').addEventListener('click', () => this.desplegarEntradas());
    $('#btnEntradasCerrar').addEventListener('click', () => this.plegarEntradas());
    // un toque fuera del panel lo cierra; un toque fuera del aviso lo pliega
    document.addEventListener('pointerdown', (e) => {
      // ese mismo toque no abre un área de la escena (this.tragarToque lo consulta main.js)
      const panel = $('#entradas');
      if (panel.classList.contains('abierto') && !panel.contains(e.target) && !$('#btnEntradas').contains(e.target)) {
        this.plegarEntradas();
        this.tragarToque = performance.now();
      }
      const aviso = $('#aviso');
      if (aviso.classList.contains('abierto') && !aviso.contains(e.target)) {
        aviso.classList.remove('abierto');
        this.tragarToque = performance.now();
      }
    }, true);
    $('#aviso').addEventListener('click', () => {
      if (esBaja()) $('#aviso').classList.toggle('abierto');
    });
  }

  desplegarEntradas() {
    if (!esBaja()) return;
    $('#entradas').classList.add('abierto');
    $('#btnEntradas').setAttribute('aria-expanded', 'true');
    $('#entradas').querySelector('.switch').focus({ preventScroll: true });
  }

  plegarEntradas() {
    $('#entradas').classList.remove('abierto');
    $('#btnEntradas').setAttribute('aria-expanded', 'false');
  }

  // al pasar de un diseño a otro (rotar el celular, cambiar el alto de la ventana)
  cambioDiseno() {
    this.plegarEntradas();
    $('#aviso').classList.remove('abierto');
    this.medirEtiquetas();
    this.actualizarCorrimiento(true);
    if (this.abierta) this.pintarTarjeta();
  }

  // ---------------- Ayuda ----------------
  crearAyuda() {
    const A = TEXTOS.ayuda;
    $('#ayudaTit').textContent = A.titulo;
    $('#ayudaPasos').innerHTML = A.pasos.map((p) => `<li><span>${p}</span></li>`).join('');
    $('#ayudaTip').textContent = A.tip;
    $('#btnEmpezar').textContent = A.empezar;
    $('#btnEmpezar').addEventListener('click', () => this.cerrarAyuda());
    $('#ayuda').addEventListener('click', (e) => { if (e.target.id === 'ayuda') this.cerrarAyuda(); });
    // ?captura omite la ayuda (para generar la imagen de vista previa)
    let vista = new URLSearchParams(location.search).has('captura');
    try { vista = vista || localStorage.getItem(CLAVE_AYUDA) === '1'; } catch (_) { /* sin almacenamiento */ }
    if (!vista) this.mostrarAyuda();
  }

  mostrarAyuda() {
    $('#ayuda').hidden = false;
    $('#btnEmpezar').focus({ preventScroll: true });
  }

  cerrarAyuda() {
    $('#ayuda').hidden = true;
    try { localStorage.setItem(CLAVE_AYUDA, '1'); } catch (_) { /* sin almacenamiento */ }
  }

  // ---------------- Tarjeta ----------------
  abrirTarjeta(id) {
    this.abierta = id;
    this.pintarTarjeta();
    const t = $('#tarjeta');
    t.hidden = false;
    document.body.classList.add('con-tarjeta');
    // reinicia la animación de entrada
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    this.actualizarCorrimiento();
    this.marcarActiva();
  }

  cerrarTarjeta() {
    this.abierta = null;
    $('#tarjeta').hidden = true;
    document.body.classList.remove('con-tarjeta');
    this.actualizarCorrimiento();
    this.marcarActiva();
  }

  marcarActiva() {
    for (const e of this.etiquetas) e.el.classList.toggle('activa', e.id === this.abierta);
  }

  // Corre la vista para que la escena quede en la zona libre de paneles
  actualizarCorrimiento(instantaneo = false) {
    const esc = this.app.escena;
    const H = window.innerHeight;
    const entr = $('#entradas').getBoundingClientRect();
    const baja = esBaja();
    const panelAncho = !baja && entr.width > window.innerWidth * 0.6;
    const movil = window.innerWidth <= 760 && !baja; // tarjeta como panel inferior
    if (baja) document.documentElement.style.setProperty('--alto-cabecera', `${Math.round($('.hud-top').getBoundingClientRect().height)}px`);
    // posición de los botones de girar (sobre el panel inferior en celular)
    const raiz = document.documentElement.style;
    raiz.setProperty('--alto-entradas', `${Math.round(entr.height)}px`);
    const hoja = this.abierta && movil ? $('#tarjeta').getBoundingClientRect().height : 0;
    raiz.setProperty('--alto-inferior', `${Math.round(hoja || H - entr.top)}px`);
    let arriba = 0, abajo = 0;
    if (baja) {
      arriba = $('.hud-top').getBoundingClientRect().bottom + 4;
    } else if (esc.angosta || panelAncho) {
      arriba = $('#aviso').getBoundingClientRect().bottom + 6;
      abajo = H - entr.top + 6;
    }
    esc.reservaV = arriba + abajo;
    if (!this.abierta) {
      esc.setCorrimiento(0, Math.round((abajo - arriba) / 2), instantaneo);
      return;
    }
    const r = $('#tarjeta').getBoundingClientRect();
    if (movil) esc.setCorrimiento(0, Math.round(r.height / 2), instantaneo);
    else esc.setCorrimiento(Math.round((window.innerWidth - r.left) / 2), 0, instantaneo);
  }

  pintarTarjeta() {
    const id = this.abierta;
    if (!id) return;
    const t = $('#tarjeta');
    const sim = this.app.sim;
    const B = TEXTOS.botones;
    if (id === 'cofre') {
      const C = TEXTOS.cofre;
      const faltan = 4 - sim.areasArregladas;
      const ok = faltan === 0;
      t.innerHTML = `
        <div class="t-cab ${ok ? '' : 'problema'}">
          <div class="t-lugar">${C.lugar}</div>
          <h2>${C.nombre}</h2>
          <span class="t-chip ${ok ? 'ok' : ''}"><span class="d"></span>${ok ? TEXTOS.liberado : C.faltan(faltan)}</span>
          <button type="button" class="t-cerrar" aria-label="${B.cerrar}">×</button>
        </div>
        <div class="t-cuerpo">
          <div class="bloque solucion"><h3>${C.tituloComo}</h3><p>${C.comoFunciona}</p></div>
          <div class="bloque ${ok ? 'solucion' : 'problema'}">
            <h3>${C.tituloEstado}</h3>
            <p>${ok ? C.completo : C.faltan(faltan)}</p>
            <ul class="lista-areas">
              ${AREAS.map((a) => `<li class="${sim.fixed[a] ? 'ok' : ''}"><span class="edot"></span>${TEXTOS.areas[a].nombre} · ${sim.fixed[a] ? TEXTOS.estado.optimizada : TEXTOS.estado.problema}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="t-pie">
          ${ok ? '' : `<button type="button" class="btn-primario" data-acc="siguiente">${B.siguiente}</button>`}
        </div>`;
    } else {
      const A = TEXTOS.areas[id];
      const fx = sim.fixed[id];
      t.innerHTML = `
        <div class="t-cab ${fx ? '' : 'problema'}">
          <div class="t-lugar">${A.lugar}</div>
          <h2>${A.nombre}</h2>
          <span class="t-chip ${fx ? 'ok' : ''}"><span class="d"></span>${fx ? TEXTOS.estado.optimizada : TEXTOS.estado.problema}</span>
          <button type="button" class="t-cerrar" aria-label="${B.cerrar}">×</button>
        </div>
        <div class="t-cuerpo">
          <div class="bloque problema ${fx ? 'atenuado' : ''}"><h3>${TEXTOS.tarjeta.problema}</h3><p>${A.problema}</p></div>
          <div class="bloque solucion"><h3>${TEXTOS.tarjeta.solucion}</h3><p>${A.solucion}</p></div>
          ${fx ? `<p class="efecto">${A.efecto}</p>` : ''}
        </div>
        <div class="t-pie">
          <button type="button" class="${fx ? 'btn-sec' : 'btn-primario'}" data-acc="toggle">${fx ? B.deshacer : B.aplicar}</button>
        </div>`;
    }
    t.querySelector('.t-cerrar').addEventListener('click', () => { this.cerrarTarjeta(); this.app.vistaGeneral(); });
    const acc = t.querySelector('[data-acc]');
    if (acc) {
      acc.addEventListener('click', () => {
        if (acc.dataset.acc === 'toggle') this.app.toggleArea(id);
        else this.app.enfocar(AREAS.find((a) => !sim.fixed[a]));
      });
    }
    requestAnimationFrame(() => this.actualizarCorrimiento());
  }

  // ---------------- Estado general ----------------
  refrescar() {
    const sim = this.app.sim;
    const n = sim.areasArregladas;
    const txt = TEXTOS.progreso(n);
    if ($('#progresoTxt').textContent !== txt) {
      $('#progresoTxt').textContent = txt;
      const pm = $('#progresoMovil');
      if (pm) pm.textContent = txt;
      const pr = $('#progreso');
      pr.classList.remove('pop'); void pr.offsetWidth; pr.classList.add('pop');
    }
    for (const e of this.etiquetas) {
      if (e.fuente) {
        e.el.classList.toggle('apagada', !sim.fuentes[e.id].on);
        continue;
      }
      const ok = e.id === 'cofre' ? n === 4 : sim.fixed[e.id];
      e.el.classList.toggle('ok', ok);
      e.el.setAttribute('aria-label', `${e.nombre}: ${ok ? TEXTOS.estado.optimizada : TEXTOS.estado.problema}`);
    }
    for (const f of ['ads', 'org']) {
      const st = sim.fuentes[f];
      const { fila, sw, botones } = this.filas[f];
      sw.setAttribute('aria-checked', String(st.on));
      sw.title = st.on ? TEXTOS.entradas.apagar : TEXTOS.entradas.encender;
      fila.classList.toggle('off', !st.on);
      botones.forEach((b, i) => b.setAttribute('aria-pressed', String(st.on && i === st.nivel)));
    }
    const encendidas = ['ads', 'org'].filter((f) => sim.fuentes[f].on);
    const be = $('#btnEntradas');
    be.classList.toggle('on', encendidas.length > 0);
    be.setAttribute('aria-label', `${TEXTOS.entradas.abrir}: ${encendidas.length ? TEXTOS.entradas.estadoOn : TEXTOS.entradas.estadoOff}`);
    be.querySelectorAll('.be-icos span').forEach((s) => s.classList.toggle('on', sim.fuentes[s.dataset.f].on));
    $('#liberado').hidden = n !== 4;
    if (this.abierta) this.pintarTarjeta();
  }

  // aviso con pequeño retardo para que no parpadee
  actualizarAviso(dt, forzar = false) {
    this.tAviso += dt;
    if (!forzar && this.tAviso < 0.4) return;
    this.tAviso = 0;
    const clave = this.app.sim.diagnostico();
    const ahora = performance.now();
    if (clave !== this.avisoCandidato) { this.avisoCandidato = clave; this.avisoDesde = ahora; }
    const estable = ahora - this.avisoDesde > 1200;
    if (clave !== this.avisoActual && (estable || forzar || this.avisoActual === null)) {
      this.avisoActual = clave;
      const el = $('#aviso');
      const ok = clave === 'liberado' || clave === 'liberadoBajo';
      el.classList.add('cambia');
      setTimeout(() => {
        el.querySelector('.av-largo').textContent = TEXTOS.avisos[clave];
        el.querySelector('.av-corto').textContent = TEXTOS.avisosCortos[clave];
        el.title = TEXTOS.avisos[clave];
        el.classList.toggle('ok', ok);
        el.classList.remove('cambia');
      }, this.app.reducido ? 0 : 180);
    }
  }

  update(dt) {
    this.posicionarEtiquetas(dt);
    this.actualizarAviso(dt);
  }
}
