# Frontend Notes

## Cómo corre
1. `npm install`
2. `ng serve --open` → http://localhost:4200
3. Requiere backend corriendo en http://localhost:5274 (CORS habilitado)

## Estructura de carpetas
- `core/` — servicios HTTP (TicketService), interceptor de errores, modelos TS
- `features/tickets/` — ticket-list, ticket-form (crear/editar), ticket-detail
- `shared/` — componentes reutilizables (spinner, alert, status-badge)

## 3 mejoras futuras
1. **Caching de listados**: usar un signal/store (ej. NgRx o servicios con
   `BehaviorSubject`) para evitar refetch al volver del detalle al listado.
2. **Optimistic updates**: al cambiar estado o agregar comentario, actualizar
   la UI inmediatamente y revertir si la API falla, mejorando percepción
   de velocidad.
3. **Virtual scroll / lazy loading de comentarios**: para tickets con
   muchos comentarios, cargar en páginas en lugar de traer todos de una vez.
