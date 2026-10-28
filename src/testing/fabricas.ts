import { ItemPedido, Producto, Restaurante } from '@core/models';

/** Fábricas de datos para las pruebas unitarias. */
export function crearProducto(cambios: Partial<Producto> = {}): Producto {
  return {
    id: 'p-test',
    restauranteId: 'r1',
    nombre: 'Bandeja Paisa',
    descripcion: '',
    categoria: 'Platos Fuertes',
    precio: 35000,
    stock: 10,
    visible: true,
    emoji: '🍛',
    opciones: [],
    ...cambios,
  };
}

export function crearItem(cambios: Partial<ItemPedido> = {}): ItemPedido {
  return {
    productoId: 'p-test',
    nombre: 'Bandeja Paisa',
    emoji: '🍛',
    precioUnitario: 35000,
    opciones: [],
    notas: '',
    cantidad: 1,
    ...cambios,
  };
}

export function crearRestaurante(cambios: Partial<Restaurante> = {}): Restaurante {
  return {
    id: 'r1',
    nombre: 'Sabor Colombiano',
    tipoCocina: 'Típica',
    direccion: 'Carrera 7',
    ciudad: 'Armenia',
    calificacion: 4.8,
    totalResenas: 10,
    tiempoEntregaMin: 30,
    tiempoEntregaMax: 45,
    emoji: '🇨🇴',
    ...cambios,
  };
}
