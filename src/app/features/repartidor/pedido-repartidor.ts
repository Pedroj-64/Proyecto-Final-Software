import { Directive, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorRegla, Pedido, Resultado } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { EntregaService } from '@core/services/entrega.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { PedidoService } from '@core/services/pedido.service';
import { SesionService } from '@core/services/sesion.service';

/** Pantalla del flujo del repartidor que corresponde al estado actual del pedido. */
export function rutaSegunEstado(pedido: Pick<Pedido, 'id' | 'estado'>): string[] {
  const base = ['/repartidor/pedidos', pedido.id];
  switch (pedido.estado) {
    case 'ASIGNADO':
      return [...base, 'recogida'];
    case 'EN_CAMINO':
      return [...base, 'en-ruta'];
    default:
      return base;
  }
}

/**
 * Base de las pantallas del repartidor que trabajan sobre un pedido (`/repartidor/pedidos/:id/...`).
 * Reúne el pedido de la ruta, sus datos relacionados, los errores de regla y la forma de
 * ejecutar una acción de EntregaService con el repartidor en sesión.
 */
@Directive()
export abstract class PedidoRepartidor {
  protected readonly db = inject(BaseDatosService);
  protected readonly sesion = inject(SesionService);
  protected readonly entregas = inject(EntregaService);
  protected readonly notificaciones = inject(NotificacionService);
  private readonly pedidos = inject(PedidoService);
  private readonly router = inject(Router);

  /** Id del pedido (parámetro de ruta). */
  readonly id = input.required<string>();

  protected readonly errores = signal<ErrorRegla[]>([]);
  protected readonly repartidorId = computed(() => this.sesion.repartidor()?.id ?? '');

  /** El pedido solo es visible si está disponible para este repartidor o asignado a él. */
  protected readonly pedido = computed(() => {
    const pedido = this.pedidos.obtener(this.id());
    const repartidorId = this.repartidorId();
    if (!pedido || !repartidorId) return undefined;
    if (pedido.repartidorId === repartidorId) return pedido;
    const disponible =
      pedido.estado === 'PENDIENTE' &&
      pedido.repartidorId === null &&
      !pedido.repartidoresQueRechazaron.includes(repartidorId);
    return disponible ? pedido : undefined;
  });

  protected readonly restaurante = computed(() =>
    this.db.restaurantes().find((r) => r.id === this.pedido()?.restauranteId),
  );
  protected readonly cliente = computed(() =>
    this.db.clientes().find((c) => c.id === this.pedido()?.clienteId),
  );

  /**
   * Muestra los errores si la acción falló; si funcionó, avisa y navega a `destino`
   * (por defecto, la pantalla que corresponde al nuevo estado del pedido).
   */
  protected ejecutar(
    resultado: Resultado<Pedido>,
    mensaje: string,
    destino?: (pedido: Pedido) => string[],
  ): void {
    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.errores.set([]);
    this.notificaciones.mostrar(mensaje, 'exito');
    void this.router.navigate((destino ?? rutaSegunEstado)(resultado.valor));
  }
}
