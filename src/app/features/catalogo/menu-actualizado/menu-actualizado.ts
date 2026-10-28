import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pantalla pendiente: la implementa su dueño según el reparto del equipo. */
@Component({
  selector: 'app-menu-actualizado',
  template: `<section class="pagina">
    <h1>MenuActualizado</h1>
    <p>Pendiente de implementar.</p>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuActualizado {}
