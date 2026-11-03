import { Calificacion, ErrorRegla, Pedido } from '@core/models';

/**
 * Regla de negocio del proceso 4, retroalimentación del cliente (RN-12).
 * Función pura: no depende de Angular ni de la base de datos.
 */

const ESTRELLAS_MIN = 1;
const ESTRELLAS_MAX = 5;

function estrellasValidas(valor: number): boolean {
  return Number.isInteger(valor) && valor >= ESTRELLAS_MIN && valor <= ESTRELLAS_MAX;
}

/** RN-12: solo se califican pedidos entregados, una única vez, de 1 a 5 estrellas. */
export function validarCalificacion(
  pedido: Pick<Pedido, 'estado' | 'calificacion'>,
  datos: Pick<Calificacion, 'estrellasRestaurante' | 'estrellasRepartidor'>,
): ErrorRegla[] {
  if (pedido.estado !== 'ENTREGADO') {
    return [{ regla: 'RN-12', mensaje: 'Solo puedes calificar un pedido entregado.' }];
  }
  if (pedido.calificacion) {
    return [{ regla: 'RN-12', mensaje: 'Este pedido ya fue calificado.' }];
  }

  const errores: ErrorRegla[] = [];
  if (!estrellasValidas(datos.estrellasRestaurante)) {
    errores.push({
      regla: 'RN-12',
      mensaje: `Califica al restaurante de ${ESTRELLAS_MIN} a ${ESTRELLAS_MAX} estrellas.`,
    });
  }
  if (!estrellasValidas(datos.estrellasRepartidor)) {
    errores.push({
      regla: 'RN-12',
      mensaje: `Califica al repartidor de ${ESTRELLAS_MIN} a ${ESTRELLAS_MAX} estrellas.`,
    });
  }
  return errores;
}
