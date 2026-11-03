import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { calcularLiquidacion } from '@core/domain/costos';
import { Pedido } from '@core/models';
import { NotificacionService } from '@core/services/notificacion.service';
import { PedidoService } from '@core/services/pedido.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { EstadoPedidoPipe } from '@shared/pipes/estado-pedido.pipe';

/** Pedidos recibidos por el restaurante y acceso a su liquidación (proceso 4). */
@Component({
  selector: 'app-pedidos-restaurante',
  imports: [RouterLink, DatePipe, CopPipe, EstadoPedidoPipe, EstadoVacio],
  templateUrl: './pedidos-restaurante.html',
  styleUrl: './pedidos-restaurante.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosRestaurante {
  private readonly pedidosService = inject(PedidoService);
  private readonly sesion = inject(SesionService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly pedidos = computed(() =>
    this.pedidosService.delRestaurante(this.sesion.restaurante()?.id ?? ''),
  );

  /** Suma de lo que el restaurante recibe por los pedidos entregados. */
  protected readonly totalLiquidado = computed(() =>
    this.pedidos()
      .filter((p) => p.estado === 'ENTREGADO')
      .reduce((acc, p) => acc + calcularLiquidacion(p).totalRestaurante, 0),
  );

  protected cancelar(pedido: Pedido): void {
    const resultado = this.pedidosService.cancelar(pedido.id);
    if (resultado.ok) {
      this.notificaciones.mostrar(
        `Pedido ${pedido.codigo} cancelado. El stock fue devuelto.`,
        'info',
      );
    } else {
      this.notificaciones.mostrar(resultado.errores[0].mensaje, 'error');
    }
  }
}
