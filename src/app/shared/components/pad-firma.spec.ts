import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { PadFirma } from './pad-firma';

const PNG = 'data:image/png;base64,FIRMA';

@Component({
  imports: [PadFirma],
  template: `<app-pad-firma [(firma)]="firma" />`,
})
class Anfitrion {
  readonly firma = signal<string | null>(null);
}

/**
 * jsdom no dibuja en <canvas> (getContext y toDataURL devuelven null sin el paquete nativo
 * `canvas`), así que se simulan: se prueba la lógica del componente, no los píxeles.
 */
describe('PadFirma', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let canvas: HTMLCanvasElement;
  let ctx: {
    beginPath: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
    clearRect: ReturnType<typeof vi.fn>;
  };
  let toDataURL: MockInstance<HTMLCanvasElement['toDataURL']>;

  const puntero = (tipo: string, x: number, y: number) => {
    canvas.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true }));
    fixture.detectChanges();
  };
  const boton = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const estado = () => fixture.nativeElement.querySelector('.estado').textContent.trim();

  beforeEach(() => {
    ctx = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(PNG);

    fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    canvas = fixture.nativeElement.querySelector('canvas');
  });

  afterEach(() => vi.restoreAllMocks());

  it('empieza sin firma, con "Limpiar" deshabilitado y nombre accesible', () => {
    expect(fixture.componentInstance.firma()).toBeNull();
    expect(boton().disabled).toBe(true);
    expect(estado()).toBe('Sin firma');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Firma del cliente');
  });

  it('al trazar una línea emite la firma como imagen en texto', () => {
    puntero('pointerdown', 10, 10);
    puntero('pointermove', 40, 30);
    puntero('pointerup', 40, 30);

    expect(ctx.lineTo).toHaveBeenCalledWith(40, 30);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(fixture.componentInstance.firma()).toBe(PNG);
    expect(boton().disabled).toBe(false);
    expect(estado()).toBe('Firma registrada');
  });

  it('un toque sin movimiento no cuenta como firma', () => {
    puntero('pointerdown', 10, 10);
    puntero('pointermove', 10, 10);
    puntero('pointerup', 10, 10);

    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(toDataURL).not.toHaveBeenCalled();
    expect(fixture.componentInstance.firma()).toBeNull();
  });

  it('mover el puntero sin presionar no dibuja', () => {
    puntero('pointermove', 10, 10);
    puntero('pointermove', 50, 50);
    puntero('pointerup', 50, 50);

    expect(ctx.stroke).not.toHaveBeenCalled();
    expect(fixture.componentInstance.firma()).toBeNull();
  });

  it('limpiar borra el dibujo y vuelve a null', () => {
    puntero('pointerdown', 10, 10);
    puntero('pointermove', 40, 30);
    puntero('pointerup', 40, 30);

    boton().click();
    fixture.detectChanges();

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 600, 200);
    expect(fixture.componentInstance.firma()).toBeNull();
    expect(boton().disabled).toBe(true);
    expect(estado()).toBe('Sin firma');
  });

  it('emite null si el navegador no logra generar la imagen', () => {
    toDataURL.mockReturnValue('data:,');
    puntero('pointerdown', 10, 10);
    puntero('pointermove', 40, 30);
    puntero('pointerup', 40, 30);

    expect(fixture.componentInstance.firma()).toBeNull();
  });
});
