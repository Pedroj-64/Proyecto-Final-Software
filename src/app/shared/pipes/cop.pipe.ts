import { Pipe, PipeTransform } from '@angular/core';

const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/** Formatea pesos colombianos como en las maquetas: "COP 35.000". */
@Pipe({ name: 'cop' })
export class CopPipe implements PipeTransform {
  transform(valor: number | null | undefined, signo: '' | '-' = ''): string {
    return `${signo ? '- ' : ''}COP ${formato.format(valor ?? 0)}`;
  }
}
