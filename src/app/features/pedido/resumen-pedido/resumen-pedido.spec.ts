import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BaseDatosService } from '@core/services/base-datos.service';
import { CarritoService } from '@core/services/carrito.service';
import { CheckoutService } from '@core/services/checkout.service';
import { SesionService } from '@core/services/sesion.service';
import { ResumenPedido } from './resumen-pedido';

@Component({ template: '' })
class PaginaVacia {}

describe('ResumenPedido (transacción Registrar Pedido)', () => {
  let carrito: CarritoService;
  let checkout: CheckoutService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ResumenPedido],
      providers: [provideRouter([{ path: 'cliente/pedidos/:id', component: PaginaVacia }])],
    });
    const db = TestBed.inject(BaseDatosService);
    db.restablecer();
    TestBed.inject(SesionService).iniciar('CLIENTE', 'c1');
    carrito = TestBed.inject(CarritoService);
    checkout = TestBed.inject(CheckoutService);
    // Ajiaco de Sabor Colombiano (r1): 3 unidades superan el subtotal mínimo (RN-04).
    carrito.agregar(
      db.productos().find((p) => p.restauranteId === 'r1' && p.stock >= 3)!,
      3,
    );
  });

  async function montar() {
    const fixture = TestBed.createComponent(ResumenPedido);
    await fixture.whenStable();
    return { fixture, elemento: fixture.nativeElement as HTMLElement };
  }

  function confirmar(fixture: { whenStable: () => Promise<unknown> }, elemento: HTMLElement) {
    elemento.querySelector<HTMLButtonElement>('.btn-accion')?.click();
    return fixture.whenStable();
  }

  it('sin dirección ni pago muestra el estado vacío', async () => {
    const { elemento } = await montar();
    expect(elemento.textContent).toContain('Falta completar el pedido');
    expect(elemento.querySelector('.btn-accion')).toBeNull();
  });

  it('RN-05: muestra la regla y conserva el carrito si la dirección no tiene cobertura', async () => {
    checkout.direccionId.set('d3'); // Bogotá; el restaurante reparte en Armenia
    checkout.metodoPagoId.set('m1');
    const { fixture, elemento } = await montar();
    await confirmar(fixture, elemento);

    expect(elemento.querySelector('[role=alert]')?.textContent).toContain('RN-05');
    expect(carrito.lineas().length).toBe(1);
  });

  it('RN-07: rechaza efectivo insuficiente', async () => {
    checkout.direccionId.set('d1');
    checkout.metodoPagoId.set('m3');
    checkout.montoEfectivo.set(1000);
    const { fixture, elemento } = await montar();
    await confirmar(fixture, elemento);

    expect(elemento.querySelector('[role=alert]')?.textContent).toContain('RN-07');
  });

  it('registra el pedido, vacía el carrito y navega a la confirmación', async () => {
    checkout.direccionId.set('d1');
    checkout.metodoPagoId.set('m1');
    const { fixture, elemento } = await montar();
    const router = TestBed.inject(Router);
    await confirmar(fixture, elemento);
    await fixture.whenStable();

    expect(carrito.lineas()).toEqual([]);
    expect(checkout.datos()).toBeNull();
    expect(router.url).toMatch(/^\/cliente\/pedidos\/ped\d+$/);
  });
});
