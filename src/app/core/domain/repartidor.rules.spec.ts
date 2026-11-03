import { EstadoPedido } from '@core/models';
import {
  tienePedidoActivo,
  validarAceptacion,
  validarCodigoRecogida,
  validarEvidenciaEntrega,
} from './repartidor.rules';

describe('repartidor.rules (RN-09 a RN-11)', () => {
  const pedido = (repartidorId: string | null, estado: EstadoPedido) => ({ repartidorId, estado });

  describe('tienePedidoActivo (RN-09)', () => {
    it('detecta un pedido asignado o en camino del repartidor', () => {
      expect(tienePedidoActivo('rp1', [pedido('rp1', 'ASIGNADO')])).toBe(true);
      expect(tienePedidoActivo('rp1', [pedido('rp1', 'EN_CAMINO')])).toBe(true);
    });

    it('ignora pedidos terminados y los de otros repartidores', () => {
      const pedidos = [
        pedido('rp1', 'ENTREGADO'),
        pedido('rp1', 'CANCELADO'),
        pedido('rp2', 'EN_CAMINO'),
        pedido(null, 'PENDIENTE'),
      ];
      expect(tienePedidoActivo('rp1', pedidos)).toBe(false);
    });
  });

  describe('validarAceptacion', () => {
    it('acepta un pedido pendiente si el repartidor está libre', () => {
      expect(validarAceptacion('rp1', { estado: 'PENDIENTE' }, [])).toEqual([]);
    });

    it('RN-09: rechaza si el repartidor ya tiene un pedido activo', () => {
      const errores = validarAceptacion('rp1', { estado: 'PENDIENTE' }, [
        pedido('rp1', 'ASIGNADO'),
      ]);
      expect(errores.map((e) => e.regla)).toEqual(['RN-09']);
    });

    it('rechaza un pedido que ya no está pendiente', () => {
      const errores = validarAceptacion('rp1', { estado: 'ASIGNADO' }, []);
      expect(errores.map((e) => e.regla)).toEqual(['ESTADO']);
    });
  });

  describe('validarCodigoRecogida (RN-10)', () => {
    const p = { codigo: 'UE-102340' };

    it('acepta el código aunque se escriba en otro formato', () => {
      expect(validarCodigoRecogida(p, 'UE-102340')).toEqual([]);
      expect(validarCodigoRecogida(p, ' ue102340 ')).toEqual([]);
      expect(validarCodigoRecogida(p, '102340')).toEqual([]);
    });

    it('exige el código', () => {
      expect(validarCodigoRecogida(p, '  ')[0].regla).toBe('RN-10');
      expect(validarCodigoRecogida(p, 'abc')[0].regla).toBe('RN-10');
    });

    it('rechaza un código distinto', () => {
      expect(validarCodigoRecogida(p, 'UE-102341')[0].regla).toBe('RN-10');
    });
  });

  describe('validarEvidenciaEntrega (RN-11)', () => {
    it('con contacto exige la firma', () => {
      expect(validarEvidenciaEntrega({ sinContacto: false, firma: 'Juan', foto: null })).toEqual(
        [],
      );
      expect(
        validarEvidenciaEntrega({ sinContacto: false, firma: null, foto: 'foto.jpg' })[0].regla,
      ).toBe('RN-11');
      expect(
        validarEvidenciaEntrega({ sinContacto: false, firma: '  ', foto: null })[0].regla,
      ).toBe('RN-11');
    });

    it('sin contacto exige la foto', () => {
      expect(validarEvidenciaEntrega({ sinContacto: true, firma: null, foto: 'foto.jpg' })).toEqual(
        [],
      );
      expect(
        validarEvidenciaEntrega({ sinContacto: true, firma: 'Juan', foto: null })[0].regla,
      ).toBe('RN-11');
    });
  });
});
