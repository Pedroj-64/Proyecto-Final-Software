import { TestBed } from '@angular/core/testing';
import { BaseDatosService } from './base-datos.service';
import { CarritoService } from './carrito.service';
import { PedidoService } from './pedido.service';
import { SesionService } from './sesion.service';

describe('PedidoService (RN-01 a RN-08)', () => {
  let pedidos: PedidoService;
  let carrito: CarritoService;
  let db: BaseDatosService;

  const producto = () => db.productos().find((p) => p.id === 'p1')!;
  const cliente = () => TestBed.inject(SesionService).cliente()!;
  const checkout = (i = 0, metodo = 0, monto: number | null = null) => ({
    direccion: cliente().direcciones[i],
    metodoPago: cliente().metodosPago[metodo],
    montoEfectivo: monto,
  });

  beforeEach(() => {
    db = TestBed.inject(BaseDatosService);
    db.restablecer();
    TestBed.inject(SesionService).iniciar('CLIENTE', 'c1');
    carrito = TestBed.inject(CarritoService);
    pedidos = TestBed.inject(PedidoService);
    carrito.vaciar();
    carrito.agregar(producto(), 2);
  });

  it('registra el pedido, descuenta el stock y vacía el carrito (RN-08)', () => {
    const stock = producto().stock;
    const r = pedidos.registrar(checkout());
    expect(r.ok).toBe(true);
    expect(producto().stock).toBe(stock - 2);
    expect(carrito.lineas()).toEqual([]);
    expect(r.ok && r.valor.estado).toBe('PENDIENTE');
  });

  it('genera códigos únicos y consecutivos (RN-08)', () => {
    const a = pedidos.registrar(checkout());
    carrito.agregar(producto(), 1);
    const b = pedidos.registrar(checkout());
    expect(a.ok && b.ok && a.valor.codigo !== b.valor.codigo).toBe(true);
  });

  it('RN-05: rechaza una dirección fuera de cobertura', () => {
    const r = pedidos.registrar(checkout(2)); // d3 está en Bogotá
    expect(r.ok === false && r.errores[0].regla).toBe('RN-05');
  });

  it('RN-07: rechaza efectivo insuficiente', () => {
    const r = pedidos.registrar(checkout(0, 2, 10000)); // m3 es efectivo
    expect(r.ok === false && r.errores[0].regla).toBe('RN-07');
  });

  it('RN-01: rechaza si el producto se agotó después de armar el carrito', () => {
    db.actualizarProductos((ps) => ps.map((p) => (p.id === 'p1' ? { ...p, stock: 0 } : p)));
    const r = pedidos.registrar(checkout());
    expect(r.ok === false && r.errores[0].regla).toBe('RN-01');
  });

  it('cancela un pedido pendiente y devuelve el stock', () => {
    const stock = producto().stock;
    const creado = pedidos.registrar(checkout());
    const r = pedidos.cancelar(creado.ok ? creado.valor.id : '');
    expect(r.ok && r.valor.estado).toBe('CANCELADO');
    expect(producto().stock).toBe(stock);
  });

  it('no cancela un pedido ya entregado', () => {
    const r = pedidos.cancelar('ped1');
    expect(r.ok).toBe(false);
  });

  it('lista los pedidos del cliente y del restaurante', () => {
    expect(pedidos.delCliente('c1').length).toBeGreaterThan(0);
    expect(pedidos.delRestaurante('r1').length).toBeGreaterThan(0);
  });
});
