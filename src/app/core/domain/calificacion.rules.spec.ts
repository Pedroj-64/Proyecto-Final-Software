import { Calificacion } from '@core/models';
import { validarCalificacion } from './calificacion.rules';

describe('calificacion.rules (RN-12)', () => {
  const entregado = { estado: 'ENTREGADO' as const, calificacion: null };
  const estrellas = (estrellasRestaurante: number, estrellasRepartidor: number) => ({
    estrellasRestaurante,
    estrellasRepartidor,
  });

  it('acepta un pedido entregado sin calificar con 1 a 5 estrellas', () => {
    expect(validarCalificacion(entregado, estrellas(1, 5))).toEqual([]);
    expect(validarCalificacion(entregado, estrellas(3, 4))).toEqual([]);
  });

  it('rechaza un pedido que no ha sido entregado', () => {
    const errores = validarCalificacion(
      { estado: 'EN_CAMINO', calificacion: null },
      estrellas(5, 5),
    );
    expect(errores.map((e) => e.regla)).toEqual(['RN-12']);
  });

  it('rechaza calificar dos veces', () => {
    const previa: Calificacion = {
      estrellasRestaurante: 5,
      comentarioRestaurante: '',
      estrellasRepartidor: 5,
      comentarioRepartidor: '',
      fecha: '2026-11-01T12:00:00.000Z',
    };
    const errores = validarCalificacion({ ...entregado, calificacion: previa }, estrellas(4, 4));
    expect(errores.map((e) => e.regla)).toEqual(['RN-12']);
  });

  it('rechaza estrellas fuera de rango o no enteras', () => {
    expect(validarCalificacion(entregado, estrellas(0, 5)).length).toBe(1);
    expect(validarCalificacion(entregado, estrellas(5, 6)).length).toBe(1);
    expect(validarCalificacion(entregado, estrellas(3.5, 0)).length).toBe(2);
  });
});
