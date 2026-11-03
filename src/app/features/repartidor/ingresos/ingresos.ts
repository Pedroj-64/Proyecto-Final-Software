import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { calcularLiquidacion } from '@core/domain/liquidacion';
import { BaseDatosService } from '@core/services/base-datos.service';
import { EntregaService } from '@core/services/entrega.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** RN-13: lo que ha ganado el repartidor en sesión (el envío de cada pedido entregado). */
@Component({
  selector: 'app-ingresos',
  imports: [RouterLink, DatePipe, CopPipe, EstadoVacio],
  templateUrl: './ingresos.html',
  styleUrl: './ingresos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ingresos {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);
  private readonly entregasService = inject(EntregaService);

  private readonly restaurantes = computed(
    () => new Map(this.db.restaurantes().map((r) => [r.id, r.nombre])),
  );

  protected readonly entregas = computed(() =>
    this.entregasService.entregadosPor(this.sesion.repartidor()?.id ?? '').map((pedido) => ({
      pedido,
      restaurante: this.restaurantes().get(pedido.restauranteId) ?? '',
      fecha: pedido.entrega?.fecha ?? pedido.creadoEn,
      pago: calcularLiquidacion(pedido).pagoRepartidor,
    })),
  );

  protected readonly total = computed(() => this.entregas().reduce((acc, e) => acc + e.pago, 0));
}
