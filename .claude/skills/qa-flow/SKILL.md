---
name: qa-flow
description: Lleva un requisito (REQ-00X) de punta a punta por el flujo de QA con agentes - extracción, plan de pruebas, automatización en Playwright y reporte con trazabilidad. Úsala cuando el usuario escriba /qa-flow REQ-00X, pida "correr el flujo" de un requisito o quiera generar pruebas a partir de un archivo de requirements/.
---

# Flujo de QA: de un requisito a pruebas con trazabilidad

Argumento: el id del requisito (`REQ-00X`). Si no existe `requirements/REQ-00X-*.md`, detente y dilo.

Cada etapa la hace un subagente distinto, con su modelo fijado en `.claude/agents/`. Tú orquestas:
lanzas la etapa, revisas su salida contra la puerta y solo entonces sigues. No hagas tú el trabajo
de una etapa.

| # | Agente | Modelo | Produce | Puerta para seguir |
|---|---|---|---|---|
| 1 | `extractor` | Haiku | `artifacts/REQ-00X/01-extraccion.json` | JSON válido; mismos criterios que el requisito |
| 2 | `planner` | Fable | `artifacts/REQ-00X/02-plan.md` | Todo criterio tiene caso; tabla con las 6 columnas |
| — | Persona | — | Aprobación del plan | Ver abajo |
| 3 | `automator` | Opus | `tests/`, `src/`, `03-ejecucion.md` | Suite del requisito en verde, lint y typecheck limpios |
| 4 | `reporter` | Haiku | `04-reporte.md`, `bugs/` | Cifras iguales a las de `results/` |

## Pasos

1. **Extracción.** Lanza `extractor` con el id. Comprueba que el JSON abre y que los criterios
   coinciden uno a uno con el requisito.
2. **Plan.** Lanza `planner`. Comprueba que cada `CA-n` aparece en la columna Criterios.
3. **Revisión humana.** Muestra el alcance, la tabla de casos y las preguntas abiertas, y pide
   aprobación antes de automatizar. Los cambios que pida la persona vuelven al `planner`. Solo se
   salta esta pausa si la persona lo pidió (`--sin-pausa`). Deja la decisión en
   `artifacts/REQ-00X/02-revision.md` con tres viñetas: `- **Revisó:**`, `- **Decisión:**` y
   `- **Cambios pedidos:**`, bajo la cabecera `> Revisión humana · AAAA-MM-DD · Requisito: REQ-00X`.
4. **Automatización.** Lanza `automator`. Al volver, corre tú mismo
   `npx playwright test --project=ui --project=api -g "@REQ-00X"` para confirmar el verde, y revisa
   con `git diff` que no haya asserts debilitados ni `test.skip` sin motivo.
5. **Versión con bugs.** Si el requisito tiene pruebas de UI, corre `npm run -s test:bugs -- -g "@REQ-00X"`.
   Que aquí fallen pruebas es lo esperado: son los bugs sembrados.
6. **Trazabilidad.** Corre `npm run -s trazabilidad`. Si reporta problemas, vuelve a la etapa que los causó.
7. **Reporte.** Lanza `reporter`.
8. **Cierre.** Resume a la persona: casos, resultado, bugs abiertos y qué quedó manual. No hagas
   commit ni push salvo que lo pidan.

## Reglas del flujo

- Un artefacto por etapa y cada uno dice qué modelo lo generó. No se editan a mano; si algo está
  mal, se corrige la entrada y se vuelve a correr la etapa.
- Si una etapa falla su puerta dos veces, detente y explica qué falla en lugar de insistir.
- La trazabilidad la calcula el script, nunca un modelo.
