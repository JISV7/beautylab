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

## Inicio rápido con Docker

Desde la raíz del repositorio:

```bash
docker compose up -d
```

El servicio de backend espera a PostgreSQL, ejecuta `alembic upgrade head`,
carga los datos iniciales con el seeder idempotente y arranca la API.

| Servicio | URL |
|----------|-----|
| API | `http://localhost:8000` |
| Documentación interactiva | `http://localhost:8000/docs` |
| Referencia ReDoc | `http://localhost:8000/redoc` |
| Frontend (desarrollo local) | `http://localhost:5173` |
| PostgreSQL | `localhost:5432` |

Para ejecutar el frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

## Desarrollo local del backend

Requisitos: Python 3.13+, PostgreSQL 17+ y
[uv](https://docs.astral.sh/uv/).

```bash
cd backend
uv sync

cp .env.example .env
# Edita .env con las credenciales de PostgreSQL y un JWT_SECRET_KEY seguro.

uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
```

El seeder es idempotente: puede ejecutarse en cada arranque sin duplicar roles,
usuarios, fuentes, temas, cursos, productos ni rutas de aprendizaje. No elimina
contenido creado por administradores y conserva los precios e impuestos que un
administrador haya configurado en los productos sembrados.

## Credenciales iniciales

Después de ejecutar el seeder:

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Root | `root@cursorg.ve` | `password12345*` |
| Admin | `admin@cursorg.ve` | `password123*` |

Cambia estas contraseñas antes de desplegar en producción.

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

## Documentación

- API y ejemplos: `http://localhost:8000/docs`.
- Backend, seeder y catálogo: [`backend/README.md`](backend/README.md).

## Licencia

MIT
