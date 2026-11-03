import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ErrorRegla, Pedido } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { EntregaService } from '@core/services/entrega.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { SesionService } from '@core/services/sesion.service';
import { ErroresRegla } from '@shared/components/errores-regla';
import { EstadoVacio } from '@shared/components/estado-vacio';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { EstadoPedidoPipe } from '@shared/pipes/estado-pedido.pipe';
import { rutaSegunEstado } from '../pedido-repartidor';

/** Proceso 3: pedidos pendientes que el repartidor en sesión puede aceptar o rechazar. */
@Component({
  selector: 'app-pedidos-disponibles',
  imports: [RouterLink, DatePipe, CopPipe, EstadoPedidoPipe, ErroresRegla, EstadoVacio],
  templateUrl: './pedidos-disponibles.html',
  styleUrl: './pedidos-disponibles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosDisponibles {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);
  private readonly entregas = inject(EntregaService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly router = inject(Router);

  private readonly repartidorId = computed(() => this.sesion.repartidor()?.id ?? '');
  protected readonly errores = signal<ErrorRegla[]>([]);

  /** RN-09: si ya tiene un pedido en curso se le muestra primero. */
  protected readonly activo = computed(() => this.entregas.activoDe(this.repartidorId()));
  protected readonly rutaActivo = computed(() => {
    const activo = this.activo();
    return activo ? rutaSegunEstado(activo) : null;
  });
  protected readonly disponibles = computed(() =>
    this.entregas.disponiblesPara(this.repartidorId()),
  );

  private readonly restaurantes = computed(
    () => new Map(this.db.restaurantes().map((r) => [r.id, r])),
  );

  protected restaurante(id: string) {
    return this.restaurantes().get(id);
  }

  protected unidades(pedido: Pedido): number {
    return pedido.items.reduce((acc, i) => acc + i.cantidad, 0);
  }

  protected aceptar(pedido: Pedido): void {
    const resultado = this.entregas.aceptar(pedido.id, this.repartidorId());
    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.errores.set([]);
    this.notificaciones.mostrar(`Aceptaste el pedido #${pedido.codigo}.`, 'exito');
    void this.router.navigate(rutaSegunEstado(resultado.valor));
  }

  protected rechazar(pedido: Pedido): void {
    const resultado = this.entregas.rechazar(pedido.id, this.repartidorId());
    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.errores.set([]);
    this.notificaciones.mostrar(`Descartaste el pedido #${pedido.codigo}.`, 'info');
  }
}
