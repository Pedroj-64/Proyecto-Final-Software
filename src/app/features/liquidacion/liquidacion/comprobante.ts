import { REGLAS } from '@core/domain/reglas';
import { Liquidacion } from '@core/models';
import { CopPipe } from '@shared/pipes/cop.pipe';

/** Datos del encabezado del comprobante que no están en la liquidación. */
export interface DatosComprobante {
  restaurante: string;
  /** Fecha de entrega del pedido, ya formateada para mostrar. */
  fechaEntrega: string;
  /** Fecha en que se genera el comprobante, ya formateada para mostrar. */
  fechaEmision: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapa texto para insertarlo en HTML sin que se interprete como etiquetas o atributos. */
export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

const cop = new CopPipe();
const porcentaje = (tasa: number) => `${Math.round(tasa * 100)} %`;

/** Nombre sugerido para el archivo descargado, p. ej. "liquidacion-UE-102340.html". */
export function nombreComprobante(liquidacion: Pick<Liquidacion, 'pedidoCodigo'>): string {
  return `liquidacion-${liquidacion.pedidoCodigo.replace(/[^\w-]/g, '')}.html`;
}

/**
 * RN-13: documento HTML autocontenido e imprimible con la liquidación del pedido.
 * Todo texto variable se escapa antes de insertarse.
 */
export function generarComprobante(liquidacion: Liquidacion, datos: DatosComprobante): string {
  const e = escaparHtml;
  const filas = liquidacion.items
    .map(
      (i) =>
        `<tr><td>${e(String(i.cantidad))}</td><td>${e(i.nombre)}</td><td class="num">${e(cop.transform(i.total))}</td></tr>`,
    )
    .join('\n          ');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Liquidación ${e(liquidacion.pedidoCodigo)} · Urban Eats</title>
    <style>
      body { font-family: system-ui, sans-serif; color: #2b1d14; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
      h1 { font-size: 1.4rem; margin: 0 0 0.25rem; }
      .suave { color: #7a6656; font-size: 0.9rem; margin: 0.15rem 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 1.25rem; }
      th, td { text-align: left; padding: 0.45rem 0.3rem; border-bottom: 1px solid #ecdccb; }
      .num { text-align: right; white-space: nowrap; }
      .total td { font-weight: 800; border-top: 2px solid #2b1d14; border-bottom: none; }
      .imprimir { margin-top: 1.5rem; padding: 0.6rem 1.2rem; border-radius: 999px; border: none; background: #b5420f; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
      footer { margin-top: 1.5rem; font-size: 0.8rem; color: #7a6656; }
      @media print { .imprimir { display: none; } body { margin: 0; } }
    </style>
  </head>
  <body>
    <h1>Comprobante de liquidación</h1>
    <p class="suave">Urban Eats · ${e(datos.restaurante)}</p>
    <p class="suave">Pedido <strong>#${e(liquidacion.pedidoCodigo)}</strong> · entregado el ${e(datos.fechaEntrega)}</p>

    <table>
      <thead>
        <tr><th>Cant.</th><th>Producto</th><th class="num">Total</th></tr>
      </thead>
      <tbody>
          ${filas}
      </tbody>
    </table>

    <table>
      <tbody>
        <tr><td>Subtotal del pedido</td><td class="num">${e(cop.transform(liquidacion.subtotal))}</td></tr>
        <tr><td>Comisión de la plataforma (${porcentaje(REGLAS.TASA_COMISION_APP)})</td><td class="num">${e(cop.transform(liquidacion.comision, '-'))}</td></tr>
        <tr><td>IVA sobre la comisión (${porcentaje(REGLAS.TASA_IVA_COMISION)})</td><td class="num">${e(cop.transform(liquidacion.ivaComision, '-'))}</td></tr>
        <tr class="total"><td>Total para el restaurante</td><td class="num">${e(cop.transform(liquidacion.totalRestaurante))}</td></tr>
      </tbody>
    </table>

    <p class="suave">Pago al repartidor (valor del envío, no se descuenta al restaurante): ${e(cop.transform(liquidacion.pagoRepartidor))}</p>

    <button class="imprimir" type="button" onclick="window.print()">Imprimir</button>

    <footer>Emitido el ${e(datos.fechaEmision)} · RN-13: comisión del ${porcentaje(REGLAS.TASA_COMISION_APP)} + IVA del ${porcentaje(REGLAS.TASA_IVA_COMISION)} sobre la comisión; el envío es para el repartidor.</footer>
  </body>
</html>
`;
}
