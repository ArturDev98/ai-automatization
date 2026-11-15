> Revisión humana · 2026-11-15 · Requisito: REQ-004

- **Revisó:** Arturo Isaza
- **Decisión:** Aprobado, con un caso agregado después de la primera ejecución
- **Cambios pedidos:** un caso nuevo para el hallazgo H-1 (envío antes de que el formulario aplique los obligatorios), que queda en rojo con `test.fail` mientras el defecto siga abierto

## Decisiones sobre las preguntas abiertas

1. **Regla del adjunto.** El oráculo es la regla que anuncia la propia app (en la tienda, un `.txt`
   vacío). TC-008 queda como está. Si la versión con bugs anuncia o aplica otra regla y falla,
   cuenta como bug sembrado.
2. **Mensaje de solo espacios.** No se agrega caso automatizado. Queda como hallazgo y riesgo para
   el exploratorio TC-013.

## Historial

1. **Antes de automatizar.** Plan aprobado sin cambios, con las dos decisiones de arriba.
2. **Después de la primera ejecución (hallazgo H-1).** La automatización encontró que nombre,
   apellido y correo solo pasan a obligatorios cuando falla `GET /users/me`, de 1,5 a 2 s después
   de cargar; si se envía antes, el mensaje se guarda sin esos datos. La suite espera ese estado
   para probar el formulario estable, así que el defecto quedaba sin prueba que lo detectara.
   Decisión: el planner agrega un caso que envía apenas carga la pantalla, y el automator lo deja
   con `test.fail` mientras el defecto siga abierto, para que se vea en la trazabilidad.
