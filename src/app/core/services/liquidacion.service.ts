import { Injectable, inject } from '@angular/core';
import { Calificacion, Id, Liquidacion, Pedido, Resultado, exito, fallo } from '@core/models';
import { validarCalificacion } from '@core/domain/calificacion.rules';
import { calcularLiquidacion } from '@core/domain/liquidacion';
import { BaseDatosService } from './base-datos.service';
import { RELOJ } from './reloj';
import { SesionService } from './sesion.service';

/**
 * Casos de uso del proceso 4: liquidación del pedido y retroalimentación del cliente.
 * Endpoints REST equivalentes:
 * - liquidacion → GET /restaurantes/{id}/pedidos/{id}/liquidacion
 * - calificar → POST /pedidos/{id}/calificacion
 */
@Injectable({ providedIn: 'root' })
export class LiquidacionService {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);
  private readonly reloj = inject(RELOJ);

  /** RN-13: liquidación de un pedido entregado del restaurante en sesión. */
  liquidacion(pedidoId: Id): Resultado<Liquidacion> {
    const restauranteId = this.sesion.restaurante()?.id;
    const pedido = this.buscar(pedidoId);
    if (!restauranteId || pedido?.restauranteId !== restauranteId) {
      return fallo([{ regla: 'ESTADO', mensaje: 'El pedido no existe en tu restaurante.' }]);
    }
    if (pedido.estado !== 'ENTREGADO') {
      return fallo([{ regla: 'ESTADO', mensaje: 'Solo se liquidan pedidos entregados.' }]);
    }
    return exito(calcularLiquidacion(pedido));
  }

  /** RN-12: el cliente en sesión califica su pedido entregado, una única vez, de 1 a 5 estrellas. */
  calificar(pedidoId: string, datos: Omit<Calificacion, 'fecha'>): Resultado<Pedido> {
    const clienteId = this.sesion.cliente()?.id;
    const pedido = this.buscar(pedidoId);
    if (!clienteId || pedido?.clienteId !== clienteId) {
      return fallo([{ regla: 'ESTADO', mensaje: 'El pedido no existe en tu historial.' }]);
    }

    const errores = validarCalificacion(pedido, datos);
    if (errores.length > 0) return fallo(errores);

    const calificado: Pedido = {
      ...pedido,
      calificacion: {
        estrellasRestaurante: datos.estrellasRestaurante,
        comentarioRestaurante: datos.comentarioRestaurante.trim(),
        estrellasRepartidor: datos.estrellasRepartidor,
        comentarioRepartidor: datos.comentarioRepartidor.trim(),
        fecha: this.reloj().toISOString(),
      },
    };
    this.db.actualizarPedidos((pedidos) =>
      pedidos.map((p) => (p.id === pedidoId ? calificado : p)),
    );
    return exito(calificado);
  }

  private buscar(pedidoId: Id): Pedido | undefined {
    return this.db.pedidos().find((p) => p.id === pedidoId);
  }
}
