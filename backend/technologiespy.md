# Technology Stack & Architecture Specification

**Date:** March 5, 2026
**Project:** User Interfaces - Evaluation 1
**Document:** technologies.md

## 1. Core Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL | 17.8+ | Relational storage, JSONB for theme configs. |
| **Backend** | FastAPI | 0.135.1+ | API structure, auth, business logic. |
| **Frontend** | React | 19.2.4+ | UI rendering, state management, theming. |
| **Language** | TypeScript | 5.9+ | Type safety (Frontend). |
| **ORM** | SQLAlchemy | 2.0.48+ | Async DB schema management. |
| **Migrations** | Alembic | 1.18.4+ | Database version control. |

## 2. Database Schema (PostgreSQL 17.8)

Designed for scalability, RBAC, and dynamic theme storage. Modeled via SQLAlchemy 2.0 ORM.
Read the file beautyschemav1.md
To gain a complete understanding of the schemaV1.0

## 3. Backend Architecture (FastAPI)

### 3.1. Project Structure
*   **`app/routers`**: API endpoints (`auth.py`, `users.py`, `themes.py`).
*   **`app/core`**: Security, config, database session.
*   **`app/models`**: SQLAlchemy ORM models.
*   **`app/schemas`**: Pydantic models for request/response validation.
*   **`app/dependencies`**: Reusable dependencies (Auth, RBAC).

### 3.2. Authentication Strategy
*   **Access Token**: JWT (Short-lived, 15 min).
*   **Refresh Token**: JWT (Long-lived, 7 days).
*   **Hashing**: `argon2-cffi` (via `passlib` or direct).
*   **Validation**: Pydantic V2 models for all DTOs.

### 3.3. Authorization Dependencies
*   **`get_current_user`**: Validates JWT via `OAuth2PasswordBearer`.
*   **`check_role`**: Dependency to verify user role against required roles.
*   **`check_permission`**: Dependency for granular resource access.

### 3.4. API Endpoints (Key)
*   `POST /auth/register`: Create user (Default role: `user`).
*   `POST /auth/login`: Return access/refresh tokens.
*   `GET /themes`: Public endpoint to fetch active themes.
*   `POST /themes`: Admin only. Create new theme config.
*   `PATCH /themes/:id`: Admin only. Update theme variables.

## 4. Frontend Architecture (React 19.2.4)

### 4.1. State Management
*   **Auth Context**: Session, tokens, role.
*   **Theme Context**: CSS variables, font families, mode.
*   **Persistence**: Tokens in `HttpOnly` cookies; Theme preference in `localStorage`.

### 4.2. Dynamic Theming Engine
*   **CSS Variables**: Global `:root` for public site.
*   **Encapsulation**: Admin Live Preview uses Shadow DOM or `<iframe>` to isolate uncommitted styles.
*   **System Preference**: `window.matchMedia('(prefers-color-scheme: dark)')`.
*   **Units**: `rem` for typography/spacing (proportional scaling).

### 4.3. Component Structure
*   **`/public`**: Landing, Hero, Carousel, Services (Consumes active theme).
*   **`/admin`**: Dashboard (Sidebar + Dynamic Content).
    *   `ThemeEditor`: Color/font forms.
    *   `PreviewZone`: Sample components with pending styles.
*   **`/auth`**: Login/Register forms.

### 4.4. Routing (React Router v7+)
*   **Protected Routes**: `RequireAuth` wrapper.
*   **Role Based Routes**: Admin routes restricted to `admin`/`root`.

## 5. Security & Accessibility

### 5.1. Security Measures
*   **CORS**: `CORSMiddleware` configured for specific frontend origin.
*   **Headers**: Secure HTTP headers (via middleware).
*   **Rate Limiting**: `slowapi` or custom middleware on auth endpoints.
*   **Sanitization**: `DOMPurify` for rich text inputs.

### 5.2. Accessibility (WCAG 2.2)
*   **Contrast**: Admin validates colors against WCAG AA/AAA.
*   **Focus**: Visible outlines for interactive elements.
*   **Semantic HTML**: `<header>`, `<main>`, `<nav>`, `<footer>`.
*   **Daltonism**: Theme presets ensure distinguishable hues.

## 6. Development Environment

*   **Backend Manager**: pip / uv (Python 3.13+).
*   **Frontend Manager**: pnpm (v10+).
*   **Containerization**: Docker & Docker Compose.
*   **Linting**: Ruff (Backend), ESLint + Prettier (Frontend).
*   **Testing**: Pytest (Backend), React Testing Library (Frontend).
*   **CI/CD**: GitHub Actions.

## 7. Implementation Roadmap

1.  **Setup**: Init FastAPI & React, configure Docker (Postgres 17.8).
2.  **DB**: Define SQLAlchemy models, run Alembic migration.
3.  **Auth**: Implement JWT logic, Login/Register endpoints.
4.  **RBAC**: Seed roles, implement dependency guards.
5.  **Theme Engine**: Build CRUD for themes, CSS variable injection logic.
6.  **Admin Panel**: Dashboard layout, Theme Editor, Live Preview.
7.  **Public Site**: Implement sections using dynamic tokens.
8.  **Testing**: Verify roles, theme persistence, system preferences.
9.  **Deploy**: Containerize and deploy.