# PENDIENTES

Prioridad: **Alta** (bloquea o afecta la demo), **Media** (conviene antes de usarla con prospectos), **Baja** (ideas).

## Para decisión del PO / arquitecto
Puntos donde tuve que interpretar el diseño. Funcionan así hoy, pero conviene confirmarlos.

| # | Tema | Cómo quedó | Prioridad |
|---|---|---|---|
| D1 | **Publicación en GitHub** | Ver "Problemas conocidos" P1: en este equipo no hay sesión de GitHub de la cuenta `actiogrowth`. | Alta |
| D2 | Nivel del cofre | Representa el **ritmo reciente** de ganancias, no un acumulado. Así "solo se llena de verdad con el flujo liberado" y baja si algo se rompe. Si se prefiere un acumulado que nunca baja, el mensaje "más anuncios no sirven si Ventas está rota" se debilita. | Media |
| D3 | Números en pantalla | Las únicas cifras visibles son "x/4 áreas optimizadas" y "Flujo liberado al 100%" (pedidos en el prompt). Nada más. | Media |
| D4 | Ayuda inicial | Aparece la primera vez en cada navegador y luego se recuerda. En reuniones guiadas no molesta después de la primera vez; se reabre con "?". | Media |
| D5 | Quien pasa de largo | No muestra cara de ánimo (no llegó a ser cliente). Solo quien se va de la fila / entrega (molesto) o con su compra (feliz). | Baja |
| D6 | Clientes molestos en la entrega | Ya pasaron por caja, pero si se van sin pedido no llega dinero al cofre (narrativa: venta perdida). | Baja |
| D7 | Botón "Ir al siguiente cuello de botella" en la tarjeta del cofre | Agregado para el visitante que explora solo (no estaba en el prompt). Fácil de quitar. | Baja |
| D8 | Llamado a la acción | No hay botón de contacto / agendar reunión (no estaba en el alcance). Sería el siguiente paso natural para la versión web. | Baja |

## Problemas conocidos
| # | Problema | Prioridad |
|---|---|---|
| P1 | **No se pudo publicar desde este equipo**: no está instalada la CLI de GitHub (`gh`) y el administrador de credenciales de Git solo tiene guardadas otras cuentas (no `actiogrowth`). Falta: autenticarse como `actiogrowth`, crear `actiogrowth/consultoria-3d`, subir `main`, activar Pages y verificar la URL. El código ya está en un repositorio git local listo para subir. | Alta |
| P2 | No se probó en dispositivos reales (iPhone/Safari, Android/Chrome); solo en emulación de ancho de celular y tableta del navegador integrado. Rendimiento en celulares de gama baja sin medir. | Media |
| P3 | `prefers-reduced-motion` y la pausa con pestaña oculta se verificaron por código y forzando el modo reducido en tiempo de ejecución, no activando la preferencia del sistema operativo ni cambiando de pestaña en un navegador real. | Media |
| P4 | Las personitas no se esquivan entre sí: se pueden superponer (sobre todo frente a la vitrina cuando entra mucha gente). | Baja |
| P5 | La demo depende de jsDelivr para cargar Three.js: sin internet o con el CDN caído no carga (se podría copiar `three.module.js` al repo). | Baja |
| P6 | GitHub Pages cachea ~10 min: tras publicar un cambio puede verse la versión anterior sin recarga forzada. | Baja |
| P7 | El aviso dinámico tiene ~1–2 s de retardo intencional (para no parpadear); justo después de deshacer un área puede mostrar todavía el cuello anterior unos segundos. | Baja |

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
