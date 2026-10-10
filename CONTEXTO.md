# CONTEXTO · Tienda en Marcha

## Qué es
**Tienda en Marcha** es una demo 3D interactiva de Actio Growth. Muestra, en una sola pantalla y con una tienda de barrio en estilo diorama low-poly, cómo funciona la consultoría estratégica de Actio:

1. Llegan personas al negocio por **anuncios pagos** o de forma **orgánica** (recomendación).
2. En el camino se topan con **cuellos de botella** en cuatro áreas: **Marketing**, **Ventas**, **Operaciones / Servicios** y **Finanzas**.
3. Al **aplicar la consultoría** en un área, su tramo se libera de forma visible.
4. Cuando el flujo queda libre de punta a punta, lo que entra se convierte en **ganancias** (el cofre se llena).

Es **genérica**: no representa a ningún cliente real. No usa nombres, entregables ni porcentajes de ningún proyecto previo.

## Para quién
- **Prospectos en reuniones guiadas por Daniel**: él controla la demo, abre cada área, explica el problema y aplica la consultoría frente al prospecto. Necesita poder volver al estado inicial (Reiniciar) y comparar antes / después (Deshacer).
- **Visitantes de la web que la exploran solos**: llegan sin guía. Necesitan una ayuda breve al inicio, etiquetas claras y un aviso que les diga en una frase qué está frenando el flujo.

## Mensaje que debe transmitir
- Un negocio es **un solo flujo**: lo que pasa en un área afecta a todas las que vienen después.
- **Más anuncios no arreglan un negocio trabado**: si Ventas sigue rota, subir la intensidad de los anuncios solo alarga la fila y aumenta los clientes molestos. (Mensaje clave.)
- Arreglar un área mejora su tramo, pero el cofre **solo se llena de verdad cuando todo el flujo está liberado**.
- Actio interviene área por área con un diagnóstico claro y una solución concreta.
- Tono: profesional y cálido. La demo vende consultoría, no es un juego infantil.

## Escenario
Una tienda de barrio vista como maqueta. Recorrido de izquierda a derecha:

| Tramo | Elemento en escena | Área |
|---|---|---|
| Entradas | Calle con valla publicitaria (Anuncios pagos) y sendero con faroles (Orgánico) | — |
| Vitrina | Escaparate y letrero de la tienda | Marketing |
| Fila, mostrador y caja | Fila en zigzag, mostrador con cajero(s) | Ventas |
| Zona de entrega / bodega | Mostrador de entrega, bodega con estantes y cajas | Operaciones / Servicios |
| Caja fuerte | Caja fuerte por la que pasan las monedas | Finanzas |
| Cofre | Cofre de Ganancias que se llena con monedas | Resultado |

### Estado inicial (los 4 cuellos de botella visibles)
1. **Marketing**: vitrina apagada y letrero fundido (parpadea). La mayoría mira y pasa de largo, sale de la escena.
2. **Ventas**: un solo cajero lento y una fila larga. Quien espera demasiado se va molesto. Si la fila está llena, quien llega se va molesto de inmediato.
3. **Operaciones / Servicios**: bodega desordenada (cajas tiradas por el piso), un solo encargado busca cada pedido. Los clientes esperan su pedido y algunos se van insatisfechos.
4. **Finanzas**: la caja fuerte tiene una grieta; parte de las monedas se cae en el camino al cofre y se pierde.

### Al aplicar la consultoría
1. **Marketing**: la vitrina y el letrero se iluminan; entra mucha más gente.
2. **Ventas**: llega un segundo cajero y la atención es más ágil; la fila se disuelve.
3. **Operaciones / Servicios**: las cajas se ordenan en los estantes, se suma un segundo encargado y la entrega es rápida.
4. **Finanzas**: la grieta se sella; todas las monedas llegan al cofre.

Cada arreglo se puede **deshacer** para comparar el antes y el después.

## Reglas de negocio de la simulación
- **Entradas**: cada una (Anuncios pagos, Orgánico) tiene interruptor de encendido/apagado y tres intensidades: bajo, medio, alto (sin números). La intensidad solo cambia cuánta gente llega. Si ambas están apagadas no llega nadie y se muestra un aviso.
- **Valla publicitaria**: brilla más cuanto mayor es la intensidad de anuncios; apagada si los anuncios están apagados. Los faroles del sendero hacen lo mismo con la intensidad orgánica.
- **Causa → efecto en orden**: una persona solo puede llegar a un tramo si pasó el anterior. Cada área limita lo que deja pasar:
  - Marketing decide cuántos de los que pasan frente a la vitrina entran.
  - Ventas tiene una capacidad de atención (cajeros × rapidez) y una fila con paciencia limitada.
  - Operaciones tiene una capacidad de preparación de pedidos y clientes con paciencia limitada.
  - Finanzas decide cuánto del dinero vendido llega al cofre.
- **Mensaje clave garantizado por diseño**: con Ventas rota, la capacidad de caja es menor que lo que llega con Marketing arreglado o con intensidad alta. Más anuncios → fila más larga → más clientes molestos, no más ganancias.
- **Ganancias**: cada entrega completada genera monedas que viajan a la caja fuerte y luego al cofre. El nivel del cofre refleja el **ritmo reciente** de monedas que llegan (no un acumulado), por eso solo se ve lleno cuando el flujo completo está liberado, y baja si se vuelve a romper un área o se apagan las entradas.
- **Con las 4 áreas optimizadas**: mensaje "Flujo liberado al 100%" y, si está entrando gente, efecto de cofre rebosando.
- **Ánimo**: quien se va molesto (fila o espera de pedido) muestra una cara molesta; quien se va con su compra muestra una cara feliz. Quien pasa de largo no muestra ánimo (no llegó a ser cliente).
- **Sin cifras**: no hay números, montos ni porcentajes en pantalla (la única excepción es el contador "x/4 áreas optimizadas" y el mensaje "Flujo liberado al 100%", pedidos explícitamente). Solo tendencias visuales.
- **Reiniciar**: todo vuelve a estar roto y ambas entradas encendidas en intensidad media.

## Interacción esperada
- Etiquetas flotantes sobre cada área y sobre el cofre, con un punto de estado (problema / optimizada).
- Clic o toque en un área → la cámara se acerca y aparece una tarjeta con "Problema detectado", "Lo que hace Actio" y el botón "Aplicar consultoría" / "Deshacer".
- El cofre muestra cómo funciona y cuántas áreas faltan, sin cifras de dinero.
- Contador "x/4 áreas optimizadas", aviso dinámico de una frase, botones Reiniciar y Vista general.
- Cámara orbitable con límites. Ayuda breve al inicio que se puede cerrar.
- Funciona en celular (táctil, tarjeta como panel inferior).

## Fuera de alcance
- Datos reales de clientes, cifras, montos, porcentajes o promesas de resultados numéricos.
- Cualquier contenido del proyecto de referencia que no sea la idea de interacción, el logo y la paleta.
- Formularios, captura de datos, analítica o integración con CRM.
- Sonido, varios idiomas, guardado de partidas, varios escenarios o industrias.
- Modelos 3D o texturas de terceros.
- Modificar el repositorio de referencia `actiogrowth/sistemaoperativovea`.
