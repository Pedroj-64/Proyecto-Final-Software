import { pedidosIniciales } from '@core/data/seed';
import { calcularLiquidacion } from './liquidacion';

describe('liquidacion (RN-13)', () => {
  it('liquida 10 % de comisión + 19 % de IVA sobre la comisión', () => {
    const pedido = pedidosIniciales()[0]; // subtotal 67.000
    const liquidacion = calcularLiquidacion(pedido);
    expect(liquidacion.comision).toBe(6700);
    expect(liquidacion.ivaComision).toBe(1273);
    expect(liquidacion.totalRestaurante).toBe(67000 - 6700 - 1273);
    expect(liquidacion.pagoRepartidor).toBe(5000);
  });
});
