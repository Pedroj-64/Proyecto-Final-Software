import { crearItem } from '../../../testing/fabricas';
import { calcularCambio, calcularCostos, precioUnitarioConOpciones } from './costos';

describe('costos (RN-06, RN-07)', () => {
  it('suma las opciones adicionales al precio unitario', () => {
    const item = crearItem({ opciones: [{ id: 'o1', nombre: 'Extra queso', precioExtra: 5000 }] });
    expect(precioUnitarioConOpciones(item)).toBe(40000);
  });

  it('calcula subtotal, envío fijo e impuesto al consumo del 8 %', () => {
    const costos = calcularCostos([
      crearItem({ cantidad: 2 }),
      crearItem({ precioUnitario: 32000 }),
    ]);
    expect(costos).toEqual({ subtotal: 102000, envio: 5000, impuestos: 8160, total: 115160 });
  });

  it('no cobra envío ni impuestos a un carrito vacío', () => {
    expect(calcularCostos([])).toEqual({ subtotal: 0, envio: 0, impuestos: 0, total: 0 });
  });

  it('calcula el cambio del pago en efectivo y nunca devuelve negativo', () => {
    expect(calcularCambio(77360, 100000)).toBe(22640);
    expect(calcularCambio(77360, 50000)).toBe(0);
  });
});
