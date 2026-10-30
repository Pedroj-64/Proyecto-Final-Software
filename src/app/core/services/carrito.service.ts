import { Injectable, computed, signal } from '@angular/core';
import { ItemPedido, OpcionProducto, Producto, Resultado, exito, fallo } from '@core/models';
import { calcularCostos } from '@core/domain/costos';
import { validarDisponibilidad, validarMismoRestaurante } from '@core/domain/pedido.rules';

/** Línea del carrito: el producto elegido más el restaurante al que pertenece. */
export interface LineaCarrito extends ItemPedido {
  restauranteId: string;
}

/**
 * Carrito de compras del cliente (RN-01 a RN-03 y RN-06).
 * Vive en memoria: se vacía al cambiar de usuario o al registrar el pedido.
 * No tiene endpoint REST equivalente porque el carrito es estado del cliente, no del servidor.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _lineas = signal<LineaCarrito[]>([]);

  readonly lineas = this._lineas.asReadonly();
  readonly cantidadItems = computed(() => this._lineas().reduce((n, l) => n + l.cantidad, 0));
  /** Restaurante del carrito, o null si está vacío (RN-03). */
  readonly restauranteId = computed(() => this._lineas()[0]?.restauranteId ?? null);
  readonly costos = computed(() => calcularCostos(this._lineas()));

  /**
   * Agrega unidades de un producto. Si ya hay una línea igual (mismas opciones y notas) suma la cantidad.
   * Valida RN-01, RN-02 con la cantidad total resultante y RN-03.
   */
  agregar(
    producto: Producto,
    cantidad: number,
    opciones: OpcionProducto[] = [],
    notas = '',
  ): Resultado<LineaCarrito[]> {
    const existente = this._lineas().find((l) => this.mismaLinea(l, producto.id, opciones, notas));
    const errores = [
      ...validarMismoRestaurante(this.restauranteId(), producto),
      ...validarDisponibilidad(producto, (existente?.cantidad ?? 0) + cantidad),
    ];
    if (errores.length > 0) return fallo(errores);

    this._lineas.update((lineas) =>
      existente
        ? lineas.map((l) => (l === existente ? { ...l, cantidad: l.cantidad + cantidad } : l))
        : [
            ...lineas,
            {
              restauranteId: producto.restauranteId,
              productoId: producto.id,
              nombre: producto.nombre,
              emoji: producto.emoji,
              precioUnitario: producto.precio,
              opciones,
              notas,
              cantidad,
            },
          ],
    );
    return exito(this._lineas());
  }

  /** Cambia la cantidad de una línea validando RN-01 y RN-02 contra el producto vigente. */
  cambiarCantidad(indice: number, producto: Producto, cantidad: number): Resultado<LineaCarrito[]> {
    const errores = validarDisponibilidad(producto, cantidad);
    if (errores.length > 0) return fallo(errores);
    this._lineas.update((lineas) => lineas.map((l, i) => (i === indice ? { ...l, cantidad } : l)));
    return exito(this._lineas());
  }

  quitar(indice: number): void {
    this._lineas.update((lineas) => lineas.filter((_, i) => i !== indice));
  }

  vaciar(): void {
    this._lineas.set([]);
  }

  private mismaLinea(
    linea: LineaCarrito,
    productoId: string,
    opciones: OpcionProducto[],
    notas: string,
  ): boolean {
    const ids = (ops: OpcionProducto[]) =>
      ops
        .map((o) => o.id)
        .sort()
        .join(',');
    return (
      linea.productoId === productoId &&
      ids(linea.opciones) === ids(opciones) &&
      linea.notas === notas
    );
  }
}
