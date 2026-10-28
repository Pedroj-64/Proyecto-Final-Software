import { DesgloseCostos, ItemPedido, Liquidacion, Pedido } from '@core/models';
import { REGLAS } from './reglas';

/** Precio de una unidad incluyendo las opciones adicionales elegidas. */
export function precioUnitarioConOpciones(
  item: Pick<ItemPedido, 'precioUnitario' | 'opciones'>,
): number {
  return item.precioUnitario + item.opciones.reduce((acc, o) => acc + o.precioExtra, 0);
}

export function totalItem(
  item: Pick<ItemPedido, 'precioUnitario' | 'opciones' | 'cantidad'>,
): number {
  return precioUnitarioConOpciones(item) * item.cantidad;
}

export function calcularSubtotal(items: readonly ItemPedido[]): number {
  return items.reduce((acc, item) => acc + totalItem(item), 0);
}

/** RN-06: desglose de costos del pedido. */
export function calcularCostos(items: readonly ItemPedido[]): DesgloseCostos {
  const subtotal = calcularSubtotal(items);
  if (subtotal === 0) {
    return { subtotal: 0, envio: 0, impuestos: 0, total: 0 };
  }
  const envio = REGLAS.COSTO_ENVIO;
  const impuestos = Math.round(subtotal * REGLAS.TASA_IMPUESTO_CONSUMO);
  return { subtotal, envio, impuestos, total: subtotal + envio + impuestos };
}

/** RN-07: cambio a devolver cuando el cliente paga en efectivo. */
export function calcularCambio(total: number, montoEfectivo: number): number {
  return Math.max(0, montoEfectivo - total);
}

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
