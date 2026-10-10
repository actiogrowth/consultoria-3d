// =====================================================================
//  Tienda en Marcha · Configuración
//  TEXTOS: todo lo que se lee en pantalla (editar aquí).
//  PARAMS: números internos de la simulación (nunca se muestran).
// =====================================================================

export const TEXTOS = {
  marca: {
    eyebrow: 'Actio Growth · Simulador',
    titulo: 'Tienda en Marcha',
    subtitulo: 'Cómo un negocio pasa de tener cuellos de botella a convertir visitas en ganancias.',
  },

  progreso: (n) => `${n}/4 áreas optimizadas`,

  botones: {
    vistaGeneral: 'Vista general',
    reiniciar: 'Reiniciar',
    ayuda: 'Ayuda',
    cerrar: 'Cerrar',
    aplicar: 'Aplicar consultoría',
    deshacer: 'Deshacer',
    siguiente: 'Ir al siguiente cuello de botella',
  },

  entradas: {
    titulo: 'Entradas',
    ads: 'Anuncios pagos',
    org: 'Orgánico',
    niveles: ['Bajo', 'Medio', 'Alto'],
    encender: 'Encender',
    apagar: 'Apagar',
  },

  etiquetasEscena: {
    ads: 'Anuncios pagos',
    org: 'Orgánico · recomendación',
  },

  // Textos pintados dentro de la escena 3D
  escena: {
    letrero: 'TIENDA',
    vallaTitulo: '¡Visítanos!',
    vallaBajada: 'Tu tienda de siempre',
  },

  estado: {
    problema: 'Problema',
    optimizada: 'Optimizada',
  },

  tarjeta: {
    problema: 'Problema detectado',
    solucion: 'Lo que hace Actio',
    antes: 'Así está hoy',
    despues: 'Así queda con Actio',
  },

  areas: {
    marketing: {
      nombre: 'Marketing',
      lugar: 'La vitrina',
      problema:
        'La vitrina está apagada y el mensaje no se entiende. La gente pasa frente al negocio, mira un segundo y sigue de largo.',
      solucion:
        'Aclaramos a quién le hablas y qué te hace distinto, y lo llevamos a una vitrina y una comunicación que invitan a entrar.',
      efecto: 'La vitrina se ilumina y entra mucha más gente.',
    },
    ventas: {
      nombre: 'Ventas',
      lugar: 'Fila, mostrador y caja',
      problema:
        'Un solo cajero atiende todo. Se forma fila, la espera se alarga y parte de los clientes se va molesta sin comprar.',
      solucion:
        'Ordenamos el proceso comercial: roles claros, atención más ágil y capacidad para responder cuando llega más gente.',
      efecto: 'Llega un segundo cajero y la fila avanza rápido.',
    },
    operaciones: {
      nombre: 'Operaciones / Servicios',
      lugar: 'Entrega y bodega',
      problema:
        'La bodega está desordenada. Encontrar cada pedido toma demasiado y algunos clientes se cansan de esperar y se van.',
      solucion:
        'Diseñamos procesos y orden operativo para que cada pedido se prepare y se entregue rápido, sin errores ni esperas.',
      efecto: 'Las cajas vuelven a los estantes y la entrega es inmediata.',
    },
    finanzas: {
      nombre: 'Finanzas',
      lugar: 'La caja fuerte',
      problema:
        'La caja fuerte tiene una grieta: se vende, pero parte del dinero se pierde en el camino y no llega a ganancias.',
      solucion:
        'Ponemos orden en costos, cobros y flujo de caja para que lo que se vende se convierta, de verdad, en ganancia.',
      efecto: 'La grieta se sella y todo el dinero llega al cofre.',
    },
  },

  cofre: {
    nombre: 'Ganancias',
    lugar: 'El cofre',
    comoFunciona:
      'El cofre se llena con lo que de verdad llega al final del recorrido. Su ritmo depende de todo el flujo: si un área se frena, lo que hacen bien las demás no alcanza a llegar.',
    tituloComo: 'Cómo funciona',
    tituloEstado: 'Cómo va el flujo',
    faltan: (n) =>
      n === 1
        ? 'Falta 1 área por optimizar para liberar el flujo completo.'
        : `Faltan ${n} áreas por optimizar para liberar el flujo completo.`,
    completo: 'Flujo liberado al 100%: lo que entra se convierte en ganancia.',
  },

  liberado: 'Flujo liberado al 100%',

  avisos: {
    sinEntradas: 'No está llegando nadie: enciende anuncios pagos u orgánico para atraer visitas.',
    filaConAds: 'Hay fila en caja: más anuncios solo la alargan y la gente se va molesta.',
    filaSinAds: 'Hay fila en caja: la gente espera demasiado y se va molesta.',
    entregaLenta: 'Los pedidos tardan en salir: los clientes esperan y algunos se van insatisfechos.',
    vitrina: 'La vitrina no llama la atención: la mayoría pasa de largo.',
    ventas: 'Con un solo cajero, la caja no da abasto en cuanto llega más gente.',
    operaciones: 'La bodega desordenada frena las entregas en cuanto sube la demanda.',
    finanzas: 'Se vende, pero parte del dinero se pierde antes de llegar al cofre.',
    liberado: 'Flujo liberado de punta a punta: cada visita puede convertirse en ganancia.',
    liberadoBajo: 'Todo fluye. Con más visitas, el cofre se llena más rápido.',
  },

  ayuda: {
    titulo: 'Así funciona Tienda en Marcha',
    pasos: [
      'Las personas llegan por <b>anuncios pagos</b> o de forma <b>orgánica</b>. Enciéndelos o cambia su intensidad en el panel de entradas.',
      'Cada área del negocio tiene un <b>cuello de botella</b>. Toca su etiqueta para ver el problema y lo que hace Actio.',
      'Aplica la consultoría área por área y mira cómo se llena el cofre de <b>Ganancias</b>.',
    ],
    tip: 'Arrastra para girar la vista. Usa la rueda o pellizca para acercar.',
    empezar: 'Empezar',
  },

  meta: {
    titulo: 'Tienda en Marcha · Simulador de consultoría | Actio Growth',
  },
};

// Orden del flujo (también orden del aviso y del botón "siguiente").
export const AREAS = ['marketing', 'ventas', 'operaciones', 'finanzas'];

// Paleta de la marca (igual a la página de referencia).
export const COLORES = {
  g900: '#004225',
  g700: '#1F5E3A',
  g600: '#355E3B',
  g500: '#4C6B47',
  grey: '#E1E8E2',
  ink: '#13261c',
  muted: '#5f7167',
  bg: '#F1F5F1',
};

// Parámetros internos. Tiempos en segundos, tasas en personas/segundo.
export const PARAMS = {
  // Llegadas por entrada según intensidad [bajo, medio, alto]
  llegadas: {
    ads: [0.25, 0.5, 0.85],
    org: [0.15, 0.3, 0.5],
  },
  // Marketing: probabilidad de entrar al pasar frente a la vitrina
  pEntrar: { roto: 0.3, arreglado: 0.68 },
  // Ventas
  cajeros: { roto: 1, arreglado: 2 },
  atencion: { roto: [4.4, 5.6], arreglado: [1.5, 2.1] }, // incluye caminar al mostrador
  filaMax: 12,
  pacienciaFila: [32, 44],
  // Operaciones
  encargados: { roto: 1, arreglado: 2 },
  preparacion: { roto: [5.0, 7.0], arreglado: [0.8, 1.3] },
  pacienciaPedido: [11, 16],
  // Finanzas
  monedasPorVenta: 3,
  pPerderMoneda: { roto: 0.55, arreglado: 0 },
  // Ganancias: ritmo de referencia (monedas/s) = flujo completo en intensidad media
  ritmoReferencia: 1.6,
  tauRitmo: 9,
  // Personas
  velocidad: [1.45, 1.85],
  topePersonas: { escritorio: 70, celular: 40 },
  topeMonedas: 90,
  precalentar: 20, // segundos simulados al iniciar / reiniciar (tras sembrar la fila)
};
