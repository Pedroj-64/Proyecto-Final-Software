import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErroresRegla } from '@shared/components/errores-regla';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { PadFirma } from '@shared/components/pad-firma';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { PedidoRepartidor } from '../pedido-repartidor';
import { crearMiniatura } from './miniatura';

/**
 * RN-11: el repartidor confirma la entrega con la firma del cliente o,
 * si la entrega es sin contacto, con una foto (guardada como miniatura).
 */
@Component({
  selector: 'app-confirmar-entrega',
  imports: [RouterLink, CopPipe, ErroresRegla, EstadoVacio, PadFirma],
  templateUrl: './confirmar-entrega.html',
  styleUrls: ['../repartidor.scss', './confirmar-entrega.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmarEntrega extends PedidoRepartidor {
  protected readonly sinContacto = signal(false);
  protected readonly firma = signal<string | null>(null);
  protected readonly foto = signal<string | null>(null);
  protected readonly procesandoFoto = signal(false);
  protected readonly errorFoto = signal<string | null>(null);

  /** Al cambiar de modo se descarta la evidencia del otro, que ya no está a la vista. */
  protected cambiarModo(evento: Event): void {
    this.sinContacto.set((evento.target as HTMLInputElement).checked);
    this.firma.set(null);
    this.foto.set(null);
    this.errorFoto.set(null);
    this.errores.set([]);
  }

  /** Nueva evidencia: los errores RN-11 de un intento anterior dejan de aplicar. */
  protected cambiarFirma(firma: string | null): void {
    this.firma.set(firma);
    this.errores.set([]);
  }

  protected async elegirFoto(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    this.procesandoFoto.set(true);
    this.errorFoto.set(null);
    try {
      this.foto.set(await crearMiniatura(archivo));
      this.errores.set([]);
    } catch (error) {
      this.foto.set(null);
      this.errorFoto.set(error instanceof Error ? error.message : 'No se pudo usar la foto.');
    } finally {
      this.procesandoFoto.set(false);
    }
  }

  protected quitarFoto(): void {
    this.foto.set(null);
    this.errores.set([]);
  }

  protected confirmar(): void {
    this.ejecutar(
      this.entregas.confirmarEntrega(this.id(), this.repartidorId(), {
        sinContacto: this.sinContacto(),
        firma: this.firma(),
        foto: this.foto(),
      }),
      '¡Pedido entregado!',
      () => ['/repartidor/pedidos'],
    );
  }
}
