# Repetición de una corrida real de los agentes

> Diseño · 2026-11-15 · Estado: para aprobar

## Por qué

Quien evalúa el portafolio (reclutador o líder QA) a lo mucho abre el repo y el panel. Hoy ve lo
que entregó cada agente, pero no a los agentes trabajando. La corrida real de `/qa-flow REQ-004`
del 2026-11-15 quedó grabada en el historial local de Claude Code (sesión principal y un registro
por subagente), así que se puede mostrar el proceso con datos reales, sin grabar pantalla ni
inventar nada.

## Metas

- Que en menos de un minuto se vea a los cuatro agentes trabajando por turnos, con su modelo, y los
  momentos de control: puertas que el orquestador revisa, la revisión humana y los trabajos
  devueltos.
- Que todo lo mostrado salga de la grabación: horas, herramientas, archivos, cifras de pruebas.
- Que el README lo muestre sin abrir nada (un GIF) y enlace a la versión interactiva del panel.

## No metas

- No es un reproductor de la conversación: no se muestran prompts, razonamientos ni salidas de
  comandos.
- No se graban corridas nuevas en CI: los registros son locales y la repetición se regenera a mano
  cuando haya una corrida mejor.
- No cambia el flujo `/qa-flow` ni los agentes.

## Anti-metas (fallaría aunque funcione)

- Publicar algo privado: rutas del equipo, el correo, claves de los clientes desechables, texto de
  otras conversaciones.
- Que parezca montado: un evento sin respaldo en la grabación, o cifras redondeadas a favor.
- Que tape el resto del panel o lo haga más lento de leer para quien tiene dos minutos.

## Lo que hay en la grabación (REQ-004)

| Hora (UTC) | Qué pasó |
|---|---|
| 15:16 | Extractor (Haiku): 2 lecturas, 19 comandos (3 volcados de pantalla), escribe `01-extraccion.json` |
| 15:21 | Orquestador revisa la puerta: JSON válido, CA-1 a CA-6 uno a uno |
| 15:21 | Planner (Fable): escribe `02-plan.md`, 13 casos |
| 15:24 | Pausa: pregunta de aprobación a la persona; aprobado a las 15:28 |
| 15:28 | Automator (Opus): unos 70 comandos, 24 ediciones, 11 archivos escritos |
| 15:57 | La puerta no pasa: 4 pruebas fallan con la suite en paralelo; se le devuelve al automator |
| 16:08 | Puerta en verde: 56 de 56, versión con bugs 36 de 36, trazabilidad 27 de 27 |
| 16:12 | La persona pide un caso nuevo: se detiene el reporter, vuelve al planner (TC-014) y al automator |
| 16:27 | Reporter (Haiku): reporte y bugs; el orquestador comprueba las cifras |
| 16:45 | El CI sale verde pero con un reintento (TC-009 inestable): vuelve al automator y se corrige |

## Enfoques considerados

1. **Repetición en el panel a partir de la grabación** (elegido por la persona). Script que extrae
   y limpia, JSON versionado, sección animada en el panel y GIF para el README. Más trabajo, pero
   no hay que grabar nada y encaja con el panel.
2. Video o GIF de una corrida grabada en pantalla: lo más auténtico, pero exige otra corrida de
   ~100 minutos, edición, y un archivo pesado en el repo.
3. Línea de tiempo estática en Mermaid en el README: barata, pero no se ve a los agentes en acción.

## Diseño

### 1. Extracción: `scripts/repeticion.ts`

- `npm run repeticion -- <sesion.jsonl> REQ-004` lee la sesión principal y sus subagentes
  (`<sesion>/subagents/*.jsonl` + `.meta.json`) y escribe `site/repeticiones/REQ-004.json`.
- Ventana: desde la llamada a la skill `qa-flow` con ese requisito hasta el último regreso de un
  subagente lanzado en ella y la verificación que le sigue.
- **Lista blanca, nunca lista negra.** Solo salen campos derivados: hora, actor (orquestador,
  persona, extractor, planner, automator, reporter), modelo, tipo de evento, ruta relativa al repo
  (si la ruta no está dentro del repo, no sale) y cifras. Nunca sale el texto de un comando, de una
  salida, de un prompt ni de un mensaje.
- Tipos de evento: `inicio`/`fin` de agente; `lee`, `busca`, `escribe`, `edita` (con ruta);
  `snapshot` (pantalla de Toolshop); `pruebas` (con pasan/fallan/inestables leídos de la salida de
  Playwright); `calidad` (lint, typecheck); `trazabilidad` (criterios cubiertos); `puerta`
  (pasa/no pasa); `pausa` y `decision` de la persona; `devuelve` (orquestador a un agente);
  `detiene`; `ci`.
- Los motivos de `devuelve` y `decision` se toman de un archivo curado a mano,
  `site/repeticiones/REQ-004.notas.json`, con texto en español e inglés y la hora del evento al que
  se pegan. El script falla si una nota no cae sobre un evento real.
- Se descarta lo que no es del requisito, por ejemplo la revisión del CI de otro push a las 15:20.
- Control final: el script busca en su salida el usuario de Windows, `C:\`, `/c/Users`, `@` con
  dominio y patrones de clave; si encuentra algo, falla sin escribir.
- Pruebas unitarias con un registro de ejemplo pequeño, en `scripts/repeticion.test.ts`.

### 2. Sección en el panel: «En acción»

- Va justo después del mapa y entra al riel y a la barra como una sección más.
- Se ve como una línea de metro de cinco estaciones con el color de la línea de REQ-004; un tren
  avanza de estación en estación según la hora real. Al lado, un reloj con la hora de la grabación
  y un marcador de duración real («102 min reales en 60 s»).
- Debajo, un tablero con la actividad del agente en curso: modelo, contadores que suben (lecturas,
  comandos, archivos escritos, pruebas corridas) y las últimas 5 o 6 acciones con su ruta.
- Los momentos de control frenan el tren con un letrero: puerta, pausa humana, devolución. Son el
  centro de la historia: muestran que la IA no avanza sola.
- Controles: reproducir/pausar, reiniciar y una barra para saltar a cualquier punto. Arranca sola
  cuando la sección entra en pantalla.
- Tiempo proporcional a la hora real, con los tramos muertos de más de 3 minutos comprimidos (la
  espera de la aprobación se marca como «esperando a la persona, 4 min»).
- Sin JavaScript o con `prefers-reduced-motion`: se ve una versión estática ya escrita en el HTML,
  con los totales de cada agente y la lista completa de momentos de control.
- Sigue `DESIGN.md`: sin sombras ni degradados, Overpass y Overpass Mono, color solo para la línea;
  textos en `textos.json` en los dos idiomas.
- Bajo la sección: «Datos de la corrida real del 2026-11-15, extraídos del registro de Claude Code
  con `scripts/repeticion.ts`» y enlace al JSON.

### 3. GIF para el README: `scripts/gif.ts`

- `npm run gif` abre el panel generado con Playwright, mueve la repetición paso a paso con un
  control interno (no a tiempo real, para que salga igual siempre), toma capturas PNG y arma
  `docs/repeticion.gif` con ffmpeg (paleta en dos pasadas: `palettegen` y `paletteuse`). Meta:
  menos de 2 MB y unos 15 s.
- ffmpeg es una herramienta del equipo, no del repo (en Windows, `winget install Gyan.FFmpeg`). Si
  no está en el PATH, el script lo dice y sale; el CI no genera el GIF.
- El README lo pone arriba, junto a la captura actual del panel, con enlace a la sección.

### 4. Pruebas

- `tests/panel/panel.spec.ts` suma: la sección existe y tiene los mismos eventos que el JSON; los
  controles funcionan con teclado; con movimiento reducido no hay animación y todo está visible;
  sin desborde horizontal a 360 px.
- `npm run lint`, `typecheck`, `test:unit` y `test:panel` en verde.

## Decisiones que tomé yo (para revisar)

- El JSON va en `site/repeticiones/` y no en `artifacts/`: no lo genera un agente.
- Duración de 60 s y compresión de tramos muertos de más de 3 min.
- Los motivos en inglés y español vienen de un archivo de notas curado a mano; el resto se genera.
- Solo se muestra REQ-004; el formato admite más requisitos si después se graba otra corrida.

## Lo que queda al constructor

Los nombres exactos de clases y claves de textos, la geometría de la línea, cómo se pinta el
contador y el número exacto de cuadros del GIF.
