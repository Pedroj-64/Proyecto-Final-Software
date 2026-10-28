import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseDatosService } from '@core/services/base-datos.service';
import { PedidoService } from '@core/services/pedido.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { EstadoPedidoPipe } from '@shared/pipes/estado-pedido.pipe';

/** Historial de pedidos del cliente. */
@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink, DatePipe, CopPipe, EstadoPedidoPipe, EstadoVacio],
  template: `
    <section class="pagina">
      <h1>Mis pedidos</h1>
      @for (p of pedidos(); track p.id) {
        <a class="tarjeta pedido" [routerLink]="['/cliente/pedidos', p.id]">
          <div class="fila entre">
            <strong>#{{ p.codigo }} · {{ nombreRestaurante(p.restauranteId) }}</strong>
            <span class="chip" [class.chip-exito]="p.estado === 'ENTREGADO'">{{
              p.estado | estadoPedido
            }}</span>
          </div>
          <span class="texto-suave"
            >{{ p.creadoEn | date: 'd MMM, h:mm a' }} · {{ p.costos.total | cop }}</span
          >
          @if (p.estado === 'ENTREGADO' && !p.calificacion) {
            <span class="chip">⭐ Pendiente por calificar</span>
          }
        </a>
      } @empty {
        <app-estado-vacio
          icono="🧾"
          titulo="Aún no tienes pedidos"
          descripcion="Tu historial aparecerá aquí."
        >
          <a class="btn btn-primario" routerLink="/cliente/restaurantes">Hacer mi primer pedido</a>
        </app-estado-vacio>
      }
    </section>
  `,
  styles: `
    .pedido {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      text-decoration: none;
      color: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisPedidos {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);
  private readonly pedidosService = inject(PedidoService);

  protected readonly pedidos = computed(() =>
    this.pedidosService.delCliente(this.sesion.cliente()?.id ?? ''),
  );
  private readonly nombres = computed(
    () => new Map(this.db.restaurantes().map((r) => [r.id, r.nombre])),
  );

  protected nombreRestaurante(id: string): string {
    return this.nombres().get(id) ?? '';
  }
}
