import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Mensajes breves (toasts) mostrados por el layout principal. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private siguienteId = 1;
  readonly notificaciones = signal<Notificacion[]>([]);

  mostrar(mensaje: string, tipo: TipoNotificacion = 'info', duracionMs = 3000): void {
    const id = this.siguienteId++;
    this.notificaciones.update((lista) => [...lista, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

  cerrar(id: number): void {
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }
}
