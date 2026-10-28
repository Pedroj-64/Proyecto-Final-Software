import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Rol } from '@core/models';
import { BaseDatosService } from './base-datos.service';
import { StorageService } from './storage.service';

export interface Sesion {
  rol: Rol;
  /** Id del cliente, restaurante o repartidor según el rol. */
  usuarioId: string;
}

/** Usuario demo activo. El MVP no tiene autenticación real (ver README). */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly storage = inject(StorageService);
  private readonly db = inject(BaseDatosService);

  readonly sesion = signal<Sesion | null>(this.storage.leer<Sesion>('sesion'));
  readonly rol = computed(() => this.sesion()?.rol ?? null);

  readonly cliente = computed(() => this.buscar('CLIENTE', this.db.clientes()));
  readonly restaurante = computed(() => this.buscar('RESTAURANTE', this.db.restaurantes()));
  readonly repartidor = computed(() => this.buscar('REPARTIDOR', this.db.repartidores()));

  readonly nombreUsuario = computed(
    () => this.cliente()?.nombre ?? this.restaurante()?.nombre ?? this.repartidor()?.nombre ?? '',
  );

  constructor() {
    effect(() => {
      const sesion = this.sesion();
      if (sesion) this.storage.guardar('sesion', sesion);
      else this.storage.eliminar('sesion');
    });
  }

  iniciar(rol: Rol, usuarioId: string): void {
    this.sesion.set({ rol, usuarioId });
  }

  cerrar(): void {
    this.sesion.set(null);
  }

  private buscar<T extends { id: string }>(rol: Rol, lista: readonly T[]): T | undefined {
    const sesion = this.sesion();
    return sesion?.rol === rol ? lista.find((x) => x.id === sesion.usuarioId) : undefined;
  }
}
