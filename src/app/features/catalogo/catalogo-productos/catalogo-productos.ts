import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { estadoProducto } from '@core/domain/producto.rules';
import { CATEGORIAS, Categoria, EstadoProducto, Producto } from '@core/models';
import { NotificacionService } from '@core/services/notificacion.service';
import { ProductoService } from '@core/services/producto.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';

const TAMANO_PAGINA = 6;

export const ETIQUETAS_ESTADO_PRODUCTO: Record<EstadoProducto, { texto: string; clase: string }> = {
  ACTIVO: { texto: 'Activo', clase: 'chip-exito' },
  AGOTADO: { texto: 'Agotado', clase: 'chip-error' },
  OCULTO: { texto: 'Oculto', clase: 'chip-neutro' },
};

/** Listado del CRUD de Producto: búsqueda, filtro, paginación, visibilidad y eliminación. */
@Component({
  selector: 'app-catalogo-productos',
  imports: [RouterLink, FormsModule, CopPipe, EstadoVacio],
  templateUrl: './catalogo-productos.html',
  styleUrl: './catalogo-productos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoProductos {
  private readonly productosService = inject(ProductoService);
  private readonly notificaciones = inject(NotificacionService);
  protected readonly sesion = inject(SesionService);

  protected readonly categorias = CATEGORIAS;
  protected readonly etiquetas = ETIQUETAS_ESTADO_PRODUCTO;
  protected readonly busqueda = signal('');
  protected readonly categoria = signal<Categoria | ''>('');
  protected readonly pagina = signal(1);
  protected readonly porEliminar = signal<Producto | null>(null);

  protected readonly productos = computed(() => {
    const id = this.sesion.restaurante()?.id;
    return id ? this.productosService.listarPorRestaurante(id) : [];
  });

  protected readonly resumen = computed(() => {
    const lista = this.productos();
    return {
      total: lista.length,
      agotados: lista.filter((p) => estadoProducto(p) === 'AGOTADO').length,
      activos: lista.filter((p) => estadoProducto(p) === 'ACTIVO').length,
    };
  });

  protected readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoria = this.categoria();
    return this.productos().filter(
      (p) =>
        (!texto || p.nombre.toLowerCase().includes(texto)) &&
        (!categoria || p.categoria === categoria),
    );
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / TAMANO_PAGINA)),
  );

  protected readonly paginaActual = computed(() => {
    const pagina = Math.min(this.pagina(), this.totalPaginas());
    return this.filtrados().slice((pagina - 1) * TAMANO_PAGINA, pagina * TAMANO_PAGINA);
  });

  protected estado(producto: Producto): EstadoProducto {
    return estadoProducto(producto);
  }

  protected filtrar(busqueda: string, categoria: Categoria | ''): void {
    this.busqueda.set(busqueda);
    this.categoria.set(categoria);
    this.pagina.set(1);
  }

  protected cambiarPagina(delta: number): void {
    this.pagina.update((p) => Math.min(this.totalPaginas(), Math.max(1, p + delta)));
  }

  protected alternarVisibilidad(producto: Producto): void {
    this.productosService.cambiarVisibilidad(producto.id, !producto.visible);
    this.notificaciones.mostrar(
      producto.visible
        ? `"${producto.nombre}" ya no se muestra en el menú.`
        : `"${producto.nombre}" ahora es visible.`,
    );
  }

  protected confirmarEliminacion(): void {
    const producto = this.porEliminar();
    if (!producto) return;
    const resultado = this.productosService.eliminar(producto.id);
    this.porEliminar.set(null);
    if (resultado.ok) {
      this.notificaciones.mostrar(`"${producto.nombre}" fue eliminado.`, 'exito');
    } else {
      this.notificaciones.mostrar(resultado.errores[0].mensaje, 'error', 5000);
    }
  }
}
