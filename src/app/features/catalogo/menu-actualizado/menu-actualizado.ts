import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoService } from '@core/services/producto.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Menú publicado: lo que ven los clientes (productos visibles; los agotados se marcan). */
@Component({
  selector: 'app-menu-actualizado',
  imports: [RouterLink, CopPipe, EstadoVacio],
  template: `
    <section class="pagina">
      <h1>Menú actualizado</h1>
      <p class="texto-suave">Así lo ven tus clientes ({{ menu().length }} productos).</p>
      @for (p of menu(); track p.id) {
        <article class="tarjeta fila entre">
          <span class="miniatura" aria-hidden="true">{{ p.emoji }}</span>
          <span class="datos">
            <strong>{{ p.nombre }}</strong
            ><br /><span class="texto-suave">{{ p.categoria }}</span>
          </span>
          <span>
            <strong>{{ p.precio | cop }}</strong>
            @if (p.stock === 0) {
              <br /><span class="chip chip-error">Agotado</span>
            }
          </span>
        </article>
      } @empty {
        <app-estado-vacio
          icono="📋"
          titulo="Tu menú está vacío"
          descripcion="Muestra al menos un producto para publicarlo."
        />
      }
      <a class="btn btn-borde btn-bloque" routerLink="/restaurante/catalogo">Volver al catálogo</a>
    </section>
  `,
  styles: `
    .datos {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuActualizado {
  private readonly productos = inject(ProductoService);
  private readonly sesion = inject(SesionService);

  protected readonly menu = computed(() =>
    this.productos.menuPublicado(this.sesion.restaurante()?.id ?? ''),
  );
}
