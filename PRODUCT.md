# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

static HTML/CSS: un script de TypeScript (`scripts/panel.ts`) genera un solo HTML sin dependencias
en `site/dist`, desplegado en GitHub Pages.

## Users

Dos lectores, en este orden de lectura:

1. Un reclutador no técnico con uno o dos minutos. No lee código. Tiene que entender qué se hizo,
   que funciona, y poder reenviarlo a alguien técnico.
2. Un líder de QA que baja al detalle: casos, trazabilidad, bugs y cómo se controló a la IA.

## Product Purpose

Panel del portafolio de QA de Arturo Isaza. Muestra un flujo en el que un requisito pasa por cuatro
agentes (extractor, planner, automator, reporter) y sale como plan de pruebas, pruebas de
Playwright, reporte y matriz de trazabilidad. Éxito: que quien lo abra concluya que el autor sabe
diseñar pruebas y usa la IA con control, y quiera hablar con él.

## Positioning

Cada etapa deja un artefacto versionado que dice qué modelo lo generó, hay una revisión humana
antes de automatizar, y la trazabilidad la calcula un script, no un modelo. El panel se genera de
los resultados reales de la última corrida.

## Operating Context

Se llega desde el perfil de GitHub, el README o un enlace en una postulación. Se lee una vez, en
escritorio o en el móvil. Convive con el reporte HTML de Playwright, al que enlaza.

## Capabilities and Constraints

- Contenido generado en cada corrida del CI a partir de `results/` y `artifacts/`.
- Textos fijos en español e inglés con selector; el contenido generado (casos, bugs) queda en español.
- Tema claro y oscuro. Usable en móvil.
- La aplicación bajo prueba es una demo pública de terceros (Toolshop); el panel no la presenta como propia.
- Reparto de modelos: Fable planea, Opus automatiza, Haiku extrae y reporta.

## Brand Commitments

- Firma: Arturo Isaza · https://www.linkedin.com/in/arturo-isaza-qa/ · GitHub ArturDev98.
- Sin logo ni identidad previa.

## Evidence on Hand

- Requisitos, extracciones, planes, reportes y bugs reales en `requirements/`, `artifacts/` y `bugs/`.
- Resultados de Playwright y matriz en `results/`.
- No hay testimonios, clientes ni métricas de impacto: no se inventan.

## Product Principles

1. Lo que se muestra sale de la corrida real; si algo falló, el panel lo dice.
2. Primero se entiende en segundos; el detalle está debajo para quien lo busque.
3. La IA aparece con sus límites: qué hizo cada modelo y qué revisó una persona.
4. El criterio de QA pesa más que la herramienta.
