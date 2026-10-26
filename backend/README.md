# Cursorg Backend API

Backend de **Cursorg**, la plataforma de capacitación corporativa para equipos y
organizaciones en Latinoamérica. API construida con FastAPI, PostgreSQL,
SQLAlchemy async, Alembic y theming dinámico.

> **Cursorg** — *Capacitación corporativa sin barreras.*

## Características

- 🔐 **Autenticación JWT** — tokens de acceso y refresco con hashing Argon2.
- 👥 **RBAC** — roles `root`, `admin` y `user` con permisos granulares.
- 🎨 **Theming dinámico** — configuración JSONB con paletas light, dark y accessibility.
- 📚 **Catálogo corporativo** — niveles, categorías, cursos, productos y rutas de aprendizaje.
- 🧾 **Facturación** — facturas, pagos divididos, cupones y licencias.
- 📊 **Auditoría** — registro de cambios de recursos.
- 🐘 **PostgreSQL** — UUIDs, JSONB e índices GIN.
- 🔄 **Async first** — SQLAlchemy 2.0 async y asyncpg.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | FastAPI 0.135+ |
| Base de datos | PostgreSQL 17 |
| ORM | SQLAlchemy 2.0+ (Async) |
| Migraciones | Alembic |
| Autenticación | JWT (python-jose) + Argon2 |
| Validación | Pydantic V2 |
| Contenedores | Docker + Docker Compose |

## Inicio rápido

### Requisitos

- Python 3.13+
- PostgreSQL 17+
- [uv](https://docs.astral.sh/uv/) (gestor de paquetes de Python)

> **Windows 10:** `uvloop` está marcado como dependencia solo para plataformas
> no Windows. `uv sync` instala el resto de dependencias y Uvicorn usa `asyncio`.
> Para facturas PDF, WeasyPrint necesita GTK3/Pango; el backend en Docker ya las
> incluye.

### Instalación local

En PowerShell:

```powershell
cd backend
uv sync

# Configura las variables de entorno
Copy-Item .env.example .env
# Edita .env: DATABASE_URL debe usar localhost y un JWT_SECRET_KEY seguro.

# Crea el esquema y carga los datos iniciales
uv run alembic upgrade head
uv run python -m app.seed

# Inicia la API
uv run uvicorn app.main:app --reload
```

En Linux/macOS los comandos son equivalentes con `cp` en lugar de
`Copy-Item`.

La API queda disponible en `http://localhost:8000`.
La documentación interactiva está en `http://localhost:8000/docs` y
`http://localhost:8000/redoc`.

### Docker Compose

Desde la raíz del repositorio:

```bash
docker compose up -d
```

El contenedor del backend ejecuta automáticamente `alembic upgrade head` y
`python -m app.seed` al iniciar. El seeder es **idempotente**, por lo que puede
ejecutarse en cada arranque sin duplicar datos.

### Migración desde la base de datos anterior

El nombre de la base de datos cambió a **`cursorg`**. Docker Compose no migra
automáticamente un volumen `postgres_data` existente: si vienes de una
instalación anterior, haz un respaldo y restaura los datos en la base
`cursorg`, o recrea el volumen con:

```bash
docker compose down -v   # ⚠️ elimina la base de datos anterior
docker compose up -d
```

El seeder migra en sitio los usuarios `root@beautylab.com` y
`admin@beautylab.com` hacia `root@cursorg.ve` y `admin@cursorg.ve` cuando no
existe ya la cuenta nueva. No elimina contenido creado por administradores.

## Credenciales iniciales

Después de ejecutar el seeder:

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Root | `root@cursorg.ve` | `password12345*` |
| Admin | `admin@cursorg.ve` | `password123*` |

Cambia estas contraseñas antes de desplegar en producción.

## Datos iniciales del catálogo

El seeder crea (o actualiza) los siguientes cursos publicados. Los productos
asociados tienen precio `0.00` y tipo de impuesto `exento` porque la política de
precios aún no está definida; los administradores pueden actualizarlos desde el
panel.

| Curso | Slug | SKU | Horas | Nivel | Categoría |
|-------|------|-----|-------|-------|-----------|
| Seguridad y Salud en el Trabajo | `seguridad-y-salud-en-el-trabajo` | `CURSORG-001` | 6 | Básico | Seguridad y Salud |
| Finanzas Prácticas para No Financieros | `finanzas-practicas-para-no-financieros` | `CURSORG-002` | 8 | Básico | Finanzas |
| Ventas Consultivas y Atención al Cliente | `ventas-consultivas-y-atencion-al-cliente` | `CURSORG-003` | 6 | Intermedio | Ventas y Servicio |
| Habilidades Digitales y Productividad | `habilidades-digitales-y-productividad` | `CURSORG-004` | 4 | Básico | Habilidades Digitales |
| Liderazgo Operativo y Supervisión | `liderazgo-operativo-y-supervision` | `CURSORG-005` | 6 | Intermedio | Liderazgo |

También se crea la ruta de aprendizaje publicada **Ruta de Capacitación
Corporativa** (`ruta-de-capacitacion-corporativa`, SKU `CURSORG-100`) con los
cinco cursos.

### Fuente y tema por defecto

- Se descarga y versiona Montserrat en
  `app/fonts/Montserrat-VariableFont_wght.ttf`.
- El seeder registra la fuente **Montserrat** y mantiene **Roboto** como
  respaldo para temas antiguos.
- El tema **Default Theme** se actualiza en sitio con la paleta de Cursorg
  (`#0D2B4D`, `#1E5AA8`, `#55C7E8`, `#6E7882`, `#FBFBFE`, `#F1F5F9`) y
  Montserrat en todos los roles tipográficos.

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/login` | Iniciar sesión y obtener tokens |
| POST | `/auth/refresh` | Refrescar token de acceso |
| GET | `/users/me` | Perfil del usuario autenticado |
| GET | `/catalog/courses` | Catálogo público de cursos |
| GET | `/catalog/courses/{id}/admin` | Curso editable con su URL de video (admin) |
| GET | `/catalog/categories` | Categorías del catálogo |
| GET | `/catalog/my-courses` | Cursos del cliente con pago, acceso y avance |
| GET | `/catalog/my-courses/{id}/player` | Video protegido e inscripción (requiere licencia o asignación) |
| PATCH | `/enrollments/my/{id}` | Guardar avance de forma monotónica |
| GET | `/themes/default` | Tema por defecto |
| GET | `/invoices/` | Facturas del usuario |
| POST | `/payments/purchase-course` | Compra de curso con pago dividido |
| GET | `/invoices/download-all` | Descargar todas las facturas en ZIP |

Los videos de los cursos se sirven desde `/static/course-videos/`. El archivo de
demostración está en `app/static/videos/cursorg-demo.mp4` y las respuestas de
Starlette soportan `Range`, por lo que el reproductor puede buscar dentro del
video. La URL del video no se devuelve en los endpoints públicos del catálogo:
solo aparece en el endpoint protegido del reproductor y en el endpoint de
administración.

La referencia completa está disponible en `/docs`.

## Estructura del proyecto

```
backend/
├── app/
│   ├── main.py              # Punto de entrada FastAPI
│   ├── config.py            # Configuración (pydantic-settings)
│   ├── database.py          # Conexión async a PostgreSQL
│   ├── seed.py              # Seeder idempotente
│   ├── core/                # Seguridad y dependencias
│   ├── models/              # Modelos SQLAlchemy
│   ├── schemas/             # Esquemas Pydantic
│   ├── routers/             # Endpoints
│   ├── services/            # Lógica de negocio
│   ├── static/videos/       # Video local de demostración de los cursos
│   ├── templates/           # Plantillas de correo y facturas
│   └── fonts/               # Fuentes incluidas (Montserrat, Roboto)
├── alembic/                 # Migraciones
├── tests/                   # Pruebas
├── Dockerfile
├── pyproject.toml
└── .env.example
```

## Desarrollo

```bash
# Pruebas
uv run pytest

# Lint
uv run ruff check app

# Nueva migración
uv run alembic revision --autogenerate -m "Descripción"

# Aplicar migraciones
uv run alembic upgrade head
```

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
| `INVOICE_DOWNLOAD_BASE_URL` | Opcional; usa `WEBSITE_URL` si está vacío |

## Licencia

MIT
