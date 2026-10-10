// =====================================================================
//  Arranque y bucle de animación
// =====================================================================
import { PARAMS, AREAS } from './config.js';
import { Sim } from './sim.js';
import { Escena } from './scene.js';
import { UI } from './ui.js';

const canvas = document.getElementById('escena');

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (_) {
    return false;
  }
}

if (!hayWebGL()) {
  document.getElementById('sinWebgl').hidden = false;
} else {
  iniciar();
}

function iniciar() {
  const movil = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducido = mqReducido.matches;

  const sim = new Sim({ maxPersonas: movil ? PARAMS.topePersonas.celular : PARAMS.topePersonas.escritorio });
  const escena = new Escena(canvas, { movil, reducido });

  const app = {
    sim,
    escena,
    reducido,

    toggleArea(id) {
      const v = !sim.fixed[id];
      sim.setFixed(id, v);
      escena.setFixed(id, v);
      ui.refrescar();
      ui.actualizarAviso(0, true);
    },

    setFuente(f, cambios) {
      sim.setFuente(f, cambios);
      const st = sim.fuentes[f];
      escena.setBrillo(f, st.on, st.nivel);
      ui.refrescar();
      ui.actualizarAviso(0, true);
    },

    enfocar(id) {
      if (!id) return;
      escena.volarA(id);
      ui.abrirTarjeta(id);
    },

    vistaGeneral() {
      escena.volarA('general');
    },

    reiniciar() {
      precalentar();
      ui.cerrarTarjeta();
      ui.refrescar();
      ui.avisoActual = null;
      ui.actualizarAviso(0, true);
      escena.volarA('general');
    },
  };

  // Todo roto, entradas en intensidad media y unos segundos ya simulados
  function precalentar() {
    sim.reset();
    sim.sembrar();
    for (const a of AREAS) escena.setFixed(a, false, true);
    for (const f of ['ads', 'org']) escena.setBrillo(f, true, 1);
    escena.limpiarPersonas();
    const pasos = Math.round(PARAMS.precalentar / 0.1);
    for (let i = 0; i < pasos; i++) sim.step(0.1);
  }

  precalentar();
  const ui = new UI(app);
  ui.actualizarCorrimiento(true);
  escena.volarA('general', true);
  ui.actualizarAviso(0, true);

  // ---- clic / toque sobre la escena ----
  let abajo = null;
  canvas.addEventListener('pointerdown', (e) => { abajo = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!abajo) return;
    const mov = Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y);
    const dur = performance.now() - abajo.t;
    abajo = null;
    if (mov > 8 || dur > 600) return;
    const id = escena.pick(e.clientX, e.clientY);
    if (id) app.enfocar(id);
  });
  if (!movil) {
    let pend = false;
    canvas.addEventListener('pointermove', (e) => {
      if (pend || e.buttons) return;
      pend = true;
      requestAnimationFrame(() => {
        pend = false;
        canvas.style.cursor = escena.pick(e.clientX, e.clientY) ? 'pointer' : '';
      });
    });
  }

  // ---- tamaño de ventana ----
  window.addEventListener('resize', () => {
    const cambioModo = escena.resize();
    ui.actualizarCorrimiento(true);
    const camaraRota = !Number.isFinite(escena.camera.position.x);
    if (camaraRota || (cambioModo && !ui.abierta)) escena.volarA(ui.abierta || 'general', true);
  });

  // ---- bucle (se pausa con la pestaña oculta) ----
  let ultimo = performance.now();
  let raf = 0;
  function cuadro(ahora) {
    const dt = Math.min(0.1, Math.max(0, (ahora - ultimo) / 1000));
    ultimo = ahora;
    // subpasos para estabilidad
    let resto = dt;
    while (resto > 0) {
      const h = Math.min(0.05, resto);
      sim.step(h);
      resto -= h;
    }
    escena.update(dt, sim);
    ui.update(dt);
    escena.render();
    raf = requestAnimationFrame(cuadro);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      ultimo = performance.now();
      raf = requestAnimationFrame(cuadro);
    }
  });
  raf = requestAnimationFrame(cuadro);

  window.__tienda = app; // ayuda para pruebas desde la consola
}
