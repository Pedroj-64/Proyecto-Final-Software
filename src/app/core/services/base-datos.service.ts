import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CLIENTES, PRODUCTOS, REPARTIDORES, RESTAURANTES, pedidosIniciales } from '@core/data/seed';
import { Cliente, Pedido, Producto, Repartidor, Restaurante } from '@core/models';
import { StorageService } from './storage.service';

interface Esquema {
  version: number;
  restaurantes: Restaurante[];
  productos: Producto[];
  clientes: Cliente[];
  repartidores: Repartidor[];
  pedidos: Pedido[];
}

const CLAVE = 'db';
const VERSION = 1;

function datosSemilla(): Esquema {
  return structuredClone({
    version: VERSION,
    restaurantes: RESTAURANTES,
    productos: PRODUCTOS,
    clientes: CLIENTES,
    repartidores: REPARTIDORES,
    pedidos: pedidosIniciales(),
  });
}

/**
 * Base de datos en memoria persistida en el navegador.
 * Hace las veces del backend del MVP: los servicios de cada feature son los
 * "controladores" y aquí solo viven las colecciones.
 */
@Injectable({ providedIn: 'root' })
export class BaseDatosService {
  private readonly storage = inject(StorageService);
  private readonly estado = signal<Esquema>(this.cargar());

  readonly restaurantes = computed(() => this.estado().restaurantes);
  readonly productos = computed(() => this.estado().productos);
  readonly clientes = computed(() => this.estado().clientes);
  readonly repartidores = computed(() => this.estado().repartidores);
  readonly pedidos = computed(() => this.estado().pedidos);

  constructor() {
    effect(() => this.storage.guardar(CLAVE, this.estado()));
  }

  actualizarClientes(fn: (clientes: Cliente[]) => Cliente[]): void {
    this.estado.update((db) => ({ ...db, clientes: fn(db.clientes) }));
  }

  actualizarProductos(fn: (productos: Producto[]) => Producto[]): void {
    this.estado.update((db) => ({ ...db, productos: fn(db.productos) }));
  }

  actualizarPedidos(fn: (pedidos: Pedido[]) => Pedido[]): void {
    this.estado.update((db) => ({ ...db, pedidos: fn(db.pedidos) }));
  }

  /** Aplica cambios a productos y pedidos de forma atómica (una sola transacción). */
  transaccion(
    fn: (db: Pick<Esquema, 'productos' | 'pedidos'>) => Pick<Esquema, 'productos' | 'pedidos'>,
  ): void {
    this.estado.update((db) => ({
      ...db,
      ...fn({ productos: db.productos, pedidos: db.pedidos }),
    }));
  }

  restablecer(): void {
    this.estado.set(datosSemilla());
  }

  private cargar(): Esquema {
    const guardado = this.storage.leer<Esquema>(CLAVE);
    return guardado?.version === VERSION ? guardado : datosSemilla();
  }
}
