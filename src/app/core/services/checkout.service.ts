import { Injectable, computed, inject, signal } from '@angular/core';
import { ClienteService } from './cliente.service';
import { DatosCheckout } from './pedido.service';

/**
 * Elecciones del cliente a lo largo del checkout (dirección, método de pago y efectivo).
 * Viven en memoria entre las pantallas y se reinician al registrar el pedido.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cliente = inject(ClienteService);

  readonly direccionId = signal<string | null>(null);
  readonly metodoPagoId = signal<string | null>(null);
  readonly montoEfectivo = signal<number | null>(null);

  readonly direccion = computed(() =>
    this.cliente.direcciones().find((d) => d.id === this.direccionId()),
  );
  readonly metodoPago = computed(() =>
    this.cliente.metodosPago().find((m) => m.id === this.metodoPagoId()),
  );

  /** Datos listos para `PedidoService.registrar`, o null si falta algún paso. */
  readonly datos = computed<DatosCheckout | null>(() => {
    const direccion = this.direccion();
    const metodoPago = this.metodoPago();
    return direccion && metodoPago
      ? { direccion, metodoPago, montoEfectivo: this.montoEfectivo() }
      : null;
  });

  reiniciar(): void {
    this.direccionId.set(null);
    this.metodoPagoId.set(null);
    this.montoEfectivo.set(null);
  }
}
