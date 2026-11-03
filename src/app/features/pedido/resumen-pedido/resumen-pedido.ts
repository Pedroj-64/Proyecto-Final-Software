import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { totalItem } from '@core/domain/costos';
import { ErrorRegla } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { CarritoService } from '@core/services/carrito.service';
import { CheckoutService } from '@core/services/checkout.service';
import { PedidoService } from '@core/services/pedido.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { ErroresRegla } from '@shared/components/errores-regla';
import { CopPipe } from '@shared/pipes/cop.pipe';

/**
 * Pantalla 1 del MVP: resumen y confirmación de la transacción Registrar Pedido (RF-04).
 * Al confirmar se validan RN-01 a RN-07; si alguna falla se muestra y no cambia nada (RN-08).
 */
@Component({
  selector: 'app-resumen-pedido',
  imports: [RouterLink, CopPipe, EstadoVacio, ErroresRegla],
  template: `
    @if (datos(); as d) {
      <section class="pagina">
        <a routerLink="/cliente/checkout/pago">← Pago</a>
        <h1>Resumen del pedido</h1>
        <div class="tarjeta">
          <strong>{{ restaurante()?.nombre }}</strong>
          <p class="texto-suave">
            Entrega en {{ d.direccion.etiqueta }}: {{ d.direccion.linea }}, {{ d.direccion.ciudad }}
            <br />Pago: {{ d.metodoPago.nombre }}
            @if (d.montoEfectivo) {
              · con {{ d.montoEfectivo | cop }}
            }
          </p>
        </div>
        <div class="tarjeta desglose">
          @for (l of carrito.lineas(); track $index) {
            <span>{{ l.cantidad }}x {{ l.nombre }}</span
            ><span>{{ total(l) | cop }}</span>
          }
          <span>Subtotal</span><span>{{ carrito.costos().subtotal | cop }}</span> <span>Envío</span
          ><span>{{ carrito.costos().envio | cop }}</span> <span>Impuesto al consumo</span
          ><span>{{ carrito.costos().impuestos | cop }}</span> <span class="total">Total</span
          ><span class="total">{{ carrito.costos().total | cop }}</span>
        </div>

        <app-errores-regla [errores]="errores()" />
        <div class="accion-fija">
          <button type="button" class="btn btn-accion btn-bloque" (click)="confirmar()">
            Confirmar pedido
          </button>
        </div>
      </section>
    } @else {
      <app-estado-vacio
        icono="🧾"
        titulo="Falta completar el pedido"
        descripcion="Elige dirección y método de pago para revisar el resumen."
      >
        <a class="btn btn-primario" routerLink="/cliente/checkout/direccion">Continuar</a>
      </app-estado-vacio>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenPedido {
  protected readonly carrito = inject(CarritoService);
  private readonly checkout = inject(CheckoutService);
  private readonly pedidos = inject(PedidoService);
  private readonly db = inject(BaseDatosService);
  private readonly router = inject(Router);

  protected readonly total = totalItem;
  protected readonly datos = this.checkout.datos;
  protected readonly errores = signal<ErrorRegla[]>([]);
  protected readonly restaurante = computed(() =>
    this.db.restaurantes().find((r) => r.id === this.carrito.restauranteId()),
  );

  /** Registra el pedido; ante reglas violadas las muestra y conserva el carrito. */
  protected confirmar(): void {
    const datos = this.datos();
    if (!datos) return;
    const resultado = this.pedidos.registrar(datos);
    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.checkout.reiniciar();
    void this.router.navigate(['/cliente/pedidos', resultado.valor.id]);
  }
}
