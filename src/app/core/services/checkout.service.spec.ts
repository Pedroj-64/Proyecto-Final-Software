import { TestBed } from '@angular/core/testing';
import { BaseDatosService } from './base-datos.service';
import { CheckoutService } from './checkout.service';
import { SesionService } from './sesion.service';

describe('CheckoutService', () => {
  let checkout: CheckoutService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.inject(BaseDatosService).restablecer();
    TestBed.inject(SesionService).iniciar('CLIENTE', 'c1');
    checkout = TestBed.inject(CheckoutService);
  });

  it('no entrega datos hasta que se eligen dirección y método de pago', () => {
    expect(checkout.datos()).toBeNull();
    checkout.direccionId.set('d1');
    expect(checkout.datos()).toBeNull();
    checkout.metodoPagoId.set('m3');
    checkout.montoEfectivo.set(50000);
    expect(checkout.datos()).toMatchObject({
      direccion: { id: 'd1' },
      metodoPago: { id: 'm3' },
      montoEfectivo: 50000,
    });
  });

  it('reiniciar borra las elecciones', () => {
    checkout.direccionId.set('d1');
    checkout.metodoPagoId.set('m3');
    checkout.reiniciar();
    expect(checkout.datos()).toBeNull();
    expect(checkout.montoEfectivo()).toBeNull();
  });
});
