import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { EstadoPedido } from '@core/models';
import { ETIQUETAS_ESTADO } from '@shared/pipes/estado-pedido.pipe';

const PASOS: EstadoPedido[] = ['PENDIENTE', 'ASIGNADO', 'EN_CAMINO', 'ENTREGADO'];

/** Línea de tiempo del estado del pedido (Pendiente → Preparación → En camino → Entregado). */
@Component({
  selector: 'app-seguimiento-pedido',
  template: `
    <ol class="pasos" aria-label="Estado del pedido">
      @for (paso of pasos; track paso; let i = $index) {
        <li
          [class.hecho]="i <= indiceActual()"
          [attr.aria-current]="i === indiceActual() ? 'step' : null"
        >
          <span class="punto" aria-hidden="true"></span>
          {{ etiquetas[paso] }}
        </li>
      }
    </ol>
    <p class="estado">Estado: {{ etiquetas[estado()] | uppercase }}</p>
  `,
  styles: `
    .pasos {
      display: flex;
      justify-content: space-between;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: 0.75rem;
      color: var(--color-texto-suave);
    }
    li {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
    }
    .punto {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background: var(--color-borde);
    }
    .hecho {
      color: var(--color-marca);
      font-weight: 700;
    }
    .hecho .punto {
      background: var(--color-marca);
    }
    .estado {
      text-align: center;
      font-weight: 700;
      font-size: 0.8rem;
      margin: 0.5rem 0 0;
    }
  `,
  imports: [UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeguimientoPedido {
  readonly estado = input.required<EstadoPedido>();
  protected readonly pasos = PASOS;
  protected readonly etiquetas = ETIQUETAS_ESTADO;
  protected readonly indiceActual = computed(() => PASOS.indexOf(this.estado()));
}
