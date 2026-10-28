import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { totalItem } from '@core/domain/costos';
import { BaseDatosService } from '@core/services/base-datos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { PedidoService } from '@core/services/pedido.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { SeguimientoPedido } from '@shared/components/seguimiento-pedido';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Pantalla de éxito y seguimiento del pedido (maqueta "Pantalla de éxito"). */
@Component({
  selector: 'app-confirmacion-pedido',
  imports: [RouterLink, DatePipe, CopPipe, EstadoVacio, SeguimientoPedido],
  templateUrl: './confirmacion-pedido.html',
  styleUrl: './confirmacion-pedido.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionPedido {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);
  private readonly pedidos = inject(PedidoService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly totalItem = totalItem;

  /** Id del pedido (parámetro de ruta). */
  readonly id = input.required<string>();

  /** Solo el cliente dueño puede ver su pedido. */
  protected readonly pedido = computed(() => {
    const pedido = this.pedidos.obtener(this.id());
    return pedido?.clienteId === this.sesion.cliente()?.id ? pedido : undefined;
  });
  protected readonly restaurante = computed(() =>
    this.db.restaurantes().find((r) => r.id === this.pedido()?.restauranteId),
  );
  protected readonly repartidor = computed(() =>
    this.db.repartidores().find((r) => r.id === this.pedido()?.repartidorId),
  );

  protected cancelar(): void {
    const resultado = this.pedidos.cancelar(this.id());
    this.notificaciones.mostrar(
      resultado.ok ? 'Pedido cancelado.' : resultado.errores[0].mensaje,
      resultado.ok ? 'info' : 'error',
    );
  }
}
