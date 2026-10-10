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

    this.crearEtiquetas();
    this.crearEntradas();
    this.crearAyuda();

    $('#btnVista').addEventListener('click', () => { this.cerrarTarjeta(); app.vistaGeneral(); });
    $('#btnReiniciar').addEventListener('click', () => app.reiniciar());
    $('#btnAyuda').addEventListener('click', () => this.mostrarAyuda());
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('#ayuda').hidden) this.cerrarAyuda();
      else if (this.abierta) { this.cerrarTarjeta(); app.vistaGeneral(); }
    });

    this.refrescar();
  }

  // ---------------- Etiquetas flotantes ----------------
  crearEtiquetas() {
    const cont = $('#etiquetas');
    this.etiquetas = [];
    const ids = [...AREAS, 'cofre'];
    for (const id of ids) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'etiqueta' + (id === 'cofre' ? ' cofre' : '');
      const nombre = id === 'cofre' ? TEXTOS.cofre.nombre : TEXTOS.areas[id].nombre;
      b.innerHTML = `<span class="edot" aria-hidden="true"></span><span>${nombre}</span>`;
      b.addEventListener('click', () => this.app.enfocar(id));
      cont.appendChild(b);
      this.etiquetas.push({ id, el: b, ancla: new THREE.Vector3(...ANCLAS[id]), nombre });
    }
    for (const id of ['ads', 'org']) {
      const s = document.createElement('div');
      s.className = 'etiqueta fuente';
      s.textContent = TEXTOS.etiquetasEscena[id];
      cont.appendChild(s);
      this.etiquetas.push({ id, el: s, ancla: new THREE.Vector3(...ANCLAS[id]), fuente: true });
    }
  }

  posicionarEtiquetas() {
    const esc = this.app.escena;
    const w = window.innerWidth, h = window.innerHeight;
    for (const e of this.etiquetas) {
      const ok = esc.proyectar(e.ancla, this.p);
      if (!ok || Math.abs(this.p.x) > 1.15 || Math.abs(this.p.y) > 1.15) {
        if (e.visible !== false) { e.el.style.visibility = 'hidden'; e.visible = false; }
        continue;
      }
      if (e.visible === false) { e.el.style.visibility = ''; e.visible = true; }
      const x = (this.p.x * 0.5 + 0.5) * w;
      const y = (-this.p.y * 0.5 + 0.5) * h;
      // las etiquetas se achican un poco al alejarse
      const d = esc.camera.position.distanceTo(e.ancla);
      const s = Math.max(0.78, Math.min(1.05, 26 / d + 0.35));
      e.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${s.toFixed(3)})`;
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
    // reinicia la animación de entrada
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    this.actualizarCorrimiento();
    this.marcarActiva();
  }

  cerrarTarjeta() {
    this.abierta = null;
    $('#tarjeta').hidden = true;
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
    const panelAncho = entr.width > window.innerWidth * 0.6;
    let arriba = 0, abajo = 0;
    if (esc.angosta || panelAncho) {
      arriba = $('#aviso').getBoundingClientRect().bottom + 6;
      abajo = H - entr.top + 6;
    }
    esc.reservaV = arriba + abajo;
    if (!this.abierta) {
      esc.setCorrimiento(0, Math.round((abajo - arriba) / 2), instantaneo);
      return;
    }
    const r = $('#tarjeta').getBoundingClientRect();
    if (window.innerWidth <= 760) esc.setCorrimiento(0, Math.round(r.height / 2), instantaneo);
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
        $('#avisoTxt').textContent = TEXTOS.avisos[clave];
        el.classList.toggle('ok', ok);
        el.classList.remove('cambia');
      }, this.app.reducido ? 0 : 180);
    }
  }

  update(dt) {
    this.posicionarEtiquetas();
    this.actualizarAviso(dt);
  }
}
