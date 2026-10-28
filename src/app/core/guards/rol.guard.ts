import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '@core/models';
import { SesionService } from '@core/services/sesion.service';

/** Permite entrar a una sección solo con el rol indicado; si no, vuelve al acceso. */
export function rolGuard(rol: Rol): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    return sesion.rol() === rol ? true : inject(Router).createUrlTree(['/acceso']);
  };
}
