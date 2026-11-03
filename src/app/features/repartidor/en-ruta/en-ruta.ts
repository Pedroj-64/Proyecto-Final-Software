import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { SeguimientoPedido } from '@shared/components/seguimiento-pedido';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { PedidoRepartidor } from '../pedido-repartidor';

/** El repartidor va hacia el cliente: destino, contacto y lo que debe cobrar. */
@Component({
  selector: 'app-en-ruta',
  imports: [RouterLink, CopPipe, EstadoVacio, SeguimientoPedido],
  templateUrl: './en-ruta.html',
  styleUrl: '../repartidor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnRuta extends PedidoRepartidor {
  /** Búsqueda de la dirección de entrega en Google Maps. */
  protected readonly mapa = computed(() => {
    const direccion = this.pedido()?.direccion;
    if (!direccion) return null;
    const consulta = encodeURIComponent(`${direccion.linea}, ${direccion.ciudad}, Colombia`);
    return `https://www.google.com/maps/search/?api=1&query=${consulta}`;
  });
}
