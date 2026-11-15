> Revisión humana · 2026-11-14 · Requisito: REQ-002

- **Revisó:** Arturo Isaza
- **Decisión:** Aprobado, con un cambio pedido después de la primera ejecución
- **Cambios pedidos:** el esperado de TC-004 y TC-005 pasa a ser el orden dentro de lo que el catálogo muestra

## Historial

1. **Antes de automatizar.** Plan aprobado sin cambios.
2. **Después de la primera ejecución (hallazgo H-01).** El plan esperaba que, al ordenar, el primer
   producto fuera el extremo de todo el catálogo. La tienda trae por defecto un filtro de precio de
   1 a 100 que oculta 5 de los 50 productos, así que el primero mostrado no es ese extremo, aunque
   el orden de lo mostrado es correcto. CA-3 pide que "el orden mostrado corresponda al elegido":
   la premisa del plan era más fuerte que el requisito. Decisión: el planner ajusta el esperado de
   TC-004 y TC-005 al orden de lo que el catálogo muestra, y el filtro por defecto que oculta
   productos se reporta aparte como bug de severidad baja contra la tienda real.
