import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorRegla } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { LiquidacionService } from '@core/services/liquidacion.service';
import { PedidoService } from '@core/services/pedido.service';
import { SesionService } from '@core/services/sesion.service';
import { ErroresRegla } from '@shared/components/errores-regla';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { SelectorEstrellas } from '@shared/components/selector-estrellas';

/**
 * Retroalimentación y calificación (proceso 4). Reemplaza la encuesta telefónica
 * de satisfacción del proceso manual.
 */
@Component({
  selector: 'app-calificacion',
  imports: [FormsModule, RouterLink, ErroresRegla, EstadoVacio, SelectorEstrellas],
  templateUrl: './calificacion.html',
  styleUrl: './calificacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalificacionPedido {
  private readonly router = inject(Router);
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);
  private readonly pedidos = inject(PedidoService);
  private readonly liquidacion = inject(LiquidacionService);
  private readonly notificaciones = inject(NotificacionService);

  /** Id del pedido (parámetro de ruta). */
  readonly id = input.required<string>();

  protected readonly estrellasRestaurante = signal(0);
  protected readonly comentarioRestaurante = signal('');
  protected readonly estrellasRepartidor = signal(0);
  protected readonly comentarioRepartidor = signal('');
  protected readonly errores = signal<ErrorRegla[]>([]);

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

  protected enviar(): void {
    const resultado = this.liquidacion.calificar(this.id(), {
      estrellasRestaurante: this.estrellasRestaurante(),
      comentarioRestaurante: this.comentarioRestaurante(),
      estrellasRepartidor: this.estrellasRepartidor(),
      comentarioRepartidor: this.comentarioRepartidor(),
    });
    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.notificaciones.mostrar('¡Gracias por calificar tu experiencia!', 'exito');
    void this.router.navigateByUrl('/cliente/pedidos');
  }
}
