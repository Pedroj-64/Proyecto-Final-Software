import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ErroresRegla } from '@shared/components/errores-regla';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { PedidoRepartidor } from '../pedido-repartidor';

/** RN-10: el repartidor confirma la recogida en el restaurante con el código del pedido. */
@Component({
  selector: 'app-recogida',
  imports: [FormsModule, RouterLink, ErroresRegla, EstadoVacio],
  templateUrl: './recogida.html',
  styleUrl: '../repartidor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Recogida extends PedidoRepartidor {
  protected readonly codigo = signal('');

  protected readonly unidades = computed(
    () => this.pedido()?.items.reduce((acc, i) => acc + i.cantidad, 0) ?? 0,
  );

  protected confirmar(): void {
    this.ejecutar(
      this.entregas.confirmarRecogida(this.id(), this.repartidorId(), this.codigo()),
      'Pedido recogido. ¡En camino!',
    );
  }
}
