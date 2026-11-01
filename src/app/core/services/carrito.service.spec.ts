import { TestBed } from '@angular/core/testing';
import { crearProducto } from '../../../testing/fabricas';
import { CarritoService } from './carrito.service';

describe('CarritoService (RN-01 a RN-03, RN-06)', () => {
  let carrito: CarritoService;

  beforeEach(() => {
    carrito = TestBed.inject(CarritoService);
  });

  it('agrega un producto y calcula los costos', () => {
    const r = carrito.agregar(crearProducto(), 2);
    expect(r.ok).toBe(true);
    expect(carrito.cantidadItems()).toBe(2);
    expect(carrito.costos().subtotal).toBe(70000);
    expect(carrito.restauranteId()).toBe('r1');
  });

  it('suma la cantidad cuando la línea es igual', () => {
    carrito.agregar(crearProducto(), 1);
    carrito.agregar(crearProducto(), 2);
    expect(carrito.lineas().length).toBe(1);
    expect(carrito.cantidadItems()).toBe(3);
  });

  it('RN-01: no agrega un producto agotado', () => {
    const r = carrito.agregar(crearProducto({ stock: 0 }), 1);
    expect(r.ok).toBe(false);
    expect(carrito.lineas()).toEqual([]);
  });

  it('RN-02: valida el stock contra la cantidad total de la línea', () => {
    carrito.agregar(crearProducto({ stock: 3 }), 2);
    const r = carrito.agregar(crearProducto({ stock: 3 }), 2);
    expect(r.ok).toBe(false);
    expect(carrito.cantidadItems()).toBe(2);
  });

  it('RN-03: rechaza productos de otro restaurante', () => {
    carrito.agregar(crearProducto(), 1);
    const r = carrito.agregar(crearProducto({ id: 'p2', restauranteId: 'r2' }), 1);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errores[0].regla).toBe('RN-03');
  });

  it('cambia la cantidad, quita líneas y vacía', () => {
    carrito.agregar(crearProducto(), 1);
    carrito.cambiarCantidad(0, crearProducto(), 4);
    expect(carrito.cantidadItems()).toBe(4);
    carrito.quitar(0);
    expect(carrito.restauranteId()).toBeNull();
    carrito.agregar(crearProducto(), 1);
    carrito.vaciar();
    expect(carrito.lineas()).toEqual([]);
  });
});
