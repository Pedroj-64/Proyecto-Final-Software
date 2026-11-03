import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BaseDatosService } from '@core/services/base-datos.service';
import { CarritoService } from '@core/services/carrito.service';
import { Carrito } from './carrito';

describe('Carrito (pantalla)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [Carrito], providers: [provideRouter([])] });
    TestBed.inject(BaseDatosService).restablecer();
  });

  async function montar() {
    const fixture = TestBed.createComponent(Carrito);
    await fixture.whenStable();
    return { fixture, elemento: fixture.nativeElement as HTMLElement };
  }

  it('muestra el estado vacío sin productos', async () => {
    const { elemento } = await montar();
    expect(elemento.textContent).toContain('Tu carrito está vacío');
  });

  it('RN-04: avisa cuánto falta para el pedido mínimo y bloquea continuar', async () => {
    const db = TestBed.inject(BaseDatosService);
    TestBed.inject(CarritoService).agregar(
      db.productos().find((p) => p.precio < 15000 && p.visible && p.stock > 0)!,
      1,
    );
    const { elemento } = await montar();

    expect(elemento.querySelector('[role=status]')?.textContent).toContain('RN-04');
    expect(elemento.querySelector('a.btn-primario')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('aumenta la cantidad de una línea', async () => {
    const db = TestBed.inject(BaseDatosService);
    const carrito = TestBed.inject(CarritoService);
    carrito.agregar(
      db.productos().find((p) => p.stock >= 3)!,
      1,
    );
    const { fixture, elemento } = await montar();
    elemento.querySelector<HTMLButtonElement>('button[aria-label^="Más"]')?.click();
    await fixture.whenStable();

    expect(carrito.cantidadItems()).toBe(2);
  });
});
