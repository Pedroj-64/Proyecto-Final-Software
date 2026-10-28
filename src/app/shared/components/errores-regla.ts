import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CATALOGO_REGLAS } from '@core/domain/reglas';
import { ErrorRegla } from '@core/models';

/** Muestra los errores de reglas de negocio junto al código de la regla violada. */
@Component({
  selector: 'app-errores-regla',
  template: `
    @if (errores().length) {
      <div class="aviso aviso-error" role="alert">
        <ul>
          @for (error of errores(); track $index) {
            <li [title]="catalogo[error.regla]">
              <strong>{{ error.regla }}:</strong> {{ error.mensaje }}
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    ul {
      margin: 0;
      padding-left: 1.1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErroresRegla {
  readonly errores = input.required<readonly ErrorRegla[]>();
  /** Enunciado completo de cada regla, mostrado como ayuda al pasar el cursor. */
  protected readonly catalogo = CATALOGO_REGLAS;
}
