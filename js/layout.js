// =====================================================================
//  Coordenadas del mundo (x a la derecha, z hacia la cámara, y arriba).
//  La simulación y la escena leen de aquí para que caminos, fila,
//  puestos y decorado siempre coincidan.
// =====================================================================

const P = (x, z) => ({ x, z });

export const L = {
  // Base del diorama
  base: { x0: -16, x1: 16, z0: -8.6, z1: 9 },
  calle: { z0: 4.8, z1: 7.6 },
  vereda: { z0: 3.0, z1: 4.8 },

  // Tienda
  tienda: { x0: -8.4, x1: 7.2, z0: -5.2, z1: 2.6 },
  vitrina: { x0: -8.3, x1: -5.7, z: 2.6, alto: 1.7 },
  puerta: { x0: -5.4, x1: -4.2 },
  puertaSalida: { x0: 2.2, x1: 3.4 },
  tabique: { x: 3.6, ventana: [-2.6, 0.6] },
  mostrador: { x0: -4.6, x1: -0.4, z: -3.2 },

  // Entradas
  spawnAds: P(-15.8, 3.9),
  spawnPeaton: P(15.8, 4.15), // peatón ocasional: llega por la vereda desde la derecha
  rutaOrg: [P(-15.4, -7.8), P(-13.6, -6.3), P(-12.2, -4.3), P(-11.3, -1.9), P(-10.6, 0.7), P(-9.5, 2.9)],
  decision: P(-7.0, 3.75),

  // Caminos
  rutaEntrar: [P(-4.8, 3.4), P(-4.8, 1.7)],
  rutaPasar: [P(-3.0, 3.95), P(-3.0, 6.2), P(-3.0, 8.6)],
  rutaSalirFila: [P(-4.8, 1.7), P(-4.8, 3.5), P(-3.5, 4.0), P(-3.5, 6.2), P(-3.5, 8.6)],
  rutaSalirEntrega: [P(2.8, 1.9), P(2.8, 3.6), P(4.4, 4.0), P(4.4, 6.2), P(4.4, 8.6)],

  // Fila en zigzag (cabeza primero)
  fila: [
    P(-2.4, -1.25), P(-3.15, -1.25), P(-3.9, -1.25), P(-4.65, -1.25),
    P(-5.4, -1.25), P(-6.15, -1.25), P(-6.9, -1.25), P(-7.6, -1.25),
    P(-7.6, -0.1), P(-6.85, -0.1), P(-6.1, -0.1), P(-5.35, -0.1),
  ],

  // Caja
  cajeros: [P(-3.6, -4.0), P(-1.4, -4.0)],
  puestosCaja: [P(-3.6, -2.45), P(-1.4, -2.45)],

  // Entrega
  puestosEntrega: [
    P(1.0, -2.1), P(1.8, -2.1), P(2.6, -2.1),
    P(1.0, -1.1), P(1.8, -1.1), P(2.6, -1.1),
    P(1.0, -0.1), P(1.8, -0.1), P(2.6, -0.1),
    P(1.0, 0.9), P(1.8, 0.9), P(2.6, 0.9),
  ],
  ventanaEntrega: { x: 3.6, y: 1.25, z: -1.0 },

  // Bodega
  bodega: { x0: 3.8, x1: 7.0, z0: -5.0, z1: 2.4 },
  encargados: [P(4.3, -1.3), P(4.3, -0.2)],

  // Finanzas y ganancias
  cajaFuerte: { x: 10.0, z: -1.6 },
  cofre: { x: 12.9, z: 1.4 },
  valla: { x: -12.9, z: 1.3, rot: 0.22 },
};

// Anclas de etiquetas flotantes (x, y, z)
export const ANCLAS = {
  marketing: [-7.0, 3.2, 2.6],
  ventas: [-2.5, 2.9, -3.2],
  operaciones: [5.4, 3.0, -1.6],
  finanzas: [10.0, 3.1, -1.6],
  cofre: [12.9, 2.5, 1.4],
  ads: [-12.9, 4.9, 1.3],
  org: [-11.2, 1.3, -2.6],
};

// Vistas de cámara al enfocar un área. az es relativo al azimut base
// (frontal en pantallas anchas, lateral en pantallas angostas).
export const VISTAS = {
  general: { target: [-0.6, 0.2, -0.2], polar: 0.9, az: 0 },
  marketing: { target: [-7.2, 0.8, 1.8], r: 11.5, polar: 1.0, az: -0.22 },
  ventas: { target: [-4.6, 0.6, -1.5], r: 14, polar: 0.84, az: 0 },
  operaciones: { target: [4.0, 0.6, -1.2], r: 12.5, polar: 0.84, az: 0.12 },
  finanzas: { target: [10.8, 0.8, -0.6], r: 10.5, polar: 0.95, az: 0.22 },
  cofre: { target: [12.3, 0.6, 0.9], r: 9.5, polar: 1.0, az: 0.28 },
};
