import {
  Direccion,
  ErrorRegla,
  EstadoPedido,
  ItemPedido,
  MetodoPago,
  Pedido,
  Producto,
  Restaurante,
} from '@core/models';
import { calcularCostos } from './costos';
import { REGLAS } from './reglas';

/**
 * Reglas de negocio del proceso 2, "el cliente hace el pedido" (RN-01 a RN-08).
 * Son funciones puras: no dependen de Angular ni de la base de datos.
 */

/** Transiciones permitidas del ciclo de vida de un pedido. */
const TRANSICIONES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  PENDIENTE: ['ASIGNADO', 'CANCELADO'],
  ASIGNADO: ['EN_CAMINO', 'PENDIENTE', 'CANCELADO'],
  EN_CAMINO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

/** RN-01 y RN-02: el producto debe estar visible, con stock y dentro del tope por pedido. */
export function validarDisponibilidad(producto: Producto, cantidad: number): ErrorRegla[] {
  const errores: ErrorRegla[] = [];

  if (!producto.visible || producto.stock <= 0) {
    errores.push({ regla: 'RN-01', mensaje: `"${producto.nombre}" no está disponible.` });
    return errores;
  }
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    errores.push({ regla: 'RN-02', mensaje: 'La cantidad debe ser un entero mayor que cero.' });
  } else if (cantidad > producto.stock) {
    errores.push({
      regla: 'RN-02',
      mensaje: `Solo quedan ${producto.stock} unidades de "${producto.nombre}".`,
    });
  } else if (cantidad > REGLAS.MAX_UNIDADES_POR_PRODUCTO) {
    errores.push({
      regla: 'RN-02',
      mensaje: `Máximo ${REGLAS.MAX_UNIDADES_POR_PRODUCTO} unidades de "${producto.nombre}" por pedido.`,
    });
  }
  return errores;
}

/** RN-03: todos los productos del pedido deben ser del mismo restaurante. */
export function validarMismoRestaurante(
  restauranteDelCarrito: string | null,
  producto: Pick<Producto, 'restauranteId'>,
): ErrorRegla[] {
  if (restauranteDelCarrito === null || restauranteDelCarrito === producto.restauranteId) {
    return [];
  }
  return [
    {
      regla: 'RN-03',
      mensaje: 'Tu carrito tiene productos de otro restaurante. Vacíalo para pedir en este.',
    },
  ];
}

/** RN-05: la dirección debe estar en la ciudad donde reparte el restaurante. */
export function validarCobertura(
  direccion: Pick<Direccion, 'ciudad'>,
  restaurante: Pick<Restaurante, 'nombre' | 'ciudad'>,
): ErrorRegla[] {
  if (direccion.ciudad === restaurante.ciudad) return [];
  return [
    {
      regla: 'RN-05',
      mensaje: `${restaurante.nombre} solo reparte en ${restaurante.ciudad}.`,
    },
  ];
}

/**
 * RN-01 a RN-07: valida el pedido completo justo antes de registrarlo.
 * `productos` es el catálogo vigente, para detectar cambios de stock desde que se armó el carrito.
 */
export function validarPedido(
  items: readonly ItemPedido[],
  productos: readonly Producto[],
  restaurante: Pick<Restaurante, 'id' | 'nombre' | 'ciudad'>,
  direccion: Pick<Direccion, 'ciudad'>,
  metodoPago: Pick<MetodoPago, 'tipo'>,
  montoEfectivo: number | null,
): ErrorRegla[] {
  if (items.length === 0) {
    return [{ regla: 'RN-04', mensaje: 'El carrito está vacío.' }];
  }

  const errores: ErrorRegla[] = [];

  for (const item of items) {
    const producto = productos.find((p) => p.id === item.productoId);
    if (!producto) {
      errores.push({ regla: 'RN-01', mensaje: `"${item.nombre}" ya no existe en el menú.` });
      continue;
    }
    errores.push(...validarMismoRestaurante(restaurante.id, producto));
    errores.push(...validarDisponibilidad(producto, item.cantidad));
  }

  const costos = calcularCostos(items);
  if (costos.subtotal < REGLAS.SUBTOTAL_MINIMO) {
    errores.push({
      regla: 'RN-04',
      mensaje: `El subtotal mínimo es COP ${REGLAS.SUBTOTAL_MINIMO.toLocaleString('es-CO')}.`,
    });
  }

  errores.push(...validarCobertura(direccion, restaurante));

  if (metodoPago.tipo === 'EFECTIVO' && (montoEfectivo ?? 0) < costos.total) {
    errores.push({
      regla: 'RN-07',
      mensaje: `El efectivo entregado no cubre el total de COP ${costos.total.toLocaleString('es-CO')}.`,
    });
  }

  return errores;
}

/** Indica si el ciclo de vida del pedido permite pasar de un estado a otro. */
export function puedeTransicionar(desde: EstadoPedido, hacia: EstadoPedido): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/** Un pedido solo se cancela mientras no ha salido a la calle. */
export function puedeCancelar(estado: EstadoPedido): boolean {
  return puedeTransicionar(estado, 'CANCELADO');
}

/** Un pedido está en curso mientras no esté entregado ni cancelado (la usa RP-04 del catálogo). */
export function esPedidoActivo(pedido: Pick<Pedido, 'estado'>): boolean {
  return pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO';
}

/** Acepta "ue-102340", " UE102340 " o "102340" y devuelve "UE-102340". */
export function normalizarCodigo(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '');
  return digitos ? `UE-${digitos}` : '';
}
