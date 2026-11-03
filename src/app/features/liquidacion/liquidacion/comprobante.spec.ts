import { Liquidacion } from '@core/models';
import { escaparHtml, generarComprobante, nombreComprobante } from './comprobante';

const liquidacion: Liquidacion = {
  pedidoCodigo: 'UE-102340',
  items: [
    { nombre: 'Bandeja Paisa', cantidad: 1, total: 35000 },
    { nombre: 'Ajiaco Santafereño', cantidad: 1, total: 32000 },
  ],
  subtotal: 67000,
  comision: 6700,
  ivaComision: 1273,
  totalRestaurante: 59027,
  pagoRepartidor: 5000,
};
const datos = {
  restaurante: 'Sabor Colombiano',
  fechaEntrega: '2 nov 2026, 1:30 p. m.',
  fechaEmision: '3 nov 2026, 9:00 a. m.',
};

describe('comprobante de liquidación (RN-13)', () => {
  it('escapa los caracteres especiales de HTML', () => {
    expect(escaparHtml(`<b>"Té" & 'pan'</b>`)).toBe(
      '&lt;b&gt;&quot;Té&quot; &amp; &#39;pan&#39;&lt;/b&gt;',
    );
  });

  it('incluye el desglose completo de la liquidación', () => {
    const html = generarComprobante(liquidacion, datos);
    expect(html).toContain('#UE-102340');
    expect(html).toContain('Sabor Colombiano');
    expect(html).toContain('Ajiaco Santafereño');
    expect(html).toContain('COP 67.000');
    expect(html).toContain('- COP 6.700');
    expect(html).toContain('- COP 1.273');
    expect(html).toContain('COP 59.027');
    expect(html).toContain('COP 5.000');
    expect(html).toContain('(10 %)');
    expect(html).toContain('(19 %)');
  });

  it('no deja pasar etiquetas en el nombre de un producto ni del restaurante', () => {
    const html = generarComprobante(
      {
        ...liquidacion,
        items: [{ nombre: '<img src=x onerror="alert(1)">', cantidad: 1, total: 1000 }],
      },
      { ...datos, restaurante: '<script>alert(2)</script>' },
    );
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
  });

  it('es un documento HTML completo que jsdom puede leer', () => {
    const doc = new DOMParser().parseFromString(
      generarComprobante(liquidacion, datos),
      'text/html',
    );
    expect(doc.title).toBe('Liquidación UE-102340 · Urban Eats');
    expect(doc.querySelectorAll('tbody tr').length).toBe(2 + 4);
  });

  it('sugiere un nombre de archivo seguro', () => {
    expect(nombreComprobante(liquidacion)).toBe('liquidacion-UE-102340.html');
    expect(nombreComprobante({ pedidoCodigo: 'UE-1/../x' })).toBe('liquidacion-UE-1x.html');
  });
});
