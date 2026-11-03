import { DOCUMENT, DatePipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { REGLAS } from '@core/domain/reglas';
import { LiquidacionService } from '@core/services/liquidacion.service';
import { PedidoService } from '@core/services/pedido.service';
import { RELOJ } from '@core/services/reloj';
import { SesionService } from '@core/services/sesion.service';
import { ErroresRegla } from '@shared/components/errores-regla';
import { CopPipe } from '@shared/pipes/cop.pipe';
import { generarComprobante, nombreComprobante } from './comprobante';

const FORMATO_FECHA = 'd MMM y, h:mm a';

/** RN-13: liquidación de un pedido entregado para el restaurante en sesión. */
@Component({
  selector: 'app-liquidacion',
  imports: [RouterLink, DatePipe, CopPipe, ErroresRegla],
  templateUrl: './liquidacion.html',
  styleUrl: './liquidacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidacionPedido {
  private readonly servicio = inject(LiquidacionService);
  private readonly pedidos = inject(PedidoService);
  protected readonly sesion = inject(SesionService);
  private readonly reloj = inject(RELOJ);
  private readonly locale = inject(LOCALE_ID);
  private readonly documento = inject(DOCUMENT);

  /** Id del pedido (parámetro de ruta). */
  readonly id = input.required<string>();

  protected readonly tasaComision = Math.round(REGLAS.TASA_COMISION_APP * 100);
  protected readonly tasaIva = Math.round(REGLAS.TASA_IVA_COMISION * 100);

  private readonly resultado = computed(() => this.servicio.liquidacion(this.id()));
  protected readonly liquidacion = computed(() => {
    const r = this.resultado();
    return r.ok ? r.valor : null;
  });
  protected readonly errores = computed(() => {
    const r = this.resultado();
    return r.ok ? [] : r.errores;
  });
  /** Solo para la fecha de entrega; la liquidación ya validó que sea del restaurante. */
  protected readonly fechaEntrega = computed(() => {
    const pedido = this.liquidacion() ? this.pedidos.obtener(this.id()) : undefined;
    return pedido?.entrega?.fecha ?? pedido?.creadoEn ?? null;
  });

  /** Genera el comprobante en el navegador y lo descarga como archivo .html. */
  protected descargar(): void {
    const liquidacion = this.liquidacion();
    if (!liquidacion) return;

    const html = generarComprobante(liquidacion, {
      restaurante: this.sesion.restaurante()?.nombre ?? '',
      fechaEntrega: this.formatear(this.fechaEntrega()),
      fechaEmision: this.formatear(this.reloj().toISOString()),
    });
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = nombreComprobante(liquidacion);
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  private formatear(fecha: string | null): string {
    return fecha ? formatDate(fecha, FORMATO_FECHA, this.locale) : '';
  }
}
