import { TestBed } from '@angular/core/testing';
import { DatosProducto } from '@core/domain/producto.rules';
import { BaseDatosService } from './base-datos.service';
import { ProductoService } from './producto.service';

const nuevo: DatosProducto = {
  nombre: 'Arepa de Choclo',
  descripcion: 'Con queso campesino',
  categoria: 'Entradas',
  precio: 12000,
  stock: 15,
  visible: true,
  emoji: '🫓',
};

describe('ProductoService (CRUD de Producto)', () => {
  let servicio: ProductoService;
  let db: BaseDatosService;

  beforeEach(() => {
    localStorage.clear();
    servicio = TestBed.inject(ProductoService);
    db = TestBed.inject(BaseDatosService);
    db.restablecer();
  });

  it('lista solo los productos del restaurante', () => {
    const lista = servicio.listarPorRestaurante('r1');
    expect(lista.length).toBe(10);
    expect(lista.every((p) => p.restauranteId === 'r1')).toBe(true);
  });

  it('el menú publicado excluye los productos ocultos pero conserva los agotados', () => {
    const menu = servicio.menuPublicado('r1').map((p) => p.id);
    expect(menu).not.toContain('p10'); // oculto
    expect(menu).toContain('p5'); // agotado
  });

  it('crea un producto válido', () => {
    const resultado = servicio.crear('r1', { ...nuevo, nombre: '  Arepa de Choclo ' });
    expect(resultado.ok).toBe(true);
    expect(servicio.listarPorRestaurante('r1').some((p) => p.nombre === 'Arepa de Choclo')).toBe(
      true,
    );
  });

  it('no crea un producto con nombre repetido en el mismo restaurante (RP-01)', () => {
    const resultado = servicio.crear('r1', { ...nuevo, nombre: 'Bandeja Paisa' });
    expect(!resultado.ok && resultado.errores[0].regla).toBe('RP-01');
    // En otro restaurante sí se permite.
    expect(servicio.crear('r2', { ...nuevo, nombre: 'Bandeja Paisa' }).ok).toBe(true);
  });

  it('actualiza conservando el nombre propio sin considerarlo duplicado', () => {
    const actual = servicio.obtener('p1');
    if (!actual) throw new Error('sin semilla');
    const resultado = servicio.actualizar('p1', { ...actual, precio: 36000 });
    expect(resultado.ok && resultado.valor.precio).toBe(36000);
  });

  it('cambia la visibilidad', () => {
    servicio.cambiarVisibilidad('p1', false);
    expect(servicio.obtener('p1')?.visible).toBe(false);
  });

  it('elimina un producto que no está en pedidos activos', () => {
    expect(servicio.eliminar('p3').ok).toBe(true);
    expect(servicio.obtener('p3')).toBeUndefined();
  });

  it('RP-04: no elimina un producto que está en un pedido en curso', () => {
    // ped2 (PENDIENTE) contiene p17.
    const resultado = servicio.eliminar('p17');
    expect(!resultado.ok && resultado.errores[0].regla).toBe('RP-04');
    expect(servicio.obtener('p17')).toBeDefined();
  });

  it('persiste los cambios en el almacenamiento local', () => {
    servicio.cambiarVisibilidad('p2', false);
    TestBed.tick();
    const guardado = JSON.parse(localStorage.getItem('urban-eats:db') ?? '{}');
    expect(guardado.productos.find((p: { id: string }) => p.id === 'p2').visible).toBe(false);
  });
});
