import { Injectable, computed, inject } from '@angular/core';
import { Direccion, Resultado, exito, fallo } from '@core/models';
import { BaseDatosService } from './base-datos.service';
import { SesionService } from './sesion.service';

/** Datos que el cliente escribe al registrar una dirección nueva. */
export type DatosDireccion = Omit<Direccion, 'id'>;

/**
 * Direcciones y métodos de pago del cliente en sesión (proceso 2, pasos de checkout).
 * Endpoints REST equivalentes:
 * - direcciones() → GET /clientes/{id}/direcciones
 * - metodosPago() → GET /clientes/{id}/metodos-pago
 * - agregarDireccion → POST /clientes/{id}/direcciones
 */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);

  readonly direcciones = computed(() => this.sesion.cliente()?.direcciones ?? []);
  readonly metodosPago = computed(() => this.sesion.cliente()?.metodosPago ?? []);

  /** Guarda una dirección nueva del cliente en sesión. */
  agregarDireccion(datos: DatosDireccion): Resultado<Direccion> {
    const cliente = this.sesion.cliente();
    const linea = datos.linea.trim();
    if (!cliente) {
      return fallo([
        { regla: 'RN-05', mensaje: 'Inicia sesión como cliente para guardar una dirección.' },
      ]);
    }
    if (linea.length < 5) {
      return fallo([
        { regla: 'RN-05', mensaje: 'Escribe la dirección completa (mínimo 5 caracteres).' },
      ]);
    }

    const direccion: Direccion = { ...datos, linea, id: crypto.randomUUID() };
    this.db.actualizarClientes((clientes) =>
      clientes.map((c) =>
        c.id === cliente.id ? { ...c, direcciones: [...c.direcciones, direccion] } : c,
      ),
    );
    return exito(direccion);
  }
}
