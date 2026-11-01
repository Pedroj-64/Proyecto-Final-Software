import { Injectable, computed, inject } from '@angular/core';
import { esPedidoActivo } from '@core/domain/pedido.rules';
import { DatosProducto, estadoProducto, validarProducto } from '@core/domain/producto.rules';
import { Producto, Resultado, exito, fallo } from '@core/models';
import { BaseDatosService } from './base-datos.service';

/**
 * CU-04 Gestionar catálogo: CRUD de la entidad Producto (Proceso 1: menú digital).
 * Cada método documenta el endpoint REST equivalente para la matriz de trazabilidad.
 */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly db = inject(BaseDatosService);

  readonly productos = this.db.productos;
  readonly porId = computed(() => new Map(this.db.productos().map((p) => [p.id, p])));

  /** GET /restaurantes/{id}/productos */
  listarPorRestaurante(restauranteId: string): Producto[] {
    return this.db.productos().filter((p) => p.restauranteId === restauranteId);
  }

  /** GET /restaurantes/{id}/menu: solo productos visibles (los agotados se muestran bloqueados). */
  menuPublicado(restauranteId: string): Producto[] {
    return this.listarPorRestaurante(restauranteId).filter((p) => estadoProducto(p) !== 'OCULTO');
  }

  /** GET /productos/{id} */
  obtener(id: string): Producto | undefined {
    return this.porId().get(id);
  }

  /** POST /restaurantes/{id}/productos */
  crear(restauranteId: string, datos: DatosProducto): Resultado<Producto> {
    const errores = validarProducto(datos, this.listarPorRestaurante(restauranteId));
    if (errores.length) return fallo(errores);

    const producto: Producto = {
      ...datos,
      nombre: datos.nombre.trim(),
      id: crypto.randomUUID(),
      restauranteId,
      opciones: [],
    };
    this.db.actualizarProductos((lista) => [...lista, producto]);
    return exito(producto);
  }

  /** PUT /productos/{id} */
  actualizar(id: string, datos: DatosProducto): Resultado<Producto> {
    const actual = this.obtener(id);
    if (!actual) return fallo([{ regla: 'RP-01', mensaje: 'El producto no existe.' }]);

    const otros = this.listarPorRestaurante(actual.restauranteId).filter((p) => p.id !== id);
    const errores = validarProducto(datos, otros);
    if (errores.length) return fallo(errores);

    const actualizado: Producto = { ...actual, ...datos, nombre: datos.nombre.trim() };
    this.db.actualizarProductos((lista) => lista.map((p) => (p.id === id ? actualizado : p)));
    return exito(actualizado);
  }

  /** PATCH /productos/{id} { visible } */
  cambiarVisibilidad(id: string, visible: boolean): void {
    this.db.actualizarProductos((lista) => lista.map((p) => (p.id === id ? { ...p, visible } : p)));
  }

  /** DELETE /productos/{id}. RP-04: no se elimina si está en un pedido activo. */
  eliminar(id: string): Resultado<true> {
    const enUso = this.db
      .pedidos()
      .some((pedido) => esPedidoActivo(pedido) && pedido.items.some((i) => i.productoId === id));
    if (enUso) {
      return fallo([
        {
          regla: 'RP-04',
          mensaje:
            'No se puede eliminar: el producto está en un pedido en curso. Ocúltalo del menú.',
        },
      ]);
    }
    this.db.actualizarProductos((lista) => lista.filter((p) => p.id !== id));
    return exito(true);
  }
}
