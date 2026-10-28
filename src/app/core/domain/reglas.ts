/**
 * Parámetros de las reglas de negocio de Urban Eats.
 * Centralizarlos aquí evita "números mágicos" repartidos por la aplicación.
 */
export const REGLAS = {
  /** RN-02: unidades máximas de un mismo producto por pedido. */
  MAX_UNIDADES_POR_PRODUCTO: 10,
  /** RN-04: subtotal mínimo para registrar un pedido (COP). */
  SUBTOTAL_MINIMO: 15_000,
  /** RN-06: costo fijo de envío (COP). */
  COSTO_ENVIO: 5_000,
  /** RN-06: impuesto al consumo sobre el subtotal. */
  TASA_IMPUESTO_CONSUMO: 0.08,
  /** RN-13: comisión de la plataforma sobre el subtotal del pedido. */
  TASA_COMISION_APP: 0.1,
  /** RN-13: IVA aplicado sobre la comisión de la plataforma. */
  TASA_IVA_COMISION: 0.19,
  /** RP-02: el precio debe ser múltiplo de este valor (COP). */
  MULTIPLO_PRECIO: 50,
  /** RP-03: stock máximo registrable por producto. */
  STOCK_MAXIMO: 999,
} as const;

/** Catálogo de reglas para mostrar mensajes y documentar la trazabilidad. */
export const CATALOGO_REGLAS: Record<string, string> = {
  'RN-01': 'Solo se pueden pedir productos visibles y con stock disponible.',
  'RN-02': `La cantidad pedida no puede superar el stock ni ${REGLAS.MAX_UNIDADES_POR_PRODUCTO} unidades por producto.`,
  'RN-03': 'Un pedido solo puede contener productos de un mismo restaurante.',
  'RN-04': `El subtotal mínimo de un pedido es COP ${REGLAS.SUBTOTAL_MINIMO.toLocaleString('es-CO')}.`,
  'RN-05': 'La dirección de entrega debe estar en la zona de cobertura del restaurante.',
  'RN-06': 'Total = subtotal + envío + impuesto al consumo (8 %).',
  'RN-07': 'Si el pago es en efectivo, el monto entregado debe cubrir el total.',
  'RN-08': 'Al confirmar se descuenta el stock y se genera un código de pedido único.',
  'RN-09': 'Un repartidor solo puede tener un pedido activo a la vez.',
  'RN-10': 'La recogida exige el código del pedido.',
  'RN-11': 'La entrega exige la firma del cliente o una foto si es sin contacto.',
  'RN-12': 'Solo se califican pedidos entregados, una única vez, de 1 a 5 estrellas.',
  'RN-13':
    'Liquidación: comisión del 10 % + IVA del 19 % sobre la comisión; el envío es para el repartidor.',
  'RP-01': 'El nombre del producto es obligatorio (3 a 60 caracteres) y único en el restaurante.',
  'RP-02': `El precio es un entero positivo y múltiplo de COP ${REGLAS.MULTIPLO_PRECIO}.`,
  'RP-03': `El stock es un entero entre 0 y ${REGLAS.STOCK_MAXIMO}.`,
  'RP-04': 'No se elimina un producto incluido en un pedido en curso.',
};
