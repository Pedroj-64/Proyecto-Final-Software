import { Injectable, inject } from '@angular/core';
import { Pedido, Resultado, fallo } from '@core/models';
import { BaseDatosService } from './base-datos.service';

/** Esqueleto con el contrato de Brandon: registrar se agrega con la transacción completa. */
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly db = inject(BaseDatosService);

  obtener(id: string): Pedido | undefined {
    return this.db.pedidos().find((p) => p.id === id);
  }

  delCliente(clienteId: string): Pedido[] {
    return this.db.pedidos().filter((p) => p.clienteId === clienteId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cancelar(_pedidoId: string): Resultado<Pedido> {
    return fallo([{ regla: 'PENDIENTE', mensaje: 'Cancelar pedido aún no está implementado.' }]);
  }
}
