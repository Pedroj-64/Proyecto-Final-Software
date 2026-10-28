import { Injectable } from '@angular/core';

/**
 * Envoltura sobre `localStorage`. Simula la capa de persistencia de un backend y
 * tolera navegadores donde el almacenamiento no está disponible (modo privado).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefijo = 'urban-eats:';

  leer<T>(clave: string): T | null {
    try {
      const valor = localStorage.getItem(this.prefijo + clave);
      return valor ? (JSON.parse(valor) as T) : null;
    } catch {
      return null;
    }
  }

  guardar(clave: string, valor: unknown): void {
    try {
      localStorage.setItem(this.prefijo + clave, JSON.stringify(valor));
    } catch {
      // Sin almacenamiento: la app sigue funcionando en memoria.
    }
  }

  eliminar(clave: string): void {
    try {
      localStorage.removeItem(this.prefijo + clave);
    } catch {
      // Ignorado a propósito.
    }
  }
}
