import { crearItem, crearProducto, crearRestaurante } from '../../../testing/fabricas';
import {
  normalizarCodigo,
  puedeCancelar,
  puedeTransicionar,
  validarCobertura,
  validarDisponibilidad,
  validarMismoRestaurante,
  validarPedido,
} from './pedido.rules';

describe('pedido.rules (RN-01 a RN-07)', () => {
  const restaurante = crearRestaurante();
  const productos = [crearProducto()];
  const armenia = { ciudad: 'Armenia' as const };

  describe('validarDisponibilidad', () => {
    it('RN-01: rechaza un producto agotado', () => {
      const errores = validarDisponibilidad(crearProducto({ stock: 0 }), 1);
      expect(errores.map((e) => e.regla)).toEqual(['RN-01']);
    });

    it('RN-01: rechaza un producto oculto', () => {
      expect(validarDisponibilidad(crearProducto({ visible: false }), 1)[0].regla).toBe('RN-01');
    });

    it('RN-02: rechaza una cantidad mayor que el stock', () => {
      const errores = validarDisponibilidad(crearProducto({ stock: 3 }), 4);
      expect(errores[0].regla).toBe('RN-02');
      expect(errores[0].mensaje).toContain('3');
    });

    it('RN-02: rechaza más de 10 unidades aunque haya stock', () => {
      expect(validarDisponibilidad(crearProducto({ stock: 50 }), 11)[0].regla).toBe('RN-02');
    });

    it('acepta una cantidad válida', () => {
      expect(validarDisponibilidad(crearProducto(), 2)).toEqual([]);
    });
  });

  describe('validarMismoRestaurante (RN-03)', () => {
    it('acepta el primer producto y los del mismo restaurante', () => {
      expect(validarMismoRestaurante(null, { restauranteId: 'r1' })).toEqual([]);
      expect(validarMismoRestaurante('r1', { restauranteId: 'r1' })).toEqual([]);
    });

    it('rechaza productos de otro restaurante', () => {
      expect(validarMismoRestaurante('r1', { restauranteId: 'r2' })[0].regla).toBe('RN-03');
    });
  });

  describe('validarCobertura (RN-05)', () => {
    it('rechaza una dirección fuera de la ciudad del restaurante', () => {
      const errores = validarCobertura({ ciudad: 'Bogotá' }, restaurante);
      expect(errores[0].regla).toBe('RN-05');
    });

    it('acepta una dirección en la misma ciudad', () => {
      expect(validarCobertura(armenia, restaurante)).toEqual([]);
    });
  });

  describe('validarPedido', () => {
    const tarjeta = { tipo: 'TARJETA' as const };
    const efectivo = { tipo: 'EFECTIVO' as const };

    it('acepta un pedido válido', () => {
      const items = [crearItem()];
      expect(validarPedido(items, productos, restaurante, armenia, tarjeta, null)).toEqual([]);
    });

    it('RN-04: rechaza un subtotal menor al mínimo', () => {
      const items = [crearItem({ precioUnitario: 10000 })];
      const errores = validarPedido(items, productos, restaurante, armenia, tarjeta, null);
      expect(errores.map((e) => e.regla)).toEqual(['RN-04']);
    });

    it('RN-04: rechaza un carrito vacío', () => {
      const errores = validarPedido([], productos, restaurante, armenia, tarjeta, null);
      expect(errores[0].regla).toBe('RN-04');
    });

    it('RN-07: rechaza efectivo que no cubre el total', () => {
      const items = [crearItem()]; // total 35.000 + 5.000 + 2.800 = 42.800
      const errores = validarPedido(items, productos, restaurante, armenia, efectivo, 40000);
      expect(errores.map((e) => e.regla)).toEqual(['RN-07']);
    });

    it('RN-07: acepta efectivo que cubre el total exacto', () => {
      const items = [crearItem()];
      expect(validarPedido(items, productos, restaurante, armenia, efectivo, 42800)).toEqual([]);
    });

    it('RN-01: detecta un producto agotado desde que se armó el carrito', () => {
      const items = [crearItem()];
      const agotados = [crearProducto({ stock: 0 })];
      const errores = validarPedido(items, agotados, restaurante, armenia, tarjeta, null);
      expect(errores[0].regla).toBe('RN-01');
    });

    it('acumula varios errores a la vez', () => {
      const items = [crearItem({ cantidad: 20 })];
      const errores = validarPedido(
        items,
        productos,
        restaurante,
        { ciudad: 'Bogotá' },
        tarjeta,
        null,
      );
      expect(errores.map((e) => e.regla)).toEqual(['RN-02', 'RN-05']);
    });
  });

  describe('transiciones de estado', () => {
    it('permite el flujo normal', () => {
      expect(puedeTransicionar('PENDIENTE', 'ASIGNADO')).toBe(true);
      expect(puedeTransicionar('ASIGNADO', 'EN_CAMINO')).toBe(true);
      expect(puedeTransicionar('EN_CAMINO', 'ENTREGADO')).toBe(true);
    });

    it('no permite saltarse estados ni salir de uno final', () => {
      expect(puedeTransicionar('PENDIENTE', 'ENTREGADO')).toBe(false);
      expect(puedeTransicionar('ENTREGADO', 'CANCELADO')).toBe(false);
    });

    it('solo se cancela antes de salir a la calle', () => {
      expect(puedeCancelar('PENDIENTE')).toBe(true);
      expect(puedeCancelar('ASIGNADO')).toBe(true);
      expect(puedeCancelar('EN_CAMINO')).toBe(false);
    });
  });

  describe('normalizarCodigo', () => {
    it('unifica mayúsculas, espacios y guion', () => {
      expect(normalizarCodigo(' ue-102340 ')).toBe('UE-102340');
      expect(normalizarCodigo('UE102340')).toBe('UE-102340');
      expect(normalizarCodigo('102340')).toBe('UE-102340');
    });

    it('devuelve vacío si no hay dígitos', () => {
      expect(normalizarCodigo('abc')).toBe('');
    });
  });
});
