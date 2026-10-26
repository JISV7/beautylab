# CURSORG

**Plataforma B2B de Capacitación Corporativa**

> *Capacitación corporativa sin barreras.*

Cursorg es una plataforma SaaS B2B para que una empresa registre su espacio,
organice departamentos, administre colaboradores, publique clases y evalúe a su
equipo con quizzes. Incluye catálogo de cursos, licencias, carrito, facturación y
un reproductor con progreso por clase.

---

## Estado actual del sistema

**Estado:** MVP funcional, listo para demo y piloto controlado. **No está listo
para instalarse en producción sin completar la sección de pendientes.**

### Ya funciona

- Registro de empresa con administrador y departamentos.
- Login split-screen con recuperación visual de contraseña.
- Panel de empresa `/empresa` con Inicio, Departamentos, Gestión de Clases y
  Directorio.
- CRUD de departamentos y colaboradores.
- Clases de video, solo quiz o video + quiz.
- Editor de quizzes con preguntas de selección única, múltiple y verdadero/falso.
- Intentos, nota mínima, límite de intentos, tiempo límite y calificación en
  servidor.
- Progreso del curso calculado por clases requeridas completadas.
- Catálogo, carrito, facturas, licencias, inscripciones y acceso al reproductor.
- Seed idempotente con empresa, departamentos, clases, quizzes, empleados y
  licencias de prueba.

### Pendiente para producción

- **Pagos simulados:** hoy todo pago se marca como `completed`; no hay pasarela
  real (Stripe, PayPal, Pago Móvil, etc.).
- **Certificados:** todavía no se generan ni verifican.
- **Recuperación de contraseña y verificación de correo:** no hay endpoints
  reales; el formulario de recuperación es visual.
- **Email:** el SMTP está sin configurar por defecto.
- **Despliegue:** falta contenedor/nginx del frontend, HTTPS, proxy inverso y
  variables de entorno para la URL de la API.
- **Seguridad:** el seed crea usuarios demo con contraseñas conocidas; hay que
  desactivarlo o cambiarlas antes de producción.
- **Pruebas automatizadas:** `backend/tests` está vacío.
- **Asignación de licencias/cursos desde `/empresa`:** existe API de licencias,
  pero el panel de empresa todavía no la integra.
- **Multi-tenant estricto:** los cursos/clases del catálogo son globales; los
  departamentos y usuarios sí están aislados por empresa.

---

## Novedades de esta versión

- **Landing B2B** con foto, overlay azul, beneficios, logos y CTA para registrar
  empresa.
- **Login split-screen** en `/login`.
- **Wizard de registro de empresa** en `/registro-empresa` (datos, cuenta y
  departamentos).
- **Dashboard de empresa** en `/empresa`, separado del panel de plataforma
  `/admin`.
- **Multi-empresa:** tablas `companies`, `departments` y relación con `users`.
- **Estructura de clases:** `course_modules`, `course_classes` con tipo de
  contenido (`video`, `quiz`, `mixed`) y clase requerida.
- **Quizzes:** preguntas, opciones, intentos, respuestas, nota mínima, tiempo y
  publicación.
- **Progreso por clase:** una clase se completa al terminar el video o al aprobar
  su quiz; el curso recalcula su avance.
- **Directorio de empresa:** roles, departamento, estado activo/inactivo y alta
  de usuarios.
- **Seed demo completo** para probar todos los roles sin configurar nada.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | FastAPI, Python 3.13 |
| Base de datos | PostgreSQL 17 |
| ORM y migraciones | SQLAlchemy 2.0 async, Alembic |
| Autenticación | JWT + Argon2 |
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4 |
| Contenedores | Podman / Docker Compose |

---

## Estructura del repositorio

```text
beautylab/
├── backend/
│   ├── app/
│   │   ├── models/          # User, Company, Department, Course, Quiz...
│   │   ├── routers/         # auth, company, learning, catalog, invoices...
│   │   ├── services/        # company, quiz, course_progress, enrollment...
│   │   ├── schemas/         # Pydantic request/response
│   │   └── seed.py          # datos demo idempotentes
│   ├── alembic/versions/    # migraciones 021 y 022 incluidas
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # LoginPage, CompanyRegisterPage, CompanyDashboard...
│   │   ├── components/      # company/, course/, home/, layout/...
│   │   ├── contexts/        # AuthContext, ThemeContext, CartContext
│   │   └── lib/             # companyApi, learningApi
│   └── public/images/       # fotos locales de hero, login y cursos
├── compose.yaml
└── README.md
```

---

## Requisitos

### Windows 10/11

- **Podman Desktop** o **Docker Desktop** con motor Linux.
- **Node.js 20+** y **pnpm**.
- **Git**.
- Opcional: Python 3.13 + `uv` para ejecutar el backend sin contenedores.

### Podman en Windows

Si es la primera vez:

```powershell
podman machine init --cpus 4 --memory 4096 --disk-size 30
podman machine start
```

Para usar Compose con Podman, instala el proveedor:

```powershell
pip install --user podman-compose
```

Agrega la carpeta de scripts de Python al PATH del usuario. Normalmente es:

```text
C:\Users\<TU_USUARIO>\AppData\Roaming\Python\Python312\Scripts
```

---

## Inicio rápido

Desde la raíz del repositorio:

### 1. Configurar el backend

```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```

Cambia al menos `JWT_SECRET_KEY`. Puedes generar uno con:

```powershell
$secret = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
(Get-Content backend\.env) -replace '^JWT_SECRET_KEY=.*', "JWT_SECRET_KEY=$secret" | Set-Content backend\.env -Encoding UTF8
```

> El `DATABASE_URL` del `.env` apunta a `localhost`. Compose lo sobrescribe
> automáticamente para usar el servicio `db`. No lo cambies para Podman/Docker.

### 2. Levantar base de datos y backend

**Podman (recomendado en este proyecto):**

```powershell
podman-compose up -d --build
```

**Docker:**

```powershell
docker compose up -d --build
```

La primera vez compila la imagen. El backend espera a PostgreSQL, aplica
migraciones, ejecuta el seeder y arranca la API.

### 3. Levantar el frontend

En otra terminal:

```powershell
cd frontend
pnpm install
pnpm dev --host --port 5173
```

Si `pnpm install` muestra `Ignored build scripts: @swc/core, esbuild`, ejecuta:

```powershell
pnpm approve-builds
```

o verifica que `frontend/pnpm-workspace.yaml` tenga:

```yaml
allowBuilds:
  '@swc/core': true
  esbuild: true
```

### 4. Verificar

```powershell
podman ps
Invoke-RestMethod http://localhost:8000/health
```

| Servicio | URL |
|----------|-----|
| Aplicación | `http://localhost:5173` |
| Login | `http://localhost:5173/login` |
| Registro de empresa | `http://localhost:5173/registro-empresa` |
| Panel de empresa | `http://localhost:5173/empresa` |
| Panel de plataforma | `http://localhost:5173/admin` |
| API | `http://localhost:8000` |
| Documentación API | `http://localhost:8000/docs` |
| PostgreSQL | `localhost:5432` |

---

## Usuarios de prueba

El seeder crea estos usuarios automáticamente. **Cámbialos antes de producción.**

| Rol | Correo | Contraseña | Entrar en | Qué puede probar |
|-----|--------|------------|-----------|------------------|
| **root** | `root@cursorg.ve` | `password12345*` | `/admin` y `/empresa` | Control total: temas, catálogo, facturas, usuarios y empresa |
| **admin** | `admin@cursorg.ve` | `password123*` | `/admin` y `/empresa` | Administración de plataforma y empresa demo |
| **company_admin** | `gerente@cursorg.ve` | `password123*` | `/empresa` | Panel de empresa (sin acceso a `/admin`) |
| **user** | `luis.gonzalez@cursorg.ve` | `password123*` | `/dashboard` | Curso con licencia demo, clases y quiz final |
| **user** | `ana.martinez@cursorg.ve` | `password123*` | `/dashboard` | Curso con licencia y progreso alto |
| **user** | `carla.fernandez@cursorg.ve` | `password123*` | `/dashboard` | Colaborador sin licencia (prueba de acceso restringido) |

Todos los colaboradores demo usan la misma contraseña `password123*`.

### Flujo rápido de prueba

1. Entra como `gerente@cursorg.ve` → `/empresa`.
2. Revisa **Inicio**, **Departamentos**, **Gestión de Clases** y **Directorio**.
3. En **Gestión de Clases**, abre el icono de quiz de una clase de evaluación y
   edita preguntas, nota mínima, intentos o tiempo.
4. Cierra sesión y entra como `luis.gonzalez@cursorg.ve`.
5. Ve a **Mis cursos** → curso **Ventas Consultivas y Atención al Cliente**.
6. En el contenido, abre la clase **Evaluación de atención al cliente**.
7. Inicia el quiz, responde y envía. Al aprobar, la clase queda completada y el
   progreso del curso se recalcula.

---

## Rutas y navegación

### Rutas públicas

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing B2B | Público |
| `/#courses` | Sección de cursos de la landing | Público |
| `/#about` | Sección “Sobre Cursorg” | Público |
| `/#contact` | Formulario de contacto/demo | Público |
| `/explore` | Catálogo público de cursos | Público |
| `/course/:id` | Detalle público de un curso | Público |
| `/login` | Login split-screen | Público |
| `/registro-empresa` | Wizard de registro de empresa | Público |

> Si un usuario autenticado entra a `/explore`, se le redirige a
> `/dashboard?tab=explore`. Si entra a `/course/:id`, se le redirige a
> `/dashboard?tab=course-details&courseId=:id`.

### Autenticación y redirecciones

| Ruta | Resultado |
|------|-----------|
| `/login` | Tras iniciar sesión: `company_admin`/`admin`/`root` → `/empresa`; `user` → `/dashboard` |
| `/registro-empresa` | Al completar el wizard inicia sesión y redirige a `/empresa` |
| `/dashboard` | Requiere sesión; sin sesión redirige a `/` |
| `/empresa` | Requiere rol `company_admin`, `admin` o `root` |
| `/admin` | Requiere rol `admin` o `root` |
| `/cart` | Requiere sesión |
| `*` (ruta inexistente) | Redirige a `/` |

### Panel del colaborador — `/dashboard`

El panel usa el parámetro `?tab=` para navegar entre secciones. También acepta
`courseId` en las vistas de curso.

| Ruta | Sección | Estado |
|------|---------|--------|
| `/dashboard?tab=home` | Inicio del colaborador | Placeholder actual |
| `/dashboard?tab=my-courses` | Mis cursos | Funcional |
| `/dashboard?tab=explore` | Explorar cursos | Funcional |
| `/dashboard?tab=learning-paths` | Rutas de aprendizaje | Placeholder actual |
| `/dashboard?tab=community` | Comunidad | Placeholder actual |
| `/dashboard?tab=ai-lab` | Laboratorio IA | Placeholder actual |
| `/dashboard?tab=invoices` | Facturas del colaborador | Funcional |
| `/dashboard?tab=cart` | Carrito dentro del panel | Funcional |
| `/dashboard?tab=settings` | Configuración de perfil | Funcional |
| `/dashboard?tab=course-details&courseId={uuid}` | Detalle del curso autenticado | Funcional |
| `/dashboard?tab=course-player&courseId={uuid}` | Reproductor, clases y quizzes | Funcional; requiere licencia |

### Panel de empresa — `/empresa`

Requiere rol `company_admin`, `admin` o `root`. Navegación por `?tab=`:

| Ruta | Sección |
|------|---------|
| `/empresa?tab=inicio` | KPIs y actividad reciente |
| `/empresa?tab=departamentos` | Grid y CRUD de departamentos |
| `/empresa?tab=clases` | Programas, módulos, clases y editor de quizzes |
| `/empresa?tab=directorio` | Directorio y usuarios de la empresa |

Sin `?tab=`, carga `inicio` por defecto.

### Panel de plataforma — `/admin`

Requiere rol `admin` o `root`. Navegación por `?tab=`:

| Ruta | Sección |
|------|---------|
| `/admin?tab=dashboard` | Resumen del panel |
| `/admin?tab=themes` | Configuración de temas |
| `/admin?tab=home` | Configuración de la página de inicio |
| `/admin?tab=categories` | Categorías |
| `/admin?tab=users` | Usuarios de plataforma |
| `/admin?tab=content` | Cursos y contenido |
| `/admin?tab=invoices` | Facturas |
| `/admin?tab=coupons` | Cupones |
| `/admin?tab=company-info` | Información fiscal de la empresa |
| `/admin?tab=printer-info` | Información de impresión |

Dentro de `?tab=content`, las vistas de crear/editar curso se abren desde los
botones del listado (no cambian la URL).

### Flujo de navegación recomendado

**Admin de empresa**
1. `/login` → iniciar sesión como `gerente@cursorg.ve`.
2. `/empresa?tab=inicio`.
3. `/empresa?tab=departamentos` → crear/editar áreas.
4. `/empresa?tab=directorio` → agregar colaboradores.
5. `/empresa?tab=clases` → crear clase y pulsar el icono de quiz para configurarlo.

**Colaborador**
1. `/login` → iniciar sesión como `luis.gonzalez@cursorg.ve`.
2. `/dashboard?tab=my-courses`.
3. Abrir el curso → `/dashboard?tab=course-player&courseId={uuid}`.
4. Seleccionar una clase de video o una clase solo quiz.
5. Aprobar el quiz → la clase se completa y el progreso se actualiza.

**Plataforma**
1. `/login` → iniciar sesión como `admin@cursorg.ve` o `root@cursorg.ve`.
2. `/admin?tab=dashboard`.
3. Navegar por el sidebar; la URL refleja la sección activa.
4. `/empresa` sigue disponible para revisar el espacio de empresa demo.

---

## Funcionalidades detalladas

### Registro de empresa

- **Paso 1:** nombre, RIF, sector, correo, teléfono, responsable y contraseña.
- **Paso 2:** selección de departamentos con chips y opción de agregar otros.
- Al finalizar se crea la empresa, sus departamentos y el usuario
  `company_admin`, y se inicia sesión automáticamente.

### Panel de empresa (`/empresa`)

- **Inicio:** empleados activos, cursos asignados, tasa de finalización y
  actividad reciente.
- **Departamentos:** tarjetas con empleados, cursos y progreso promedio. CRUD
  completo.
- **Gestión de Clases:** programas, módulos en acordeón y clases con miniatura
  16:9, tipo de contenido, evaluación y edición.
- **Directorio y Usuarios:** búsqueda, tabla con departamento, rol y estado,
  alta de usuarios y activación/desactivación.

### Clases y quizzes

Tipos de contenido por clase:

| Tipo | Video | Quiz | Se completa con |
|------|-------|------|-----------------|
| `video` | Sí | Opcional | Ver el video al 100 % |
| `quiz` | No | Sí | Aprobar el quiz |
| `mixed` | Sí | Sí | Aprobar el quiz |

Tipos de pregunta:

- Selección única.
- Selección múltiple.
- Verdadero/falso.

Reglas:

- La nota mínima es configurable (por defecto 70 %).
- Los intentos máximos son configurables (vacío = ilimitados).
- El tiempo límite es configurable y se valida en el servidor.
- La calificación es siempre server-side; el frontend nunca recibe las
  respuestas correctas antes de enviar.
- Selección múltiple usa crédito total solo si coincide exactamente el conjunto
  correcto.
- El alumno puede ver la revisión de respuestas si el quiz lo permite.

### Progreso del curso

- Solo las clases **requeridas** cuentan.
- Cada clase completada suma al progreso.
- El progreso es monotónico: no retrocede si se repite una clase.
- Al llegar al 100 %, la inscripción pasa a `completed`.
- Los cursos antiguos sin clases siguen usando el progreso manual del video.

### Acceso del alumno

- El reproductor y los quizzes exigen una **licencia canjeada** o una
  **asignación corporativa** vigente.
- Sin acceso, la API responde `403`.
- El seed otorga licencias demo a `ana.martinez@cursorg.ve` y
  `luis.gonzalez@cursorg.ve` para el curso de Ventas.

---

## Modelo de datos agregado

| Tabla | Propósito |
|-------|-----------|
| `companies` | Empresa/tenant |
| `departments` | Departamentos por empresa |
| `users.company_id`, `users.department_id` | Pertenencia del usuario |
| `course_modules` | Módulos de un curso |
| `course_classes` | Clases con video/quiz/mixta y obligatoriedad |
| `quizzes` | Configuración del quiz por clase |
| `quiz_questions` | Preguntas |
| `quiz_options` | Opciones y respuesta correcta |
| `quiz_attempts` | Intentos por alumno |
| `quiz_attempt_answers` | Respuestas y puntaje por pregunta |
| `class_completions` | Clases completadas por usuario |

Migraciones relevantes:

- `021_company_workspace`: empresas, departamentos, módulos, clases y
  `company_id`/`department_id` en usuarios.
- `022_quizzes_and_progress`: quizzes, intentos, respuestas y progreso por clase.

---

## API principal

### Empresas y autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/companies/register` | Registrar empresa + admin + departamentos |
| `POST` | `/auth/login` | Iniciar sesión |
| `GET` | `/users/me` | Usuario actual con roles y empresa |

### Panel de empresa

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/company/profile` | Datos de la empresa |
| `GET` | `/company/summary` | KPIs |
| `GET` | `/company/activity` | Actividad reciente |
| `GET/POST` | `/company/departments` | Listar/crear departamentos |
| `PATCH/DELETE` | `/company/departments/{id}` | Editar/eliminar |
| `GET` | `/company/classes` | Programas, módulos y clases |
| `POST/PATCH/DELETE` | `/company/modules/...` | CRUD de módulos |
| `POST/PATCH/DELETE` | `/company/classes/...` | CRUD de clases |
| `GET/POST` | `/company/users` | Listar/crear colaboradores |
| `PATCH/DELETE` | `/company/users/{id}` | Editar/desactivar |
| `GET/PUT/DELETE` | `/company/classes/{id}/quiz` | Configurar quiz |
| `GET` | `/company/classes/{id}/quiz/attempts` | Resultados de alumnos |

### Alumno

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/catalog/my-courses/{course_id}/player` | Acceso y progreso del curso |
| `GET` | `/catalog/my-courses/{course_id}/content` | Módulos, clases y estado |
| `POST` | `/catalog/my-courses/{course_id}/classes/{class_id}/complete` | Completar clase de video |
| `GET` | `/catalog/my-courses/{course_id}/classes/{class_id}/quiz` | Estado del quiz |
| `POST` | `/catalog/my-courses/{course_id}/classes/{class_id}/quiz/attempts` | Iniciar/continuar intento |
| `POST` | `/catalog/quiz-attempts/{attempt_id}/submit` | Enviar y calificar |
| `GET` | `/catalog/my-courses/{course_id}/classes/{class_id}/quiz/attempts` | Historial |

La documentación interactiva completa está en `http://localhost:8000/docs`.

---

## Seed y datos demo

`python -m app.seed` es idempotente y crea o actualiza:

- Roles: `root`, `admin`, `company_admin`, `user`.
- Empresa **Cursorg Demo** con 5 departamentos.
- 5 cursos, 1 ruta de aprendizaje, 10 módulos y 20 clases.
- 5 quizzes de evaluación con 3 preguntas cada uno.
- Colaboradores demo con departamentos, inscripciones y progreso.
- Licencias demo para probar el reproductor y los quizzes.
- Usuario `company_admin` dedicado: `gerente@cursorg.ve`.

Puedes ejecutarlo de nuevo en cualquier momento:

```powershell
podman exec cursorg-backend python -m app.seed
```

---

## Variables de entorno

Referencia completa en `backend/.env.example`.

| Variable | Uso |
|----------|-----|
| `JWT_SECRET_KEY` | Firma de tokens. Obligatorio cambiarlo |
| `DATABASE_URL` | Conexión PostgreSQL (Compose la sobrescribe a `db`) |
| `CORS_ORIGINS` | Orígenes permitidos del frontend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Envío de correos |
| `FROM_EMAIL`, `FROM_NAME` | Remitente |
| `WEBSITE_URL` | URL usada en enlaces de facturas |

> El frontend aún tiene la URL de la API hardcodeada en varios archivos
> (`http://localhost:8000`). Antes de desplegar hay que moverla a una variable de
> entorno.

---

## Comandos útiles

```powershell
# Estado de contenedores
podman ps

# Logs del backend
podman logs -f cursorg-backend

# Migraciones
podman exec cursorg-backend alembic current
podman exec cursorg-backend alembic upgrade head

# Seed
podman exec cursorg-backend python -m app.seed

# Calidad backend
podman exec cursorg-backend ruff check app
podman exec cursorg-backend python -m compileall -q app

# Frontend
cd frontend
pnpm build
pnpm lint
```

### Reiniciar la base desde cero

```powershell
podman-compose down -v
podman-compose up -d --build
```

Esto elimina el volumen de PostgreSQL y los archivos subidos.

---

## Pruebas de humo recomendadas

1. `GET http://localhost:8000/health` → `{"status":"healthy"}`.
2. Login con cada usuario de la tabla de roles.
3. En `/empresa`, crear un departamento, un usuario y una clase.
4. Configurar un quiz y publicarlo.
5. Entrar como alumno con licencia, aprobar el quiz y verificar:
   - clase marcada como completada,
   - progreso del curso actualizado,
   - intento visible en el panel de empresa.
6. Intentar abrir el curso con un usuario sin licencia → debe responder `403`.
7. `pnpm build` sin errores.

---

## Problemas comunes

| Síntoma | Qué revisar |
|---------|-------------|
| `Cannot connect to Podman` | `podman machine start` |
| `podman-compose` no se reconoce | Instala con `pip install --user podman-compose` y agrega `...\Python312\Scripts` al PATH |
| `docker` no se reconoce | Abre Docker Desktop y espera **Engine running** |
| El backend no conecta a la DB | `podman ps`; la base debe estar `healthy` |
| El frontend no carga datos | API en `http://localhost:8000/health` y `CORS_ORIGINS` con `http://localhost:5173` |
| Error de `uvloop` en Windows nativo | Usa Podman/Docker o actualiza con `uv sync` |
| PDF de factura falla en Windows nativo | Usa el backend en contenedor (incluye Pango/WeasyPrint) |
| `pnpm install` bloquea builds | `pnpm approve-builds` o revisa `pnpm-workspace.yaml` |
| Puerto ocupado (`5432`, `8000`, `5173`) | Cierra el proceso anterior o cambia el puerto |
| Quiz no visible para el alumno | Debe estar publicado y el usuario debe tener licencia/asignación |
| El progreso no sube al ver el video | La clase debe ser de tipo `video` y llegar al 100 % |

---

## Próximos pasos sugeridos

1. Pasarela de pagos real o flujo de conciliación manual.
2. Certificados verificables con código único/QR.
3. Reset de contraseña, verificación de correo y rate limiting.
4. Asignación de licencias/cursos desde `/empresa`.
5. Contenedor del frontend, nginx, HTTPS y variables de entorno.
6. Pruebas automatizadas de autenticación, quizzes y progreso.
7. Backups, monitoreo y logs centralizados.

---

## Licencia

MIT
