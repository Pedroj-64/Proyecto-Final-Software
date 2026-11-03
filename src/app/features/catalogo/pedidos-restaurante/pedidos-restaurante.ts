import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '@core/services/pedido.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { EstadoPedidoPipe } from '@shared/pipes/estado-pedido.pipe';

/** Pedidos recibidos por el restaurante; los entregados enlazan a su liquidación (RN-13). */
@Component({
  selector: 'app-pedidos-restaurante',
  imports: [RouterLink, DatePipe, CopPipe, EstadoPedidoPipe, EstadoVacio],
  template: `
    <section class="pagina">
      <h1>Pedidos del restaurante</h1>
      @for (p of pedidos(); track p.id) {
        <article class="tarjeta">
          <div class="fila entre">
            <strong>#{{ p.codigo }}</strong>
            <span class="chip" [class.chip-exito]="p.estado === 'ENTREGADO'">{{
              p.estado | estadoPedido
            }}</span>
          </div>
          <span class="texto-suave"
            >{{ p.creadoEn | date: 'd MMM, h:mm a' }} · {{ p.items.length }} producto(s) ·
            {{ p.costos.total | cop }}</span
          >
          @if (p.estado === 'ENTREGADO') {
            <a [routerLink]="['/restaurante/pedidos', p.id, 'liquidacion']">Ver liquidación</a>
          }
        </article>
      } @empty {
        <app-estado-vacio
          icono="🧾"
          titulo="Aún no hay pedidos"
          descripcion="Los pedidos de tus clientes aparecerán aquí."
        />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosRestaurante {
  private readonly servicio = inject(PedidoService);
  private readonly sesion = inject(SesionService);

  /** Del más reciente al más antiguo. */
  protected readonly pedidos = computed(() =>
    [...this.servicio.delRestaurante(this.sesion.restaurante()?.id ?? '')].sort((a, b) =>
      b.creadoEn.localeCompare(a.creadoEn),
    ),
  );
}
