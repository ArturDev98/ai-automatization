# Repetición de los agentes: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar en el panel y en el README una repetición animada de la corrida real de `/qa-flow REQ-004`, armada desde el registro local de Claude Code.

**Architecture:** `scripts/repeticion.ts` lee la sesión principal y sus subagentes, clasifica cada acción en un evento de lista blanca y escribe `site/repeticiones/REQ-004.json` (versionado). `scripts/panel.ts` lo comprime a 60 s, escribe una versión estática en el HTML y lo pasa a `site/panel.js`, que lo reproduce. `scripts/gif.ts` mueve la barra de la repetición con Playwright, toma capturas y arma el GIF con ffmpeg.

**Tech Stack:** TypeScript con `tsx`, `node:test`, Playwright 1.65, HTML/CSS/JS sin dependencias, ffmpeg 9 (herramienta del equipo).

**Spec:** `docs/superpowers/specs/2026-11-15-repeticion-agentes-design.md`

## Global Constraints

- Comentarios de máximo 2 líneas. Nada de `waitForTimeout`. Selectores por rol o atributo estable.
- Lista blanca: del registro solo salen hora, actor, modelo, tipo, ruta relativa al repo y cifras. Nunca texto de comandos, salidas, prompts ni mensajes.
- Los textos visibles van en `site/textos.json`, en `es` y `en`; el español queda escrito en el HTML.
- Panel según `DESIGN.md`: sin sombras ni degradados, Overpass 400/600/800/900 y Overpass Mono para ids, color solo de línea (REQ-004 es `l4`), bordes de 2 px y radios de 14 px; no usar el punto medio como separador.
- Duración de la repetición: 60 s; los tramos sin eventos de más de 180 s reales cuentan como 180 s.
- La CSP del panel no cambia: todo en línea y con hash, sin recursos nuevos.
- GIF: `docs/repeticion.gif`, menos de 2 MB, entre 12 y 25 s.
- No se tocan `artifacts/`, los agentes ni la skill `qa-flow`.
- Trabajo en la rama `feat/repeticion-agentes`, un commit por tarea, sin push. Mensajes en español; el último commit lleva `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Una ruta absoluta fuera del repo en una herramienta** (por ejemplo, un `Read` del scratchpad en `AppData`): el evento se cuenta, pero sin `ruta`. Prueba en la tarea 1.
- **Un mensaje de la persona que no tiene que ver con el flujo** (15:20, «¿esperamos el nuevo req?»): no genera evento `pide`. Prueba en la tarea 1.
- **Un subagente detenido sin regreso** (el primer reporter, 16:13): sus eventos aparecen, cierra con `detiene` y no con `fin`. Prueba en la tarea 1.
- **Saltar con la barra hacia atrás:** contadores, bitácora y reloj se recalculan desde cero y no acumulan. Prueba en la tarea 4.
- **Cambiar de idioma con la repetición en curso:** el letrero y la bitácora se repintan en el idioma nuevo sin reiniciar. Prueba en la tarea 4.

---

### Task 1: Eventos desde el registro

**Files:**
- Create: `scripts/repeticion.ts`
- Test: `scripts/repeticion.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Actor = 'orquestador' | 'persona' | 'extractor' | 'planner' | 'automator' | 'reporter';
  export type Tipo = 'inicio' | 'fin' | 'lee' | 'busca' | 'escribe' | 'edita' | 'snapshot' | 'api' | 'comando'
    | 'pruebas' | 'calidad' | 'trazabilidad' | 'puerta' | 'pausa' | 'decision' | 'pide' | 'devuelve'
    | 'detiene' | 'ci' | 'commit';
  export const CONTROL: Tipo[] = ['puerta', 'pausa', 'decision', 'pide', 'devuelve', 'detiene'];
  export interface Evento {
    t: number;            // segundos reales desde el inicio
    actor: Actor; tipo: Tipo;
    ruta?: string;        // relativa al repo, con /
    pasan?: number; fallan?: number; inestables?: number; cubiertos?: string; // "27/27"
    a?: Actor;            // destinatario de devuelve y detiene
    resultado?: 'pasa' | 'no-pasa';
    nota?: { es: string; en: string };
  }
  export interface Repeticion {
    req: string; fecha: string; inicio: string; fin: string; // ISO UTC
    actores: { clave: Actor; modelo: string | null }[];
    eventos: Evento[];
  }
  export interface Registro { principal: object[]; subagentes: { meta: { agentType: string; toolUseId: string }; lineas: object[] }[] }
  export function extraer(reg: Registro, req: string): Repeticion;
  export function nombreModelo(id: string): string; // 'claude-haiku-5-5' -> 'Claude Haiku 5.5'
  ```

Reglas que la implementación tiene que cumplir (vienen de la grabación real):

- **Ventana.** Empieza en el `tool_use` `Skill` con `skill === 'qa-flow'` y `args` igual a `req`. Los agentes de la corrida son los `tool_use` `Agent` posteriores cuyo `description` contiene `req`; cada subagente se une por `meta.toolUseId`, y su `agentId` sale del `tool_result` («agentId: …»). Termina en el primer `git commit` del orquestador después del último `fin` de un agente; si no hay commit, en el último evento del orquestador antes del siguiente mensaje de la persona.
- **Subagentes.** `Read`→`lee`; `Glob`/`Grep`→`busca`; `Write`→`escribe`; `Edit`→`edita`; `SubagentHandback`→`fin`. `Bash`, con esta prioridad: `playwright test`→`pruebas`; `trazabilidad`→`trazabilidad`; `eslint|npm run lint|tsc|typecheck`→`calidad`; `snapshot`→`snapshot` (con `ruta` = path de la URL si el host es `*.practicesoftwaretesting.com`); `curl` a ese mismo host→`api` (con el path); lo demás→`comando`. El modelo del actor es el `message.model` de su primera respuesta. El primer evento de cada subagente es `inicio`.
- **Cifras.** En `pruebas`, se suman todos los `(\d+) passed|failed|flaky` del `tool_result`. En `trazabilidad`, `cubiertos` sale de `Criterios cubiertos: (\d+\/\d+)`.
- **Orquestador.** Solo emite `pruebas`, `calidad`, `trazabilidad`, `escribe`/`edita` bajo `artifacts/<req>/` o `tests/`, `commit` (`git commit`) y `ci` (`gh run`, solo después del primer `commit` de la ventana). `AskUserQuestion`→`pausa` (actor `persona`) y su resultado→`decision` (actor `persona`). `SendMessage`→`devuelve` con `a` = actor del `agentId` del campo `to`. `TaskStop`→`detiene` con `a` = actor de su `task_id`.
- **Puerta.** Tras cada `fin`, se emite una `puerta` del orquestador con la hora de su primer `pruebas`/`calidad`/`trazabilidad` posterior (o del primer `Agent`/`AskUserQuestion`, si no corrió nada). `resultado` es `no-pasa` si la siguiente acción dirigida a un agente es un `devuelve` al mismo agente sin un mensaje de texto de la persona en medio; si no, `pasa`.
- **Persona.** Un mensaje de texto propio (no una notificación ni un hand-back) se emite como `pide` solo si es el último mensaje de la persona antes de un `devuelve` o un `detiene`, y ese `devuelve` o `detiene` llega antes del siguiente `fin`.
- **Rutas.** Se pasa a relativa la que empieza por la raíz del repo (el `cwd` de la sesión, con `\` o `/`, y también la forma `/c/Users/...`). Cualquier otra ruta absoluta se descarta.

- [ ] **Step 1: Write the failing tests**

En `scripts/repeticion.test.ts`, con un registro armado en memoria por un helper `registro()` (líneas con `timestamp`, `cwd`, `message.content` de tipo `tool_use`/`tool_result`/`text`), con estos tests:

```ts
test('una corrida con extractor da inicio, acciones y fin con su modelo', () => {
  const r = extraer(registro(), 'REQ-009');
  assert.deepEqual(r.eventos.filter((e) => e.actor === 'extractor').map((e) => e.tipo), ['inicio', 'lee', 'snapshot', 'escribe', 'fin']);
  assert.deepEqual(r.actores.find((a) => a.clave === 'extractor'), { clave: 'extractor', modelo: 'Claude Haiku 5.5' });
  assert.equal(r.eventos[0].t, 0);
});
test('pruebas suma las cifras de Playwright', () => { /* salida "  2 failed\n  11 passed (17.7s)" -> pasan 11, fallan 2 */ });
test('una ruta fuera del repo no sale', () => { /* Read de C:\\Users\\x\\AppData\\... -> evento lee sin ruta; Write en <cwd>\\artifacts\\REQ-009\\01.json -> ruta 'artifacts/REQ-009/01.json' */ });
test('la puerta no pasa si el orquestador devuelve el trabajo al mismo agente', () => { /* fin automator, pruebas con fallos, SendMessage al automator -> puerta resultado 'no-pasa' y devuelve a='automator' */ });
test('un pedido de la persona antes de devolver es pide, y la puerta pasa', () => {});
test('un mensaje de la persona sin devolución después no genera pide', () => {});
test('un subagente detenido cierra con detiene y sin fin', () => {});
test('gh run antes del primer commit no cuenta como ci', () => {});
test('nombreModelo', () => assert.equal(nombreModelo('claude-fable-5-2'), 'Claude Fable 5.2'));
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:unit`
Expected: FAIL, `Cannot find module './repeticion'`

- [ ] **Step 3: Implement `extraer` y `nombreModelo` in `scripts/repeticion.ts`**

Funciones puras sobre las líneas ya parseadas; nada de lectura de archivos en este paso. Eventos ordenados por `t` y, a igual `t`, por el orden del registro.

- [ ] **Step 4: Run to verify they pass**

Run: `npm run test:unit && npm run lint && npm run typecheck`
Expected: PASS, sin errores

- [ ] **Step 5: Commit**

```bash
git switch -c feat/repeticion-agentes
git add scripts/repeticion.ts scripts/repeticion.test.ts
git commit -m "Repetición: eventos de una corrida de /qa-flow desde el registro de Claude Code"
```

### Task 2: Notas, revisión de privacidad y datos reales de REQ-004

**Files:**
- Modify: `scripts/repeticion.ts`, `scripts/repeticion.test.ts`, `package.json` (script `"repeticion": "tsx scripts/repeticion.ts"`)
- Create: `site/repeticiones/REQ-004.notas.json`, `site/repeticiones/REQ-004.json` (generado)

**Interfaces:**
- Consumes: `extraer`, `Repeticion`, `Evento` (tarea 1)
- Produces:
  ```ts
  export interface Nota { hora: string; tipo: Tipo; es: string; en: string } // hora 'HH:MM:SS' UTC
  export function aplicarNotas(r: Repeticion, notas: Nota[]): Repeticion; // lanza Error si una nota no cae sobre un evento
  export function revisarPrivacidad(json: string): void; // lanza Error con el patrón encontrado
  export function leerRegistro(sesionJsonl: string): Registro; // lee <sesion>.jsonl y <sesion>/subagents/*.jsonl + .meta.json
  ```
  CLI: `npm run repeticion -- <ruta-sesion.jsonl> REQ-004` escribe `site/repeticiones/REQ-004.json` con 2 espacios de indentación y LF.

- [ ] **Step 1: Write the failing tests**

```ts
test('una nota se pega al evento de su tipo a 60 s o menos', () => { /* nota 15:59:30 devuelve -> evento devuelve de 15:59:49 lleva nota */ });
test('una nota sin evento cerca hace fallar', () => assert.throws(() => aplicarNotas(r, [{ hora: '10:00:00', tipo: 'devuelve', es: 'x', en: 'x' }]), /10:00:00/));
for (const malo of ['C:\\Users\\alguien', '/c/Users/alguien', 'AppData', 'a@b.co', 'toolu_01abc', 'agent-a2021cb566021842d'])
  test(`revisarPrivacidad rechaza ${malo}`, () => assert.throws(() => revisarPrivacidad(JSON.stringify({ x: malo }))));
test('revisarPrivacidad deja pasar rutas del repo y nombres de modelo', () => revisarPrivacidad(JSON.stringify({ ruta: 'artifacts/REQ-004/02-plan.md', modelo: 'Claude Opus 5.5' })));
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:unit`
Expected: FAIL, `aplicarNotas is not a function`

- [ ] **Step 3: Implement `aplicarNotas`, `revisarPrivacidad`, `leerRegistro` y el CLI**

El CLI hace extraer → aplicar notas (si existe `site/repeticiones/<req>.notas.json`) → revisar privacidad → escribir. Si la revisión falla, no escribe nada y sale con código 1.

- [ ] **Step 4: Write `site/repeticiones/REQ-004.notas.json`**

Una nota por momento de control de la grabación (horas UTC de la sesión `50d30342…`), texto corto y fiel a lo que pasó:

| hora | tipo | es |
|---|---|---|
| 15:21:37 | puerta | La extracción abre y trae CA-1 a CA-6 uno a uno |
| 15:24:51 | pausa | El plan espera la aprobación de la persona |
| 15:28:33 | decision | Plan aprobado: 13 casos, 12 automatizados |
| 15:59:49 | devuelve | Con la suite en paralelo fallan 4 pruebas: vuelve al automator |
| 16:12:53 | pide | La persona pide dejar el hallazgo como prueba en rojo |
| 16:13:05 | detiene | Se detiene el reporter: el plan cambia antes del reporte |
| 16:13:30 | devuelve | El planner agrega TC-014 |
| 16:40:27 | pide | La persona pide validar la corrida del CI |
| 16:46:00 | devuelve | El CI pasó con un reintento: TC-009 inestable vuelve al automator |

Con su traducción en `en`. Si al correr el CLI una hora no coincide, se corrige la hora con la grabación, no el texto.

- [ ] **Step 5: Generate and check the real data**

Run: `npm run repeticion -- "$HOME/.claude/projects/C--Users-artur-Documents-Proyectos-personales-ai-automatization/50d30342-44e8-4207-9185-a8b7a1169c66.jsonl" REQ-004`
Expected: escribe el JSON; `fin - inicio` entre 95 y 110 min; actores extractor/planner/automator/reporter con Haiku 5.5, Fable 5.2, Opus 5.5 y Haiku 5.5; una sola puerta `no-pasa` (la del automator, hacia las 15:54) y la del extractor `pasa`; dos `pide` (16:12 y 16:40) y ninguno a las 15:20; ningún `ci` del orquestador entre 15:20 y 15:24.

- [ ] **Step 6: Run checks**

Run: `npm run test:unit && npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add scripts/repeticion.ts scripts/repeticion.test.ts package.json site/repeticiones
git commit -m "Repetición: notas, revisión de privacidad y datos de la corrida real de REQ-004"
```

### Task 3: La sección en el HTML generado

**Files:**
- Create: `scripts/panel-repeticion.ts`, `scripts/panel-repeticion.test.ts`
- Modify: `scripts/panel.ts` (leer el JSON, `datos.repeticion`, reemplazo `<!--REPETICION-->`), `site/panel.html` (sección `#accion` entre `#mapa` y `#estaciones`, enlace en `.barra nav` y en el riel), `site/textos.json`

**Interfaces:**
- Consumes: `Repeticion`, `Evento`, `CONTROL` (tareas 1 y 2)
- Produces:
  ```ts
  export interface EventoPanel extends Evento { v: number } // 0..1 a lo largo de los 60 s
  export function comprimir(eventos: Evento[], tope = 180): EventoPanel[];
  export function repeticionHtml(r: Repeticion | null): string; // '' si no hay
  ```
  `datos.repeticion = { req, fecha, inicio, fin, minutos, actores, eventos: EventoPanel[] } | null` (en `panel.js`).
  Marcado estático que usa la tarea 4: `section#accion > .accion` con `.accion-via` (SVG de 5 estaciones `data-etapa="0..4"` y un `.tren`), `.accion-reloj time`, `.accion-tablero`, `ol.accion-bitacora`, `.accion-letrero`, controles `button#accion-play` (`aria-pressed`), `button#accion-reinicio`, `input#accion-barra` (`type=range`, 0 a 1000, con `aria-label`), y la versión estática `.accion-resumen` (totales por agente) + `ol.accion-control` (un `li` por evento de `CONTROL`, con hora `HH:MM` y su nota en español).

- [ ] **Step 1: Write the failing tests**

```ts
test('comprimir deja el primero en 0, el último en 1 y no retrocede', () => {});
test('un hueco de 10 min pesa como uno de 180 s', () => { /* eventos en 0, 60, 660 s -> v = [0, 60/240, 1] */ });
test('repeticionHtml pone un li por momento de control con su hora', () => {});
test('repeticionHtml devuelve vacío sin repetición', () => assert.equal(repeticionHtml(null), ''));
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:unit`
Expected: FAIL, `Cannot find module './panel-repeticion'`

- [ ] **Step 3: Implement `comprimir`, `repeticionHtml` y conectarlos en `panel.ts`**

`panel.ts` lee el primer `site/repeticiones/REQ-*.json` que no sea `.notas.json`. Textos nuevos (con `en`): `n.accion` («En acción»), `t.accion`, `t.accionBajada`, `a.reloj` («{min} min reales en 60 s»), `a.play`, `a.pausa`, `a.reinicio`, `a.barra`, `a.fuente` (la línea de procedencia con enlace al JSON), un `a.<tipo>` por tipo de evento (el verbo de la bitácora: «lee», «corre las pruebas», …) y `a.actor.<clave>`.

- [ ] **Step 4: Run to verify they pass and the panel builds**

Run: `npm run test:unit && npm run panel && npm run test:panel`
Expected: PASS; las 12 pruebas actuales del panel siguen verdes

- [ ] **Step 5: Commit**

```bash
git add scripts/panel-repeticion.ts scripts/panel-repeticion.test.ts scripts/panel.ts site/panel.html site/textos.json
git commit -m "Panel: sección En acción con la versión estática de la repetición"
```

### Task 4: La reproducción

**Files:**
- Modify: `site/panel.js`, `site/panel.css`, `tests/panel/panel.spec.ts`, `DESIGN.md` (una línea en Movimiento)

**Interfaces:**
- Consumes: `datos.repeticion` y el marcado de la tarea 3.
- Produces: `function irA(v)` interna en `panel.js` que pinta el estado en el punto `v` (0..1) desde cero: estación del tren (la del último agente con evento; `persona` va a la de revisión), contadores del actor en curso (lecturas = `lee`+`busca`; comandos = `snapshot`+`api`+`comando`+`pruebas`+`calidad`+`trazabilidad`; archivos = `escribe`+`edita`; últimas pruebas = `pasan`/`fallan`), las últimas 6 acciones en la bitácora, el reloj real (`HH:MM` UTC) y el letrero del último evento de control si quedó a menos de 0,04 de `v`. El `input` de la barra llama a `irA`; la reproducción avanza con `requestAnimationFrame` y se detiene 2,5 s en cada evento de control. Al terminar queda en pausa en `v = 1`.

Comportamiento:
- Arranca sola la primera vez que la sección entra en pantalla (IntersectionObserver), salvo con `prefers-reduced-motion`: ahí `section#accion` lleva la clase `quieta`, no hay animación, se ve la versión estática y los controles quedan ocultos.
- Con JavaScript y sin movimiento reducido, la versión estática queda en un `<details>` cerrado bajo la animación.
- Cambiar de idioma repinta el estado actual sin reiniciar.

- [ ] **Step 1: Write the failing tests in `tests/panel/panel.spec.ts`**

```ts
test.describe('En acción', () => {
  test('lista los mismos momentos de control que el JSON', async ({ page }) => { /* lee site/repeticiones/REQ-004.json con fs, cuenta CONTROL, compara con '#accion ol.accion-control li' */ });
  test('la barra al final muestra la hora del último evento y el botón queda en pausa', async ({ page }) => { /* fill('1000') en #accion-barra */ });
  test('volver atrás con la barra no acumula contadores', async ({ page }) => { /* fin, luego 0: lecturas = 0 y bitácora vacía o con el primer evento */ });
  test('el botón de reproducir funciona con teclado', async ({ page }) => { /* focus + Enter cambia aria-pressed */ });
  test('cambiar de idioma con la repetición en curso repinta sin reiniciar', async ({ page }) => { /* barra a 500, EN, el reloj sigue igual y el verbo de la bitácora está en inglés */ });
  test('con movimiento reducido se ve la versión estática y no hay controles', async ({ page }) => { /* emulateMedia({ reducedMotion: 'reduce' }) */ });
  test('a 360 px no hay desplazamiento horizontal', async ({ page }) => { /* scrollWidth <= clientWidth */ });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run panel && npm run test:panel`
Expected: FAIL en los tests nuevos (sin reproducción todavía)

- [ ] **Step 3: Implement la reproducción en `panel.js` y el estilo en `panel.css`**

En `DESIGN.md`, bajo Movimiento: «La repetición de En acción avanza a la hora real comprimida a 60 s y se detiene en cada momento de control; con movimiento reducido se ve estática».

- [ ] **Step 4: Run to verify they pass**

Run: `npm run panel && npm run test:panel && npm run lint`
Expected: PASS. Revisión visual con capturas a 1280 px y 360 px, en tema claro y oscuro.

- [ ] **Step 5: Commit**

```bash
git add site/panel.js site/panel.css tests/panel/panel.spec.ts DESIGN.md
git commit -m "Panel: reproducción de la corrida real con barra, pausa y letreros de control"
```

### Task 5: GIF para el README

**Files:**
- Create: `scripts/gif.ts`, `docs/repeticion.gif` (generado)
- Modify: `package.json` (script `"gif": "tsx scripts/gif.ts"`), `README.md`

**Interfaces:**
- Consumes: `site/dist/index.html` y `input#accion-barra` (tareas 3 y 4).
- Produces: `npm run gif` → `docs/repeticion.gif`.

- [ ] **Step 1: Implement `scripts/gif.ts`**

Si `spawnSync('ffmpeg', ['-version'])` falla, imprime «Falta ffmpeg en el PATH (en Windows: winget install Gyan.FFmpeg)» y sale con 1. Abre el panel con `chromium` de `@playwright/test` (viewport 1200×800, `locale: 'es-CO'`, tema claro), pausa la reproducción y captura `#accion .accion` en 12 cuadros por segundo moviendo la barra de 0 a 1000. Repite cuadros para quedarse 1,5 s en cada momento de control. Las capturas van a una carpeta de `os.tmpdir()` que se borra al final. Luego dos pasadas de ffmpeg: `palettegen=stats_mode=diff` y `paletteuse=dither=bayer:bayer_scale=5`, escalado a 900 px de ancho. Falla si el GIF pesa 2 MB o más.

- [ ] **Step 2: Generate and check**

Run: `npm run panel && npm run gif`
Expected: `docs/repeticion.gif` de menos de 2 MB y entre 12 y 25 s. Se mira el GIF: se lee el reloj, cambia el agente y aparecen los letreros.

- [ ] **Step 3: Update `README.md`**

Debajo de la captura del panel, con el título «Los agentes en acción», van el GIF (`docs/repeticion.gif`), una línea que diga que es la corrida real de REQ-004 del 2026-11-15, extraída del registro de Claude Code con `scripts/repeticion.ts`, y un enlace a `https://arturdev98.github.io/ai-automatization/#accion`. En «Correrlo» se agregan `npm run repeticion` y `npm run gif`, aclarando que este último necesita ffmpeg.

- [ ] **Step 4: Full check**

Run: `npm run lint && npm run typecheck && npm run test:unit && npm run panel && npm run test:panel`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/gif.ts package.json README.md docs/repeticion.gif docs/superpowers
git commit -m "README: GIF de los agentes en acción, generado desde el panel con ffmpeg

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
