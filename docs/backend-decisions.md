# Decisiones Backend - Trade-offs

1. **Arquitectura en 4 capas (API/Application/Domain/Infrastructure)**:
   se eligió para separar responsabilidades y facilitar testing
   (Application no depende de EF Core directamente).

2. **EF Core + SQL Server**: se priorizó productividad y migraciones
   automáticas sobre Dapper, dado el tamaño del proyecto. Trade-off:
   menos control fino sobre SQL generado.

3. **Status y Priority como string en BD** (HasConversion<string>):
   mejora legibilidad en queries directas a la BD, a costo de
   un poco más de espacio que un TINYINT.

4. **Reglas de transición de estado en Domain** (TicketStatusRules):
   centraliza la lógica de negocio fuera de controllers/services,
   facilita testing unitario puro sin mocks de BD.

5. **Middleware global de excepciones**: respuestas de error
   consistentes (400/404/409/500) sin try-catch repetido en
   cada controller.

6. **Header X-User como stub de autenticación**: simula el usuario
   autenticado sin implementar JWT completo, dejando el sistema
   "preparado" para integrarlo después (mencionado como requisito).

7. **Paginación server-side**: necesaria por el volumen esperado
   de tickets (picos de 10k/día mencionados en el caso de análisis),
   evita cargar listados completos al cliente.

8. **AutoMapper no usado activamente**: se optó por mapeo manual
   con records (DTOs) por simplicidad y porque las entidades son
   pequeñas; AutoMapper se deja como dependencia disponible si
   el modelo crece.
