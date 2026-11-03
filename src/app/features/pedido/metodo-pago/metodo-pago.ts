import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { calcularCambio } from '@core/domain/costos';
import { CarritoService } from '@core/services/carrito.service';
import { CheckoutService } from '@core/services/checkout.service';
import { ClienteService } from '@core/services/cliente.service';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Paso 4 del pedido: método de pago y, si es efectivo, con cuánto paga (RF-03, RN-07). */
@Component({
  selector: 'app-metodo-pago',
  imports: [RouterLink, CopPipe],
  template: `
    <section class="pagina">
      <a routerLink="/cliente/checkout/direccion">← Dirección</a>
      <h1>Método de pago</h1>
      <div role="radiogroup" aria-label="Métodos de pago" class="lista">
        @for (m of clientes.metodosPago(); track m.id) {
          <button
            type="button"
            role="radio"
            class="tarjeta tarjeta-seleccionable"
            [attr.aria-checked]="checkout.metodoPagoId() === m.id"
            (click)="elegir(m.id)"
          >
            <strong>{{ m.nombre }}</strong
            ><br /><span class="texto-suave">{{ m.detalle }}</span>
          </button>
        }
      </div>

      @if (checkout.metodoPago()?.tipo === 'EFECTIVO') {
        <label class="campo">
          ¿Con cuánto pagas? (total {{ carrito.costos().total | cop }})
          <input
            type="number"
            inputmode="numeric"
            min="0"
            step="500"
            [value]="checkout.montoEfectivo() ?? ''"
            (input)="checkout.montoEfectivo.set(monto($any($event.target).value))"
          />
        </label>
        @if (cambio() > 0) {
          <p class="aviso aviso-info" role="status">Tu cambio será de {{ cambio() | cop }}.</p>
        }
      }

      <div class="accion-fija">
        <button
          type="button"
          class="btn btn-primario btn-bloque"
          [disabled]="!listo()"
          (click)="continuar()"
        >
          Revisar pedido
        </button>
      </div>
    </section>
  `,
  styles: `
    .lista {
      display: grid;
      gap: 0.5rem;
    }
    .tarjeta-seleccionable {
      text-align: left;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetodoPagoPaso {
  protected readonly clientes = inject(ClienteService);
  protected readonly checkout = inject(CheckoutService);
  protected readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);

  protected readonly cambio = computed(() =>
    calcularCambio(this.carrito.costos().total, this.checkout.montoEfectivo() ?? 0),
  );
  /** Con efectivo hace falta indicar el monto; con otros métodos basta elegirlo. */
  protected readonly listo = computed(() => {
    const metodo = this.checkout.metodoPago();
    return !!metodo && (metodo.tipo !== 'EFECTIVO' || (this.checkout.montoEfectivo() ?? 0) > 0);
  });

  protected elegir(id: string): void {
    this.checkout.metodoPagoId.set(id);
    if (this.checkout.metodoPago()?.tipo !== 'EFECTIVO') this.checkout.montoEfectivo.set(null);
  }

  protected monto(valor: string): number | null {
    return valor === '' ? null : Number(valor);
  }

  protected continuar(): void {
    void this.router.navigateByUrl('/cliente/checkout/resumen');
  }
}
