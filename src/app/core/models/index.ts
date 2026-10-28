/**
 * Modelos del dominio de Urban Eats usados por la implementación.
 * Los nombres de entidades y atributos siguen el modelo de dominio del proyecto
 * para mantener la trazabilidad modelo → prototipo → código.
 */

export type Id = string;

export type Ciudad = 'Armenia' | 'Bogota' | 'Pereira';

export const CATEGORIAS = [
    'Entradas',
    'Sopas',
    'Platos Fuertes',
    'Acompañamientos',
    'Hamburguesas',
    'Bebidas',
    'Postres',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export type Rol = 'CLIENTE' | 'RESTAURANTE' | 'REPARTIDOR';

export interface Restaurante {
  id: Id;
  nombre: string;
  tipoCocina: string;
  direccion: string;
  ciudad: Ciudad;
  calificacion: number;
  totalResenas: number;
  tiempoEntregaMin: number;
  tiempoEntregaMax: number;
  emoji: string;
}

export interface OpcionProducto {
  id: Id;
  nombre: string;
  precioExtra: number;
}

export interface Producto {
  id: Id;
  restauranteId: Id;
  nombre: string;
  descripcion: string;
  categoria: Categoria;
  precio: number;
  stock: number;
  visible: boolean;
  emoji: string;
  opciones: OpcionProducto[];
}

export type EstadoProducto = 'ACTIVO' | 'AGOTADO' | 'OCULTO';

export interface Direccion {
  id: Id;
  etiqueta: 'Casa' | 'Trabajo' | 'Otra';
  linea: string;
  ciudad: Ciudad;
}

export type TipoMetodoPago = 'TARJETA' | 'EFECTIVO' | 'BILLETERA';

export interface MetodoPago {
  id: Id;
  tipo: TipoMetodoPago;
  nombre: string;
  detalle: string;
}

export interface Cliente {
  id: Id;
  nombre: string;
  email: string;
  telefono: string;
  direcciones: Direccion[];
  metodosPago: MetodoPago[];
}

export interface Repartidor {
  id: Id;
  nombre: string;
  telefono: string;
  vehiculo: string;
}

export type EstadoPedido = 'PENDIENTE' | 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export interface ItemPedido {
  productoId: Id;
  nombre: string;
  emoji: string;
  precioUnitario: number;
  opciones: OpcionProducto[];
  notas: string;
  cantidad: number;
}

export interface DesgloseCostos {
  subtotal: number;
  envio: number;
  impuestos: number;
  total: number;
}

export interface CambioEstado {
  estado: EstadoPedido;
  fecha: string;
}

export interface EvidenciaEntrega {
  sinContacto: boolean;
  firma: string | null;
  foto: string | null;
  fecha: string;
}

export interface Calificacion {
  estrellasRestaurante: number;
  comentarioRestaurante: string;
  estrellasRepartidor: number;
  comentarioRepartidor: string;
  fecha: string;
}

export interface Pedido {
  id: Id;
  codigo: string;
  clienteId: Id;
  restauranteId: Id;
  repartidorId: Id | null;
  repartidoresQueRechazaron: Id[];
  items: ItemPedido[];
  direccion: Direccion;
  metodoPago: MetodoPago;
  montoEfectivo: number | null;
  costos: DesgloseCostos;
  estado: EstadoPedido;
  creadoEn: string;
  historial: CambioEstado[];
  entrega: EvidenciaEntrega | null;
  calificacion: Calificacion | null;
}

export interface Liquidacion {
  pedidoCodigo: string;
  items: { nombre: string; cantidad: number; total: number }[];
  subtotal: number;
  comision: number;
  ivaComision: number;
  totalRestaurante: number;
  pagoRepartidor: number;
}

/** Error producido al violar una regla de negocio (RN-xx). */
export interface ErrorRegla {
  regla: string;
  mensaje: string;
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; errores: ErrorRegla[] };

export const exito = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
export const fallo = <T>(errores: ErrorRegla[]): Resultado<T> => ({ ok: false, errores });
