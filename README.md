# CURSORG

**Plataforma de Capacitación Corporativa**

> *Capacitación corporativa sin barreras.*

Cursorg es una plataforma B2B para gestionar programas de formación corporativa:
catálogo de cursos, rutas de aprendizaje, inscripciones, compras y facturación.
El proyecto está pensado para equipos de recursos humanos, operaciones y
capacitación que necesitan centralizar la formación de sus organizaciones.

## Estructura del repositorio

- **`backend/`** — API FastAPI (Python 3.13) con PostgreSQL, SQLAlchemy async,
  Alembic, autenticación JWT, RBAC, theming dinámico, catálogo, carrito,
  facturación y correo transaccional.
- **`frontend/`** — Aplicación React 19 + Vite + TypeScript + TailwindCSS v4.
  Incluye las vistas públicas, el panel de administración, el flujo de compra y
  la personalización visual.
- **`compose.yaml`** — Configuración de Docker Compose para la base de datos y
  el backend.

## Funcionalidades

- **Autenticación y roles** — JWT con hashing Argon2 y permisos granulares para
  los roles `root`, `admin` y `user`.
- **Catálogo corporativo** — Cursos, categorías, niveles, productos y rutas de
  aprendizaje.
- **Compras y facturación** — Carrito, cupones, pagos divididos, facturas en PDF
  y descarga masiva en ZIP.
- **Theming dinámico** — Configuración JSONB con paletas light, dark y
  accessibility; el tema por defecto usa la identidad visual de Cursorg.
- **Correo transaccional** — Mensajes de bienvenida y compra, además del envío de
  facturas.
- **Auditoría** — Registro de cambios sobre los recursos administrados.

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | FastAPI 0.135+, Python 3.13 |
| Base de datos | PostgreSQL 17 |
| ORM y migraciones | SQLAlchemy 2.0 async, Alembic |
| Autenticación | JWT (python-jose) + Argon2 |
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4 |
| Contenedores | Docker + Docker Compose |

## Requisitos en Windows 10

El proyecto se desarrolló originalmente en Ubuntu y se ejecuta localmente en
Windows 10 con Docker Desktop. Docker Desktop usa WSL2 para ejecutar contenedores
Linux; no hace falta una máquina virtual ni un servidor Ubuntu aparte.

- **Windows 10** versión 22H2 o superior, con virtualización habilitada.
- **Docker Desktop** con el motor Linux y la integración WSL2 activa.
- **Node.js 20+** y **pnpm** para el frontend.
- **Git** para clonar el repositorio.
- **Opcional:** Python 3.13+ y [uv](https://docs.astral.sh/uv/) si se desea
  ejecutar el backend de forma nativa, sin Docker.

> En PowerShell, si `docker` no se reconoce, abre Docker Desktop, espera a que
> indique **Engine running** y vuelve a abrir la terminal.

## Inicio rápido en Windows 10 (PowerShell)

Desde la raíz del repositorio:

```powershell
# 1. Crear la configuración local del backend
Copy-Item backend\.env.example backend\.env

# 2. Editar backend\.env y cambiar al menos JWT_SECRET_KEY
notepad backend\.env

# 3. Levantar PostgreSQL y la API (la primera vez compila la imagen)
docker compose up -d

# 4. Comprobar que ambos contenedores están saludables
docker compose ps
```

El backend espera a PostgreSQL, ejecuta `alembic upgrade head`, carga los datos
iniciales con el seeder idempotente y arranca la API en el puerto `8000`.

Después, en otra terminal:

```powershell
cd frontend
pnpm install
pnpm dev
```

| Servicio | URL local |
|----------|-----------|
| Aplicación (frontend Vite) | `http://localhost:5173` |
| Iniciar sesión (split-screen) | `http://localhost:5173/login` |
| Registro de empresa (wizard) | `http://localhost:5173/registro-empresa` |
| Panel de empresa | `http://localhost:5173/empresa` |
| API | `http://localhost:8000` |
| Documentación interactiva | `http://localhost:8000/docs` |
| Referencia ReDoc | `http://localhost:8000/redoc` |
| PostgreSQL | `localhost:5432` |

El seeder crea la empresa demo **Cursorg Demo** con departamentos, clases y
colaboradores de ejemplo. Entra a `/empresa` con `admin@cursorg.ve` /
`password123*` para ver el panel de empresa, o usa `/registro-empresa` para
crear un espacio nuevo con su propio administrador.

Para detener el stack sin borrar datos:

```powershell
docker compose down
```

`docker compose down -v` también elimina el volumen de PostgreSQL y los archivos
subidos; úsalo solo si quieres reiniciar la base desde cero.

### Modo híbrido recomendado

En Windows 10 lo más práctico es mantener **PostgreSQL y el backend en Docker** y
ejecutar **el frontend con Vite** de forma nativa. El código del backend está
montado como volumen (`./backend/app`), por lo que los cambios de Python se
recargan sin reconstruir la imagen. El frontend usa el puerto `5173`, que ya está
incluido en `CORS_ORIGINS`.

### Si la imagen del backend debe reconstruirse

`docker compose up -d` reutiliza la imagen existente. Reconstruye solo cuando
cambien el `Dockerfile` o las dependencias de Python:

```powershell
docker compose up -d --build
```

La compilación necesita acceso a Debian y PyPI. Si aparece un error como
`Could not resolve 'deb.debian.org'`, revisa la red/DNS de Docker Desktop
(**Settings → Resources → Network**) y vuelve a intentarlo. El stack actual puede
seguir ejecutándose con la imagen ya construida y el código montado.

## Servicios, salud y roles

| Componente | Dónde corre | Puerto | Cómo verificar |
|------------|-------------|--------|----------------|
| Base de datos | Contenedor `cursorg-db` (PostgreSQL 17) | `5432` | `docker exec cursorg-db pg_isready -U postgres -d cursorg` |
| Backend | Contenedor `cursorg-backend` (FastAPI + Uvicorn) | `8000` | `Invoke-RestMethod http://localhost:8000/health` |
| Frontend | Proceso local de Vite | `5173` | Abrir `http://localhost:5173` |
| Documentación API | Backend | `8000` | `http://localhost:8000/docs` |

Comandos útiles:

```powershell
docker compose ps                         # estado y salud de los contenedores
docker compose logs -f backend            # logs de la API en vivo
docker compose exec backend alembic current
docker compose exec backend python -m app.seed
```

Roles iniciales:

| Rol | Alcance |
|-----|---------|
| `root` | Control total: usuarios, roles, temas, auditoría y configuración. |
| `admin` | Catálogo, cursos, videos, productos, licencias, facturas y panel administrativo. |
| `user` | Vista del cliente: compra cursos, canjea licencias, reproduce videos y guarda su avance. |

Después de ejecutar el seeder:

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Root | `root@cursorg.ve` | `password12345*` |
| Admin | `admin@cursorg.ve` | `password123*` |

Cambia estas contraseñas antes de desplegar en producción.

## Vista del cliente y reproducción de cursos

El cliente compra un curso desde el catálogo, completa el pago y llega a
**Mis cursos**. La compra por sí sola no entrega el video: el acceso se habilita
cuando la licencia se canjea o cuando una empresa asigna una licencia corporativa
al usuario.

Flujo esperado:

1. **Explorar cursos** → abrir un curso → comprar o agregar al carrito.
2. Completar el pago dividido. La confirmación ofrece **Ver mis cursos**.
3. En **Mis cursos**, la tarjeta muestra el estado y la acción disponible:
   - **Canjear y comenzar** — la licencia está lista y el curso aún no tiene acceso.
   - **Continuar curso** / **Comenzar curso** — ya hay una licencia canjeada o una
     asignación corporativa.
   - **Repasar curso** — el curso llegó al 100%.
   - **Ver curso** — el pago aún está pendiente o el acceso no está disponible.
4. Al abrir el reproductor, el backend verifica la licencia o asignación y
   devuelve la URL protegida del video. La respuesta usa `Cache-Control: no-store`
   y la URL no aparece en los endpoints públicos del catálogo.
5. El avance se guarda automáticamente. Es monotónico: una petición retrasada no
   puede hacer retroceder al estudiante. Al llegar a 100% el curso se marca como
   completado.

El endpoint que usa el reproductor es
`GET /catalog/my-courses/{course_id}/player`. Sin acceso responde `403`; con una
licencia canjeada o asignación válida responde `200` y crea la inscripción si aún
no existe. El avance se actualiza con `PATCH /enrollments/my/{enrollment_id}`.

### Video local de demostración

Los cinco cursos sembrados apuntan al video de demostración:

```text
/static/course-videos/cursorg-demo.mp4
```

El archivo está en `backend/app/static/videos/cursorg-demo.mp4` y FastAPI lo sirve
con soporte de peticiones `Range`, necesario para buscar dentro del video. Para
reemplazarlo, copia otro MP4 en esa carpeta o cambia la URL desde el panel de
administración: **Cursos → editar curso → Video del curso**. También se aceptan
URLs externas firmadas.

> Los videos promocionales subidos desde el panel usan
> `/static/videos/...` y viven en el volumen `backend_uploads`. Los videos de los
> cursos usan `/static/course-videos/...` y viven dentro del código del backend.

## Desarrollo local del backend (sin Docker)

Requisitos: Python 3.13+, PostgreSQL 17+ y
[uv](https://docs.astral.sh/uv/). En Windows, `uvloop` se omite automáticamente
mediante un marcador de plataforma; Uvicorn usa el bucle `asyncio` nativo.

```powershell
cd backend
uv sync

Copy-Item .env.example .env
# Edita .env: DATABASE_URL debe apuntar a localhost, no a db.
# Ejemplo: postgresql://postgres:postgres@localhost:5432/cursorg

uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
```

> En Windows nativo, la generación de facturas PDF con WeasyPrint requiere las
> bibliotecas GTK3/Pango instaladas y disponibles en `PATH`. Si solo se va a
> probar el catálogo y el reproductor, no es necesario. Para paridad completa con
> producción, usa el backend en Docker, que ya incluye esas bibliotecas.

El seeder es idempotente: puede ejecutarse en cada arranque sin duplicar roles,
usuarios, fuentes, temas, cursos, productos ni rutas de aprendizaje. No elimina
contenido creado por administradores y conserva los precios e impuestos que un
administrador haya configurado en los productos sembrados.

## Catálogo inicial

El seeder crea cinco cursos publicados y una ruta que los agrupa. Los productos
asociados se crean con precio `0.00` y tipo de impuesto `exento` porque la
política comercial todavía no está definida; los administradores pueden
actualizarlos desde el panel.

| Curso | SKU | Horas | Nivel | Categoría |
|-------|-----|-------|-------|-----------|
| Seguridad y Salud en el Trabajo | `CURSORG-001` | 6 | Básico | Seguridad y Salud |
| Finanzas Prácticas para No Financieros | `CURSORG-002` | 8 | Básico | Finanzas |
| Ventas Consultivas y Atención al Cliente | `CURSORG-003` | 6 | Intermedio | Ventas y Servicio |
| Habilidades Digitales y Productividad | `CURSORG-004` | 4 | Básico | Habilidades Digitales |
| Liderazgo Operativo y Supervisión | `CURSORG-005` | 6 | Intermedio | Liderazgo |

La ruta **Ruta de Capacitación Corporativa** (`CURSORG-100`,
`ruta-de-capacitacion-corporativa`) incluye los cinco cursos.

## Identidad visual

- Paleta: `#0D2B4D`, `#1E5AA8`, `#55C7E8`, `#6E7882`, `#FBFBFE`, `#F1F5F9`.
- Tipografía principal: **Montserrat**, incluida en
  `backend/app/fonts/Montserrat-VariableFont_wght.ttf`.
- El tema **Default Theme** se actualiza en sitio al ejecutar el seeder. Se
  conservan las decisiones de `is_active` e `is_default` tomadas por un
  administrador.

## Migración desde la instalación anterior

La base de datos pasó de `beautylab` a `cursorg`. Docker Compose no migra
automáticamente un volumen `postgres_data` existente:

1. Respalda la base de datos anterior.
2. Restaura los datos en una base `cursorg`, o recrea el volumen con
   `docker compose down -v` (esto elimina la base anterior).
3. Ejecuta `docker compose up -d` para aplicar migraciones y el seeder.

El seeder migra en sitio las cuentas `root@beautylab.com` y
`admin@beautylab.com` hacia `root@cursorg.ve` y `admin@cursorg.ve` cuando las
cuentas nuevas aún no existen. Las direcciones anteriores se conservan
únicamente con ese propósito de migración.

## Variables de entorno relevantes

| Variable | Valor por defecto |
|----------|-------------------|
| `APP_NAME` | `Cursorg API` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/cursorg` |
| `FROM_EMAIL` | `no-reply@cursorg.ve` |
| `FROM_NAME` | `Cursorg` |
| `COMPANY_NAME` | `Cursorg - Plataforma de Capacitación Corporativa` |
| `SUPPORT_EMAIL` | `soporte@cursorg.ve` |
| `PAYMENTS_EMAIL` | `pagos@cursorg.ve` |
| `WEBSITE_URL` | `http://localhost:5173` |
| `INVOICE_DOWNLOAD_BASE_URL` | Opcional; si está vacío se usa `WEBSITE_URL` |

La referencia completa de configuración está en `backend/.env.example` y en
`backend/README.md`.

## Comprobaciones antes de entregar

```powershell
# Backend: estilo y sintaxis
docker exec cursorg-backend ruff check app
docker exec cursorg-backend python -m compileall -q app

# Migraciones y datos iniciales
docker exec cursorg-backend alembic current
docker exec cursorg-backend python -m app.seed

# Frontend: tipos y build de producción
cd frontend
pnpm build
```

Prueba manual mínima del flujo del cliente:

1. Inicia sesión con una cuenta `user` (o crea una desde el registro).
2. Compra un curso y completa el pago.
3. En **Mis cursos**, usa **Canjear y comenzar**.
4. Confirma que el video reproduce, que puedes buscar dentro de la línea de
   tiempo y que el porcentaje de avance aumenta.
5. Recarga la página: el avance debe conservarse.
6. Cierra sesión y prueba `GET /catalog/my-courses/{course_id}/player` sin
   licencia: debe responder `403`.

## Problemas comunes en Windows 10

| Síntoma | Qué revisar |
|---------|-------------|
| `docker` no se reconoce | Abre Docker Desktop, espera a **Engine running** y reinicia PowerShell. |
| `docker compose up` falla al crear el backend | Verifica que exista `backend\.env`; cópialo desde `.env.example`. |
| La API no conecta a PostgreSQL | Usa `docker compose ps`; la base debe estar `healthy`. En Docker, `DATABASE_URL` debe apuntar a `db`, no a `localhost`. |
| El frontend no carga datos | Confirma que la API responde en `http://localhost:8000/health` y que `CORS_ORIGINS` incluye `http://localhost:5173`. |
| El video responde `404` | Comprueba que el archivo exista en `backend/app/static/videos/` y que la URL del curso empiece por `/static/course-videos/`. |
| El video no permite avanzar/retroceder | Verifica que la respuesta incluya `Accept-Ranges: bytes` y `206 Partial Content` al pedir un rango. |
| Error de `uvloop` en Windows nativo | Actualiza el backend; `uvloop` está marcado solo para plataformas no Windows. Usa `uv sync` de nuevo. |
| WeasyPrint falla al generar PDF en Windows nativo | Instala GTK3/Pango o usa el backend en Docker, que ya las incluye. |
| Puerto ocupado (`5432`, `8000` o `5173`) | Cierra el proceso anterior o cambia el puerto en `compose.yaml`/Vite. |
| La imagen no se reconstruye por DNS | Revisa la red de Docker Desktop y reintenta; el código montado sigue funcionando con la imagen existente. |

## Documentación

- API y ejemplos: `http://localhost:8000/docs`.
- Backend, seeder y catálogo: [`backend/README.md`](backend/README.md).

## Licencia

MIT
