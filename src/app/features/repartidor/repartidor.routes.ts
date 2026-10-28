import { Routes } from '@angular/router';

/** Proceso 3: coordinación de preparación y despacho logístico (vista del repartidor). */
export const REPARTIDOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
  {
    path: 'pedidos',
    title: 'Pedidos disponibles',
    loadComponent: () =>
      import('./pedidos-disponibles/pedidos-disponibles').then((m) => m.PedidosDisponibles),
  },
  {
    path: 'pedidos/:id',
    title: 'Detalle del pedido',
    loadComponent: () => import('./detalle-entrega/detalle-entrega').then((m) => m.DetalleEntrega),
  },
  {
    path: 'pedidos/:id/recogida',
    title: 'Confirmar recogida',
    loadComponent: () => import('./recogida/recogida').then((m) => m.Recogida),
  },
  {
    path: 'pedidos/:id/en-ruta',
    title: 'En ruta',
    loadComponent: () => import('./en-ruta/en-ruta').then((m) => m.EnRuta),
  },
  {
    path: 'pedidos/:id/entrega',
    title: 'Confirmar entrega',
    loadComponent: () =>
      import('./confirmar-entrega/confirmar-entrega').then((m) => m.ConfirmarEntrega),
  },
  {
    path: 'ingresos',
    title: 'Ingresos',
    loadComponent: () => import('./ingresos/ingresos').then((m) => m.Ingresos),
  },
];
