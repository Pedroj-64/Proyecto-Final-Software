import { crearMiniatura, dimensionesMiniatura } from './miniatura';

/**
 * Solo se prueba el cálculo del tamaño y el rechazo de archivos que no son imagen:
 * jsdom no decodifica imágenes ni dibuja en <canvas>, así que la reducción real se revisa a mano.
 */
describe('miniatura de la foto de entrega', () => {
  it('reduce el lado mayor a 320 px conservando la proporción', () => {
    expect(dimensionesMiniatura(4000, 3000)).toEqual({ ancho: 320, alto: 240 });
    expect(dimensionesMiniatura(1080, 1920)).toEqual({ ancho: 180, alto: 320 });
    expect(dimensionesMiniatura(1000, 1000)).toEqual({ ancho: 320, alto: 320 });
  });

  it('no agranda una imagen más pequeña', () => {
    expect(dimensionesMiniatura(200, 100)).toEqual({ ancho: 200, alto: 100 });
  });

  it('nunca devuelve un tamaño cero', () => {
    expect(dimensionesMiniatura(0, 0)).toEqual({ ancho: 1, alto: 1 });
    expect(dimensionesMiniatura(5000, 2)).toEqual({ ancho: 320, alto: 1 });
  });

  it('rechaza un archivo que no es imagen', async () => {
    const pdf = new File(['%PDF'], 'factura.pdf', { type: 'application/pdf' });
    await expect(crearMiniatura(pdf)).rejects.toThrow('no es una imagen');
  });
});
