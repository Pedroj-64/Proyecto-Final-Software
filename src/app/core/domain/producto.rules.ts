import { CATEGORIAS, ErrorRegla, EstadoProducto, Producto } from '@core/models';
import { REGLAS } from './reglas';

export type DatosProducto = Pick<
  Producto,
  'nombre' | 'descripcion' | 'categoria' | 'precio' | 'stock' | 'visible' | 'emoji'
>;

/** Estado mostrado en el catálogo: oculto tiene prioridad sobre agotado. */
export function estadoProducto(producto: Pick<Producto, 'stock' | 'visible'>): EstadoProducto {
  if (!producto.visible) return 'OCULTO';
  return producto.stock > 0 ? 'ACTIVO' : 'AGOTADO';
}

/**
 * Reglas del CRUD de Producto (RP-01 a RP-04).
 * `otros` son los productos del mismo restaurante, excluyendo el que se edita.
 */
export function validarProducto(datos: DatosProducto, otros: readonly Producto[]): ErrorRegla[] {
  const errores: ErrorRegla[] = [];
  const nombre = datos.nombre.trim();

  if (nombre.length < 3 || nombre.length > 60) {
    errores.push({ regla: 'RP-01', mensaje: 'El nombre debe tener entre 3 y 60 caracteres.' });
  } else if (otros.some((p) => p.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
    errores.push({ regla: 'RP-01', mensaje: `Ya existe un producto llamado "${nombre}".` });
  }

  if (!CATEGORIAS.includes(datos.categoria)) {
    errores.push({ regla: 'RP-01', mensaje: 'Selecciona una categoría válida.' });
  }

  if (!Number.isInteger(datos.precio) || datos.precio <= 0) {
    errores.push({ regla: 'RP-02', mensaje: 'El precio debe ser un valor entero mayor que cero.' });
  } else if (datos.precio % REGLAS.MULTIPLO_PRECIO !== 0) {
    errores.push({
      regla: 'RP-02',
      mensaje: `El precio debe ser múltiplo de COP ${REGLAS.MULTIPLO_PRECIO}.`,
    });
  }

  if (!Number.isInteger(datos.stock) || datos.stock < 0 || datos.stock > REGLAS.STOCK_MAXIMO) {
    errores.push({
      regla: 'RP-03',
      mensaje: `El stock debe ser un entero entre 0 y ${REGLAS.STOCK_MAXIMO}.`,
    });
  }

  if (datos.descripcion.length > 200) {
    errores.push({ regla: 'RP-01', mensaje: 'La descripción admite máximo 200 caracteres.' });
  }

  return errores;
}
