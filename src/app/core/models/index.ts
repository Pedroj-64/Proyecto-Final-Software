/**
 * Modelos del dominio de Urban Eats usados por la implementación.
 * Los nombres de entidades y atributos siguen el modelo de dominio del proyecto
 * para mantener la trazabilidad modelo → prototipo → código.
 */

/** Identificador de una entidad (cadena opaca). */
export type Id = string;

/** Ciudades con cobertura; la usa RN-05 para validar la entrega. */
export type Ciudad = 'Armenia' | 'Bogotá' | 'Pereira';

/** Categorías del menú de un restaurante. */
export const CATEGORIAS = [
  'Entradas',
  'Sopas',
  'Platos Fuertes',
  'Acompañamientos',
  'Hamburguesas',
  'Bebidas',
  'Postres',
] as const;

/** Categoría de un `Producto`. */
export type Categoria = (typeof CATEGORIAS)[number];

/** Rol del usuario demo; define las rutas a las que puede entrar. */
export type Rol = 'CLIENTE' | 'RESTAURANTE' | 'REPARTIDOR';

/** Restaurante aliado que ofrece productos y atiende pedidos en una ciudad. */
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

/** Adicional opcional de un `Producto` con costo extra (p. ej. "Doble carne"). */
export interface OpcionProducto {
  id: Id;
  nombre: string;
  precioExtra: number;
}

/** Plato del menú. Se pide solo si está visible y con stock (RN-01); su precio es múltiplo de 50 (RP-02). */
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

/** Estado derivado de `visible` y `stock`; no se guarda (ver `estadoProducto`). */
export type EstadoProducto = 'ACTIVO' | 'AGOTADO' | 'OCULTO';

/** Dirección de entrega guardada por un `Cliente`. */
export interface Direccion {
  id: Id;
  etiqueta: 'Casa' | 'Trabajo' | 'Otra';
  linea: string;
  ciudad: Ciudad;
}

/** Formas de pago aceptadas. */
export type TipoMetodoPago = 'TARJETA' | 'EFECTIVO' | 'BILLETERA';

/** Método de pago registrado por un `Cliente`. */
export interface MetodoPago {
  id: Id;
  tipo: TipoMetodoPago;
  nombre: string;
  detalle: string;
}

/** Quien realiza pedidos; guarda sus direcciones y métodos de pago. */
export interface Cliente {
  id: Id;
  nombre: string;
  email: string;
  telefono: string;
  direcciones: Direccion[];
  metodosPago: MetodoPago[];
}

/** Quien recoge y entrega pedidos; solo puede tener uno activo (RN-09). */
export interface Repartidor {
  id: Id;
  nombre: string;
  telefono: string;
  vehiculo: string;
}

/** Ciclo de vida del pedido; las transiciones válidas están en `pedido.rules.ts`. */
export type EstadoPedido = 'PENDIENTE' | 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

/** Línea de un `Pedido`: copia del precio y nombre del producto al momento de pedir. */
export interface ItemPedido {
  productoId: Id;
  nombre: string;
  emoji: string;
  precioUnitario: number;
  opciones: OpcionProducto[];
  notas: string;
  cantidad: number;
}

/** Costos del pedido (RN-06): total = subtotal + envío + impuestos. */
export interface DesgloseCostos {
  subtotal: number;
  envio: number;
  impuestos: number;
  total: number;
}

/** Registro de una transición de estado en el historial del pedido. */
export interface CambioEstado {
  estado: EstadoPedido;
  fecha: string;
}

/** Prueba de entrega: firma del cliente o foto si fue sin contacto (RN-11). */
export interface EvidenciaEntrega {
  sinContacto: boolean;
  firma: string | null;
  foto: string | null;
  fecha: string;
}

/** Calificación de 1 a 5 estrellas al restaurante y al repartidor (RN-12). */
export interface Calificacion {
  estrellasRestaurante: number;
  comentarioRestaurante: string;
  estrellasRepartidor: number;
  comentarioRepartidor: string;
  fecha: string;
}

/** Transacción principal: pedido de un cliente a un restaurante, con código único (RN-08). */
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

/** Reparto del valor de un pedido entregado entre restaurante, plataforma y repartidor (RN-13). */
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

/** Resultado de una operación de negocio: el valor, o la lista de reglas violadas. */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; errores: ErrorRegla[] };

/** Construye un `Resultado` exitoso. */
export const exito = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
/** Construye un `Resultado` fallido con las reglas violadas. */
export const fallo = <T>(errores: ErrorRegla[]): Resultado<T> => ({ ok: false, errores });
