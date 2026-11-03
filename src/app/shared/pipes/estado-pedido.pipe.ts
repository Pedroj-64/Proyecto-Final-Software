import { Pipe, PipeTransform } from '@angular/core';
import { EstadoPedido } from '@core/models';

/** Texto en español de cada estado del pedido. */
export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  ASIGNADO: 'Preparación',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

/** Muestra el estado del pedido en español: `{{ pedido.estado | estadoPedido }}`. */
@Pipe({ name: 'estadoPedido' })
export class EstadoPedidoPipe implements PipeTransform {
  transform(estado: EstadoPedido): string {
    return ETIQUETAS_ESTADO[estado];
  }
}
