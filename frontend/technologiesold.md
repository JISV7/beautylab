# Technology Stack & Architecture Specification

**Date:** February 25, 2026
**Project:** User Interfaces - Evaluation 1
**Document:** technologies.md

## 1. Core Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | 17.8+ | Relational data storage, JSONB for theme configs. |
| **Backend** | FastAPI | 0.135.1+ | API structure, authentication, business logic. |
| **Frontend** | React | 19.2.4+ | UI rendering, state management, dynamic theming. |
| **Language** | TypeScript | 5.9+ | Type safety across full stack. |
| **ORM** | SQLAlchemy | 2.0.48+ | Database schema management and querying. |

## 2. Database Schema (PostgreSQL 17.8)

Designed for scalability, RBAC, and dynamic theme storage.

### 2.1. Users & Authentication
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  preferred_theme_id UUID REFERENCES theme_configs(id) NULL;
);
```

### 2.2. Roles & Permissions (RBAC)
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL -- 'root', 'admin', 'user'
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'create_theme', 'delete_user'
  resource VARCHAR(50) NOT NULL
);

CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id),
  permission_id INT REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id INT REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);
```

### 2.3. Theme Configuration
Stores dynamic design settings managed by admins.
```sql
CREATE TABLE theme_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL, -- 'Monochromatic', 'Triad', 'Christmas'
  type VARCHAR(20) NOT NULL, -- 'light', 'dark'
  colors JSONB NOT NULL, -- { primary: '#...', background: '#...' }
  typography JSONB NOT NULL, -- { baseFont: 'Roboto', scale: 1.2 }
  is_active BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 3. Backend Architecture (FastAPI)

### 3.1. Module Structure
*   **`AuthModule`**: Handles login, register, JWT strategy, refresh tokens.
*   **`UsersModule`**: User profile management.
*   **`RolesModule`**: RBAC logic, guards, decorators.
*   **`ThemeModule`**: CRUD for theme configurations, live preview data endpoints.
*   **`AppModule`**: Global providers, configuration.

### 3.2. Authentication Strategy
*   **Access Token**: JWT (Short-lived, 15 min).
*   **Refresh Token**: JWT or DB stored (Long-lived, 7 days).
*   **Hashing**: Argon2 (via `pnpm i argon2`).
*   **Validation**: Class-validator pipes for DTOs.

### 3.3. Authorization Guards
*   **`JwtAuthGuard`**: Validates access token.
*   **`RolesGuard`**: Checks user role against `@Roles()` decorator.
*   **`PermissionsGuard`**: Checks specific permissions for granular access.

### 3.4. API Endpoints (Key)
*   `POST /auth/register`: Create user (Default role: `user`).
*   `POST /auth/login`: Return access/refresh tokens.
*   `GET /themes`: Public endpoint to fetch active themes.
*   `POST /themes`: Admin only. Create new theme config.
*   `PATCH /themes/:id`: Admin only. Update theme variables.

## 4. Frontend Architecture (React 19.2.4)

### 4.1. State Management
*   **Auth Context**: Stores user session, tokens, and role.
*   **Theme Context**: Stores current CSS variables, font families, and mode (light/dark).
*   **Persistence**: Tokens in `HttpOnly` cookies; Theme preference in `localStorage`.

### 4.2. Dynamic Theming Engine
*   **CSS Variables**: For the public site, active colors and font-sizes are defined globally in `:root`. For the Admin panel's Live Preview, dynamic CSS variables are strictly encapsulated within a Shadow DOM or an <iframe> to prevent uncommitted theme changes from bleeding into the dashboard UI.
*   **System Preference**: Uses `window.matchMedia('(prefers-color-scheme: dark)')` for initial load.
*   **Live Preview**: Admin panel updates React Context state immediately before committing to DB.
*   **Units**: `rem` used for typography and spacing to ensure proportional scaling.

### 4.3. Component Structure
*   **`/public`**: Landing page, Hero, Carousel, Services (Consumes active theme).
*   **`/admin`**: Dashboard layout (Sidebar + Dynamic Content Area).
    *   `ThemeEditor`: Form for colors/fonts.
    *   `PreviewZone`: Renders sample cards/inputs with pending styles.
*   **`/auth`**: Login/Register forms.

### 4.4. Routing (React Router v7+)
*   **Protected Routes**: Wrapped with `RequireAuth` component.
*   **Role Based Routes**: Admin routes restricted to `admin`/`root` roles.

## 5. Security & Accessibility

### 5.1. Security Measures
*   **CORS**: Configured to allow specific frontend origin.
*   **Helmet**: Sets secure HTTP headers.
*   **Rate Limiting**: on auth endpoints.
*   **Input Sanitization**: DOMPurify for any rich text inputs.

### 5.2. Accessibility (WCAG 2.2)
*   **Contrast Ratios**: Admin panel validates color choices against WCAG AA/AAA standards.
*   **Focus States**: Visible outlines for all interactive elements.
*   **Semantic HTML**: Proper use of `<header>`, `<main>`, `<nav>`, `<footer>`, etc.
*   **Daltonism Safe**: Specific theme preset ensures distinguishable hues (no red/green reliance).

## 6. Development Environment

*   **Package Manager**: pnpm (v10+)
*   **Containerization**: Docker & Docker Compose (Postgres 17.8 image).
*   **Linting**: ESLint + Prettier.
*   **Testing**:
    *   Backend: Jest (Unit & E2E).
    *   Frontend: React Testing Library.
*   **CI/CD**: GitHub Actions (Build, Test, Deploy).

## 7. Implementation Roadmap

1.  **Setup**: Initialize FastAPI & React repos, configure Docker for Postgres 17.8.
2.  **Auth**: Implement User entity, JWT strategy, Login/Register flows.
3.  **RBAC**: Seed roles (`root`, `admin`, `user`), implement guards.
4.  **Theme Engine**: Create DB schema for themes, build CSS variable injection logic.
5.  **Admin Panel**: Build Dashboard layout, Theme Editor, Live Preview component.
6.  **Public Site**: Implement Header, Hero, Carousel, Footer using dynamic tokens.
7.  **Testing**: Verify role restrictions, theme persistence, and system preference detection.
8.  **Deploy**: Containerize and deploy to production environment.