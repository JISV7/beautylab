# Evaluación 1 - Home y Configuración

## 1. Paleta de Colores Accesible (Daltonismo)
- Los colores deben ser aptos para personas con daltonismo.
- El sistema debe incluir tres modos: **Modo claro**, **Modo oscuro** y **Modo accesibilidad**.

## 2. Tipografía y Tamaños
- Cada elemento tipográfico debe tener su tamaño definido: títulos, subtítulos, párrafos, etc.
- El tamaño del párrafo debe afectar de forma consistente a: botones, todos los textos y el header de la vista de usuario.

## 3. Gestión de Temas sin Código
- El administrador debe poder modificar colores, tipografías y tamaños sin tocar código.
- **Módulo de configuración de temas** (vista administrador):
  - Configuración de colores.
  - Configuración de tipografías.
  - Vista previa en tiempo real de: botones, select, fuentes, inputs, textarea, cards y colores de las tarjetas de productos o de la página en general.

## 4. Roles del Sistema
- **Rol usuario**
- **Rol administrador**

## 5. Vista de Usuario (Landing Page)
Debe contener las siguientes secciones, con formularios, botones y estilos consistentes:
1. Header
2. Hero
3. Carousel
4. Servicios
5. Footer

## 6. Vista de Administrador
- Módulo de configuración de temas (colores, tipografías, vistas previas de componentes).

---

# Evaluación 2 - Formularios y Facturas

## Requisitos Generales
- **Manejo de errores:** El sistema debe notificar al usuario si comete un error (por ejemplo, correo erróneo o fechas que no han ocurrido).
- Se puede utilizar `autocomplete` de JavaScript.
- **Cálculo KLM (Keystroke Level Model):** 
  - Realizar el cálculo usando la tabla de Classroom.
  - Aplicar el KLM para crear una paleta de colores cualquiera.
  - Llevar el cálculo el día de la evaluación.
- **Interacciones mínimas:** Mínimo 3 puntos y 2 clics.
- **Validación de inputs:** Mínimo 6 caracteres.

## Parte A: Módulo de Facturación
- **Campos requeridos:** RIF, Cédula, Dirección, Códigos, Precios, etc.
- **Normativa:** Debe cumplir con la normativa venezolana de facturación.
- **Referencia:** Leer el archivo `FacturasVenezuela.md` (texto extraído con OCR del documento oficial).

## Parte B: Lógica de Facturación y Compras
Por lógica, para poder facturar, se requieren previamente los siguientes módulos:
- Módulo de usuarios.
- Módulo de productos/servicios.

- **Cálculo KLM:** Realizar el cálculo para el proceso de compra de un producto.
- **Escenario de prueba:** El usuario debe comprar 2 productos distintos, con 2 unidades de cada uno.
- **Métodos de pago:** Agregar opciones (ej. 50 % transferencia, 50 % tarjeta de crédito, etc.).
- **Descuentos:** Crear un módulo de cupones para aplicar descuentos.

## Parte C: Módulo de Productos y Gestión de Facturas
- **Tarjetas de productos:** Deben incluir:
  - Título, categoría y descripción.
  - Dos campos de selección.
  - Botón "Agregar al carrito".
  - Precio.
  - Botón para compartir en redes sociales.
  - Badges informativos (ej. Nuevo, Trending, etc.).
- **Gestión de facturas:**
  - Las facturas deben enviarse automáticamente al correo del usuario.
  - El usuario debe acceder a su cuenta y disponer de una sección con TODAS las facturas asociadas, donde pueda seleccionar e imprimir todas o cualquiera de ellas.

## Resumen de Requeridos
- Formulario de usuario.
- Formulario de producto.
- Formulario de pago.
- Formulario de información de la compañía.
- Formulario de imprenta autorizada (simular autorización por el SENIAT).
- Formulario de cupones.
- Formulario de facturas.
- KLM paletas.
- KLM de información de la compañía.
- KLM de imprenta autorizada.
- KLM de compra.
