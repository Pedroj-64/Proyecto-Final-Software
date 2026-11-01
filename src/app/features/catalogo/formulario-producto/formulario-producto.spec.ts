import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BaseDatosService } from '@core/services/base-datos.service';
import { ProductoService } from '@core/services/producto.service';
import { SesionService } from '@core/services/sesion.service';
import { FormularioProducto } from './formulario-producto';

@Component({ template: '' })
class PaginaVacia {}

describe('FormularioProducto', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [FormularioProducto],
      providers: [provideRouter([{ path: 'restaurante/catalogo', component: PaginaVacia }])],
    });
    TestBed.inject(BaseDatosService).restablecer();
    TestBed.inject(SesionService).iniciar('RESTAURANTE', 'r1');
  });

  async function montar(id?: string) {
    const fixture = TestBed.createComponent(FormularioProducto);
    if (id) fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
    return { fixture, elemento: fixture.nativeElement as HTMLElement };
  }

  function escribir(elemento: HTMLElement, etiqueta: string, valor: string) {
    const campo = [...elemento.querySelectorAll('label')]
      .find((l) => l.textContent?.trim().startsWith(etiqueta))
      ?.querySelector('input');
    if (!campo) throw new Error(`Campo ${etiqueta} no encontrado`);
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  it('muestra la regla de negocio violada cuando el nombre ya existe', async () => {
    const { fixture, elemento } = await montar();
    escribir(elemento, 'Nombre', 'Bandeja Paisa');
    escribir(elemento, 'Precio', '20000');
    elemento.querySelector<HTMLButtonElement>('button[type=submit]')?.click();
    await fixture.whenStable();

    expect(elemento.querySelector('[role=alert]')?.textContent).toContain('RP-01');
  });

  it('carga los datos del producto al editar', async () => {
    const { elemento } = await montar('p2');
    expect(elemento.querySelector('h1')?.textContent).toContain('Editar producto');
    const nombre = elemento.querySelector<HTMLInputElement>('input[formcontrolname=nombre]');
    expect(nombre?.value).toBe('Ajiaco Santafereño');
  });

  it('crea el producto cuando el formulario es válido', async () => {
    const { fixture, elemento } = await montar();
    escribir(elemento, 'Nombre', 'Arepa de Choclo');
    escribir(elemento, 'Precio', '12000');
    escribir(elemento, 'Stock', '8');
    elemento.querySelector<HTMLButtonElement>('button[type=submit]')?.click();
    await fixture.whenStable();

    const creado = TestBed.inject(ProductoService)
      .listarPorRestaurante('r1')
      .find((p) => p.nombre === 'Arepa de Choclo');
    expect(creado?.stock).toBe(8);
    expect(TestBed.inject(Router).url).toBe('/restaurante/catalogo');
  });
});
