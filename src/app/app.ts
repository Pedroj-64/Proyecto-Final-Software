import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Rol } from '@core/models';
import { CarritoService } from '@core/services/carrito.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { SesionService } from '@core/services/sesion.service';

interface EnlaceNavegacion {
  ruta: string;
  etiqueta: string;
  icono: string;
}

const NAVEGACION: Record<Rol, EnlaceNavegacion[]> = {
  CLIENTE: [
    { ruta: '/cliente/restaurantes', etiqueta: 'Restaurantes', icono: '🏠' },
    { ruta: '/cliente/carrito', etiqueta: 'Carrito', icono: '🛒' },
    { ruta: '/cliente/pedidos', etiqueta: 'Mis pedidos', icono: '🧾' },
  ],
  RESTAURANTE: [
    { ruta: '/restaurante/catalogo', etiqueta: 'Catálogo', icono: '📋' },
    { ruta: '/restaurante/pedidos', etiqueta: 'Pedidos', icono: '🧾' },
  ],
  REPARTIDOR: [
    { ruta: '/repartidor/pedidos', etiqueta: 'Pedidos', icono: '🛵' },
    { ruta: '/repartidor/ingresos', etiqueta: 'Ingresos', icono: '💵' },
  ],
};

const NOMBRE_ROL: Record<Rol, string> = {
  CLIENTE: 'Cliente',
  RESTAURANTE: 'Restaurante',
  REPARTIDOR: 'Repartidor',
};

/** Contenedor principal: barra superior, navegación por rol y notificaciones. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);
  protected readonly carrito = inject(CarritoService);
  protected readonly notificaciones = inject(NotificacionService);

  protected readonly enlaces = computed(() => {
    const rol = this.sesion.rol();
    return rol ? NAVEGACION[rol] : [];
  });
  protected readonly nombreRol = computed(() => {
    const rol = this.sesion.rol();
    return rol ? NOMBRE_ROL[rol] : '';
  });

  protected cerrarSesion(): void {
    this.sesion.cerrar();
    void this.router.navigateByUrl('/acceso');
  }
}
