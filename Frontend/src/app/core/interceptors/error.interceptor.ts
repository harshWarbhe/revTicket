import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';

      if (error.status === 0) {
        errorMessage = 'Backend is not reachable. Please ensure Spring Boot server is running on http://localhost:8080';
        console.error('Connection refused - Backend server is offline');
      } else if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || error.error || 'Bad request';
            break;
          case 401:
            errorMessage = error.error?.message || 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = error.error?.message || error.error || 'Resource not found';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || error.error || `Error: ${error.status} ${error.statusText}`;
        }
      }

      console.error('HTTP Error:', { 
        status: error.status, 
        message: errorMessage, 
        url: error.url, 
        fullError: error,
        errorBody: error.error 
      });
      alertService.error(errorMessage);

      return throwError(() => error);
    })
  );
};

