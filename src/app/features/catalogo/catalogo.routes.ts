import { Routes } from '@angular/router';

/** Proceso 1 (creación y publicación del menú digital) y consulta de pedidos/liquidaciones. */
export const CATALOGO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  {
    path: 'catalogo',
    title: 'Catálogo de productos',
    loadComponent: () =>
      import('./catalogo-productos/catalogo-productos').then((m) => m.CatalogoProductos),
  },
  {
    path: 'productos/nuevo',
    title: 'Nuevo producto',
    loadComponent: () =>
      import('./formulario-producto/formulario-producto').then((m) => m.FormularioProducto),
  },
  {
    path: 'productos/:id/editar',
    title: 'Editar producto',
    loadComponent: () =>
      import('./formulario-producto/formulario-producto').then((m) => m.FormularioProducto),
  },
  {
    path: 'menu-actualizado',
    title: 'Menú actualizado',
    loadComponent: () =>
      import('./menu-actualizado/menu-actualizado').then((m) => m.MenuActualizado),
  },
  {
    path: 'pedidos',
    title: 'Pedidos del restaurante',
    loadComponent: () =>
      import('./pedidos-restaurante/pedidos-restaurante').then((m) => m.PedidosRestaurante),
  },
  {
    path: 'pedidos/:id/liquidacion',
    title: 'Liquidación',
    loadComponent: () =>
      import('@features/liquidacion/liquidacion/liquidacion').then((m) => m.LiquidacionPedido),
  },
];
