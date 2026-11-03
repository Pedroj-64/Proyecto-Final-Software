import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { estadoProducto } from '@core/domain/producto.rules';
import { ProductoService } from '@core/services/producto.service';
import { SesionService } from '@core/services/sesion.service';

/** Confirmación de publicación del menú (maqueta "Menú actualizado"). */
@Component({
  selector: 'app-menu-actualizado',
  imports: [RouterLink],
  template: `
    <section class="pagina exito">
      <div class="check" aria-hidden="true">✓</div>
      <h1>Menú actualizado</h1>
      <p class="texto-suave">Tus cambios ya están visibles para los clientes en la app.</p>
      <p class="tarjeta">
        {{ resumen().activos }} productos activos · {{ resumen().agotados }} agotados
      </p>
      <a class="btn btn-borde btn-bloque" routerLink="/restaurante/catalogo">Volver al catálogo</a>
    </section>
  `,
  styles: `
    .exito {
      align-items: center;
      text-align: center;
      padding-top: 3rem;
    }
    .check {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background: var(--color-exito);
      color: #fff;
      font-size: 3rem;
      display: grid;
      place-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuActualizado {
  private readonly productos = inject(ProductoService);
  private readonly sesion = inject(SesionService);

  protected readonly resumen = computed(() => {
    const lista = this.productos.listarPorRestaurante(this.sesion.restaurante()?.id ?? '');
    return {
      activos: lista.filter((p) => estadoProducto(p) === 'ACTIVO').length,
      agotados: lista.filter((p) => estadoProducto(p) === 'AGOTADO').length,
    };
  });
}
