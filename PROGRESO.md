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

### Publicación
- Instalada la CLI de GitHub (`gh` 2.102.0, winget) y sesión iniciada por Daniel con la cuenta `actiogrowth` (las credenciales guardadas en el equipo eran de otras cuentas).
- Creado el repo público `actiogrowth/consultoria-3d`, subida la rama `main` y activado GitHub Pages desde la raíz de `main`.
- Verificado https://actiogrowth.github.io/consultoria-3d/ en escritorio (1280×720) y celular (375×812): carga Three.js 0.160.0 desde jsDelivr, la escena y la interfaz funcionan (enfocar, aplicar, deshacer, reiniciar), `og-image.png` responde 200 y la consola queda sin errores ni advertencias.

## 2026-10-09 · Sesión 2 — Giro 360° y decisiones del PO

### Cámara y giro
- Quitado el límite de giro horizontal: la cámara da 360° alrededor de la tienda en ambos sentidos (mouse, dedo y botones). Se mantienen los límites vertical, de distancia y de desplazamiento.
- Giro táctil propio con un dedo: una vuelta completa = 85 % del ancho de pantalla (antes hacía falta ~3 anchos en 360 px y ~3,6 en 375 px), con inercia suave al soltar (máx. ~50° extra) y sin inercia con `prefers-reduced-motion`. Dos dedos siguen acercando y desplazando.
- Botones "Girar a la izquierda" / "Girar a la derecha": pasos de 45° con animación de 0,55 s que se suman al tocar seguido; salto directo con `prefers-reduced-motion`. Textos en `TEXTOS.botones`.
- Muros del fondo, izquierdo, derecho de la bodega y tabique se vuelven semitransparentes (hasta 22 %) con transición suave cuando quedan entre la cámara y el interior.
- "Vista general" sigue devolviendo la posición inicial; enfocar un área toma el camino más corto desde cualquier ángulo.

### Pruebas
- 360 px (celular pequeño), 375×812 (celular), 768×1024 (tableta) y 1280×720 (escritorio): sin scroll horizontal y botones sin chocar con el panel de entradas ni con la tarjeta (medido por posición de cajas).
- Botones: 8 pasos a la izquierda = +360° y 8 a la derecha = −360° exactos; tres toques rápidos encadenados = 135°.
- Dedo emulado (eventos táctiles sintéticos) a 360 px: arrastrar el 85 % del ancho = 360° en cada sentido; golpe corto con inercia; límites verticales respetados (0,28 y 1,22 rad); dos dedos no activan el giro propio.
- Mouse: arrastre horizontal supera el antiguo límite (136° en un solo arrastre).
- Camino más corto: desde 135° a Finanzas (−122°), desde 148° a Ventas (−148°), desde 135° a la vista general (−135°), terminando exactamente en la posición inicial.
- Muros: desde atrás el muro del fondo baja a 0,23; desde la izquierda el muro izquierdo a 0,28; en la vista lateral de celular se desvanecen el muro derecho y el tabique.
- Etiquetas tocadas con clic real desde una vista girada (detrás/lateral): abren su tarjeta y la cámara vuela por el camino corto.
- `prefers-reduced-motion` forzado en ejecución: el botón gira 45° de golpe, sin vuelo.
- Consola sin errores propios. El único error registrado vino de los eventos táctiles sintéticos de la prueba (`releasePointerCapture` de OrbitControls sin puntero real).

### Decisiones registradas
- D2, D4 y D7 movidas a "Decisiones resueltas" (2026-10-09). D8 aplazado hasta el dominio propio. P5 pasa a riesgo conocido de prioridad Media con la recomendación para reuniones.

## 2026-10-10 · Sesión 3 — Arranque vacío, pantallas bajas y etiquetas sin superposición

### Arranque y simulación
- La demo arranca con Anuncios pagos y Orgánico apagados y la tienda vacía; se quitó el arranque "con historia" (`sembrar()` y el precalentamiento).
- Peatón ocasional siempre activo: uno cada 8–12 s llega por la vereda desde la derecha y sigue las reglas de cualquier persona.
- Al encender una entrada con el interruptor arranca en Medio. Bajo, Medio y Alto mantienen sus tasas.
- Nuevo aviso con las entradas apagadas: "Solo pasa alguien de vez en cuando: enciende anuncios pagos u orgánico para atraer más visitas." Paso 1 de la ayuda actualizado.
- "Reiniciar" vuelve a ese arranque exacto.
- Recalibración para que la fila crezca a la vista con solo anuncios en Medio y Ventas rota (ver ARQUITECTURA y PENDIENTES D10): ~3 personas a los 30 s, ~5 a los 45 s y ~7 al minuto.

### Pantallas bajas (celular en horizontal, ventanas bajas)
- Detección por `(max-height: 520px) and (min-aspect-ratio: 1/1)` y clase `html.baja`.
- Cabecera de una sola barra con el aviso en una línea (texto corto, se despliega completo al tocarlo), progreso visible y botones como íconos.
- Panel de Entradas plegable (botón compacto con señal de entradas encendidas, panel lateral, cierre con ×, Esc o toque fuera).
- Tarjeta como panel lateral derecho; botones de girar abajo a la derecha, a la izquierda de la tarjeta cuando está abierta.

### Etiquetas
- Colocación sin superposición en todos los tamaños: busca el hueco libre más cercano evitando otras etiquetas y la interfaz, con línea guía; acorta las de las entradas; oculta las que no tienen lugar (nunca la del área enfocada) y las de áreas tapadas por la tarjeta o el panel.
- Un arrastre con el dedo que empieza sobre una etiqueta también gira la escena (sin abrir la tarjeta al soltar).

### Otros arreglos encontrados en las pruebas
- En 761–1180 px el aviso tapaba los botones Vista general / Reiniciar: ahora va debajo.
- Tocar fuera del panel de entradas para cerrarlo ya no abre a la vez el área que estaba debajo del dedo.
- Arrastrar con el mouse durante un vuelo de cámara ahora interrumpe el vuelo (antes se ignoraba).
- La inercia pendiente del mouse ya no desvía los giros por botón ni los vuelos.

### Pruebas (Chrome sin interfaz por CDP, con toques reales emulados)
- Tamaños: 640×360 y 844×390 (celular horizontal, diseño bajo), 360×640 y 390×844 (celular vertical), 768×1024 (tableta) y 1280×720 (escritorio).
- En cada uno: arranque vacío con entradas apagadas y aviso nuevo; peatón ocasional en tiempo real; encender y apagar cada entrada (arranca en Medio); mensaje clave con 60 s simulados (la fila llegó a 5–10 y el aviso pasó a "Hay fila en caja…" en los seis); abrir y cerrar el panel de Entradas (botón, ×, toque fuera) en pantallas bajas; aviso desplegable; tarjeta de cada una de las 5 etiquetas tocando la etiqueta; giro con el dedo (85 % del ancho = 361° en cada sentido; 30 % = 124°; desde una etiqueta = 127° sin abrir tarjeta), con mouse (400 px ≈ 110°) y con botones (4 pasos de 45° y vuelta); "Reiniciar".
- Comprobación automática de etiquetas en cada estado (inicio, panel abierto, cada tarjeta, girado, 180°): ninguna superpuesta, ninguna tapada por cabecera/aviso/panel/tarjeta/botones, ninguna fuera de pantalla; botones de girar sin chocar con otros controles; sin scroll horizontal.
- Consola sin errores ni advertencias en todas las corridas.
