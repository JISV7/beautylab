# Codyn

Codyn is a comprehensive platform for learning programming. Its a online academy featuring a dynamic theming engine, user management, an integrated point-of-sale system, course enrollments, and an online catalog.

## Project Structure

The project is structured as a monorepo with distinct frontend and backend services:

- **`backend/`**: A robust FastAPI application using Python 3.13, PostgreSQL, SQLAlchemy (Async), and Alembic. It provides endpoints for authentication, role-based access control, dynamic themes, product catalog, carts, invoicing, and more.
- **`frontend/`**: A modern React 19 application built with Vite, TypeScript, and TailwindCSS v4. It features a responsive UI with Radix UI themes, GSAP animations, dynamic routing (React Router 7), and comprehensive views for exploration, dashboard management, administration, and cart checkout.
- **`compose.yaml`**: Docker Compose configuration to run the database and backend services locally.

## Features

- **Authentication & RBAC**: JWT-based authentication with Argon2 hashing and granular permissions for root, admin, and user roles.
- **Dynamic Theming**: JSONB-based theme configuration with live preview support.
- **E-Commerce & Billing**: Integrated shopping cart, product catalog, coupon system, and multi-entity invoicing support.
- **Educational Platform**: Course enrollments, learning paths, and video content handling.
- **Rich User Interface**: Responsive design powered by TailwindCSS v4, with complex animations and 3D elements using Three.js and GSAP.

## Getting Started

### Prerequisites

- Node.js & pnpm
- Python 3.13 & uv (Python package manager)
- PostgreSQL 17
- Docker & Docker Compose

### Running the Backend

Using Docker Compose:

```bash
docker compose up -d
```

Alternatively, for local development without Docker:

```bash
cd backend
uv sync
cp .env.example .env # Configure your database credentials
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`. API Docs are at `http://localhost:8000/docs`.

### Running the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```
The frontend will start on your local development server (typically `http://localhost:5173`).

## Default Credentials

If you seeded the database locally (`python -m app.seed`), you can log in with:
- **Email:** root@beautylab.com
- **Password:** admin123
