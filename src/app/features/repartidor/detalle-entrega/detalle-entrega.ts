import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { calcularCambio, totalItem } from '@core/domain/costos';
import { ErroresRegla } from '@shared/components/errores-regla';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { SeguimientoPedido } from '@shared/components/seguimiento-pedido';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { PedidoRepartidor, rutaSegunEstado } from '../pedido-repartidor';

/** Detalle del pedido para el repartidor: dónde recoger, a quién entregar y cuánto cobrar. */
@Component({
  selector: 'app-detalle-entrega',
  imports: [RouterLink, CopPipe, ErroresRegla, EstadoVacio, SeguimientoPedido],
  templateUrl: './detalle-entrega.html',
  styleUrl: './detalle-entrega.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleEntrega extends PedidoRepartidor {
  protected readonly totalItem = totalItem;

  /** RN-07: cambio que debe llevar el repartidor si el cliente paga en efectivo. */
  protected readonly cambio = computed(() => {
    const p = this.pedido();
    return p?.metodoPago.tipo === 'EFECTIVO' && p.montoEfectivo !== null
      ? calcularCambio(p.costos.total, p.montoEfectivo)
      : null;
  });

  /** Ruta para continuar si el pedido ya está asignado o en camino. */
  protected readonly continuar = computed(() => {
    const p = this.pedido();
    return p && (p.estado === 'ASIGNADO' || p.estado === 'EN_CAMINO') ? rutaSegunEstado(p) : null;
  });

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
