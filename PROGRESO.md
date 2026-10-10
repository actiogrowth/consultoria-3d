# PROGRESO

## 2026-10-09 · Sesión 1 — Documentación y construcción completa

### Documentación (PASO 1)
- Revisada la referencia `actiogrowth/sistemaoperativovea` (vista `pipeline`, sin modificar ese repo): se tomó la idea de interacción (dos llaves de entrada, compuertas que liberan el flujo, contador de tramos liberados), el logo y la paleta verde. No se copió nada de Vida en Arte.
- Redactados CONTEXTO.md y ARQUITECTURA.md (como plan), PROGRESO.md y PENDIENTES.md.

### Construcción (PASO 2)
- Estructura: `index.html`, `css/styles.css`, `js/config.js`, `js/layout.js`, `js/sim.js`, `js/scene.js`, `js/ui.js`, `js/main.js`, `assets/`.
- Simulación por agentes (sim.js) con llegadas de Poisson por entrada, decisión en la vitrina, fila FIFO con paciencia, cajeros, pedidos y encargados de bodega, monedas con pérdida por la grieta y ritmo de ganancias con promedio móvil.
- Calibración en Node sin pantalla (8 escenarios × 600 s) para garantizar el mensaje clave: con Ventas rota, más anuncios o Marketing arreglado solo alargan la fila; el cofre solo se llena con las 4 áreas optimizadas.
- Escena 3D low-poly con geometría propia: base de diorama, calle, sendero orgánico con faroles, valla que brilla según intensidad, tienda en corte con vitrina, mostrador, fila, zona de entrega, bodega, caja fuerte y cofre. Personitas con variación de colores, altura y bamboleo; personal con uniforme verde.
- Transiciones visibles y reversibles en cada área (vitrina, 2º cajero, cajas al estante + 2º encargado, grieta sellada). Cofre que rebosa con 4/4.
- Interfaz: etiquetas flotantes con estado, tarjeta (panel derecho / panel inferior en celular), panel de entradas, contador x/4, aviso dinámico, "Flujo liberado al 100%", Reiniciar, Vista general, ayuda inicial.
- Cámara con límites, vuelos suaves y corrimiento de vista para que la tarjeta no tape el área. Vista lateral automática en pantallas angostas.
- Metadatos para compartir + imagen OG 1200×630 generada con una captura real (Chrome sin interfaz).
- Todos los textos (incluidos los pintados en la escena) centralizados en `TEXTOS`.

### Pruebas realizadas (servidor local, navegador integrado)
- Estado inicial con los 4 cuellos de botella visibles (fila larga, gente molesta, cajas en el piso, monedas perdidas, vitrina apagada).
- Aplicar y deshacer cada área (por clic en la interfaz y por consola), con su cambio visual y de flujo.
- Apagar Anuncios, apagar Orgánico, apagar ambas (aviso "No está llegando nadie…", etiquetas tachadas, valla apagada).
- Tres intensidades por entrada (estado del selector, brillo de la valla y tasa de llegadas).
- Mensaje clave: Marketing arreglado + intensidad alta con Ventas rota → fila llena y aviso "más anuncios solo la alargan".
- Las 4 áreas → "Flujo liberado al 100%", cofre rebosando, aviso verde.
- Reiniciar → todo roto, entradas en medio, tarjeta cerrada, 0/4.
- Ancho de celular (375×812) y tableta (768×1024): vista lateral, panel inferior, aplicar/deshacer desde el panel, sin scroll horizontal, título sin cortar.
- Consola sin errores ni advertencias en todas las pruebas.

### Correcciones durante las pruebas
- Cámara inválida si la página carga con el panel del navegador oculto (tamaño 0): se protegió el cálculo de aspecto y se recalcula al primer `resize`.
- Fila inicial poco visible: se agregó `sembrar()` (fila y pedidos ya formados) y se recalibraron paciencias y tiempos.
- Cajeros tapados por el mostrador: mostrador más bajo y tarima para el personal.
- Vitrina "antes" demasiado parecida al "después": vidrio oscuro, letrero fundido con chispazos y halo cálido al arreglar.
- Cajas atravesando las repisas; encuadres de cámara por área; título cortado en celular; cofre tapado por el panel en tableta vertical.

### Pendiente de esta sesión
- Publicación en GitHub Pages bloqueada por autenticación (ver PENDIENTES P1).
