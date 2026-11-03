import { Injectable, inject } from '@angular/core';
import { EstadoPedido, EvidenciaEntrega, Id, Pedido, Resultado, exito, fallo } from '@core/models';
import { esPedidoActivo, puedeTransicionar } from '@core/domain/pedido.rules';
import {
  estaDisponiblePara,
  validarAceptacion,
  validarCodigoRecogida,
  validarEvidenciaEntrega,
} from '@core/domain/repartidor.rules';
import { BaseDatosService } from './base-datos.service';
import { RELOJ } from './reloj';

/** Datos que el repartidor captura al entregar; la fecha la pone el servicio. */
export type DatosEntrega = Omit<EvidenciaEntrega, 'fecha'>;

/**
 * Casos de uso del despacho con repartidores (proceso 3, RN-09 a RN-11).
 * Endpoints REST equivalentes:
 * - disponiblesPara → GET /repartidores/{id}/pedidos-disponibles
 * - activoDe → GET /repartidores/{id}/pedido-activo
 * - entregadosPor → GET /repartidores/{id}/entregas
 * - aceptar → POST /pedidos/{id}/asignacion
 * - rechazar → POST /pedidos/{id}/rechazo
 * - confirmarRecogida → POST /pedidos/{id}/recogida
 * - confirmarEntrega → POST /pedidos/{id}/entrega
 */
@Injectable({ providedIn: 'root' })
export class EntregaService {
  private readonly db = inject(BaseDatosService);
  private readonly reloj = inject(RELOJ);

  /** Pedidos pendientes, sin repartidor, que este repartidor no ha rechazado. */
  disponiblesPara(repartidorId: Id): Pedido[] {
    return this.db.pedidos().filter((p) => estaDisponiblePara(p, repartidorId));
  }

  /** RN-09: el único pedido asignado o en camino del repartidor, si lo tiene. */
  activoDe(repartidorId: Id): Pedido | undefined {
    return this.db.pedidos().find((p) => p.repartidorId === repartidorId && esPedidoActivo(p));
  }

  /** Pedidos entregados por el repartidor, del más reciente al más antiguo. */
  entregadosPor(repartidorId: Id): Pedido[] {
    return this.db
      .pedidos()
      .filter((p) => p.repartidorId === repartidorId && p.estado === 'ENTREGADO')
      .sort((a, b) => fechaEntrega(b).localeCompare(fechaEntrega(a)));
  }

  /** RN-09: asigna un pedido pendiente al repartidor si no tiene otro activo. */
  aceptar(pedidoId: Id, repartidorId: Id): Resultado<Pedido> {
    const pedido = this.buscar(pedidoId);
    if (!pedido) return noExiste();

    const errores = validarAceptacion(repartidorId, pedido, this.db.pedidos());
    if (errores.length > 0) return fallo(errores);
    return exito(this.cambiarEstado(pedido, 'ASIGNADO', { repartidorId }));
  }

  /**
   * El repartidor descarta un pedido y deja de ofrecérsele.
   * - Pendiente: solo queda anotado en `repartidoresQueRechazaron`.
   * - Ya aceptado por él (sin recoger): además vuelve a PENDIENTE para que lo tome otro.
   */
  rechazar(pedidoId: Id, repartidorId: Id): Resultado<Pedido> {
    const pedido = this.buscar(pedidoId);
    if (!pedido) return noExiste();

    const repartidoresQueRechazaron = pedido.repartidoresQueRechazaron.includes(repartidorId)
      ? pedido.repartidoresQueRechazaron
      : [...pedido.repartidoresQueRechazaron, repartidorId];

    if (pedido.estado === 'PENDIENTE' && pedido.repartidorId === null) {
      const rechazado: Pedido = { ...pedido, repartidoresQueRechazaron };
      this.reemplazar(rechazado);
      return exito(rechazado);
    }
    if (pedido.estado === 'ASIGNADO' && pedido.repartidorId === repartidorId) {
      return exito(
        this.cambiarEstado(pedido, 'PENDIENTE', { repartidorId: null, repartidoresQueRechazaron }),
      );
    }
    return fallo([{ regla: 'ESTADO', mensaje: 'Ya no puedes rechazar este pedido.' }]);
  }

  /** RN-10: con el código del pedido, el repartidor lo recoge y sale en camino. */
  confirmarRecogida(pedidoId: Id, repartidorId: Id, codigo: string): Resultado<Pedido> {
    const propio = this.propio(pedidoId, repartidorId, 'ASIGNADO');
    if (!propio.ok) return propio;

    const errores = validarCodigoRecogida(propio.valor, codigo);
    if (errores.length > 0) return fallo(errores);
    return exito(this.cambiarEstado(propio.valor, 'EN_CAMINO'));
  }

  /** RN-11: con la firma (o la foto si es sin contacto) el pedido queda entregado. */
  confirmarEntrega(pedidoId: Id, repartidorId: Id, datos: DatosEntrega): Resultado<Pedido> {
    const propio = this.propio(pedidoId, repartidorId, 'EN_CAMINO');
    if (!propio.ok) return propio;

    const errores = validarEvidenciaEntrega(datos);
    if (errores.length > 0) return fallo(errores);

    const entrega: EvidenciaEntrega = {
      sinContacto: datos.sinContacto,
      firma: datos.sinContacto ? null : (datos.firma?.trim() ?? null),
      foto: datos.sinContacto ? (datos.foto?.trim() ?? null) : null,
      fecha: this.ahora(),
    };
    return exito(this.cambiarEstado(propio.valor, 'ENTREGADO', { entrega }));
  }

  private buscar(pedidoId: Id): Pedido | undefined {
    return this.db.pedidos().find((p) => p.id === pedidoId);
  }

  /** El pedido existe, es del repartidor y está en el estado que exige la acción. */
  private propio(pedidoId: Id, repartidorId: Id, estado: EstadoPedido): Resultado<Pedido> {
    const pedido = this.buscar(pedidoId);
    if (!pedido || pedido.repartidorId !== repartidorId) return noExiste();
    if (pedido.estado !== estado) {
      return fallo([{ regla: 'ESTADO', mensaje: 'Esta acción no aplica al estado del pedido.' }]);
    }
    return exito(pedido);
  }

  /** Cambia el estado respetando el ciclo de vida y lo anota en el historial. */
  private cambiarEstado(
    pedido: Pedido,
    hacia: EstadoPedido,
    cambios: Partial<Pedido> = {},
  ): Pedido {
    if (!puedeTransicionar(pedido.estado, hacia)) {
      throw new Error(`Transición inválida: ${pedido.estado} → ${hacia}`);
    }
    const actualizado: Pedido = {
      ...pedido,
      ...cambios,
      estado: hacia,
      historial: [...pedido.historial, { estado: hacia, fecha: this.ahora() }],
    };
    this.reemplazar(actualizado);
    return actualizado;
  }

  private reemplazar(pedido: Pedido): void {
    this.db.actualizarPedidos((pedidos) => pedidos.map((p) => (p.id === pedido.id ? pedido : p)));
  }

  private ahora(): string {
    return this.reloj().toISOString();
  }
}

function noExiste(): Resultado<Pedido> {
  return fallo([{ regla: 'ESTADO', mensaje: 'El pedido no existe o no está asignado a ti.' }]);
}

function fechaEntrega(pedido: Pedido): string {
  return pedido.entrega?.fecha ?? pedido.creadoEn;
}
