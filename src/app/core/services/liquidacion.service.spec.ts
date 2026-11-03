import { TestBed } from '@angular/core/testing';
import { BaseDatosService } from './base-datos.service';
import { LiquidacionService } from './liquidacion.service';
import { RELOJ } from './reloj';
import { SesionService } from './sesion.service';

const AHORA = new Date('2026-11-02T15:00:00.000Z');

describe('LiquidacionService (RN-12 y RN-13)', () => {
  let servicio: LiquidacionService;
  let db: BaseDatosService;
  let sesion: SesionService;

  const pedido = (id: string) => db.pedidos().find((p) => p.id === id)!;
  const datos = {
    estrellasRestaurante: 5,
    comentarioRestaurante: '  Deliciosa  ',
    estrellasRepartidor: 4,
    comentarioRepartidor: '',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: RELOJ, useValue: () => AHORA }] });
    db = TestBed.inject(BaseDatosService);
    db.restablecer();
    sesion = TestBed.inject(SesionService);
    servicio = TestBed.inject(LiquidacionService);
  });

  describe('liquidacion (RN-13)', () => {
    beforeEach(() => sesion.iniciar('RESTAURANTE', 'r1'));

    it('liquida un pedido entregado del restaurante', () => {
      const r = servicio.liquidacion('ped1'); // UE-102340, subtotal 67.000
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.valor.pedidoCodigo).toBe('UE-102340');
      expect(r.valor.totalRestaurante).toBe(67000 - 6700 - 1273);
      expect(r.valor.pagoRepartidor).toBe(5000);
    });

    it('no liquida pedidos de otro restaurante', () => {
      expect(servicio.liquidacion('ped2').ok).toBe(false); // ped2 es de r3
      sesion.iniciar('RESTAURANTE', 'r3');
      expect(servicio.liquidacion('ped1').ok).toBe(false);
    });

    it('no liquida un pedido que aún no se ha entregado', () => {
      sesion.iniciar('RESTAURANTE', 'r3');
      const r = servicio.liquidacion('ped2');
      expect(r.ok === false && r.errores[0].mensaje).toContain('entregados');
    });

    it('exige sesión de restaurante', () => {
      sesion.iniciar('CLIENTE', 'c1');
      expect(servicio.liquidacion('ped1').ok).toBe(false);
    });
  });

  describe('calificar (RN-12)', () => {
    beforeEach(() => sesion.iniciar('CLIENTE', 'c1'));

    it('guarda la calificación en el pedido con fecha y comentarios limpios', () => {
      const r = servicio.calificar('ped1', datos);
      expect(r.ok).toBe(true);
      expect(pedido('ped1').calificacion).toEqual({
        estrellasRestaurante: 5,
        comentarioRestaurante: 'Deliciosa',
        estrellasRepartidor: 4,
        comentarioRepartidor: '',
        fecha: AHORA.toISOString(),
      });
    });

    it('RN-12: no permite calificar dos veces', () => {
      servicio.calificar('ped1', datos);
      const r = servicio.calificar('ped1', { ...datos, estrellasRestaurante: 1 });
      expect(r.ok === false && r.errores[0].regla).toBe('RN-12');
      expect(pedido('ped1').calificacion?.estrellasRestaurante).toBe(5);
    });

    it('RN-12: rechaza estrellas sin elegir (0), como envía la pantalla por defecto', () => {
      const r = servicio.calificar('ped1', { ...datos, estrellasRepartidor: 0 });
      expect(r.ok === false && r.errores.map((e) => e.regla)).toEqual(['RN-12']);
      expect(pedido('ped1').calificacion).toBeNull();
    });

    it('RN-12: no califica un pedido que no ha sido entregado', () => {
      sesion.iniciar('CLIENTE', 'c2');
      const r = servicio.calificar('ped2', datos);
      expect(r.ok === false && r.errores[0].regla).toBe('RN-12');
    });

    it('un cliente no califica el pedido de otro', () => {
      sesion.iniciar('CLIENTE', 'c2');
      expect(servicio.calificar('ped1', datos).ok).toBe(false);
      expect(pedido('ped1').calificacion).toBeNull();
    });
  });
});
