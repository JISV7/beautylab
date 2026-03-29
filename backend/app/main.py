"""BeautyLab API - Main FastAPI application."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import close_db, init_db
from app.routers import (
    admin,
    auth,
    cart,
    catalog,
    company_info,
    coupons,
    enrollments,
    fonts,
    invoices,
    licenses,
    payments,
    printers,
    products,
    themes,
    users,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application lifespan events."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.app_name,
    description="BeautyLab Backend API - Authentication, User Management, and Dynamic Theming",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods_list,
    allow_headers=settings.cors_allow_headers_list,
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(catalog.router)
app.include_router(cart.router)
app.include_router(coupons.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(licenses.router)
app.include_router(enrollments.router)
app.include_router(themes.router)
app.include_router(admin.router)
app.include_router(fonts.router)
app.include_router(company_info.router)
app.include_router(printers.router)

# Mount static files for fonts, courses, and company logos
app.mount("/static/fonts", StaticFiles(directory="uploads/fonts"), name="fonts")
app.mount("/static/courses", StaticFiles(directory="uploads/courses"), name="courses")
app.mount(
    "/static/company_logos", StaticFiles(directory="uploads/company_logos"), name="company_logos"
)


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Root endpoint - API health check."""
    return {"status": "ok", "message": "BeautyLab API is running"}


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
