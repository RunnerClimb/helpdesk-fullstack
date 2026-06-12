import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Agregar header X-User por defecto
  const modifiedReq = req.clone({
    setHeaders: { 'X-User': '1' }
  });

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Error inesperado. Intenta nuevamente.';

      if (error.status === 404) message = 'Recurso no encontrado.';
      else if (error.status === 400) message = error.error?.error ?? 'Datos inválidos.';
      else if (error.status === 409) message = error.error?.error ?? 'Conflicto en la operación.';
      else if (error.status === 0) message = 'Sin conexión con el servidor.';

      return throwError(() => ({ status: error.status, message }));
    })
  );
};