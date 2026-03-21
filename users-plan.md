# Users Module Development Plan

## Overview
The Users Module handles user registration, authentication, profile management, and fiscal data required for invoicing. It integrates with roles and permissions for access control.

## Models (Pydantic Schemas)
- `UserCreate`: email, password, full_name (optional)
- `UserResponse`: id, email, full_name, is_active, is_verified, roles, created_at
- `UserUpdate`: full_name, is_active, is_verified (admin only)
- `FiscalInfoUpdate`: rif, document_type, document_number, business_name, fiscal_address, phone, is_contributor
- `UserLogin`: email, password
- `Token`: access_token, token_type

## Services
- `auth_service`: password hashing (Argon2), JWT token creation/validation
- `user_service`: CRUD operations, fiscal info updates
- `role_service`: assign/remove roles, check permissions

## API Endpoints
- `POST /auth/register` – register new user (creates with default 'user' role)
- `POST /auth/login` – returns JWT token
- `POST /auth/logout` – invalidate token (optional, if using blacklist)
- `GET /users/me` – current user profile
- `PUT /users/me` – update profile (name, etc.)
- `GET /users/me/fiscal-info` – get fiscal info
- `PUT /users/me/fiscal-info` – update fiscal info
- `GET /users/{id}` – get user by id (admin only)
- `GET /users` – list users with pagination (admin)
- `PUT /users/{id}/roles` – assign/remove roles (admin)

## Business Logic
- **Registration**: validate email uniqueness, hash password, create user, assign default role 'user'.
- **Login**: verify credentials, generate JWT (expires in 1 day).
- **Profile Update**: only allow updating own profile; admins can update any.
- **Fiscal Info**: optional fields; if `is_contributor` is true, at least RIF is required.
- **Admin Access**: require role 'admin' or 'root'.

## Validation
- Email format using `email-validator`
- Password strength: at least 8 characters, mix of letters/numbers (can be configured)
- RIF format: regex pattern for Venezuelan RIF (J-123456789, V-12345678, etc.)

## Security
- Passwords hashed with Argon2id.
- JWT stored in HTTP‑only cookie or returned as Bearer token (recommend cookie).
- Rate limiting on login/register endpoints.

## Implementation Steps
1. Create Pydantic schemas in `app/schemas/user.py`
2. Implement `auth_service` with password hashing and JWT (using `python-jose`)
3. Implement `user_service` with SQLAlchemy queries
4. Create API routes in `app/api/v1/users.py` and `auth.py`
5. Add dependency `get_current_user` to verify token
6. Add role‑based permission checks using custom `require_role` dependency
7. Write unit tests for registration, login, profile updates