import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { totalItem } from '@core/domain/costos';
import { ErroresRegla } from '@shared/components/errores-regla';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { SeguimientoPedido } from '@shared/components/seguimiento-pedido';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { PedidoRepartidor } from '../pedido-repartidor';

/** Detalle del pedido para el repartidor: dónde recoger, a quién entregar y cuánto cobrar. */
@Component({
  selector: 'app-detalle-entrega',
  imports: [RouterLink, CopPipe, ErroresRegla, EstadoVacio, SeguimientoPedido],
  templateUrl: './detalle-entrega.html',
  styleUrl: '../repartidor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleEntrega extends PedidoRepartidor {
  protected readonly totalItem = totalItem;

  protected aceptar(): void {
    this.ejecutar(
      this.entregas.aceptar(this.id(), this.repartidorId()),
      `Aceptaste el pedido #${this.pedido()?.codigo}.`,
    );
  }

  /** Pendiente: lo descarta. Asignado: lo devuelve para que lo tome otro repartidor. */
  protected rechazar(): void {
    const devolver = this.pedido()?.estado === 'ASIGNADO';
    this.ejecutar(
      this.entregas.rechazar(this.id(), this.repartidorId()),
      devolver ? 'Devolviste el pedido.' : 'Descartaste el pedido.',
      () => ['/repartidor/pedidos'],
    );
  }
}
