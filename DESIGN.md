# Diseño del panel

El panel (`site/`, generado por `scripts/panel.ts`) es un mapa esquemático de transporte: cada
requisito es una línea, cada agente una estación y la revisión humana el transbordo donde las
líneas se juntan.

## Reglas

- **El mapa es la interfaz, no una ilustración.** Cada estación es un control: al elegirla, el
  letrero de abajo muestra el artefacto real de esa etapa para ese requisito.
- **El estado es una marca, no solo un color.** Completada lleva un visto dentro del aro, con
  fallos una equis, pendiente un aro punteado. Lo mismo en las etiquetas de los casos: icono y texto.
- **El color pertenece a las líneas.** Rojo, azul, verde, morado y naranja identifican requisitos;
  el resto de la página es tinta sobre papel. Ningún color de línea se usa como adorno.
- **Sin sombras ni degradados.** Bordes de 2 px en tinta y radios de 14 px; la profundidad no existe.
- **Una sola familia.** Overpass, tipografía de señalética, en 400, 600, 800 y 900. Overpass Mono
  solo para identificadores (`REQ-001`, `TC-004`, nombres de proyecto).
- **No se usa el punto medio como separador**: en Overpass queda pegado a la palabra siguiente.

## Tokens

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--papel` | `#f5f4ee` | `#0f1418` | Fondo de la página |
| `--superficie` | `#ffffff` | `#182026` | Mapa, tablas y bloques |
| `--tinta` | `#14171a` | `#eff2ee` | Texto, bordes, botones |
| `--tinta-2` | `#4b5259` | `#aab3b8` | Texto secundario |
| `--raya` | `#d8d6cb` | `#2b353c` | Divisores internos |
| `--l1` … `--l5` | `#d1002b` `#0054b4` `#007a3d` `#6a1fa8` `#a84300` | `#ff5a75` `#5aa5ff` `#3fd184` `#c29bff` `#ff9d57` | Líneas (requisitos) |
| `--sobre-linea` | `#ffffff` | `#0f1418` | Texto sobre un color de línea |
| `--aviso` | `#9a4a00` | `#ffb454` | Bug reportado, inestable |

El tema sigue al sistema y se puede forzar con el botón; la elección se guarda en el navegador.

## Tipografía

- Titular: 900, `clamp(2.5rem, 5vw, 4.25rem)`, interlineado 1, tracking -0.035em.
- Títulos de sección: 800, `clamp(1.75rem, 3.2vw, 2.5rem)`.
- Texto: 400, 1.0625rem / 1.55, medida máxima de 68 caracteres.
- Cifras en tablas y letrero: `tabular-nums`.

## Movimiento

Un solo momento: las líneas se trazan de izquierda a derecha al cargar (1,3 s, salida exponencial).
Con `prefers-reduced-motion` no hay animación y todo está visible desde el inicio.

## Adaptación

- Hasta 640 px el mapa pasa a vertical (las líneas bajan y los rótulos quedan a la derecha) y la
  tabla de estaciones se apila.
- Hasta 900 px la navegación de secciones se oculta; quedan idioma, tema y contacto.
- El mapa dibuja hasta cinco líneas; los requisitos siguientes aparecen solo en la lista.

## Idiomas

Los textos fijos están en español e inglés (`site/panel.js`). El contenido que generan los agentes
(criterios, casos, bugs) se muestra en español en ambos casos.
