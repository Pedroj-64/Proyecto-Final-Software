import { crearProducto } from '../../../testing/fabricas';
import { DatosProducto, estadoProducto, validarProducto } from './producto.rules';

const datosValidos: DatosProducto = {
  nombre: 'Arepa de Choclo',
  descripcion: 'Con queso',
  categoria: 'Entradas',
  precio: 12000,
  stock: 20,
  visible: true,
  emoji: '🫓',
};

const reglas = (datos: Partial<DatosProducto>, otros = [crearProducto()]) =>
  validarProducto({ ...datosValidos, ...datos }, otros).map((e) => e.regla);

describe('reglas de Producto (RP-01 a RP-03)', () => {
  it('acepta un producto válido', () => {
    expect(reglas({})).toEqual([]);
  });

  it('RP-01: rechaza nombres duplicados sin importar mayúsculas ni espacios', () => {
    expect(reglas({ nombre: '  bandeja PAISA ' })).toEqual(['RP-01']);
  });

  it('RP-01: exige entre 3 y 60 caracteres', () => {
    expect(reglas({ nombre: 'ab' })).toEqual(['RP-01']);
    expect(reglas({ nombre: 'x'.repeat(61) })).toEqual(['RP-01']);
  });

  it('RP-02: el precio debe ser entero, positivo y múltiplo de 50', () => {
    expect(reglas({ precio: 0 })).toEqual(['RP-02']);
    expect(reglas({ precio: 12025 })).toEqual(['RP-02']);
    expect(reglas({ precio: 12000.5 })).toEqual(['RP-02']);
  });

  it('RP-03: el stock debe estar entre 0 y 999', () => {
    expect(reglas({ stock: -1 })).toEqual(['RP-03']);
    expect(reglas({ stock: 1000 })).toEqual(['RP-03']);
    expect(reglas({ stock: 0 })).toEqual([]);
  });

  it('deriva el estado: oculto tiene prioridad sobre agotado', () => {
    expect(estadoProducto({ stock: 5, visible: true })).toBe('ACTIVO');
    expect(estadoProducto({ stock: 0, visible: true })).toBe('AGOTADO');
    expect(estadoProducto({ stock: 0, visible: false })).toBe('OCULTO');
  });
});
