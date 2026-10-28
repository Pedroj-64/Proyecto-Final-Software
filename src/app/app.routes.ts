import { Routes } from '@angular/router';
import { rolGuard } from '@core/guards/rol.guard';

/** Cada rol tiene su feature cargada de forma diferida (lazy loading). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'acceso' },
  {
    path: 'acceso',
    title: 'Urban Eats · Acceso',
    loadComponent: () => import('@features/acceso/acceso').then((m) => m.Acceso),
  },
  {
    path: 'cliente',
    canActivate: [rolGuard('CLIENTE')],
    loadChildren: () => import('@features/pedido/pedido.routes').then((m) => m.PEDIDO_ROUTES),
  },
  {
    path: 'restaurante',
    canActivate: [rolGuard('RESTAURANTE')],
    loadChildren: () => import('@features/catalogo/catalogo.routes').then((m) => m.CATALOGO_ROUTES),
  },
  {
    path: 'repartidor',
    canActivate: [rolGuard('REPARTIDOR')],
    loadChildren: () =>
      import('@features/repartidor/repartidor.routes').then((m) => m.REPARTIDOR_ROUTES),
  },
  { path: '**', redirectTo: 'acceso' },
];
