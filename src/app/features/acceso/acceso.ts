import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Rol } from '@core/models';
import { BaseDatosService } from '@core/services/base-datos.service';
import { CarritoService } from '@core/services/carrito.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { SesionService } from '@core/services/sesion.service';

const INICIO: Record<Rol, string> = {
  CLIENTE: '/cliente/restaurantes',
  RESTAURANTE: '/restaurante/catalogo',
  REPARTIDOR: '/repartidor/pedidos',
};

/** Selección del usuario demo. Reemplaza el login en este MVP. */
@Component({
  selector: 'app-acceso',
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Acceso {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);
  private readonly carrito = inject(CarritoService);
  private readonly notificaciones = inject(NotificacionService);
  protected readonly db = inject(BaseDatosService);

  protected entrar(rol: Rol, usuarioId: string): void {
    if (this.sesion.cliente()?.id !== usuarioId) this.carrito.vaciar();
    this.sesion.iniciar(rol, usuarioId);
    void this.router.navigateByUrl(INICIO[rol]);
  }

  protected restablecer(): void {
    this.db.restablecer();
    this.carrito.vaciar();
    this.notificaciones.mostrar('Datos de demostración restablecidos.', 'exito');
  }
}
