import { Liquidacion, Pedido } from '@core/models';
import { totalItem } from './costos';
import { REGLAS } from './reglas';

/**
 * Regla de negocio del proceso 4, liquidación del pedido (RN-13).
 * Función pura: no depende de Angular ni de la base de datos.
 */

/** RN-13: liquidación financiera del pedido para el restaurante y el repartidor. */
export function calcularLiquidacion(pedido: Pedido): Liquidacion {
  const subtotal = pedido.costos.subtotal;
  const comision = Math.round(subtotal * REGLAS.TASA_COMISION_APP);
  const ivaComision = Math.round(comision * REGLAS.TASA_IVA_COMISION);
  return {
    pedidoCodigo: pedido.codigo,
    items: pedido.items.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      total: totalItem(i),
    })),
    subtotal,
    comision,
    ivaComision,
    totalRestaurante: subtotal - comision - ivaComision,
    pagoRepartidor: pedido.costos.envio,
  };
}
