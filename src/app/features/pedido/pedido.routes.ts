import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { CarritoService } from '@core/services/carrito.service';

/** Los pasos del checkout requieren un carrito con productos. */
const carritoConProductos: CanActivateFn = () =>
  inject(CarritoService).lineas().length > 0 || inject(Router).createUrlTree(['/cliente/carrito']);

/** Proceso 2: Tomar y registrar pedido (vista del cliente). */
export const PEDIDO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'restaurantes' },
  {
    path: 'restaurantes',
    title: 'Restaurantes',
    loadComponent: () => import('./restaurantes/restaurantes').then((m) => m.Restaurantes),
  },
  {
    path: 'restaurantes/:id',
    title: 'Menú',
    loadComponent: () =>
      import('./menu-restaurante/menu-restaurante').then((m) => m.MenuRestaurante),
  },
  {
    path: 'productos/:id',
    title: 'Producto',
    loadComponent: () =>
      import('./detalle-producto/detalle-producto').then((m) => m.DetalleProducto),
  },
  {
    path: 'carrito',
    title: 'Carrito de compras',
    loadComponent: () => import('./carrito/carrito').then((m) => m.Carrito),
  },
  {
    path: 'checkout/direccion',
    title: 'Dirección de entrega',
    canActivate: [carritoConProductos],
    loadComponent: () =>
      import('./direccion-entrega/direccion-entrega').then((m) => m.DireccionEntrega),
  },
  {
    path: 'checkout/pago',
    title: 'Método de pago',
    canActivate: [carritoConProductos],
    loadComponent: () => import('./metodo-pago/metodo-pago').then((m) => m.MetodoPagoPaso),
  },
  {
    path: 'checkout/resumen',
    title: 'Resumen del pedido',
    canActivate: [carritoConProductos],
    loadComponent: () => import('./resumen-pedido/resumen-pedido').then((m) => m.ResumenPedido),
  },
  {
    path: 'pedidos',
    title: 'Mis pedidos',
    loadComponent: () => import('./mis-pedidos/mis-pedidos').then((m) => m.MisPedidos),
  },
  {
    path: 'pedidos/:id',
    title: 'Pedido confirmado',
    loadComponent: () =>
      import('./confirmacion-pedido/confirmacion-pedido').then((m) => m.ConfirmacionPedido),
  },
  {
    path: 'pedidos/:id/calificar',
    title: 'Califica tu experiencia',
    loadComponent: () =>
      import('@features/liquidacion/calificacion/calificacion').then((m) => m.CalificacionPedido),
  },
];
