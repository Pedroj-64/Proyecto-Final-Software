import { TestBed } from '@angular/core/testing';
import { BaseDatosService } from './base-datos.service';
import { EntregaService } from './entrega.service';
import { RELOJ } from './reloj';

/** Reloj fijo, posterior a los pedidos semilla (que se fechan respecto a la hora real). */
const AHORA = new Date(Date.now() + 60_000);

describe('EntregaService (RN-09 a RN-11)', () => {
  let servicio: EntregaService;
  let db: BaseDatosService;

  const pedido = (id: string) => db.pedidos().find((p) => p.id === id)!;
  const firma = { sinContacto: false, firma: 'Laura Gómez', foto: null };

  /** Copia pendiente de ped2 con otro id y código, para tener un segundo pedido disponible. */
  const agregarPendiente = (id: string, codigo: string) =>
    db.actualizarPedidos((ps) => [...ps, { ...pedido('ped2'), id, codigo }]);

  /** Lleva ped2 hasta "en camino" con el repartidor indicado. */
  const enCamino = (repartidorId: string) => {
    servicio.aceptar('ped2', repartidorId);
    servicio.confirmarRecogida('ped2', repartidorId, 'UE-102341');
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: RELOJ, useValue: () => AHORA }] });
    db = TestBed.inject(BaseDatosService);
    db.restablecer();
    servicio = TestBed.inject(EntregaService);
  });

  describe('pruebas de aceptación', () => {
    it('RN-09: no acepta un segundo pedido mientras tenga uno activo', () => {
      agregarPendiente('ped3', 'UE-102342');
      expect(servicio.aceptar('ped2', 'rp1').ok).toBe(true);

      const r = servicio.aceptar('ped3', 'rp1');
      expect(r.ok === false && r.errores[0].regla).toBe('RN-09');
      expect(pedido('ped3').estado).toBe('PENDIENTE');
      expect(pedido('ped3').repartidorId).toBeNull();
    });

    it('RN-10: no recoge el pedido con un código incorrecto', () => {
      servicio.aceptar('ped2', 'rp1');

      const r = servicio.confirmarRecogida('ped2', 'rp1', 'UE-102340');
      expect(r.ok === false && r.errores[0].regla).toBe('RN-10');
      expect(pedido('ped2').estado).toBe('ASIGNADO');
    });

    it('RN-11: no entrega el pedido sin la firma del cliente', () => {
      enCamino('rp1');

      const r = servicio.confirmarEntrega('ped2', 'rp1', {
        sinContacto: false,
        firma: null,
        foto: null,
      });
      expect(r.ok === false && r.errores[0].regla).toBe('RN-11');
      expect(pedido('ped2').estado).toBe('EN_CAMINO');
      expect(pedido('ped2').entrega).toBeNull();
    });
  });

  describe('flujo completo', () => {
    it('acepta, recoge y entrega registrando cada estado en el historial', () => {
      expect(servicio.aceptar('ped2', 'rp1').ok).toBe(true);
      expect(servicio.activoDe('rp1')?.id).toBe('ped2');
      expect(servicio.confirmarRecogida('ped2', 'rp1', ' ue102341 ').ok).toBe(true);
      expect(servicio.confirmarEntrega('ped2', 'rp1', firma).ok).toBe(true);

      const p = pedido('ped2');
      expect(p.estado).toBe('ENTREGADO');
      expect(p.repartidorId).toBe('rp1');
      expect(p.entrega).toEqual({ ...firma, fecha: AHORA.toISOString() });
      expect(p.historial.map((h) => h.estado)).toEqual([
        'PENDIENTE',
        'ASIGNADO',
        'EN_CAMINO',
        'ENTREGADO',
      ]);
      expect(servicio.activoDe('rp1')).toBeUndefined();
    });

    it('sin contacto guarda la foto y descarta la firma', () => {
      enCamino('rp1');
      servicio.confirmarEntrega('ped2', 'rp1', { sinContacto: true, firma: 'x', foto: 'foto' });
      expect(pedido('ped2').entrega?.firma).toBeNull();
      expect(pedido('ped2').entrega?.foto).toBe('foto');
    });

    it('otro repartidor no puede aceptar ni recoger un pedido ajeno', () => {
      servicio.aceptar('ped2', 'rp1');
      expect(servicio.confirmarRecogida('ped2', 'rp2', 'UE-102341').ok).toBe(false);
      expect(servicio.aceptar('ped2', 'rp2').ok).toBe(false);
      expect(pedido('ped2').estado).toBe('ASIGNADO');
    });

    it('otro repartidor no puede entregar un pedido ajeno aunque tenga firma', () => {
      enCamino('rp1');
      const r = servicio.confirmarEntrega('ped2', 'rp2', firma);
      expect(r.ok === false && r.errores[0].regla).toBe('ESTADO');
      expect(pedido('ped2').estado).toBe('EN_CAMINO');
      expect(pedido('ped2').entrega).toBeNull();
    });
  });

  describe('rechazar', () => {
    it('un pendiente deja de ofrecérsele solo a quien lo rechaza', () => {
      expect(servicio.rechazar('ped2', 'rp1').ok).toBe(true);
      expect(pedido('ped2').estado).toBe('PENDIENTE');
      expect(pedido('ped2').repartidoresQueRechazaron).toEqual(['rp1']);
      expect(servicio.disponiblesPara('rp1')).toEqual([]);
      expect(servicio.disponiblesPara('rp2').map((p) => p.id)).toEqual(['ped2']);
    });

    it('uno ya aceptado por él vuelve a pendiente para otro repartidor', () => {
      servicio.aceptar('ped2', 'rp1');
      expect(servicio.rechazar('ped2', 'rp1').ok).toBe(true);

      const p = pedido('ped2');
      expect(p.estado).toBe('PENDIENTE');
      expect(p.repartidorId).toBeNull();
      expect(p.repartidoresQueRechazaron).toEqual(['rp1']);
      expect(p.historial.at(-1)?.estado).toBe('PENDIENTE');
      expect(servicio.activoDe('rp1')).toBeUndefined();
      expect(servicio.disponiblesPara('rp2').map((x) => x.id)).toEqual(['ped2']);
    });

    it('quien rechazó un pedido no puede aceptarlo después', () => {
      servicio.rechazar('ped2', 'rp1');
      const r = servicio.aceptar('ped2', 'rp1');
      expect(r.ok === false && r.errores[0].mensaje).toBe('Ya rechazaste este pedido.');
      expect(pedido('ped2').repartidorId).toBeNull();
      expect(servicio.aceptar('ped2', 'rp2').ok).toBe(true);
    });

    it('quien devolvió un pedido aceptado tampoco puede volver a aceptarlo', () => {
      servicio.aceptar('ped2', 'rp1');
      servicio.rechazar('ped2', 'rp1');
      expect(servicio.aceptar('ped2', 'rp1').ok).toBe(false);
      expect(pedido('ped2').estado).toBe('PENDIENTE');
    });

    it('no rechaza uno aceptado por otro ni uno ya recogido', () => {
      servicio.aceptar('ped2', 'rp1');
      expect(servicio.rechazar('ped2', 'rp2').ok).toBe(false);
      servicio.confirmarRecogida('ped2', 'rp1', 'UE-102341');
      expect(servicio.rechazar('ped2', 'rp1').ok).toBe(false);
    });
  });

  describe('consultas', () => {
    it('disponiblesPara lista los pendientes sin repartidor', () => {
      expect(servicio.disponiblesPara('rp1').map((p) => p.id)).toEqual(['ped2']);
    });

    it('entregadosPor lista sus entregas de la más reciente a la más antigua', () => {
      enCamino('rp2');
      servicio.confirmarEntrega('ped2', 'rp2', firma);
      expect(servicio.entregadosPor('rp2').map((p) => p.codigo)).toEqual([
        'UE-102341',
        'UE-102340',
      ]);
      expect(servicio.entregadosPor('rp3')).toEqual([]);
    });
  });
});
