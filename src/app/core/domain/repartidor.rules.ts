import { ErrorRegla, EvidenciaEntrega, Id, Pedido } from '@core/models';
import { esPedidoActivo, normalizarCodigo } from './pedido.rules';

/**
 * Reglas de negocio del proceso 3, despacho con repartidores (RN-09 a RN-11).
 * Son funciones puras: no dependen de Angular ni de la base de datos.
 */

/** RN-09: indica si el repartidor ya tiene un pedido asignado o en camino. */
export function tienePedidoActivo(
  repartidorId: Id,
  pedidos: readonly Pick<Pedido, 'repartidorId' | 'estado'>[],
): boolean {
  return pedidos.some((p) => p.repartidorId === repartidorId && esPedidoActivo(p));
}

/** Datos del pedido que deciden si se le puede ofrecer a un repartidor. */
type PedidoOfrecible = Pick<Pedido, 'estado' | 'repartidorId' | 'repartidoresQueRechazaron'>;

/** El pedido está pendiente, sin repartidor, y este repartidor no lo ha rechazado. */
export function estaDisponiblePara(pedido: PedidoOfrecible, repartidorId: Id): boolean {
  return (
    pedido.estado === 'PENDIENTE' &&
    pedido.repartidorId === null &&
    !pedido.repartidoresQueRechazaron.includes(repartidorId)
  );
}

/**
 * RN-09: un repartidor solo acepta un pedido disponible para él y si no tiene otro activo.
 * `pedidos` es la lista completa, para buscar el pedido activo del repartidor.
 */
export function validarAceptacion(
  repartidorId: Id,
  pedido: PedidoOfrecible,
  pedidos: readonly Pick<Pedido, 'repartidorId' | 'estado'>[],
): ErrorRegla[] {
  if (!estaDisponiblePara(pedido, repartidorId)) {
    const mensaje = pedido.repartidoresQueRechazaron.includes(repartidorId)
      ? 'Ya rechazaste este pedido.'
      : 'El pedido ya no está disponible.';
    return [{ regla: 'ESTADO', mensaje }];
  }
  if (tienePedidoActivo(repartidorId, pedidos)) {
    return [
      {
        regla: 'RN-09',
        mensaje: 'Ya tienes un pedido activo. Entrégalo antes de aceptar otro.',
      },
    ];
  }
  return [];
}

/** RN-10: la recogida exige el código del pedido (acepta "ue-102340", "102340", etc.). */
export function validarCodigoRecogida(
  pedido: Pick<Pedido, 'codigo'>,
  entrada: string,
): ErrorRegla[] {
  const codigo = normalizarCodigo(entrada);
  if (!codigo) {
    return [{ regla: 'RN-10', mensaje: 'Ingresa el código del pedido para recogerlo.' }];
  }
  if (codigo !== pedido.codigo) {
    return [{ regla: 'RN-10', mensaje: 'El código no coincide con el del pedido.' }];
  }
  return [];
}

/** RN-11: la entrega exige la firma del cliente, o una foto si la entrega es sin contacto. */
export function validarEvidenciaEntrega(
  evidencia: Pick<EvidenciaEntrega, 'sinContacto' | 'firma' | 'foto'>,
): ErrorRegla[] {
  if (evidencia.sinContacto) {
    return evidencia.foto?.trim()
      ? []
      : [{ regla: 'RN-11', mensaje: 'Adjunta una foto de la entrega sin contacto.' }];
  }
  return evidencia.firma?.trim()
    ? []
    : [{ regla: 'RN-11', mensaje: 'Se necesita la firma del cliente para entregar.' }];
}
