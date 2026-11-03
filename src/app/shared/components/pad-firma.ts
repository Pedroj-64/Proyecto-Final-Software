import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

interface Punto {
  x: number;
  y: number;
}

/** Imagen que devuelve el navegador cuando el canvas no tiene tamaño: no es una firma. */
const IMAGEN_VACIA = 'data:,';

/**
 * Pad para que el cliente firme con el mouse o el dedo (eventos de puntero).
 * La firma sale como imagen PNG en texto (data URL) solo si se trazó al menos una línea;
 * vacío o tras limpiar vale `null`, para que RN-11 no acepte una firma en blanco.
 * Admite two-way binding: `<app-pad-firma [(firma)]="firma" />`.
 */
@Component({
  selector: 'app-pad-firma',
  template: `
    <div class="pad">
      <canvas
        #lienzo
        width="600"
        height="200"
        role="img"
        [attr.aria-label]="etiqueta()"
        (pointerdown)="iniciar($event)"
        (pointermove)="trazar($event)"
        (pointerup)="terminar()"
        (pointercancel)="terminar()"
        (pointerleave)="terminar()"
      ></canvas>
      @if (!hayTrazo()) {
        <span class="guia" aria-hidden="true">Firme aquí</span>
      }
    </div>
    <div class="acciones">
      <span class="estado" aria-live="polite">{{
        firma() ? 'Firma registrada' : 'Sin firma'
      }}</span>
      <button type="button" class="btn btn-borde" [disabled]="!hayTrazo()" (click)="limpiar()">
        Limpiar firma
      </button>
    </div>
  `,
  styles: `
    .pad {
      position: relative;
      overflow: hidden;
      background: var(--color-superficie);
      border: 2px dashed var(--color-borde);
      border-radius: 0.75rem;
    }
    /* Sin borde ni relleno: el área visible mantiene la proporción 3:1 del lienzo (600x200). */
    canvas {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 3 / 1;
      touch-action: none;
      cursor: crosshair;
    }
    .guia {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--color-texto-suave);
      pointer-events: none;
    }
    .acciones {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .estado {
      font-size: 0.85rem;
      color: var(--color-texto-suave);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PadFirma {
  /** Nombre accesible del área de firma. */
  readonly etiqueta = input('Firma del cliente');
  /** Firma como data URL PNG, o `null` si no se ha firmado. */
  readonly firma = model<string | null>(null);

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  /** Hay al menos una línea dibujada (un toque sin mover no cuenta). */
  protected readonly hayTrazo = signal(false);
  private ultimo: Punto | null = null;

  protected iniciar(evento: PointerEvent): void {
    evento.preventDefault();
    const canvas = this.lienzo().nativeElement;
    canvas.setPointerCapture?.(evento.pointerId);
    this.ultimo = this.punto(evento);
  }

  protected trazar(evento: PointerEvent): void {
    if (!this.ultimo) return;
    const actual = this.punto(evento);
    if (actual.x === this.ultimo.x && actual.y === this.ultimo.y) return;

    const ctx = this.contexto();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(this.ultimo.x, this.ultimo.y);
      ctx.lineTo(actual.x, actual.y);
      ctx.stroke();
    }
    this.ultimo = actual;
    this.hayTrazo.set(true);
  }

  protected terminar(): void {
    if (!this.ultimo) return;
    this.ultimo = null;
    this.firma.set(this.hayTrazo() ? this.imagen() : null);
  }

  /** Borra el dibujo y deja la firma en `null`. */
  limpiar(): void {
    const canvas = this.lienzo().nativeElement;
    this.contexto()?.clearRect(0, 0, canvas.width, canvas.height);
    this.ultimo = null;
    this.hayTrazo.set(false);
    this.firma.set(null);
  }

  private contexto(): CanvasRenderingContext2D | null {
    const ctx = this.lienzo().nativeElement.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#2b1d14';
    }
    return ctx;
  }

  /** PNG del canvas; `null` si el navegador no puede generarlo. */
  private imagen(): string | null {
    const url = this.lienzo().nativeElement.toDataURL('image/png');
    return url && url !== IMAGEN_VACIA ? url : null;
  }

  /**
   * Posición del puntero en coordenadas internas del canvas (que se escala con CSS).
   * Se mide el área de dibujo sin el borde: `getBoundingClientRect` sí lo incluye, así que se
   * descuenta con `clientLeft`/`clientTop` y se escala con `clientWidth`/`clientHeight`.
   */
  private punto(evento: PointerEvent): Punto {
    const canvas = this.lienzo().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.clientWidth ? canvas.width / canvas.clientWidth : 1;
    const escalaY = canvas.clientHeight ? canvas.height / canvas.clientHeight : 1;
    return {
      x: Math.round((evento.clientX - rect.left - canvas.clientLeft) * escalaX),
      y: Math.round((evento.clientY - rect.top - canvas.clientTop) * escalaY),
    };
  }
}
