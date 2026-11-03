import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { totalItem } from '@core/domain/costos';
import { ErrorRegla, OpcionProducto } from '@core/models';
import { CarritoService } from '@core/services/carrito.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { ProductoService } from '@core/services/producto.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { ErroresRegla } from '@shared/components/errores-regla';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Detalle de un producto: opciones, notas y cantidad antes de agregarlo (RF-02). */
@Component({
  selector: 'app-detalle-producto',
  imports: [RouterLink, CopPipe, EstadoVacio, ErroresRegla],
  template: `
    @if (producto(); as p) {
      <section class="pagina">
        <a [routerLink]="['/cliente/restaurantes', p.restauranteId]">← Volver al menú</a>
        <h1>{{ p.emoji }} {{ p.nombre }}</h1>
        <p class="texto-suave">{{ p.descripcion }}</p>
        <p>
          <strong>{{ p.precio | cop }}</strong>
        </p>

        @if (p.opciones.length) {
          <fieldset class="tarjeta">
            <legend>Opciones</legend>
            @for (o of p.opciones; track o.id) {
              <label class="fila entre">
                <span>
                  <input type="checkbox" [checked]="elegidas().has(o.id)" (change)="alternar(o)" />
                  {{ o.nombre }}
                </span>
                <span class="texto-suave">{{
                  o.precioExtra ? '+ ' + (o.precioExtra | cop) : ''
                }}</span>
              </label>
            }
          </fieldset>
        }

        <label class="campo">
          Notas para el restaurante
          <textarea
            rows="2"
            maxlength="120"
            placeholder="Ej. sin cebolla"
            [value]="notas()"
            (input)="notas.set($any($event.target).value)"
          ></textarea>
        </label>

        <div class="fila">
          <button
            type="button"
            class="btn-icono"
            aria-label="Menos unidades"
            [disabled]="cantidad() <= 1"
            (click)="cantidad.set(cantidad() - 1)"
          >
            −
          </button>
          <strong aria-live="polite">{{ cantidad() }}</strong>
          <button
            type="button"
            class="btn-icono"
            aria-label="Más unidades"
            (click)="cantidad.set(cantidad() + 1)"
          >
            +
          </button>
        </div>

        <app-errores-regla [errores]="errores()" />
        <div class="accion-fija">
          <button type="button" class="btn btn-primario btn-bloque" (click)="agregar()">
            Agregar al carrito · {{ total() | cop }}
          </button>
        </div>
      </section>
    } @else {
      <app-estado-vacio icono="🍽️" titulo="Producto no disponible">
        <a class="btn btn-borde" routerLink="/cliente/restaurantes">Ver restaurantes</a>
      </app-estado-vacio>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleProducto {
  private readonly productos = inject(ProductoService);
  private readonly carrito = inject(CarritoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  /** Id del producto (parámetro de ruta). */
  readonly id = input.required<string>();

  protected readonly cantidad = signal(1);
  protected readonly notas = signal('');
  protected readonly elegidas = signal<ReadonlySet<string>>(new Set());
  protected readonly errores = signal<ErrorRegla[]>([]);

  /** Un producto oculto no se muestra al cliente (RN-01). */
  protected readonly producto = computed(() => {
    const p = this.productos.obtener(this.id());
    return p?.visible ? p : undefined;
  });
  private readonly opciones = computed(() =>
    (this.producto()?.opciones ?? []).filter((o) => this.elegidas().has(o.id)),
  );
  protected readonly total = computed(() => {
    const p = this.producto();
    return p
      ? totalItem({
          precioUnitario: p.precio,
          opciones: this.opciones(),
          cantidad: this.cantidad(),
        })
      : 0;
  });

  protected alternar(opcion: OpcionProducto): void {
    this.elegidas.update((actuales) => {
      const nuevas = new Set(actuales);
      if (!nuevas.delete(opcion.id)) nuevas.add(opcion.id);
      return nuevas;
    });
  }

  /** Agrega al carrito validando RN-01 a RN-03; si todo va bien vuelve al menú. */
  protected agregar(): void {
    const producto = this.producto();
    if (!producto) return;
    const resultado = this.carrito.agregar(
      producto,
      this.cantidad(),
      this.opciones(),
      this.notas().trim(),
    );
    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.notificaciones.mostrar(`${producto.nombre} agregado.`, 'exito');
    void this.router.navigate(['/cliente/restaurantes', producto.restauranteId]);
  }
}
