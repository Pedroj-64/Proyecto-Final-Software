import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Selector accesible de 1 a 5 estrellas (se usa como radio group). */
@Component({
  selector: 'app-selector-estrellas',
  template: `
    <div class="estrellas" role="radiogroup" [attr.aria-label]="etiqueta()">
      @for (n of opciones; track n) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="valor() === n"
          [attr.aria-label]="n + (n === 1 ? ' estrella' : ' estrellas')"
          [class.llena]="n <= valor()"
          (click)="valor.set(n)"
        >
          ★
        </button>
      }
    </div>
  `,
  styles: `
    .estrellas {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }
    button {
      border: none;
      background: none;
      font-size: 2rem;
      color: #d9cfc4;
      cursor: pointer;
      padding: 0;
    }
    .llena {
      color: #f2a900;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorEstrellas {
  readonly etiqueta = input('Calificación');
  /** Estrellas seleccionadas (0 = sin calificar). Admite two-way binding. */
  readonly valor = model(0);
  protected readonly opciones = [1, 2, 3, 4, 5];
}
