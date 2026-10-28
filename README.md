# Urban Eats · MVP de implementación

Aplicación web (Angular 21 + TypeScript estricto) que automatiza los procesos manuales de
**Urban Eats**: catálogo de menús, toma de pedidos, despacho con repartidores y liquidación
con retroalimentación del cliente. Proyecto final de Ingeniería de Software.

## Cómo ejecutar

Requisitos: Node.js 22 (o 20.19+) y npm 10+.

```bash
npm install          # el .npmrc incluido activa legacy-peer-deps
npm start            # http://localhost:4200
```

| Script            | Qué hace                                   |
| ----------------- | ------------------------------------------ |
| `npm start`       | Servidor de desarrollo con recarga         |
| `npm run build`   | Compilación de producción en `dist/`       |
| `npm run test:ci` | Pruebas unitarias (Vitest) una sola vez    |
| `npm test`        | Pruebas en modo observación                |
| `npm run lint`    | ESLint + reglas de Angular y accesibilidad |
| `npm run format`  | Formatea el código con Prettier            |

La integración continua (`.github/workflows/ci.yml`) ejecuta formato, lint, pruebas y build en
cada push y pull request.

## Usuarios demo

No hay autenticación real: en la pantalla de **Acceso** se elige un usuario de demostración.
El botón _Restablecer datos de demostración_ vuelve a cargar los datos de prueba.

| Rol         | Usuario                        | Para probar                                           |
| ----------- | ------------------------------ | ----------------------------------------------------- |
| Cliente     | **Juan Pérez** (Armenia)       | Pedido completo; su dirección de Bogotá dispara RN-05 |
| Cliente     | Laura Gómez (Bogotá)           | Pedidos a La Cazuela Bogotana                         |
| Cliente     | Andrés Ríos (Pereira)          | Ningún restaurante le entrega (fuera de cobertura)    |
| Restaurante | **Sabor Colombiano** (Armenia) | CRUD del catálogo y liquidación del pedido UE-102340  |
| Restaurante | Burger Urbana / La Cazuela     | Catálogos alternos                                    |
| Repartidor  | **Carlos Muñoz**               | Aceptar, recoger, entregar y ver ingresos             |
| Repartidor  | Diana Herrera / Felipe Ortiz   | Pedidos disponibles para otros repartidores           |

Datos de prueba (`src/app/core/data/seed.ts`): 3 restaurantes, 21 productos (activos,
agotados y uno oculto), 3 clientes con 5 direcciones y 7 métodos de pago, 3 repartidores y
2 pedidos históricos (uno entregado y uno pendiente). Se guardan en `localStorage`.

## Reparto del equipo

Cada archivo tiene un solo dueño; las ramas salen de `main` y entran por pull request.

| Persona    | Parte                                                               |
| ---------- | ------------------------------------------------------------------- |
| Pedro      | Base, acceso, confirmación, Mis pedidos, calificación e integración |
| Padilla    | Catálogo del restaurante (CRUD de Producto, RP-01 a RP-04)          |
| Brandon    | Transacción _Registrar Pedido_ (RN-01 a RN-08)                      |
| María José | Repartidor y liquidación (RN-09 a RN-13)                            |

Las pantallas y servicios de los demás están como esqueleto hasta que cada dueño fusiona su rama.
