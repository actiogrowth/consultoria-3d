# ARQUITECTURA · Tienda en Marcha

> Estado: **construido** (sesión 1, 2026-10-09; cámara 360°, botones de girar y muros transparentes en la sesión 2, 2026-10-09; arranque vacío, peatón ocasional, diseño para pantallas bajas y etiquetas sin superposición en la sesión 3, 2026-10-10). Este documento describe lo que realmente quedó en el código.

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
js/main.js            Arranque (estado inicial), detección de pantalla baja, clic/toque en la escena, bucle, pausa con pestaña oculta
assets/logo-actio.png Logo de Actio Growth
assets/favicon.svg    Ícono (A blanca sobre verde Actio, dibujado a mano)
assets/og-image.png   Imagen para compartir 1200×630 (captura real de la demo)
```
Los textos están **todos** en `TEXTOS` (config.js), que es lo primero que carga la app, incluidos los que se pintan dentro de la escena 3D (`TEXTOS.escena`: letrero y valla). Para editar un texto no hace falta tocar otro archivo.

## Modelo de simulación (`js/sim.js`)
Simulación por agentes con paso de tiempo propio (`sim.step(dt)`), independiente del render. El bucle la avanza en subpasos de máx. 0,05 s.

### Estados de una persona (`EST`)
```
(origen: ads | org | calle)
llega → mira (frente a la vitrina)
          ├─ pasa (no entra; sale de escena, sin ánimo)
          └─ aFila → enFila → aCaja → atendido → aEntrega → espera
                       │                                   ├─ sale (feliz, con paquete) → monedas
                       └─ sale (molesta: paciencia agotada  └─ sale (molesta: pedido no salió a tiempo)
                                o fila llena al llegar)
```
Cada persona tiene: posición, ruta (lista de puntos), velocidad propia, paciencia en fila, paciencia de pedido, semilla de apariencia (colores, altura, ancho) y ánimo de salida. La escala se anima al aparecer y al salir (se "encoge" al dejar el diorama).

### Llegadas
- **Entradas** (anuncios y orgánico): tasa según intensidad, igual que antes (anuncios 0,25 / 0,5 / 0,85 por segundo; orgánico 0,15 / 0,3 / 0,5). El tiempo entre llegadas sigue una distribución Erlang-3 (suma de tres exponenciales): misma tasa media que un Poisson, pero con menos rachas, para que la fila crezca de forma pareja y el mensaje clave se vea siempre.
- **Peatón ocasional** (`origen: 'calle'`): siempre activo, uno cada 8–12 s (uniforme), aunque las entradas estén apagadas. Llega por la vereda desde la derecha (`L.spawnPeaton`) hasta la vitrina y desde ahí sigue las mismas reglas que cualquier persona.
- Si se alcanza el tope de personas simultáneas (70 escritorio / 40 celular) la llegada se omite.
- Arranque: ambas entradas apagadas (`on: false`, nivel guardado en Medio). Al encender con el interruptor, la entrada vuelve a Medio; si se toca directamente un nivel con la entrada apagada, se enciende en ese nivel.

### Colas y capacidades por área
| Área | Roto | Arreglado |
|---|---|---|
| Marketing | 45 % de quienes miran la vitrina entra | 68 % entra |
| Ventas | 1 cajero, atención 7,0–8,6 s | 2 cajeros, atención 1,5–2,1 s |
| Operaciones | 1 encargado, preparación 5–7 s | 2 encargados, preparación 0,8–1,3 s |
| Finanzas | 55 % de las monedas se cae por la grieta | 0 % |

- La decisión en la vitrina usa un acumulador (cada persona suma la probabilidad de entrar; entra cuando el acumulado llega a 1): se respeta exactamente la proporción que entra, sin rachas de muchos seguidos que entran o pasan de largo.
- Fila FIFO de 12 puestos en zigzag. Paciencia en fila 50–66 s. Si la fila está llena, quien llega se va molesto.
- El tiempo de atención corre desde que el cajero llama al cliente (incluye su caminata al mostrador).
- Paciencia de pedido 11–16 s: solo se agota si su pedido **no empezó** a prepararse.
- Al arreglar un área, la atención o preparación en curso se acorta (respuesta inmediata en pantalla).
- Cada entrega genera 3 monedas: vuelan de la ventana de entrega a la caja fuerte y de ahí al cofre. Con la grieta, cada moneda tiene 55 % de probabilidad de caer al piso y desaparecer.

**Todos los números viven en `PARAMS` y nunca se muestran en pantalla.**

### Ganancias (nivel del cofre)
- `ritmo` = promedio móvil exponencial (τ = 9 s) de monedas que llegan al cofre por segundo.
- `nivelCofre = min(1,25, ritmo / 1,45)`; 1,45 monedas/s ≈ flujo completo con solo anuncios en Medio (más el peatón ocasional).
- Es un **ritmo**, no un acumulado: el cofre baja si se rompe un área o se apagan las entradas. Por eso solo se ve lleno con el flujo liberado de punta a punta.
- La escena suaviza ese valor (altura del montón de oro y brillo). Rebosa (monedas que saltan + luz dorada) cuando las 4 áreas están optimizadas **y** el nivel visual supera 0,8; deja de rebosar si baja de 0,7 (histéresis para que no titile).

### Calibración (simulación sin pantalla en Node; promedios después de los primeros 90 s, 4 repeticiones de 600 s)
| Escenario | Fila media | Nivel cofre | Qué se ve |
|---|---|---|---|
| Entradas apagadas, todo roto | ~0 | ~0,04 | solo el peatón ocasional |
| Solo anuncios Medio, todo roto | ~11 | ~0,12 | la fila se forma y se llena; gente molesta |
| Anuncios + orgánico Medio, todo roto | ~12 (llena) | ~0,13 | se llena antes, más molestos, mismo cofre |
| Anuncios Alto, todo roto | ~12 (llena) | ~0,12 | más anuncios: más fila y más molestos, no más ganancia |
| Anuncios Medio, solo Marketing | ~12 (llena) | ~0,12 | entra más gente pero la caja no da abasto |
| Anuncios Medio, solo Ventas | ~0,5 | ~0,16 | la fila desaparece; ~5 clientes esperando pedido (cuello en bodega) |
| Anuncios Medio, Marketing + Ventas + Operaciones | ~1 | ~0,38 | flujo rápido, pero más de la mitad del dinero se pierde |
| Anuncios Bajo, todo arreglado | ~0,5 | ~0,49 | fluye, cofre a media altura |
| Anuncios Medio, todo arreglado | ~1 | ~0,87 | cofre lleno y rebosando |
| Anuncios + orgánico Medio, todo arreglado | ~1,3 | ~1,18 | rebosa |
| Anuncios + orgánico Alto, todo arreglado | ~2,8 | ~1,25 | rebosa; algo de fila pero nadie se va |

**Crecimiento de la fila al encender solo anuncios en Medio con Ventas rota** (300 arranques, tras 10 s con todo apagado): a los 30 s hay ~3 personas, a los 45 s ~5 y a los 60 s ~7 (en 9 de cada 10 arranques, al menos 6). Antes de usar llegadas Erlang y el acumulador en la vitrina, 1 de cada 10 arranques tenía solo 3 personas al minuto.

### Arranque y Reiniciar
`main.js → estadoInicial()`: `sim.reset()` (entradas apagadas, tienda vacía, 4 áreas rotas), transiciones de la escena al estado roto al instante, valla y faroles apagados y personas borradas. No hay precalentamiento: la tienda se ve vacía y se llena al encender una entrada.

### Diagnóstico (aviso dinámico)
`sim.diagnostico()` devuelve la clave del aviso, en este orden de prioridad:
1. Ambas entradas apagadas → `pocasVisitas` (solo pasa el peatón ocasional).
2. Las 4 áreas arregladas → `liberado` (o `liberadoBajo` si la intensidad máxima encendida es baja).
3. Ventas rota y fila ≥ 5 → `filaConAds` (si los anuncios están encendidos) o `filaSinAds`.
4. Operaciones rota y ≥ 3 clientes esperando pedido → `entregaLenta`.
5. Primera área rota en el orden del flujo → `vitrina`, `ventas`, `operaciones` o `finanzas`.

La interfaz consulta cada 0,4 s y solo cambia el texto si la nueva clave se mantiene 1,2 s (evita parpadeo). Tras una acción del usuario se fuerza la actualización. Cada clave tiene un texto completo (`TEXTOS.avisos`) y uno de una línea (`TEXTOS.avisosCortos`) para pantallas bajas.

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

### Etiquetas sin superposición (todos los tamaños)
Cada cuadro, `posicionarEtiquetas()`:
1. Proyecta las anclas y arma la lista de **obstáculos** de la interfaz con `getBoundingClientRect()` (+4 px): logo/título, progreso, botonera, aviso, "Flujo liberado", botón Entradas, botones de girar, panel de entradas y tarjeta.
2. Si el ancla de un área queda **debajo de la tarjeta o del panel lateral de entradas abierto**, esa área está tapada y su etiqueta no se muestra (no tiene sentido señalar algo que no se ve). Con una tarjeta abierta tampoco se muestran las etiquetas de las entradas.
3. Ordena por prioridad: la etiqueta del área enfocada, luego las 4 áreas y Ganancias, luego las entradas.
4. Para cada etiqueta prueba, en este orden: su lugar sobre el ancla, el desplazamiento que tenía el cuadro anterior (evita saltos) y una grilla de desplazamientos (±4 columnas de media etiqueta, de 6 filas hacia arriba a 5 hacia abajo) ordenada por distancia, prefiriendo subir. Elige la primera posición que no choca con etiquetas ya colocadas ni con obstáculos y queda dentro de la pantalla.
5. Las etiquetas de las entradas prueban primero su texto largo y, si no caben, el corto (`TEXTOS.etiquetasEscenaCortas`: "Anuncios", "Orgánico").
6. Si una etiqueta no encuentra hueco libre se oculta, en vez de quedar encima de la cabecera, el aviso, el panel o la tarjeta. La única excepción es la etiqueta del área enfocada, que nunca se oculta (va a la posición que menos tapa).
7. Cuando una etiqueta queda a más de 8 px de su ancla, se dibuja una línea guía punteada (SVG) desde la etiqueta hasta un punto en el ancla, y se oculta su piquito. El desplazamiento se suaviza (~70 ms); con `prefers-reduced-motion` es instantáneo.
- Las etiquetas tienen `touch-action: none` y el giro con el dedo se escucha en la ventana: un arrastre que empieza sobre una etiqueta también gira la escena, y al soltar no abre su tarjeta (`escena.vieneDeArrastre()`); un toque sí la abre.
- Tarjeta: escritorio = panel derecho; celular = panel inferior (máx. 58 % del alto). Áreas: "Problema detectado", "Lo que hace Actio", efecto visible y botón Aplicar/Deshacer. Cofre: cómo funciona, cuántas áreas faltan, lista de estado y botón "Ir al siguiente cuello de botella".
- Panel de entradas: interruptor + selector Bajo/Medio/Alto por entrada (elegir un nivel también enciende la entrada). Las etiquetas de la escena de una entrada apagada se tachan.
- Ayuda inicial modal; se recuerda en `localStorage` que ya se vio (con try/catch; si no hay almacenamiento, vuelve a aparecer). Botón "?" la reabre. Esc cierra ayuda o tarjeta.
- **Botones de girar** (`#giro`, dos botones redondos de 48 px —44 px en pantallas bajas— con `aria-label` y `title` desde `TEXTOS.botones.girarIzq` / `girarDer`; el grupo usa `TEXTOS.botones.girar`). Posición:
  - Escritorio: esquina inferior derecha (zona de la calle, sin etiquetas). Con la tarjeta abierta se corren a la izquierda de la tarjeta.
  - Tableta (761–1000 px): esquina inferior derecha; con la tarjeta abierta, encima del panel de entradas (no hay hueco entre ambos paneles).
  - Celular (≤ 760 px): a la derecha, justo encima del panel de entradas; con la tarjeta inferior abierta, justo encima de la tarjeta. La interfaz publica `--alto-entradas` y `--alto-inferior` como variables CSS para ubicarlos.
  - Pantalla baja: esquina inferior derecha; con la tarjeta lateral abierta, a su izquierda.

### Diseño para pantallas bajas (celular en horizontal, ventanas bajas)
- **Detección**: `matchMedia('(max-height: 520px) and (min-aspect-ratio: 1/1)')` en `main.js` agrega la clase `baja` a `<html>` al cargar y en cada `resize` (al rotar el celular). Todo el CSS de este diseño cuelga de `html.baja`, con más especificidad que las reglas de celular, así que no toca el diseño de escritorio ni el de celular vertical. Al cambiar de diseño se pliega el panel, se cierra el aviso desplegado, se vuelven a medir las etiquetas y la cámara vuelve a la vista general (si no hay tarjeta abierta).
- **Cabecera**: una sola barra blanca (~53 px) con logo, título (se oculta por debajo de 700 px de ancho), el **aviso en una línea**, el progreso "x/4 áreas optimizadas" y los botones Vista general / Reiniciar / Ayuda como íconos de 40 px. El aviso (`.centro-top`) vive dentro de la cabecera en el HTML; en los otros diseños sigue flotando centrado como antes (posición fija).
- **Aviso**: muestra el texto corto de `TEXTOS.avisosCortos`, recortado con puntos suspensivos si no cabe. Al tocarlo se despliega encima de la escena con el texto completo; se pliega con otro toque o tocando fuera. El texto completo queda siempre disponible para lectores de pantalla y como `title`.
- **Entradas plegables**: botón compacto "Entradas" abajo a la izquierda con un punto (verde si hay alguna entrada encendida, gris si no) y los íconos de anuncios y orgánico (resaltados si están encendidos); su `aria-label` dice el estado. Abre un panel lateral izquierdo con los interruptores y las intensidades; se cierra con el botón ×, con Esc o con un toque fuera. Ese toque de cierre no abre un área de la escena (`ui.tragarToque`).
- **Tarjeta**: panel lateral derecho (ancho `min(380 px, 46vw)`) entre la cabecera y el borde inferior, con el cuerpo desplazable. La cámara corre la vista a la izquierda para no tapar el área enfocada.
- **Cámara**: la vista general reserva la franja de la cabecera (`reservaV`) y centra el diorama en el resto de la pantalla.

### Otros ajustes de esta sesión
- En anchos de 761 a 1180 px (tableta vertical, laptops chicas) el aviso flotante tapaba parte de los botones "Vista general" y "Reiniciar": ahora va debajo de ellos (`top: 118px`) y la tarjeta empieza más abajo (`top: 176px`).
- Tocar o hacer clic en la escena durante un vuelo de cámara lo interrumpe y devuelve el control (antes, con mouse, el arrastre se ignoraba hasta terminar el vuelo).
- Antes de cada vuelo o giro por botón se anula la inercia pendiente del mouse (`frenarControles`), para que el giro termine exacto.
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
- Desde la sesión 3 se usa además un banco de pruebas con Chrome sin interfaz controlado por el protocolo de depuración (CDP): emula tamaños de pantalla y celular con toques reales (`Input.dispatchTouchEvent`), toma capturas y verifica por posición que ninguna etiqueta se monte, quede tapada o fuera de pantalla. Los scripts quedaron fuera del repositorio (carpeta temporal de la sesión).
- La calibración de la simulación se hizo ejecutando `sim.js` en Node sin pantalla (no se versionó el script).

## Publicación
- Repositorio público `actiogrowth/consultoria-3d`, rama `main`, GitHub Pages desde la raíz de `main`.
- URL: https://actiogrowth.github.io/consultoria-3d/
- GitHub Pages cachea los archivos ~10 min: tras publicar un cambio puede tardar en verse sin recarga forzada.
- `.claude/` (configuración local del servidor de pruebas) está excluido del repositorio.
