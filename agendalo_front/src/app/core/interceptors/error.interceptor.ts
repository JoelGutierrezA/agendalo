import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = error.error.message;
      } else {
        // Error del lado del servidor
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Solicitud incorrecta';
            break;
          case 401:
            errorMessage = 'Sesión expirada. Por favor, inicia sesión de nuevo';
            authService.endSession();
            break;
          case 403:
            errorMessage = 'No tienes permisos para realizar esta acción';
            break;
          case 404:
            errorMessage = 'El recurso solicitado no existe';
            break;
          case 422:
            // Errores de validación de Laravel
            if (error.error?.errors) {
              const firstErrorKey = Object.keys(error.error.errors)[0];
              errorMessage = error.error.errors[firstErrorKey][0];
            } else {
              errorMessage = error.error?.message || 'Datos de formulario inválidos';
            }
            break;
          case 500:
            errorMessage = 'Error interno del servidor. Inténtalo más tarde';
            break;
          default:
            errorMessage = error.error?.message || errorMessage;
        }
      }

      toastService.error(errorMessage);
      return throwError(() => error);
    })
  );
};
