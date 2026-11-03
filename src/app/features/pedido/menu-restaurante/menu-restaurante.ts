import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { estadoProducto } from '@core/domain/producto.rules';
import { CATEGORIAS, ErrorRegla, Producto } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { CarritoService } from '@core/services/carrito.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { ProductoService } from '@core/services/producto.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { ErroresRegla } from '@shared/components/errores-regla';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Paso 2 del pedido: menú publicado del restaurante con búsqueda y filtro (RF-01, RF-02). */
@Component({
  selector: 'app-menu-restaurante',
  imports: [RouterLink, CopPipe, EstadoVacio, ErroresRegla],
  template: `
    @if (restaurante(); as r) {
      <section class="pagina">
        <a routerLink="/cliente/restaurantes">← Restaurantes</a>
        <h1>{{ r.emoji }} {{ r.nombre }}</h1>
        <p class="texto-suave">{{ r.tipoCocina }} · {{ r.direccion }}, {{ r.ciudad }}</p>

        <label class="campo">
          <span class="visualmente-oculto">Buscar plato</span>
          <input
            type="search"
            placeholder="Buscar platos o ingredientes..."
            [value]="busqueda()"
            (input)="busqueda.set($any($event.target).value)"
          />
        </label>
        <div class="fila filtros" role="group" aria-label="Categorías">
          <button
            type="button"
            class="chip"
            [attr.aria-pressed]="!categoria()"
            (click)="categoria.set('')"
          >
            Todas
          </button>
          @for (c of categorias; track c) {
            <button
              type="button"
              class="chip"
              [attr.aria-pressed]="categoria() === c"
              (click)="categoria.set(c)"
            >
              {{ c }}
            </button>
          }
        </div>

        <app-errores-regla [errores]="errores()" />

        @for (p of visibles(); track p.id) {
          <article class="tarjeta fila entre">
            <span class="miniatura" aria-hidden="true">{{ p.emoji }}</span>
            <a class="datos" [routerLink]="['/cliente/productos', p.id]">
              <strong>{{ p.nombre }}</strong
              ><br />
              <span class="texto-suave">{{ p.categoria }}</span
              ><br />
              <strong>{{ p.precio | cop }}</strong>
              @if (agotado(p)) {
                <span class="chip chip-error">Agotado</span>
              }
            </a>
            <button
              type="button"
              class="btn-icono"
              [disabled]="agotado(p)"
              [attr.aria-label]="'Agregar ' + p.nombre"
              (click)="agregar(p)"
            >
              +
            </button>
          </article>
        } @empty {
          <app-estado-vacio
            icono="🔍"
            titulo="Sin resultados"
            descripcion="Prueba con otra búsqueda o categoría."
          />
        }
      </section>
    } @else {
      <app-estado-vacio icono="🍽️" titulo="Restaurante no encontrado">
        <a class="btn btn-borde" routerLink="/cliente/restaurantes">Ver restaurantes</a>
      </app-estado-vacio>
    }
  `,
  styles: `
    .filtros {
      flex-wrap: wrap;
      margin: 0.5rem 0;
    }
    .filtros .chip {
      border: 1px solid var(--color-borde);
      cursor: pointer;
    }
    .filtros .chip[aria-pressed='true'] {
      background: var(--color-marca);
      color: #fff;
    }
    .datos {
      flex: 1;
      color: inherit;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuRestaurante {
  private readonly db = inject(BaseDatosService);
  private readonly productos = inject(ProductoService);
  private readonly carrito = inject(CarritoService);
  private readonly notificaciones = inject(NotificacionService);

  /** Id del restaurante (parámetro de ruta). */
  readonly id = input.required<string>();

  protected readonly categorias = CATEGORIAS;
  protected readonly busqueda = signal('');
  protected readonly categoria = signal('');
  protected readonly errores = signal<ErrorRegla[]>([]);

  protected readonly restaurante = computed(() =>
    this.db.restaurantes().find((r) => r.id === this.id()),
  );
  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.productos
      .menuPublicado(this.id())
      .filter(
        (p) =>
          (!this.categoria() || p.categoria === this.categoria()) &&
          (!texto || `${p.nombre} ${p.descripcion}`.toLowerCase().includes(texto)),
      );
  });

  protected agotado(producto: Producto): boolean {
    return estadoProducto(producto) === 'AGOTADO';
  }

  /** Agrega una unidad al carrito; si viola RN-01 a RN-03 muestra la regla. */
  protected agregar(producto: Producto): void {
    const resultado = this.carrito.agregar(producto, 1);
    this.errores.set(resultado.ok ? [] : resultado.errores);
    if (resultado.ok) this.notificaciones.mostrar(`${producto.nombre} agregado.`, 'exito');
  }
}
