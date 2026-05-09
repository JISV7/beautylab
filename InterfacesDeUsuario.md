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

---

# Evaluación 3 - Loader y Animación Tangram 3D

## 1. Comportamiento y Secuencia de Carga
- El loader debe mostrarse automáticamente al acceder al sitio web, antes de renderizar cualquier contenido de la vista Home.
- La secuencia de animación debe seguir el flujo: **Tangram 1 → Tangram 2 → Tangram 3 → Home**.
- La transición entre cada estado (T1, T2, T3 y Home) debe ser fluida, con interpolación de posiciones y rotaciones para evitar cortes visuales bruscos.

## 2. Especificaciones del Tangram 3D
- Se deben implementar 3 modelos 3D de Tangram (T1, T2, T3), cada uno con una configuración geométrica o disposición de piezas distinta.
- La tecnología 3D (ej. Three.js, WebGL, Spline o similar) debe estar optimizada para navegadores modernos y dispositivos móviles.
- Las piezas deben mantener proporciones reales de un Tangram clásico (7 polígonos: 5 triángulos, 1 cuadrado, 1 paralelogramo).

## 3. Sincronización con la Paleta de Colores (EV 1)
- Los colores de las piezas del Tangram deben actualizarse dinámicamente según el tema activo configurado por el usuario o administrador: **Modo claro**, **Modo oscuro** y **Modo accesibilidad**.

## 4. Configuración desde el Panel de Administrador
- El administrador debe disponer de un control dentro del **Módulo de configuración de temas** para:
  - **Activar/Desactivar** el loader Tangram 3D.
  - Si se desactiva, el sitio debe omitir la animación y cargar directamente la vista Home.

## 5. Integración con Evaluaciones Anteriores
- El loader debe heredar las variables de diseño definidas en el sistema de temas de la **Evaluación 1**.
- La transición final al Home debe respetar la estructura de secciones definida previamente (Header, Hero, Carousel, Servicios, Footer).

---

# Evaluación 4 - Multimedia y Gestión de Carrusel

## 1. Sección de Video Promocional

### 1.1 Ubicación y Visualización
- El video debe mostrarse inmediatamente **debajo del banner Hero** en la vista de Home.tsx (Landing Page).
- Debe integrarse visualmente con el diseño definido en la **Evaluación 1**, respetando la paleta de colores activa (Modo claro, Modo oscuro, Modo accesibilidad).

### 1.2 Reproductor Personalizado
- El reproductor de video debe incluir **controles personalizados** (no los nativos del navegador):
  - Botón de reproducción/pausa con iconografía coherente al tema.
  - Barra de progreso interactiva.
  - Control de volumen.
  - Botón de pantalla completa.
  - Selector de pista de audio.
  - Selector de subtítulos.

### 1.3 Accesibilidad y Multidioma
- El video debe soportar **múltiples pistas de subtítulos** (configurables por el administrador).
- Debe permitir cambiar entre subtítulos en tiempo real sin reiniciar el video.
- Los controles deben ser accesibles vía teclado (navegación con Tab, activación con Enter/Espacio, flechas para subir/bajar volumen, retroceder/avanzar).

## 2. Módulo de Administración de Video

### 2.1 Carga de Contenido Multimedia
El administrador debe poder gestionar el video desde el panel de administración, incluyendo:
- **Subida de video:** Formato MP4, WebM o similar optimizado para web.
- **Subida de pistas de subtítulos:** Mínimo 2 archivos de subtítulos en formato `.vtt` o `.srt` (ej. Español e Inglés).
- **Subida de pistas de audio:** Múltiples pistas de audio para diferentes idiomas.
- **Metadatos:** Título, descripción y texto alternativo para accesibilidad.

### 2.2 Configuración de Visualización
- Activar/desactivar la sección de video.
- Seleccionar subtítulo por defecto.
- Seleccionar pista de audio por defecto.
- Configurar autoplay (respetando políticas de navegación moderna).

## 3. Gestión Avanzada del Carrusel

### 3.1 Carga de Imágenes desde Administración
- El administrador debe disponer de una sección dedicada para gestionar las imágenes del carrusel del Home.
- Cada slide del carrusel debe permitir editar:
  - Imagen principal.
  - Título/mensaje principal.
  - Subtítulo o descripción.
  - URL de destino del botón.
  - Orden de visualización.
  - Estado (activo/inactivo).

### 3.2 Especificaciones de Tamaño de Imagen
- El sistema debe definir un **tamaño fijo máximo** para las imágenes del carrusel. Ejemplos de configuraciones soportadas:
  - 300x300px, 1000x1000px, 1080x1920px, 1920x1080px
  - Configurable por el administrador.

### 3.3 Validación y Recorte de Imágenes

#### Detección Automática
- Al subir una imagen, el sistema debe validar automáticamente sus dimensiones.
- Si la imagen excede el tamaño configurado o tiene proporciones diferentes, debe activarse el flujo de recorte.

#### Interfaz de Recorte en Frontend
- El administrador debe visualizar una **herramienta de recorte (cropper)** integrada en el frontend que permita:
  - Ajustar el área de recorte mediante arrastre.
  - Rotar la imagen si es necesario.
  - Zoom in/out para mayor precisión.
  - Vista previa del resultado final.
  - Relación de aspecto bloqueada según el tamaño configurado.

#### Flujo de Decisión
1. El administrador selecciona una imagen para el carrusel.
2. El sistema valida las dimensiones.
3. Si la imagen no cumple con el tamaño/proporción:
   - Mostrar modal de confirmación: *"The image exceeds the allowed size (XxY). Do you want to crop it?"*
   - **Opción A (Yes):** Abrir herramienta de recorte en frontend → Administrador ajusta → Confirmar → Guardar imagen recortada.
   - **Opción B (No):** Cancelar subida y permitir seleccionar otra imagen.
4. Si la imagen cumple con las especificaciones: Subida directa sin intervención.

### 3.4 Optimización de Imágenes
- Implementar lazy loading para mejorar el rendimiento del carrusel.

## 4. Integración con Evaluaciones Anteriores

### 4.1 Consistencia de Diseño (EV1)
- Los controles del video y el carrusel deben respetar:
  - La paleta de colores activa (claro/oscuro/accesibilidad).
  - La tipografía y tamaños configurados en el sistema de temas.
  - Los estilos de botones, inputs y cards definidos globalmente.

### 4.2 Roles y Permisos (EV1)
- Solo el **rol administrador** puede acceder a:
  - La sección de carga y configuración de video.
  - La gestión de imágenes del carrusel.
  - La herramienta de recorte de imágenes.
- El **rol usuario** solo visualiza el contenido publicado.

### 4.3 Compatibilidad con el Loader (EV3)
- El video y el carrusel deben cargarse **después** de que el loader Tangram 3D complete su secuencia (si está activado).
- Si el loader está desactivado o se le hace skip, el video y carrusel deben respetar el orden de carga definido en el DOM.

## 5. Requisitos Técnicos Adicionales

### 5.1 Almacenamiento
- Los videos e imágenes deben almacenarse en:
  - Servidor local con estructura organizada (`/uploads/videos/`, `/uploads/carousel/`).

### 5.2 Rendimiento
- El video debe usar **streaming progresivo** o adaptativo (HLS/DASH) para conexiones lentas.
- Implementar precarga inteligente del carrusel (cargar solo las primeras 2-3 imágenes inicialmente).
- Las imágenes recortadas deben guardarse en el tamaño exacto necesario, sin redimensionamiento en el cliente.

### 5.3 Accesibilidad
- El video debe incluir atributos `aria-label` en todos los controles.
- Los subtítulos deben ser sincronizados y legibles (rem del navegador de ser posible, contraste adecuado).
