# Entregables del proyecto · Urban Eats

Transacción: **Registrar Pedido** (conecta Cliente, Restaurante, Producto, Pedido y Repartidor).
CRUD: **Producto** del catálogo del restaurante.

Diagramas: [dominio](diagramas/dominio.mmd) · [secuencia](diagramas/secuencia-registrar-pedido.mmd) ·
[actividad](diagramas/actividad-registrar-pedido.mmd) · [estados](diagramas/estados-pedido.mmd)
(se ven renderizados en `docs/index.html`).

## 1. Modelo de dominio

13 clases de dominio (sin servicios ni pantallas). Los nombres coinciden con `src/app/core/models/index.ts`.
`DesgloseCostos` y `CambioEstado` del código son atributos de `Pedido` en el modelo.

| Invariante | Regla |
| --- | --- |
| Un `Pedido` tiene 1..* `ItemPedido`, todos de un mismo `Restaurante` | RN-03 |
| Un `ItemPedido` solo existe si su `Producto` está visible y con stock | RN-01, RN-02 |
| `total = subtotal + envío + 8 % impuesto`; subtotal mínimo COP 15.000 | RN-04, RN-06 |
| La `Direccion` del pedido está en la ciudad del `Restaurante` | RN-05 |
| Un `Repartidor` tiene como máximo un `Pedido` activo | RN-09 |
| `Calificacion` y `Liquidacion` solo existen en pedidos `ENTREGADO` (0..1 cada una) | RN-12, RN-13 |

## 2. Requisitos

### Funcionales

| ID | Requisito |
| --- | --- |
| RF-01 | El cliente consulta restaurantes y el menú publicado de cada uno |
| RF-02 | El cliente arma un carrito con productos, opciones y notas |
| RF-03 | El cliente elige dirección de entrega y método de pago |
| RF-04 | El cliente confirma el resumen y registra el pedido (**transacción**) |
| RF-05 | El cliente cancela un pedido pendiente o asignado y consulta su historial |
| RF-06 | El restaurante lista, busca, crea, edita, oculta y elimina productos (**CRUD**) |
| RF-07 | El repartidor acepta, recoge (con código) y entrega (con firma o foto) |
| RF-08 | El sistema liquida el pedido y permite calificar la experiencia |

### No funcionales

| ID | Requisito | Verificación |
| --- | --- | --- |
| RNF-01 | Acceso por rol (cliente, restaurante, repartidor) | `rol.guard.spec.ts` |
| RNF-02 | Las reglas de negocio son funciones puras con pruebas unitarias | `npm run test:ci` |
| RNF-03 | Los datos persisten en el navegador y se pueden restablecer | botón en Acceso |
| RNF-04 | Montos en COP con formato es-CO | `cop.pipe.spec.ts` |
| RNF-05 | Accesibilidad básica verificada por lint | `npm run lint` |
| RNF-06 | Se despliega automáticamente como sitio estático | workflow `Deploy` |

### Reglas de negocio de la transacción

| ID | Regla |
| --- | --- |
| RN-01 | Solo se piden productos visibles y con stock |
| RN-02 | Cantidad menor o igual al stock y a 10 unidades por producto |
| RN-03 | Un pedido es de un solo restaurante |
| RN-04 | Subtotal mínimo COP 15.000 |
| RN-05 | La dirección está en la zona de cobertura del restaurante |
| RN-06 | Total = subtotal + envío (5.000) + impuesto al consumo (8 %) |
| RN-07 | Pago en efectivo: el monto cubre el total |
| RN-08 | Al confirmar se descuenta el stock y se genera un código único |

Reglas del CRUD: RP-01 nombre 3 a 60 caracteres y único; RP-02 precio entero múltiplo de 50;
RP-03 stock entre 0 y 999; RP-04 no se elimina un producto con pedido en curso.
Reglas posteriores a la entrega: RN-09 a RN-13 (repartidor, calificación, liquidación).

## 3. Casos de uso

### CU-01 Registrar Pedido (estrella)

- **Actores:** Cliente (primario), Restaurante y Repartidor (secundarios).
- **Precondiciones:** cliente con sesión; carrito con productos; al menos una dirección y un método de pago.
- **Flujo básico:** 1 elige restaurante y producto · 2 agrega al carrito · 3 elige dirección · 4 elige pago ·
  5 revisa resumen y costos · 6 confirma · 7 el sistema valida RN-01 a RN-07 · 8 descuenta stock y crea el
  pedido PENDIENTE con código · 9 muestra confirmación y seguimiento.
- **Flujos alternos:** A1 producto agotado u oculto (RN-01) · A2 otro restaurante en el carrito (RN-03) ·
  A3 subtotal menor al mínimo (RN-04) · A4 dirección fuera de cobertura (RN-05) · A5 efectivo insuficiente (RN-07) ·
  A6 el cliente cancela antes de salir a la calle: pedido CANCELADO y stock devuelto.
- **Postcondiciones:** pedido PENDIENTE con código único y stock descontado; ante cualquier error no cambia nada.

### CU-02 Gestionar catálogo (secundario, CRUD de Producto)

- **Actor:** Restaurante. **Precondición:** sesión de restaurante.
- **Flujo básico:** lista y busca productos · crea o edita con el formulario (RP-01 a RP-03) · cambia visibilidad · elimina.
- **Alternos:** datos inválidos muestran la regla violada · eliminar con pedido en curso se rechaza (RP-04).
- **Postcondición:** el menú publicado refleja los cambios.

## 4. Trazabilidad

| Requisito | Caso de uso | Diagrama | Widget del prototipo | Endpoint / controlador |
| --- | --- | --- | --- | --- |
| RF-01 | CU-01 | Dominio | Restaurantes, Menú | `GET /restaurantes/{id}/menu` · `ProductoService.menuPublicado` |
| RF-02 | CU-01 | Actividad | Carrito | `CarritoService` (RN-01 a RN-03) |
| RF-03 | CU-01 | Actividad | Dirección, Método de pago | `ClienteService` |
| RF-04 | CU-01 | Secuencia, Estados | Resumen del pedido, Confirmación | `POST /pedidos` · `PedidoService.registrar` |
| RF-05 | CU-01 | Estados | Mis pedidos | `POST /pedidos/{id}/cancelacion` · `PedidoService.cancelar` |
| RF-06 | CU-02 | Dominio | Catálogo, Formulario de producto | `GET/POST/PUT/DELETE /productos` · `ProductoService` |
| RF-07 | CU-01 | Estados | Pedidos disponibles, Recogida, Confirmar entrega | `EntregaService` |
| RF-08 | CU-01 | Dominio | Liquidación, Calificación | `LiquidacionService` |

## 5. Prueba de concepto

Datos de prueba en `src/app/core/data/seed.ts`: 3 restaurantes, 21 productos, 3 clientes con
5 direcciones y 7 métodos de pago, 3 repartidores y 2 pedidos históricos. Usuarios demo en el `README.md`.
Casos de aceptación: Juan Pérez con dirección de Bogotá dispara RN-05; Andrés Ríos no tiene cobertura;
un subtotal menor a COP 15.000 dispara RN-04; un producto agotado dispara RN-01.
