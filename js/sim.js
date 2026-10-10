// =====================================================================
//  Simulación pura (sin Three.js). Personas, fila, caja, pedidos,
//  monedas y ritmo de ganancias. La escena solo lee este estado.
// =====================================================================
import { PARAMS, AREAS } from './config.js';
import { L } from './layout.js';

const rand = (a, b) => a + Math.random() * (b - a);
const randR = ([a, b]) => rand(a, b);
const expo = (rate) => -Math.log(1 - Math.random()) / rate;
// llegadas más parejas que un Poisson puro (Erlang-3: misma tasa media, menos rachas)
const llegada = (rate) => expo(rate * 3) + expo(rate * 3) + expo(rate * 3);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export const EST = {
  LLEGA: 'llega',
  MIRA: 'mira',
  PASA: 'pasa',
  A_FILA: 'aFila',
  EN_FILA: 'enFila',
  A_CAJA: 'aCaja',
  ATENDIDO: 'atendido',
  A_ENTREGA: 'aEntrega',
  ESPERA: 'espera',
  SALE: 'sale',
};

// Arcos de las monedas
const M_INICIO = { x: L.ventanaEntrega.x, y: L.ventanaEntrega.y + 0.2, z: L.ventanaEntrega.z };
const M_CAJA = { x: L.cajaFuerte.x, y: 1.95, z: L.cajaFuerte.z };
const M_SALIDA = { x: L.cajaFuerte.x + 0.75, y: 0.95, z: L.cajaFuerte.z + 0.55 };
const M_COFRE = { x: L.cofre.x, y: 0.75, z: L.cofre.z };

function arco(a, b, alto, u) {
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u + Math.sin(Math.PI * u) * alto,
    z: a.z + (b.z - a.z) * u,
  };
}

export class Sim {
  constructor({ maxPersonas }) {
    this.maxPersonas = maxPersonas;
    this.reset();
  }

  reset() {
    this.t = 0;
    this.nextId = 1;
    this.personas = [];
    this.fila = [];
    this.pedidos = [];
    this.monedas = [];
    this.fixed = { marketing: false, ventas: false, operaciones: false, finanzas: false };
    // Arranque: entradas apagadas y tienda vacía
    this.fuentes = {
      ads: { on: false, nivel: 1, next: 0 },
      org: { on: false, nivel: 1, next: 0 },
    };
    // peatón ocasional: pasa por la calle aunque las entradas estén apagadas
    this.proxPeaton = randR(PARAMS.peatonCada) * 0.5;
    // decisión en la vitrina sin rachas: se respeta la proporción que entra
    this.acumEntrar = Math.random();
    this.cajeros = L.puestosCaja.map((spot, i) => ({ activo: i === 0, cliente: null, spot }));
    this.encargados = L.encargados.map((casa, i) => ({ activo: i === 0, pedido: null, t: 0, dur: 1, casa, objetivo: 0 }));
    this.puestosEntrega = L.puestosEntrega.map((p) => ({ p, ocupado: null }));
    this.ritmo = 0; // monedas/s que llegan al cofre (promedio móvil)
    this.eventos = { ventas: 0, molestos: 0, perdidas: 0 };
  }

  tasa(fuente) {
    const f = this.fuentes[fuente];
    return PARAMS.llegadas[fuente][f.nivel];
  }

  setFuente(fuente, { on, nivel }) {
    const f = this.fuentes[fuente];
    if (nivel !== undefined && nivel !== f.nivel) {
      f.nivel = nivel;
      f.next = Math.min(f.next, llegada(this.tasa(fuente)));
    }
    if (on !== undefined && on !== f.on) {
      f.on = on;
      // al encender con el interruptor arranca en Medio (si no se eligió otro nivel)
      if (on && nivel === undefined) f.nivel = 1;
      if (on) f.next = llegada(this.tasa(fuente)) * 0.4;
    }
  }

  setFixed(area, v) {
    this.fixed[area] = v;
    if (area === 'ventas') {
      this.cajeros[1].activo = v;
      if (v) {
        // la atención en curso se agiliza
        for (const c of this.cajeros) if (c.cliente && c.cliente.estado === EST.ATENDIDO) {
          c.cliente.t = Math.min(c.cliente.t, randR(PARAMS.atencion.arreglado));
        }
      }
    }
    if (area === 'operaciones') {
      this.encargados[1].activo = v;
      if (v) for (const e of this.encargados) if (e.pedido) {
        e.dur = Math.min(e.dur, e.t + randR(PARAMS.preparacion.arreglado));
      }
    }
  }

  get areasArregladas() {
    return AREAS.filter((a) => this.fixed[a]).length;
  }

  // -------------------------------------------------------------------
  crearPersona(origen) {
    const ox = rand(-0.28, 0.28);
    const oz = rand(-0.28, 0.28);
    const j = (p) => ({ x: p.x + ox, z: p.z + oz });
    let ruta, inicio;
    if (origen === 'ads') {
      inicio = j(L.spawnAds);
      ruta = [j(L.decision)];
    } else if (origen === 'calle') {
      inicio = j(L.spawnPeaton);
      ruta = [j(L.decision)];
    } else {
      inicio = j(L.rutaOrg[0]);
      ruta = [...L.rutaOrg.slice(1).map(j), j(L.decision)];
    }
    const p = {
      id: this.nextId++,
      origen,
      x: inicio.x,
      z: inicio.z,
      dir: Math.atan2(ruta[0].x - inicio.x, ruta[0].z - inicio.z),
      ruta,
      ox,
      oz,
      estado: EST.LLEGA,
      vel: randR(PARAMS.velocidad),
      paciencia: randR(PARAMS.pacienciaFila),
      pacPedido: randR(PARAMS.pacienciaPedido),
      t: 0,
      espera: 0,
      edad: 0,
      mueve: false,
      animo: null, // 'feliz' | 'molesto'
      paquete: false,
      slot: -1,
      escala: 0,
      seed: Math.random(),
    };
    this.personas.push(p);
  }

  salir(p, ruta, animo) {
    p.estado = animo ? EST.SALE : EST.PASA;
    p.animo = animo || null;
    p.ruta = ruta.map((q) => ({ x: q.x + p.ox * 0.6, z: q.z + p.oz * 0.6 }));
    if (animo === 'molesto') this.eventos.molestos++;
  }

  mover(p, dt) {
    p.mueve = false;
    let paso = p.vel * dt;
    while (p.ruta.length && paso > 0) {
      const obj = p.ruta[0];
      const dx = obj.x - p.x;
      const dz = obj.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 1e-3) { p.ruta.shift(); continue; }
      p.dir = Math.atan2(dx, dz);
      p.mueve = true;
      if (d <= paso) {
        p.x = obj.x; p.z = obj.z; paso -= d; p.ruta.shift();
      } else {
        p.x += (dx / d) * paso; p.z += (dz / d) * paso; paso = 0;
      }
    }
    return p.ruta.length === 0;
  }

  liberarPuesto(p) {
    for (const s of this.puestosEntrega) if (s.ocupado === p) s.ocupado = null;
  }

  tomarPuesto(p) {
    const libre = this.puestosEntrega.find((s) => !s.ocupado);
    if (libre) { libre.ocupado = p; return { x: libre.p.x, z: libre.p.z }; }
    return { x: rand(0.8, 2.8), z: rand(1.4, 1.9) };
  }

  crearMonedas() {
    const n = PARAMS.monedasPorVenta;
    for (let i = 0; i < n; i++) {
      if (this.monedas.length >= PARAMS.topeMonedas) break;
      this.monedas.push({
        fase: 'espera', d: i * 0.18, u: 0, x: M_INICIO.x, y: M_INICIO.y, z: M_INICIO.z,
        vx: 0, vy: 0, vz: 0, giro: Math.random() * 6, vida: 0,
      });
    }
  }

  // -------------------------------------------------------------------
  step(dt) {
    this.t += dt;

    // 1. Llegadas (peatón ocasional + entradas encendidas)
    this.proxPeaton -= dt;
    if (this.proxPeaton <= 0) {
      if (this.personas.length < this.maxPersonas) this.crearPersona('calle');
      this.proxPeaton = randR(PARAMS.peatonCada);
    }
    for (const k of ['ads', 'org']) {
      const f = this.fuentes[k];
      if (!f.on) continue;
      f.next -= dt;
      while (f.next <= 0) {
        if (this.personas.length < this.maxPersonas) this.crearPersona(k);
        f.next += llegada(this.tasa(k));
      }
    }

    // 2. Personas
    const fx = this.fixed;
    const vivos = [];
    for (const p of this.personas) {
      p.edad += dt;
      let quitar = false;
      switch (p.estado) {
        case EST.LLEGA:
          if (this.mover(p, dt)) { p.estado = EST.MIRA; p.t = rand(0.5, 0.9); p.dir = Math.PI; }
          break;
        case EST.MIRA:
          p.t -= dt;
          if (p.t <= 0) {
            const pe = fx.marketing ? PARAMS.pEntrar.arreglado : PARAMS.pEntrar.roto;
            this.acumEntrar += pe;
            if (this.acumEntrar >= 1) {
              this.acumEntrar -= 1;
              p.estado = EST.A_FILA;
              p.ruta = L.rutaEntrar.map((q) => ({ x: q.x + p.ox * 0.5, z: q.z }));
            } else {
              this.salir(p, L.rutaPasar, null);
            }
          }
          break;
        case EST.A_FILA:
          if (this.mover(p, dt)) {
            if (this.fila.length >= PARAMS.filaMax) {
              this.salir(p, L.rutaSalirFila.slice(1), 'molesto');
            } else {
              this.fila.push(p);
              p.estado = EST.EN_FILA;
              p.espera = 0;
              p.slot = -1;
            }
          }
          break;
        case EST.EN_FILA: {
          const idx = this.fila.indexOf(p);
          if (idx !== p.slot) { p.slot = idx; p.ruta = [L.fila[idx]]; }
          if (!this.mover(p, dt) || p.slot > 0) { /* camina o espera */ }
          if (!p.mueve) p.dir = idx === 0 ? Math.PI : Math.atan2(L.fila[idx - 1].x - p.x, L.fila[idx - 1].z - p.z);
          p.espera += dt;
          if (p.espera > p.paciencia) {
            this.fila.splice(idx, 1);
            this.salir(p, L.rutaSalirFila, 'molesto');
          }
          break;
        }
        case EST.A_CAJA:
          // el tiempo de atención corre desde que el cajero lo llama
          p.t -= dt;
          if (this.mover(p, dt)) { p.estado = EST.ATENDIDO; p.dir = Math.PI; p.t = Math.max(p.t, 0.35); }
          break;
        case EST.ATENDIDO:
          p.t -= dt;
          if (p.t <= 0) {
            for (const c of this.cajeros) if (c.cliente === p) c.cliente = null;
            const pedido = { cliente: p, estado: 'espera' };
            this.pedidos.push(pedido);
            p.pedido = pedido;
            p.estado = EST.A_ENTREGA;
            p.ruta = [{ x: -0.2, z: -2.0 }, this.tomarPuesto(p)];
            p.espera = 0;
            this.eventos.ventas++;
          }
          break;
        case EST.A_ENTREGA:
          if (this.mover(p, dt)) { p.estado = EST.ESPERA; p.dir = Math.PI / 2; }
          break;
        case EST.ESPERA:
          p.espera += dt;
          if (!p.mueve) p.dir = Math.PI / 2;
          if (p.pedido.estado === 'listo') {
            this.liberarPuesto(p);
            p.paquete = true;
            this.salir(p, L.rutaSalirEntrega, 'feliz');
            this.crearMonedas();
          } else if (p.pedido.estado === 'espera' && p.espera > p.pacPedido) {
            this.pedidos.splice(this.pedidos.indexOf(p.pedido), 1);
            this.liberarPuesto(p);
            this.salir(p, L.rutaSalirEntrega, 'molesto');
          }
          break;
        case EST.PASA:
        case EST.SALE:
          if (this.mover(p, dt)) quitar = true;
          break;
      }
      // escala: aparece al llegar y se encoge al salir de la escena
      if (p.estado === EST.PASA || p.estado === EST.SALE) {
        const fin = p.ruta[p.ruta.length - 1];
        const d = fin ? dist(p, fin) + (p.ruta.length > 1 ? 1 : 0) : 0;
        p.escala = Math.min(1, d / 1.4);
      } else {
        p.escala = Math.min(1, p.edad / 0.5);
      }
      if (!quitar) vivos.push(p);
    }
    this.personas = vivos;

    // 3. Caja: pasa el primero de la fila a un cajero libre
    for (const c of this.cajeros) {
      if (!c.activo || c.cliente || !this.fila.length) continue;
      const p = this.fila[0];
      if (dist(p, L.fila[0]) > 0.6) continue;
      this.fila.shift();
      c.cliente = p;
      p.estado = EST.A_CAJA;
      p.ruta = [{ x: c.spot.x, z: c.spot.z }];
      p.t = randR(fx.ventas ? PARAMS.atencion.arreglado : PARAMS.atencion.roto);
    }

    // 4. Bodega: los encargados preparan pedidos en orden
    for (const e of this.encargados) {
      if (e.pedido) {
        e.t += dt;
        if (e.t >= e.dur) {
          e.pedido.estado = 'listo';
          this.pedidos.splice(this.pedidos.indexOf(e.pedido), 1);
          e.pedido = null;
        }
        continue;
      }
      if (!e.activo) continue;
      const ped = this.pedidos.find((q) => q.estado === 'espera');
      if (!ped) continue;
      ped.estado = 'prep';
      e.pedido = ped;
      e.t = 0;
      e.dur = randR(fx.operaciones ? PARAMS.preparacion.arreglado : PARAMS.preparacion.roto);
      e.objetivo = Math.floor(Math.random() * 1000);
    }

    // 5. Monedas
    let llegadas = 0;
    const vivas = [];
    for (const m of this.monedas) {
      m.giro += dt * 7;
      let quitar = false;
      if (m.fase === 'espera') {
        m.d -= dt;
        if (m.d <= 0) m.fase = 'aCaja';
      } else if (m.fase === 'aCaja') {
        m.u += dt / 1.35;
        const q = arco(M_INICIO, M_CAJA, 2.6, Math.min(1, m.u));
        m.x = q.x; m.y = q.y; m.z = q.z;
        if (m.u >= 1) {
          m.u = 0;
          if (Math.random() < (fx.finanzas ? PARAMS.pPerderMoneda.arreglado : PARAMS.pPerderMoneda.roto)) {
            m.fase = 'cae';
            m.x = M_SALIDA.x - 0.15; m.y = 0.75; m.z = L.cajaFuerte.z + 0.72;
            m.vx = rand(-0.4, 1.1); m.vy = rand(0.4, 1.4); m.vz = rand(0.6, 1.6);
            this.eventos.perdidas++;
          } else {
            m.fase = 'aCofre';
          }
        }
      } else if (m.fase === 'aCofre') {
        m.u += dt / 0.95;
        const q = arco(M_SALIDA, M_COFRE, 1.3, Math.min(1, m.u));
        m.x = q.x; m.y = q.y; m.z = q.z;
        if (m.u >= 1) { llegadas++; quitar = true; }
      } else if (m.fase === 'cae') {
        m.vy -= 9 * dt;
        m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
        if (m.y <= 0.06) { m.y = 0.06; m.fase = 'suelo'; m.vida = 1.8; }
      } else if (m.fase === 'suelo') {
        m.vida -= dt;
        if (m.vida <= 0) quitar = true;
      }
      if (!quitar) vivas.push(m);
    }
    this.monedas = vivas;

    // 6. Ritmo de ganancias (promedio móvil exponencial, monedas/s)
    const k = Math.exp(-dt / PARAMS.tauRitmo);
    this.ritmo = this.ritmo * k + llegadas / PARAMS.tauRitmo;
  }

  // Nivel del cofre 0..~1.2 (sin cifras en pantalla)
  get nivelCofre() {
    return Math.min(1.25, this.ritmo / PARAMS.ritmoReferencia);
  }

  get esperandoPedido() {
    return this.personas.filter((p) => (p.estado === EST.ESPERA || p.estado === EST.A_ENTREGA) && p.pedido && p.pedido.estado !== 'listo').length;
  }

  // Qué está frenando el flujo ahora (clave de TEXTOS.avisos)
  diagnostico() {
    const f = this.fixed;
    const ads = this.fuentes.ads;
    const org = this.fuentes.org;
    if (!ads.on && !org.on) return 'pocasVisitas';
    if (AREAS.every((a) => f[a])) {
      const nivelMax = Math.max(ads.on ? ads.nivel : -1, org.on ? org.nivel : -1);
      return nivelMax <= 0 ? 'liberadoBajo' : 'liberado';
    }
    if (!f.ventas && this.fila.length >= 5) return ads.on ? 'filaConAds' : 'filaSinAds';
    if (!f.operaciones && this.esperandoPedido >= 3) return 'entregaLenta';
    if (!f.marketing) return 'vitrina';
    if (!f.ventas) return 'ventas';
    if (!f.operaciones) return 'operaciones';
    return 'finanzas';
  }
}
