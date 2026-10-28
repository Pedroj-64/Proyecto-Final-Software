import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vacío reutilizable (carrito vacío, sin pedidos, etc.). */
@Component({
  selector: 'app-estado-vacio',
  template: `
    <div class="vacio">
      <span class="icono" aria-hidden="true">{{ icono() }}</span>
      <h3>{{ titulo() }}</h3>
      <p class="texto-suave">{{ descripcion() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .vacio {
      text-align: center;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }
    .icono {
      font-size: 3rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoVacio {
  readonly icono = input('🍽️');
  readonly titulo = input.required<string>();
  readonly descripcion = input('');
}
