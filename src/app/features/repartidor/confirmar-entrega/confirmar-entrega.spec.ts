import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BaseDatosService } from '@core/services/base-datos.service';
import { EntregaService } from '@core/services/entrega.service';
import { SesionService } from '@core/services/sesion.service';
import { ConfirmarEntrega } from './confirmar-entrega';

/**
 * Los errores RN-11 de un intento fallido deben desaparecer en cuanto cambia la evidencia.
 * jsdom no dibuja en <canvas> ni decodifica imágenes, así que se simulan esas APIs del navegador:
 * se prueba el recorrido real del componente (pad de firma y selector de archivo), no los píxeles.
 */
describe('ConfirmarEntrega (RN-11)', () => {
  let fixture: ComponentFixture<ConfirmarEntrega>;
  let elemento: HTMLElement;

  const erroresRegla = () => elemento.querySelector('app-errores-regla')?.textContent?.trim() ?? '';
  const esperarTareas = () => new Promise((resolve) => setTimeout(resolve));

  async function confirmar() {
    elemento.querySelector<HTMLButtonElement>('.accion-fija button')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(BaseDatosService).restablecer();
    TestBed.inject(SesionService).iniciar('REPARTIDOR', 'rp1');
    const entregas = TestBed.inject(EntregaService);
    entregas.aceptar('ped2', 'rp1');
    entregas.confirmarRecogida('ped2', 'rp1', 'UE-102341');

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((tipo?: string) =>
      tipo === 'image/jpeg' ? 'data:image/jpeg;base64,FOTO' : 'data:image/png;base64,FIRMA',
    );

    fixture = TestBed.createComponent(ConfirmarEntrega);
    fixture.componentRef.setInput('id', 'ped2');
    await fixture.whenStable();
    elemento = fixture.nativeElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('borra el error RN-11 al firmar en el pad', async () => {
    await confirmar();
    expect(erroresRegla()).toContain('RN-11');

    const canvas = elemento.querySelector('canvas')!;
    for (const [tipo, x] of [
      ['pointerdown', 10],
      ['pointermove', 60],
      ['pointerup', 60],
    ] as const) {
      canvas.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: 20, bubbles: true }));
    }
    await fixture.whenStable();

    expect(erroresRegla()).toBe('');
  });

  describe('sin contacto', () => {
    const { createObjectURL, revokeObjectURL } = URL;
    afterEach(() => Object.assign(URL, { createObjectURL, revokeObjectURL }));

    function elegirArchivo(archivo: File) {
      const input = elemento.querySelector<HTMLInputElement>('input[type=file]')!;
      Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
      input.dispatchEvent(new Event('change'));
    }

    beforeEach(async () => {
      // Imagen que "carga" de inmediato con un tamaño de foto de celular.
      vi.stubGlobal(
        'Image',
        class {
          naturalWidth = 4000;
          naturalHeight = 3000;
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;
          set src(_url: string) {
            queueMicrotask(() => this.onload?.());
          }
        },
      );
      // jsdom no implementa URL.createObjectURL/revokeObjectURL.
      URL.createObjectURL = vi.fn(() => 'blob:foto');
      URL.revokeObjectURL = vi.fn();

      elemento.querySelector<HTMLInputElement>('input[role=switch]')!.click();
      await fixture.whenStable();
      await confirmar();
      expect(erroresRegla()).toContain('RN-11');
    });

    it('borra el error RN-11 al elegir una foto válida', async () => {
      elegirArchivo(new File(['jpg'], 'entrega.jpg', { type: 'image/jpeg' }));
      await esperarTareas();
      await fixture.whenStable();

      expect(elemento.querySelector('img.foto')?.getAttribute('src')).toBe(
        'data:image/jpeg;base64,FOTO',
      );
      expect(erroresRegla()).toBe('');
    });

    it('mantiene el error RN-11 si la foto no se pudo usar', async () => {
      elegirArchivo(new File(['%PDF'], 'factura.pdf', { type: 'application/pdf' }));
      await esperarTareas();
      await fixture.whenStable();

      expect(elemento.textContent).toContain('El archivo no es una imagen.');
      expect(erroresRegla()).toContain('RN-11');
    });
  });
});
