# Products Module Development Plan

## Overview
The Products Module manages billable items (products), courses, and learning paths. It provides CRUD operations, links educational entities to products, and supports complex relationships (course levels, categories, path‑course associations).

## Models (Pydantic Schemas)
- `ProductBase`: name, description, sku, price, tax_rate, tax_type, is_active
- `ProductCreate` / `ProductUpdate` inherit from `ProductBase`
- `ProductResponse`: includes id, created_at, updated_at
- `CategoryBase`: name, slug, description, parent_id, order
- `CategoryCreate` / `CategoryUpdate`
- `LevelBase`: name, slug, description, order
- `CourseBase`: title, slug, description, image_url, duration_hours, level_id, category_id, product_id, published
- `CourseResponse`: includes id, created_at, updated_at
- `LearningPathBase`: title, slug, description, image_url, product_id, published
- `LearningPathResponse`: includes id, created_at, updated_at
- `LearningPathCourse`: learning_path_id, course_id, order
- `ProductWithDetails`: product + associated course or learning path (optional)

## Services
- `product_service`: CRUD for products, ensure unique SKU
- `catalog_service`: CRUD for categories, levels, courses, learning paths
- `price_calculation`: for learning paths, sum of constituent courses' prices

## API Endpoints
### Products
- `GET /products` – list products (filter by active, type)
- `POST /products` – create product (admin only)
- `GET /products/{id}` – get product details
- `PUT /products/{id}` – update product (admin)
- `DELETE /products/{id}` – delete (only if no dependencies)
### Categories & Levels
- `GET /categories` – list categories
- `POST /categories` – create (admin)
- `GET /levels` – list levels
- `POST /levels` – create (admin)
### Courses
- `GET /courses` – list courses (filter by category, level, published)
- `POST /courses` – create course (requires product_id, admin)
- `GET /courses/{id}` – get course details (includes product info)
- `PUT /courses/{id}` – update (admin)
- `DELETE /courses/{id}` – delete (cascade to enrollments? careful)
### Learning Paths
- `GET /learning-paths` – list paths
- `POST /learning-paths` – create path (admin)
- `GET /learning-paths/{id}` – get path details with enrolled courses
- `PUT /learning-paths/{id}/courses` – add/remove courses (order matters)
- `DELETE /learning-paths/{id}` – delete (only path, not courses)

## Business Logic
- **Product–Course Link**: When creating a course, a product must already exist or be created simultaneously. The product's price is used for billing.
- **Learning Path Price**: Computed as the sum of the current prices of all its courses (recomputed after each change). Stored in product.price, which can be updated automatically when the path's courses change.
- **SKU Uniqueness**: Enforced at database level; application must handle duplicate error.

## Validation
- Slug must be URL‑safe and unique across tables.
- `tax_rate` must be between 0 and 100.
- `tax_type` one of: gravado, exento, exonerado.
- `duration_hours` positive integer.
- `order` fields must be non‑negative.

A small correction regarding:
`tax_rate` and `tax_type`

This is not necessary, because in Venezuela the tax is always 16% (so default to 16). The only items that are exempt are some groceries and medical supplies.
And since these are programming courses, this does not apply in any case.

## Security
- Only admin users can create, update, delete products and educational entities.
- Published courses/paths are visible to all; unpublished only to admins.

## Implementation Steps
1. Create Pydantic schemas in `app/schemas/product.py`, `catalog.py`
2. Implement services in `app/services/product_service.py`, `catalog_service.py`
3. Add routes in `app/api/v1/products.py`, `courses.py`, `learning_paths.py`
4. Add price recomputation logic for learning paths (hook on course addition/removal)
5. Write tests for creating products, courses, and paths, and price calculations