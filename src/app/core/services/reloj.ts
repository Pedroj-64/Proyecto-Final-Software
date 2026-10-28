import { InjectionToken } from '@angular/core';

/** Fuente de la fecha actual. Inyectable para poder fijar el tiempo en las pruebas. */
export const RELOJ = new InjectionToken<() => Date>('RELOJ', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
