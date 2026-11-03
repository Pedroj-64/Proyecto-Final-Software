import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { totalItem } from '@core/domain/costos';
import { REGLAS } from '@core/domain/reglas';
import { ErrorRegla } from '@core/models';
import { CarritoService } from '@core/services/carrito.service';
import { ProductoService } from '@core/services/producto.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { ErroresRegla } from '@shared/components/errores-regla';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Carrito de compras: cantidades, costos y paso al checkout (RF-02, RN-01 a RN-04, RN-06). */
@Component({
  selector: 'app-carrito',
  imports: [RouterLink, CopPipe, EstadoVacio, ErroresRegla],
  template: `
    <section class="pagina">
      <h1>Carrito de compras</h1>
      @for (l of carrito.lineas(); track $index) {
        <article class="tarjeta fila entre">
          <span class="miniatura" aria-hidden="true">{{ l.emoji }}</span>
          <div class="datos">
            <strong>{{ l.nombre }}</strong>
            @if (l.opciones.length || l.notas) {
              <br /><span class="texto-suave">
                {{ nombresOpciones(l.opciones) }}{{ l.notas ? ' · ' + l.notas : '' }}
              </span>
            }
            <br /><strong>{{ total(l) | cop }}</strong>
          </div>
          <div class="fila">
            <button
              type="button"
              class="btn-icono"
              [attr.aria-label]="'Menos ' + l.nombre"
              (click)="cambiar($index, l.cantidad - 1)"
            >
              −
            </button>
            <span aria-live="polite">{{ l.cantidad }}</span>
            <button
              type="button"
              class="btn-icono"
              [attr.aria-label]="'Más ' + l.nombre"
              (click)="cambiar($index, l.cantidad + 1)"
            >
              +
            </button>
          </div>
        </article>
      } @empty {
        <app-estado-vacio
          icono="🛒"
          titulo="Tu carrito está vacío"
          descripcion="Agrega platos de un restaurante para empezar."
        >
          <a class="btn btn-primario" routerLink="/cliente/restaurantes">Ver restaurantes</a>
        </app-estado-vacio>
      }

      @if (carrito.lineas().length) {
        <app-errores-regla [errores]="errores()" />
        <div class="tarjeta desglose">
          <span>Subtotal</span><span>{{ carrito.costos().subtotal | cop }}</span> <span>Envío</span
          ><span>{{ carrito.costos().envio | cop }}</span> <span>Impuesto al consumo</span
          ><span>{{ carrito.costos().impuestos | cop }}</span> <span class="total">Total</span
          ><span class="total">{{ carrito.costos().total | cop }}</span>
        </div>
        @if (falta() > 0) {
          <p class="aviso aviso-info" role="status">
            RN-04: el pedido mínimo es {{ minimo | cop }}. Agrega {{ falta() | cop }} más.
          </p>
        }
        <div class="accion-fija">
          <button type="button" class="btn btn-borde btn-bloque" (click)="carrito.vaciar()">
            Vaciar carrito
          </button>
          <a
            class="btn btn-primario btn-bloque"
            routerLink="/cliente/checkout/direccion"
            [attr.aria-disabled]="falta() > 0"
            [class.btn-deshabilitado]="falta() > 0"
            >Continuar</a
          >
        </div>
      }
    </section>
  `,
  styles: `
    .datos {
      flex: 1;
    }
    .btn-deshabilitado {
      pointer-events: none;
      opacity: 0.5;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carrito {
  protected readonly carrito = inject(CarritoService);
  private readonly productos = inject(ProductoService);

  protected readonly total = totalItem;
  protected readonly minimo = REGLAS.SUBTOTAL_MINIMO;
  protected readonly errores = signal<ErrorRegla[]>([]);
  /** Cuánto falta para llegar al subtotal mínimo (RN-04). */
  protected readonly falta = computed(() =>
    Math.max(0, REGLAS.SUBTOTAL_MINIMO - this.carrito.costos().subtotal),
  );

  protected nombresOpciones(opciones: readonly { nombre: string }[]): string {
    return opciones.map((o) => o.nombre).join(', ');
  }

  /** Cambia la cantidad (RN-01, RN-02); con cantidad 0 quita la línea. */
  protected cambiar(indice: number, cantidad: number): void {
    const linea = this.carrito.lineas()[indice];
    if (cantidad < 1) {
      this.carrito.quitar(indice);
      this.errores.set([]);
      return;
    }
    const producto = this.productos.obtener(linea.productoId);
    if (!producto) {
      this.carrito.quitar(indice);
      return;
    }
    const resultado = this.carrito.cambiarCantidad(indice, producto, cantidad);
    this.errores.set(resultado.ok ? [] : resultado.errores);
  }
}
