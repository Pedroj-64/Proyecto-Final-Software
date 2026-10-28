import { CopPipe } from './cop.pipe';

describe('CopPipe', () => {
  const pipe = new CopPipe();

  it('formatea con separador de miles colombiano', () => {
    expect(pipe.transform(107000)).toBe('COP 107.000');
  });

  it('muestra descuentos con signo', () => {
    expect(pipe.transform(6700, '-')).toBe('- COP 6.700');
  });

  it('trata valores nulos como cero', () => {
    expect(pipe.transform(null)).toBe('COP 0');
  });
});
