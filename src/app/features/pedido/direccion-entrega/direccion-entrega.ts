import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { validarCobertura } from '@core/domain/pedido.rules';
import { CIUDADES, Ciudad, Direccion, ErrorRegla } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { CarritoService } from '@core/services/carrito.service';
import { CheckoutService } from '@core/services/checkout.service';
import { ClienteService } from '@core/services/cliente.service';
import { ErroresRegla } from '@shared/components/errores-regla';

/** Paso 3 del pedido: dirección de entrega, con cobertura del restaurante (RF-03, RN-05). */
@Component({
  selector: 'app-direccion-entrega',
  imports: [RouterLink, ErroresRegla],
  template: `
    <section class="pagina">
      <a routerLink="/cliente/carrito">← Carrito</a>
      <h1>Dirección de entrega</h1>
      <div role="radiogroup" aria-label="Direcciones guardadas" class="lista">
        @for (d of clientes.direcciones(); track d.id) {
          <button
            type="button"
            role="radio"
            class="tarjeta tarjeta-seleccionable"
            [attr.aria-checked]="checkout.direccionId() === d.id"
            (click)="checkout.direccionId.set(d.id)"
          >
            <strong>{{ d.etiqueta }}</strong> · {{ d.linea }}, {{ d.ciudad }}
            @if (!cubre(d)) {
              <br /><span class="chip chip-error"
                >Fuera de cobertura de {{ restaurante()?.nombre }}</span
              >
            }
          </button>
        }
      </div>

      <details class="tarjeta">
        <summary>+ Agregar dirección</summary>
        <label class="campo">
          Dirección
          <input
            autocomplete="off"
            placeholder="Ej. Carrera 14 # 25N-40"
            [value]="linea()"
            (input)="linea.set($any($event.target).value)"
          />
        </label>
        <div class="fila">
          <label class="campo">
            Ciudad
            <select [value]="ciudad()" (change)="ciudad.set($any($event.target).value)">
              @for (c of ciudades; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </label>
          <label class="campo">
            Etiqueta
            <select [value]="etiqueta()" (change)="etiqueta.set($any($event.target).value)">
              @for (e of etiquetas; track e) {
                <option [value]="e">{{ e }}</option>
              }
            </select>
          </label>
        </div>
        <app-errores-regla [errores]="errores()" />
        <button type="button" class="btn btn-borde btn-bloque" (click)="guardar()">
          Guardar dirección
        </button>
      </details>

      <div class="accion-fija">
        <button
          type="button"
          class="btn btn-primario btn-bloque"
          [disabled]="!checkout.direccion()"
          (click)="continuar()"
        >
          Continuar con el proceso de pago
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
export class DireccionEntrega {
  protected readonly clientes = inject(ClienteService);
  protected readonly checkout = inject(CheckoutService);
  private readonly carrito = inject(CarritoService);
  private readonly db = inject(BaseDatosService);
  private readonly router = inject(Router);

  protected readonly ciudades = CIUDADES;
  protected readonly etiquetas: Direccion['etiqueta'][] = ['Casa', 'Trabajo', 'Otra'];
  protected readonly linea = signal('');
  protected readonly ciudad = signal<Ciudad>('Armenia');
  protected readonly etiqueta = signal<Direccion['etiqueta']>('Casa');
  protected readonly errores = signal<ErrorRegla[]>([]);

  protected readonly restaurante = computed(() =>
    this.db.restaurantes().find((r) => r.id === this.carrito.restauranteId()),
  );

  /** Indica si la dirección está en la zona del restaurante del carrito (RN-05). */
  protected cubre(direccion: Direccion): boolean {
    const restaurante = this.restaurante();
    return !restaurante || validarCobertura(direccion, restaurante).length === 0;
  }

  protected guardar(): void {
    const resultado = this.clientes.agregarDireccion({
      etiqueta: this.etiqueta(),
      linea: this.linea(),
      ciudad: this.ciudad(),
    });
    this.errores.set(resultado.ok ? [] : resultado.errores);
    if (resultado.ok) {
      this.checkout.direccionId.set(resultado.valor.id);
      this.linea.set('');
    }
  }

  protected continuar(): void {
    void this.router.navigateByUrl('/cliente/checkout/pago');
  }
}
