import { Injectable, inject } from '@angular/core';
import { Direccion, MetodoPago, Pedido, Resultado, exito, fallo } from '@core/models';
import { calcularCostos } from '@core/domain/costos';
import { puedeCancelar, validarPedido } from '@core/domain/pedido.rules';
import { BaseDatosService } from './base-datos.service';
import { CarritoService } from './carrito.service';
import { RELOJ } from './reloj';
import { SesionService } from './sesion.service';

/** Datos del checkout que el cliente elige antes de confirmar. */
export interface DatosCheckout {
  direccion: Direccion;
  metodoPago: MetodoPago;
  /** Efectivo entregado; solo aplica si el método de pago es EFECTIVO (RN-07). */
  montoEfectivo: number | null;
}

/**
 * Casos de uso del pedido del cliente (proceso 2).
 * Endpoints REST equivalentes:
 * - registrar → POST /pedidos
 * - obtener → GET /pedidos/{id}
 * - delCliente → GET /clientes/{id}/pedidos
 * - delRestaurante → GET /restaurantes/{id}/pedidos
 * - cancelar → POST /pedidos/{id}/cancelacion
 */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly db = inject(BaseDatosService);
  private readonly carrito = inject(CarritoService);
  private readonly sesion = inject(SesionService);
  private readonly reloj = inject(RELOJ);

  /**
   * Registra el pedido del carrito (RN-01 a RN-08).
   * RN-08: en una sola transacción descuenta el stock y crea el pedido con código único.
   */
  registrar(datos: DatosCheckout): Resultado<Pedido> {
    const cliente = this.sesion.cliente();
    const restaurante = this.db.restaurantes().find((r) => r.id === this.carrito.restauranteId());
    if (!cliente || !restaurante) {
      return fallo([{ regla: 'RN-04', mensaje: 'Inicia sesión y agrega productos al carrito.' }]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const items = this.carrito.lineas().map(({ restauranteId: _, ...item }) => item);
    const errores = validarPedido(
      items,
      this.db.productos(),
      restaurante,
      datos.direccion,
      datos.metodoPago,
      datos.montoEfectivo,
    );
    if (errores.length > 0) return fallo(errores);

    const ahora = this.reloj().toISOString();
    const pedidos = this.db.pedidos();
    const siguiente =
      pedidos.reduce((max, p) => Math.max(max, Number(p.codigo.slice(3))), 100000) + 1;
    const pedido: Pedido = {
      id: `ped${pedidos.length + 1}`,
      codigo: `UE-${siguiente}`,
      clienteId: cliente.id,
      restauranteId: restaurante.id,
      repartidorId: null,
      repartidoresQueRechazaron: [],
      items,
      direccion: datos.direccion,
      metodoPago: datos.metodoPago,
      montoEfectivo: datos.metodoPago.tipo === 'EFECTIVO' ? datos.montoEfectivo : null,
      costos: calcularCostos(items),
      estado: 'PENDIENTE',
      creadoEn: ahora,
      historial: [{ estado: 'PENDIENTE', fecha: ahora }],
      entrega: null,
      calificacion: null,
    };

    this.db.transaccion((estado) => ({
      productos: estado.productos.map((p) => {
        const comprado = items.find((i) => i.productoId === p.id);
        return comprado ? { ...p, stock: p.stock - comprado.cantidad } : p;
      }),
      pedidos: [...estado.pedidos, pedido],
    }));
    this.carrito.vaciar();
    return exito(pedido);
  }

  obtener(id: string): Pedido | undefined {
    return this.db.pedidos().find((p) => p.id === id);
  }

  delCliente(clienteId: string): Pedido[] {
    return this.db.pedidos().filter((p) => p.clienteId === clienteId);
  }

  delRestaurante(restauranteId: string): Pedido[] {
    return this.db.pedidos().filter((p) => p.restauranteId === restauranteId);
  }

  /** Cancela un pedido que aún no salió a la calle y devuelve las unidades al stock. */
  cancelar(pedidoId: string): Resultado<Pedido> {
    const pedido = this.obtener(pedidoId);
    if (!pedido) {
      return fallo([{ regla: 'ESTADO', mensaje: 'El pedido no existe.' }]);
    }
    if (!puedeCancelar(pedido.estado)) {
      return fallo([
        { regla: 'ESTADO', mensaje: 'Solo se cancela un pedido pendiente o asignado.' },
      ]);
    }

    const cancelado: Pedido = {
      ...pedido,
      estado: 'CANCELADO',
      historial: [...pedido.historial, { estado: 'CANCELADO', fecha: this.reloj().toISOString() }],
    };
    this.db.transaccion((estado) => ({
      productos: estado.productos.map((p) => {
        const devuelto = pedido.items.find((i) => i.productoId === p.id);
        return devuelto ? { ...p, stock: p.stock + devuelto.cantidad } : p;
      }),
      pedidos: estado.pedidos.map((x) => (x.id === pedidoId ? cancelado : x)),
    }));
    return exito(cancelado);
  }
}
