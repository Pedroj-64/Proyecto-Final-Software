import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseDatosService } from '@core/services/base-datos.service';
import { SesionService } from '@core/services/sesion.service';
import { EstadoVacio } from '@shared/components/estado-vacio';

/** Paso 1 del pedido: el cliente elige un restaurante (RF-01). */
@Component({
  selector: 'app-restaurantes',
  imports: [RouterLink, EstadoVacio],
  template: `
    <section class="pagina">
      <h1>Restaurantes</h1>
      <p class="texto-suave">Elige dónde quieres pedir hoy.</p>
      @for (r of restaurantes(); track r.id) {
        <a
          class="tarjeta tarjeta-seleccionable fila"
          [routerLink]="['/cliente/restaurantes', r.id]"
        >
          <span class="miniatura" aria-hidden="true">{{ r.emoji }}</span>
          <span>
            <strong>{{ r.nombre }}</strong
            ><br />
            <span class="texto-suave">
              {{ r.tipoCocina }} · ⭐ {{ r.calificacion }} ({{ r.totalResenas }}) ·
              {{ r.tiempoEntregaMin }}-{{ r.tiempoEntregaMax }} min · {{ r.ciudad }}
            </span>
            @if (!cubre(r.ciudad)) {
              <br /><span class="chip chip-error">Sin cobertura en tus direcciones</span>
            }
          </span>
        </a>
      } @empty {
        <app-estado-vacio icono="🍽️" titulo="No hay restaurantes disponibles" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Restaurantes {
  private readonly db = inject(BaseDatosService);
  private readonly sesion = inject(SesionService);

  protected readonly restaurantes = this.db.restaurantes;
  private readonly ciudadesDelCliente = computed(
    () => new Set<string>(this.sesion.cliente()?.direcciones.map((d) => d.ciudad)),
  );

  /** Avisa de antemano la regla RN-05: el restaurante debe repartir en alguna dirección del cliente. */
  protected cubre(ciudad: string): boolean {
    return this.ciudadesDelCliente().has(ciudad);
  }
}
