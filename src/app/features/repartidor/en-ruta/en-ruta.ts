import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pantalla pendiente: la implementa su dueño según el reparto del equipo. */
@Component({
  selector: 'app-en-ruta',
  template: `<section class="pagina">
    <h1>EnRuta</h1>
    <p>Pendiente de implementar.</p>
  </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnRuta {}
