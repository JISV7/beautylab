# BeautyLab Backend API

FastAPI-based backend for BeautyLab - a dynamic theming platform for beauty salons.

## Features

- 🔐 **JWT Authentication** - Access & refresh tokens with Argon2 password hashing
- 👥 **Role-Based Access Control (RBAC)** - Root, Admin, and User roles with granular permissions
- 🎨 **Dynamic Theming** - JSONB-based theme configuration with live preview support
- 📊 **Audit Logging** - Complete audit trail for all resource changes
- 🐘 **PostgreSQL** - Full schema with UUIDs, JSONB, and GIN indexes
- 🔄 **Async First** - Built with SQLAlchemy 2.0 async and asyncpg

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | FastAPI 0.135.1+ |
| **Database** | PostgreSQL 17.8+ |
| **ORM** | SQLAlchemy 2.0+ (Async) |
| **Migrations** | Alembic |
| **Auth** | JWT (python-jose) + Argon2 |
| **Validation** | Pydantic V2 |
| **Container** | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Python 3.13+
- PostgreSQL 17.8+
- uv (Python package manager)

### Installation

1. **Clone and setup:**
```bash
cd backend
uv sync
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. **Run migrations:**
```bash
alembic upgrade head
```

4. **Seed database:**
```bash
python -m app.seed
```

5. **Start server:**
```bash
uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000
API docs (Swagger): http://localhost:8000/docs

## Docker

### Build and Run

```bash
# Build image
docker build -t beautylab-api .

# Run container
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name beautylab-api \
  beautylab-api
```

### With Docker Compose (when ready)

```bash
# From project root
docker compose up -d
```

## Default Credentials

After seeding:
- **Email:** admin@beautylab.com
- **Password:** admin123

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (get tokens) |
| POST | `/auth/refresh` | Refresh access token |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | User | Get current user profile |
| PATCH | `/users/me` | User | Update profile |
| GET | `/users/` | Admin | List all users |
| GET | `/users/{id}` | Admin | Get user by ID |
| PATCH | `/users/{id}` | Admin | Update user |

### Themes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/themes/` | Public | List active themes |
| GET | `/themes/default` | Public | Get default theme |
| GET | `/themes/{id}` | Public | Get theme details |
| POST | `/themes/` | Admin | Create theme |
| PATCH | `/themes/{id}` | Admin | Update theme |
| DELETE | `/themes/{id}` | Admin | Delete theme |
| GET | `/themes/user/preferred` | User | Get preferred theme |
| PUT | `/themes/user/preferred` | User | Set preferred theme |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/users/{id}/roles/{rid}` | Admin | Assign role |
| DELETE | `/admin/users/{id}/roles/{rid}` | Admin | Remove role |
| GET | `/admin/roles` | Admin | List roles |
| GET | `/admin/roles/{id}` | Admin | Get role |
| POST | `/admin/roles` | Root | Create role |
| DELETE | `/admin/roles/{id}` | Root | Delete role |
| GET | `/admin/permissions` | Admin | List permissions |
| POST | `/admin/permissions` | Root | Create permission |
| POST | `/admin/roles/{rid}/perms/{pid}` | Root | Assign permission |
| DELETE | `/admin/roles/{rid}/perms/{pid}` | Root | Remove permission |
| GET | `/admin/audit-logs` | Admin | View audit logs |

## Database Schema

```
roles (id, name, created_at)
permissions (id, name, resource)
role_permissions (role_id, permission_id)
users (id, email, password_hash, full_name, is_active, is_verified, preferred_theme_id, created_at, updated_at)
user_roles (user_id, role_id, assigned_by, created_at)
themes (id, name, description, type, config[JSONB], is_active, is_default, created_by, created_at, updated_at)
audit_logs (id, user_id, action, resource_type, resource_id, changes[JSONB], ip_address, created_at)
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings management
│   ├── database.py          # DB connection
│   ├── seed.py              # Database seeder
│   ├── core/
│   │   ├── security.py      # JWT, password hashing
│   │   └── dependencies.py  # Auth dependencies
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API endpoints
│   └── services/            # Business logic
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── Dockerfile
├── pyproject.toml
└── .env.example
```

## Development

### Run tests
```bash
pytest
```

### Lint code
```bash
ruff check .
```

### Create migration
```bash
alembic revision --autogenerate -m "Description"
```

### Apply migrations
```bash
alembic upgrade head
```

## License

MIT
