import { DesgloseCostos, ItemPedido } from '@core/models';
import { REGLAS } from './reglas';

/** Precio de una unidad incluyendo las opciones adicionales elegidas. */
export function precioUnitarioConOpciones(
  item: Pick<ItemPedido, 'precioUnitario' | 'opciones'>,
): number {
  return item.precioUnitario + item.opciones.reduce((acc, o) => acc + o.precioExtra, 0);
}

/** Total de una línea: precio unitario con opciones por cantidad. */
export function totalItem(
  item: Pick<ItemPedido, 'precioUnitario' | 'opciones' | 'cantidad'>,
): number {
  return precioUnitarioConOpciones(item) * item.cantidad;
}

/** Suma de los totales de todas las líneas del pedido. */
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
