import { Injectable } from '@angular/core';
import { Calificacion, Pedido, Resultado, fallo } from '@core/models';

/** Esqueleto con el contrato de María José: calificar (RN-12) y liquidacion (RN-13). */
@Injectable({ providedIn: 'root' })
export class LiquidacionService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calificar(_pedidoId: string, _datos: Omit<Calificacion, 'fecha'>): Resultado<Pedido> {
    return fallo([{ regla: 'PENDIENTE', mensaje: 'Calificar aún no está implementado.' }]);
  }
}
