---
version: 1
slug: "site-dist-index-html"
primary_target: "site/dist/index.html"
related_targets: ["scripts/panel.ts"]
---

# Panel del portafolio (site/dist/index.html)

Modo: Persuade. Lectores: reclutador con dos minutos, luego líder de QA que baja al detalle.
Acción: recorrer el mapa y contactar por LinkedIn. Prueba: artefactos y resultados reales de la última corrida.
Restricciones: HTML y CSS planos generados por `scripts/panel.ts`; español e inglés con selector; claro y oscuro; móvil.

## Direction contract

THESIS: El flujo es un mapa de transporte: cada requisito es una línea y cada agente una estación. Rechaza el panel oscuro de tarjetas iguales con distintivos verdes.

OWN-WORLD: Papel de mapa claro (noche en tema oscuro), tres líneas gruesas rojo, azul y verde con quiebres a 45°, estaciones como aros blancos de borde negro, un transbordo en cápsula para la revisión humana, rotulación Overpass en negrita y códigos en Overpass Mono. El estado es una marca dentro del aro, no solo un color.

STORY: Entiende en segundos que un requisito pasa por cuatro agentes y una revisión humana; cree que hay control porque cada estación abre su artefacto real; contacta o abre el repositorio.

FIRST VIEWPORT: Titular a la izquierda en Overpass 800, dos acciones debajo, y el mapa de tres líneas ocupando todo el ancho en la mitad inferior, con las cinco paradas rotuladas. Contacto en la barra superior.

FORM: Mapa esquemático de transporte, primero de mi lista; elegido por el usuario como alternativa a la tirada. seed:9374fd7029a44826. Interacción insignia: elegir una estación abre su parada con los datos reales; movimiento: las líneas se trazan una vez al cargar.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
