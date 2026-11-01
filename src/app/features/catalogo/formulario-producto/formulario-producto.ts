import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatosProducto } from '@core/domain/producto.rules';
import { REGLAS } from '@core/domain/reglas';
import { CATEGORIAS, Categoria, ErrorRegla } from '@core/models';
import { NotificacionService } from '@core/services/notificacion.service';
import { ProductoService } from '@core/services/producto.service';
import { SesionService } from '@core/services/sesion.service';
import { ErroresRegla } from '@shared/components/errores-regla';

const EMOJIS = [
  '🍛',
  '🍲',
  '🥩',
  '🥗',
  '🌭',
  '🍮',
  '🫔',
  '🧃',
  '🥤',
  '🥘',
  '🍔',
  '🍟',
  '🧅',
  '🥛',
  '🍫',
  '🥣',
  '☕',
  '🍰',
  '🍕',
  '🌮',
];

/**
 * Crear / editar producto (maqueta "Editar producto").
 * Las validaciones de formato se hacen en el formulario y las de negocio
 * (nombre único, múltiplo de precio) en ProductoService.
 */
@Component({
  selector: 'app-formulario-producto',
  imports: [ReactiveFormsModule, RouterLink, ErroresRegla],
  templateUrl: './formulario-producto.html',
  styleUrl: './formulario-producto.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioProducto implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly productos = inject(ProductoService);
  private readonly sesion = inject(SesionService);
  private readonly notificaciones = inject(NotificacionService);

  /** Id del producto a editar (parámetro de ruta). Vacío al crear. */
  readonly id = input<string>();

  protected readonly categorias = CATEGORIAS;
  protected readonly emojis = EMOJIS;
  protected readonly reglas = REGLAS;
  protected readonly errores = signal<ErrorRegla[]>([]);
  protected readonly editando = signal(false);

  protected readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    descripcion: ['', [Validators.maxLength(200)]],
    categoria: this.fb.control<Categoria>('Platos Fuertes', Validators.required),
    precio: [0, [Validators.required, Validators.min(REGLAS.MULTIPLO_PRECIO)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.max(REGLAS.STOCK_MAXIMO)]],
    visible: [true],
    emoji: ['🍛'],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    const producto = this.productos.obtener(id);
    if (!producto || producto.restauranteId !== this.sesion.restaurante()?.id) {
      this.notificaciones.mostrar('El producto no existe.', 'error');
      void this.router.navigateByUrl('/restaurante/catalogo');
      return;
    }
    this.editando.set(true);
    this.formulario.setValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock,
      visible: producto.visible,
      emoji: producto.emoji,
    });
  }

  protected campoInvalido(nombre: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || control.dirty);
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      this.errores.set([]);
      return;
    }
    const datos: DatosProducto = this.formulario.getRawValue();
    const id = this.id();
    const restauranteId = this.sesion.restaurante()?.id ?? '';
    const resultado = id
      ? this.productos.actualizar(id, datos)
      : this.productos.crear(restauranteId, datos);

    if (!resultado.ok) {
      this.errores.set(resultado.errores);
      return;
    }
    this.notificaciones.mostrar(
      id ? 'Cambios guardados.' : `"${resultado.valor.nombre}" creado.`,
      'exito',
    );
    void this.router.navigateByUrl('/restaurante/catalogo');
  }
}
