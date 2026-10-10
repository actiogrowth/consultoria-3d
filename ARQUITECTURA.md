# ARQUITECTURA · Tienda en Marcha

> Estado: **construido** (sesión 1, 2026-10-09; cámara 360°, botones de girar y muros transparentes en la sesión 2, 2026-10-09). Este documento describe lo que realmente quedó en el código.

## Stack
- HTML + CSS + JavaScript con módulos ES nativos. **Sin paso de build**: se sirve tal cual en GitHub Pages.
- **Three.js 0.160.0** (versión fija) desde jsDelivr mediante `importmap`:
  - `three` → `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`
  - `three/addons/` → `.../three@0.160.0/examples/jsm/` (se usan `OrbitControls` y `BufferGeometryUtils.mergeGeometries`).
- Toda la geometría es propia (primitivas low-poly). Las únicas texturas son lienzos `<canvas>` dibujados en código: letrero "TIENDA", valla "¡Visítanos!", caras de ánimo, burbuja de recomendación y halo de la vitrina.
- Logo de Actio extraído del sitio de referencia (data URI → `assets/logo-actio.png`).

## Estructura de archivos
```
index.html            Marcado de la interfaz, importmap, metadatos para compartir (OG / Twitter)
css/styles.css        Estilos (paleta Actio; escritorio, tableta y celular; reduced-motion)
js/config.js          TEXTOS (todo lo que se lee en pantalla) + AREAS + COLORES + PARAMS de simulación
js/layout.js          Coordenadas del mundo: caminos, fila, puestos, anclas de etiquetas, vistas de cámara
js/sim.js             Simulación pura (sin Three.js): personas, fila, caja, pedidos, monedas, ritmo, diagnóstico
js/scene.js           Escena 3D: diorama, personitas, monedas, transiciones por área, cámara
js/ui.js              Interfaz HTML: etiquetas flotantes, tarjeta, entradas, aviso, progreso, ayuda
js/main.js            Arranque, precalentamiento, clic/toque en la escena, bucle, pausa con pestaña oculta
assets/logo-actio.png Logo de Actio Growth
assets/favicon.svg    Ícono (A blanca sobre verde Actio, dibujado a mano)
assets/og-image.png   Imagen para compartir 1200×630 (captura real de la demo)
```
Los textos están **todos** en `TEXTOS` (config.js), que es lo primero que carga la app, incluidos los que se pintan dentro de la escena 3D (`TEXTOS.escena`: letrero y valla). Para editar un texto no hace falta tocar otro archivo.

## Modelo de simulación (`js/sim.js`)
Simulación por agentes con paso de tiempo propio (`sim.step(dt)`), independiente del render. El bucle la avanza en subpasos de máx. 0,05 s.

### Estados de una persona (`EST`)
```
llega → mira (frente a la vitrina)
          ├─ pasa (no entra; sale de escena, sin ánimo)
          └─ aFila → enFila → aCaja → atendido → aEntrega → espera
                       │                                   ├─ sale (feliz, con paquete) → monedas
                       └─ sale (molesta: paciencia agotada  └─ sale (molesta: pedido no salió a tiempo)
                                o fila llena al llegar)
```
Cada persona tiene: posición, ruta (lista de puntos), velocidad propia, paciencia en fila, paciencia de pedido, semilla de apariencia (colores, altura, ancho) y ánimo de salida. La escala se anima al aparecer y al salir (se "encoge" al dejar el diorama).

### Llegadas
Proceso de Poisson por entrada: tiempo entre llegadas exponencial con tasa según intensidad. Si se alcanza el tope de personas simultáneas (70 escritorio / 40 celular) la llegada se omite.

### Colas y capacidades por área
| Área | Roto | Arreglado |
|---|---|---|
| Marketing | 30 % de quienes miran la vitrina entra | 68 % entra |
| Ventas | 1 cajero, atención 4,4–5,6 s | 2 cajeros, atención 1,5–2,1 s |
| Operaciones | 1 encargado, preparación 5–7 s | 2 encargados, preparación 0,8–1,3 s |
| Finanzas | 55 % de las monedas se cae por la grieta | 0 % |

- Fila FIFO de 12 puestos en zigzag. Paciencia en fila 32–44 s. Si la fila está llena, quien llega se va molesto.
- El tiempo de atención corre desde que el cajero llama al cliente (incluye su caminata al mostrador).
- Paciencia de pedido 11–16 s: solo se agota si su pedido **no empezó** a prepararse.
- Al arreglar un área, la atención o preparación en curso se acorta (respuesta inmediata en pantalla).
- Cada entrega genera 3 monedas: vuelan de la ventana de entrega a la caja fuerte y de ahí al cofre. Con la grieta, cada moneda tiene 55 % de probabilidad de caer al piso y desaparecer.

**Todos los números viven en `PARAMS` y nunca se muestran en pantalla.**

### Ganancias (nivel del cofre)
- `ritmo` = promedio móvil exponencial (τ = 9 s) de monedas que llegan al cofre por segundo.
- `nivelCofre = min(1,25, ritmo / 1,6)`; 1,6 monedas/s ≈ flujo completo con ambas entradas en intensidad media.
- Es un **ritmo**, no un acumulado: el cofre baja si se rompe un área o se apagan las entradas. Por eso solo se ve lleno con el flujo liberado de punta a punta.
- La escena suaviza ese valor (altura del montón de oro y brillo). Rebosa (monedas que saltan + luz dorada) cuando las 4 áreas están optimizadas **y** el nivel visual supera 0,85.

### Calibración (simulación sin pantalla, 600 s por escenario, ambas entradas en medio salvo indicación)
| Escenario | Fila media | Nivel cofre medio | Qué se ve |
|---|---|---|---|
| Todo roto | ~5 | ~0,13 | fila, gente molesta, pedidos lentos, monedas perdidas |
| Todo roto, intensidad alta | ~10 | ~0,13 | más fila y más molestos, mismo cofre |
| Solo Marketing arreglado | ~11 (llena) | ~0,15 | la fila explota: más gente no se traduce en más ganancia |
| Solo Ventas arreglada | ~0,5 | ~0,14 | la fila desaparece, el cuello pasa a la bodega |
| Marketing + Ventas + Operaciones | ~1 | ~0,45 | flujo rápido, pero la mitad del dinero se pierde |
| Todo arreglado, bajo | ~0,5 | ~0,5 | fluye, cofre a media altura |
| Todo arreglado, medio | ~1,4 | ~1,0 | cofre lleno y rebosando |
| Todo arreglado, alto | ~3,6 | ~1,2 | rebosa; algo de fila pero casi nadie se va |

### Precalentamiento
`sembrar()` coloca 10 personas en la fila y 2 esperando pedido, y luego se simulan 20 s sin dibujar. Así la escena arranca (y se reinicia) con los cuatro cuellos de botella ya visibles.

### Diagnóstico (aviso dinámico)
`sim.diagnostico()` devuelve la clave del aviso, en este orden de prioridad:
1. Ambas entradas apagadas → `sinEntradas`.
2. Las 4 áreas arregladas → `liberado` (o `liberadoBajo` si la intensidad máxima encendida es baja).
3. Ventas rota y fila ≥ 5 → `filaConAds` (si los anuncios están encendidos) o `filaSinAds`.
4. Operaciones rota y ≥ 3 clientes esperando pedido → `entregaLenta`.
5. Primera área rota en el orden del flujo → `vitrina`, `ventas`, `operaciones` o `finanzas`.

La interfaz consulta cada 0,4 s y solo cambia el texto si la nueva clave se mantiene 1,2 s (evita parpadeo). Tras una acción del usuario se fuerza la actualización.

## Escena (`js/scene.js`)
- Diorama sobre una base de tierra: pasto, calle con pasos peatonales, veredas, sendero de piedras con faroles, árboles y arbustos.
- Tienda en corte (sin techo, frente bajo) para ver adentro: vitrina con toldo y letrero, mostrador con cajas registradoras, separadores de fila, zona de entrega, tabique con ventana, bodega con estantes; caja fuerte sobre tarima; cofre con tapa abierta.
- **Personitas**: torso + cabeza + pelo + ojos fusionados en una geometría con colores por vértice (cacheada por combinación), piernas y brazos aparte para animar. Paleta de 12 camisas, 5 tonos de piel, 6 de pelo, 5 de pantalón; altura y ancho variables; bamboleo, balanceo de brazos y giro suave hacia donde caminan. El personal usa camisa verde Actio, delantal y gorra.
- **Monedas**: un solo `InstancedMesh` (140 instancias) para monedas en vuelo, monedas caídas y chispas del cofre.
- **Transiciones por área**: un factor 0→1 por área con amortiguación exponencial:
  - Marketing: letrero fundido (oscuro con chispazos) → encendido; vidrio oscuro → claro; fondo y productos iluminados; luz puntual y halo cálido en la vereda.
  - Ventas: aparece el 2º cajero y su caja registradora (escala). Si se deshace con un cliente en atención, termina con él y luego se va.
  - Operaciones: cada caja vuela (con arco) del piso a su lugar en el estante, escalonadas; aparece el 2º encargado. Los encargados caminan hasta una caja, buscan y vuelven cargando un paquete.
  - Finanzas: la grieta se encoge y aparece un parche remachado; luz de estado roja → verde.
- Valla: brillo emisivo, focos y luz puntual según intensidad de anuncios (0 si están apagados). Faroles del sendero según intensidad orgánica.
- Clic/toque: cajas invisibles por área (`hitBox`) + raycaster. Se distingue clic de arrastre (≤ 8 px y ≤ 600 ms).

### Cámara
- `OrbitControls` con amortiguación. **Giro horizontal libre (360° en ambos sentidos)**: `minAzimuthAngle`/`maxAzimuthAngle` = ±Infinity. Se mantienen los demás límites: distancia 6,5 a 1,25× la vista general, ángulo vertical 0,28–1,22 rad (nunca se mete bajo la isla) y objetivo acotado a la zona del diorama.
- **Mouse (escritorio)**: lo maneja OrbitControls (`rotateSpeed` 0,6, inercia por su amortiguación). Una vuelta completa ≈ alto de la ventana / 0,6 (≈ 1 200 px en 1280×720).
- **Táctil, un dedo**: giro propio (`giroTactil` en scene.js); OrbitControls queda con `touches = { ONE: null, TWO: DOLLY_PAN }`, así que dos dedos siguen acercando y desplazando.
  - Horizontal: una vuelta completa = arrastrar el **85 % del ancho de la pantalla** (306 px en un celular de 360 px).
  - Vertical: 1,8 rad por alto de pantalla, limitado al mismo rango vertical.
  - Inercia al soltar con el dedo en movimiento: velocidad suavizada, tope 4 rad/s y frenado exponencial (×e^-4,5 por segundo), lo que suma como máximo ~50° de giro. Sin inercia con `prefers-reduced-motion`.
  - Tocar la escena durante un vuelo de cámara lo interrumpe y deja el control al dedo.
- **Botones de girar**: `escena.girar(±1)` gira 45° alrededor del objetivo actual con una animación de 0,55 s (easing cúbico). Si se tocan varias veces seguidas, los pasos se suman (el vuelo lleva un azimut "desenrollado" para no tomar el camino corto equivocado). Con `prefers-reduced-motion` el giro es un salto directo.
- Vista general calculada según el aspecto de la pantalla para que todo el diorama quepa. "Vista general" vuelve siempre a esa posición inicial (mismo objetivo, ángulo, distancia y azimut base).
- Al enfocar un área (o volver a la vista general) la cámara toma **el camino más corto** desde donde esté: la diferencia de azimut se normaliza a ±180°.
- **Pantallas angostas (aspecto < 0,85: celular vertical, tableta vertical)**: la cámara inicial se ubica de costado (azimut base 90°), de modo que el recorrido queda de arriba (entradas) hacia abajo (cofre) y la escena se ve mucho más grande que de frente. La valla gira para mirar a esa cámara.
- Vuelos suaves (1,15 s, easing cúbico) al enfocar un área; instantáneos con `prefers-reduced-motion`.
- `camera.setViewOffset` corre la vista para que el área enfocada no quede tapada: a la izquierda de la tarjeta en escritorio, arriba del panel inferior en celular. En pantallas angostas, la vista general también se centra en la franja libre entre cabecera y panel de entradas.

### Muros semitransparentes
- Los muros que pueden tapar el interior se registran con `registrarMuro(mallas, nx, nz, doble)`: muro del fondo (con su remate), muro izquierdo (con su remate), muro derecho de la bodega y tabique entre tienda y bodega (`doble`: tapa desde ambos lados). Cada uno recibe su propio material (clonado) para poder desvanecerse por separado.
- Cada cuadro se calcula, en el plano horizontal, el vector del centro del muro a la cámara y su producto con la normal exterior del muro (`s`). Si `s` pasa de 0,12, la opacidad baja con una curva suave hasta 0,22 cuando `s` ≥ 0,45 (cámara claramente del lado de afuera). La opacidad se amortigua (~0,3 s) para que la transición sea suave; con `prefers-reduced-motion` cambia de inmediato.
- Mientras un muro está semitransparente su material pasa a `transparent` sin escribir profundidad; al volver a opacidad total vuelve a ser opaco (evita artefactos de orden de dibujo).
- Los frentes bajos, la vitrina, los marcos de puerta, los estantes y la caja fuerte no se desvanecen: son bajos, delgados o forman parte de lo que hay que ver.
- Las etiquetas son HTML encima del lienzo y el clic en la escena usa cajas invisibles por área, así que los muros nunca bloquean el toque.

## Interfaz (`js/ui.js`)
- Etiquetas HTML proyectadas desde anclas 3D cada cuadro (se achican con la distancia y se ocultan fuera de cuadro). Punto rojo con latido = problema; verde = optimizada. El cofre pasa a verde con 4/4.
- Tarjeta: escritorio = panel derecho; celular = panel inferior (máx. 58 % del alto). Áreas: "Problema detectado", "Lo que hace Actio", efecto visible y botón Aplicar/Deshacer. Cofre: cómo funciona, cuántas áreas faltan, lista de estado y botón "Ir al siguiente cuello de botella".
- Panel de entradas: interruptor + selector Bajo/Medio/Alto por entrada (elegir un nivel también enciende la entrada). Las etiquetas de la escena de una entrada apagada se tachan.
- Ayuda inicial modal; se recuerda en `localStorage` que ya se vio (con try/catch; si no hay almacenamiento, vuelve a aparecer). Botón "?" la reabre. Esc cierra ayuda o tarjeta.
- **Botones de girar** (`#giro`, dos botones redondos de 48 px con `aria-label` y `title` desde `TEXTOS.botones.girarIzq` / `girarDer`; el grupo usa `TEXTOS.botones.girar`). Posición:
  - Escritorio: esquina inferior derecha (zona de la calle, sin etiquetas). Con la tarjeta abierta se corren a la izquierda de la tarjeta.
  - Tableta (761–1000 px): esquina inferior derecha; con la tarjeta abierta, encima del panel de entradas (no hay hueco entre ambos paneles).
  - Celular (≤ 760 px): a la derecha, justo encima del panel de entradas; con la tarjeta inferior abierta, justo encima de la tarjeta. La interfaz publica `--alto-entradas` y `--alto-inferior` como variables CSS para ubicarlos.
- `?captura` en la URL omite la ayuda (se usó para generar la imagen de compartir).

## Rendimiento y celular
- Tope de personas (70 / 40), monedas (90 simuladas, 140 instancias), materiales cacheados, geometrías compartidas.
- Pixel ratio máx. 1,75 escritorio / 1,5 celular. Sombras (mapa 2048, PCF suave) solo en escritorio; en celular sin sombras dinámicas y sin antialias (las personas siempre llevan una sombra simple en el piso).
- El bucle se detiene con la pestaña oculta (`visibilitychange`) y `dt` se limita a 0,1 s.
- `prefers-reduced-motion`: sin bamboleo, letrero sin chispazos, sin chispas del cofre, transiciones y cámara instantáneas, CSS sin animaciones.
- Celular: `touch-action: none` en el lienzo (un dedo gira con el giro propio, dos dedos acercan/desplazan con OrbitControls), botones ≥ 44 px, `overflow: hidden` en html/body (sin scroll horizontal), `viewport-fit=cover` y márgenes seguros.
- Detección de celular: `(max-width: 760px), (pointer: coarse)`.
- Sin WebGL se muestra un aviso con el logo.

## Pruebas
- `window.__tienda` expone la app para pruebas desde la consola (`enfocar`, `toggleArea`, `setFuente`, `reiniciar`, `sim`, `escena`; p. ej. `escena.girar(1)`). No afecta al usuario.
- El giro táctil se probó despachando `PointerEvent` sintéticos con `pointerType: 'touch'` sobre el lienzo. Esos eventos sintéticos hacen que OrbitControls registre un error de `releasePointerCapture` (no existe un puntero real); con dedos reales no ocurre.
- La calibración de la simulación se hizo ejecutando `sim.js` en Node sin pantalla (no se versionó el script).

## Publicación
- Repositorio público `actiogrowth/consultoria-3d`, rama `main`, GitHub Pages desde la raíz de `main`.
- URL: https://actiogrowth.github.io/consultoria-3d/
- GitHub Pages cachea los archivos ~10 min: tras publicar un cambio puede tardar en verse sin recarga forzada.
- `.claude/` (configuración local del servidor de pruebas) está excluido del repositorio.
