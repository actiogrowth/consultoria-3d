# PENDIENTES

Prioridad: **Alta** (bloquea o afecta la demo), **Media** (conviene antes de usarla con prospectos), **Baja** (ideas).

## Para decisión del PO / arquitecto
Puntos donde tuve que interpretar el diseño. Funcionan así hoy, pero conviene confirmarlos.

| # | Tema | Cómo quedó | Prioridad |
|---|---|---|---|
| D3 | Números en pantalla | Las únicas cifras visibles son "x/4 áreas optimizadas" y "Flujo liberado al 100%" (pedidos en el prompt). Nada más. | Media |
| D5 | Quien pasa de largo | No muestra cara de ánimo (no llegó a ser cliente). Solo quien se va de la fila / entrega (molesto) o con su compra (feliz). | Baja |
| D6 | Clientes molestos en la entrega | Ya pasaron por caja, pero si se van sin pedido no llega dinero al cofre (narrativa: venta perdida). | Baja |
| D9 | Paso de los botones de girar | 45° por toque (8 toques = vuelta completa). Ajustable en `escena.girar`. | Baja |
| D10 | Recalibración para el arranque vacío | Para que la fila crezca a la vista con **solo** anuncios en Medio (antes el mensaje clave se apoyaba en ambas entradas encendidas), cambié parámetros de las áreas rotas, no de las intensidades: con Marketing roto entra el 45 % (antes 30 %; sigue pasando de largo la mayoría), el único cajero tarda 7–8,6 s (antes 4,4–5,6 s) y la paciencia en fila es de 50–66 s (antes 32–44 s). Además, las llegadas son más parejas (Erlang-3, misma tasa media) y la decisión en la vitrina no hace rachas. | Media |
| D11 | Peatón ocasional siempre activo | Pasa uno cada ~10 s también con las entradas encendidas (es el tráfico natural de la calle). Su efecto con entradas encendidas es menor. | Baja |
| D12 | Tocar un nivel con la entrada apagada | El interruptor enciende en Medio; tocar directamente Bajo o Alto con la entrada apagada la enciende en ese nivel (elección explícita). | Baja |
| D13 | Etiquetas sin hueco | Si una etiqueta no encuentra lugar libre se oculta (salvo la del área enfocada), y la de un área cuya ancla queda bajo la tarjeta o el panel lateral no se muestra. Con una tarjeta abierta se ocultan las etiquetas de las entradas. Alternativa posible: agruparlas en un indicador. | Baja |
| D14 | Aviso en tableta y laptops chicas (761–1180 px) | Estaba tapando parte de los botones "Vista general" y "Reiniciar"; lo bajé un poco (y la tarjeta). Es un cambio fuera de pantallas bajas, pero corrige un choque. | Baja |
| D15 | Título en celular chico horizontal | Por debajo de 700 px de ancho, en pantallas bajas, se oculta el texto "Tienda en Marcha" de la cabecera (queda el logo) para que el aviso tenga espacio. | Baja |

## Aplazadas
| # | Tema | Estado |
|---|---|---|
| D8 | Botón de contacto / agendar reunión | **Aplazado** (2026-10-09) hasta que la demo pase al dominio propio de Actio. |

## Decisiones resueltas (2026-10-09)
| # | Tema | Decisión |
|---|---|---|
| D2 | Nivel del cofre | Aprobado como **ritmo reciente** de ganancias, no acumulado. |
| D4 | Ayuda inicial | Aprobada: se muestra la primera vez por navegador y se reabre con "?". |
| D7 | Botón "Ir al siguiente cuello de botella" | Aprobado, se queda. |

## Problemas conocidos
| # | Problema | Prioridad |
|---|---|---|
| P2 | No se probó en dispositivos reales (iPhone/Safari, Android/Chrome); solo en emulación de ancho de celular y tableta del navegador integrado. Rendimiento en celulares de gama baja sin medir. | Media |
| P3 | `prefers-reduced-motion` y la pausa con pestaña oculta se verificaron por código y forzando el modo reducido en tiempo de ejecución, no activando la preferencia del sistema operativo ni cambiando de pestaña en un navegador real. | Media |
| P4 | Las personitas no se esquivan entre sí: se pueden superponer (sobre todo frente a la vitrina cuando entra mucha gente). | Baja |
| P5 | **Riesgo conocido (se mantiene por ahora, decisión 2026-10-09)**: la demo depende de jsDelivr para cargar Three.js; sin internet o con el CDN caído no carga. En reuniones conviene abrir la demo antes de empezar para confirmar que carga. Alternativa futura: copiar `three.module.js` al repo. | Media |
| P6 | GitHub Pages cachea ~10 min: tras publicar un cambio puede verse la versión anterior sin recarga forzada. | Baja |
| P7 | El aviso dinámico tiene ~1–2 s de retardo intencional (para no parpadear); justo después de deshacer un área puede mostrar todavía el cuello anterior unos segundos. | Baja |
| P8 | El giro con el dedo, la inercia, los botones de girar y el diseño de pantallas bajas se probaron con emulación (toques reales de Chrome por CDP y tamaños 640×360, 844×390, 360×640, 390×844, 768×1024 y 1280×720), no en un celular real. Conviene confirmar en un teléfono la sensación del giro, el panel de entradas plegable y la rotación horizontal/vertical. | Media |
| P9 | En celulares pequeños con la tarjeta inferior abierta queda poca escena visible (la tarjeta ocupa hasta el 58 % del alto); los botones de girar quedan encima de la tarjeta. | Baja |
| P10 | La fila tiene 12 puestos: con Ventas rota se llena tanto con anuncios en Medio como en Alto (en Alto se llena antes y se va más gente molesta). El mensaje "más anuncios solo la alargan" se ve como fila llena más rápido y más clientes molestos. | Baja |
| P11 | En pantallas bajas muy chicas (640×360) el aviso corto puede recortarse con puntos suspensivos; el texto completo se ve al tocarlo. | Baja |
| P12 | Con la tarjeta abierta en pantallas chicas se ven pocas etiquetas: se ocultan las que no tienen lugar libre o cuya área queda tapada (ver D13). | Baja |

## Ideas futuras
| Idea | Prioridad |
|---|---|
| Modo "presentación" para reuniones: recorrido guiado paso a paso (área por área) con un botón Siguiente. | Media |
| Botón de contacto / agendar diagnóstico (requiere definir destino con el PO). | Media |
| Vista "antes / después" lado a lado o un interruptor global "Ver sin Actio / con Actio". | Baja |
| Versión en inglés (los textos ya están centralizados en `TEXTOS`). | Baja |
| Navegación por teclado entre áreas (Tab ya recorre etiquetas; faltaría foco visual en la escena). | Baja |
| Analítica básica de uso (qué áreas abren los visitantes). | Baja |
| Otros escenarios o industrias (servicios, e-commerce) reutilizando la misma simulación. | Baja |
