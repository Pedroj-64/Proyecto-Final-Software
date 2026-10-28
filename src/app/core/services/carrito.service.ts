import { Injectable, signal } from '@angular/core';

/** Esqueleto: Brandon implementa el carrito completo (RN-01 a RN-07). */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  readonly lineas = signal<unknown[]>([]).asReadonly();
  readonly cantidadItems = signal(0).asReadonly();

  vaciar(): void {
    // Pendiente: se implementa con el carrito real.
  }
}
