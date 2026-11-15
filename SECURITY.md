# Seguridad

Este es un proyecto de portafolio: no tiene usuarios, no guarda datos personales y no maneja
secretos. Aun así, si encuentras un problema, me interesa saberlo.

## Cómo avisar

Abre un aviso privado desde la pestaña **Security → Report a vulnerability** del repositorio. Si no
está disponible, escríbeme por [LinkedIn](https://www.linkedin.com/in/arturo-isaza-qa/). Respondo
en cuanto lo vea; no hay un plazo comprometido.

## Qué está dentro del alcance

- El workflow de GitHub Actions y lo que publica en GitHub Pages.
- El panel generado (`scripts/panel.ts`, `site/`): inyección de contenido, enlaces o scripts.
- Los scripts de `scripts/` y las reglas de los agentes en `.claude/`.
- Secretos o datos personales que hayan quedado en el repositorio o en su historial.

## Qué está fuera

La aplicación bajo prueba, [Toolshop](https://practicesoftwaretesting.com), es una demo pública de
terceros. Sus defectos, incluidos los de la versión con bugs sembrados, son el objeto de las
pruebas y no un problema de este repositorio.

## Decisiones tomadas

- **Sin secretos.** El pipeline no usa ninguno. El token de Actions es de solo lectura, salvo en el
  job que despliega Pages, que solo corre en `main`.
- **Acciones fijadas por commit** y actualizadas con Dependabot.
- **Los reportes de Playwright no se publican.** Sus trazas guardan la clave de los clientes de
  prueba. Son cuentas desechables que crea cada corrida en una demo pública, con correos de
  `example.com`, pero no tienen por qué quedar en una página pública.
- **El panel lleva una política de contenido (CSP)** que solo permite ejecutar sus dos scripts en
  línea, identificados por su hash. Todo el contenido que viene de archivos escritos por modelos
  se escapa antes de entrar al HTML.
- **Los agentes tratan lo que leen como datos.** El extractor lee una web ajena; sus reglas y las
  de los demás agentes prohíben seguir instrucciones que aparezcan en ese contenido, y hay una
  revisión humana antes de automatizar.
- **Permisos de Claude Code acotados** en `.claude/settings.json`: se prohíben `rm -rf`, el
  `git push --force` y leer `.env`, y cualquier `git push` pide confirmación.
- **Las credenciales de la cuenta de demostración** que aparecen en los artefactos son las que
  publica la propia demo en su documentación. Las pruebas no las usan.
