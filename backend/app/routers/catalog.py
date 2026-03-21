"""Catalog router for categories, levels, courses, and learning paths."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.user import User
from app.schemas.catalog import (
    CategoryCreate,
    CategoryListResponse,
    CategoryResponse,
    CategoryUpdate,
    CategoryWithChildren,
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
    CourseWithDetails,
    LearningPathCourseCreate,
    LearningPathCourseResponse,
    LearningPathCreate,
    LearningPathListResponse,
    LearningPathResponse,
    LearningPathUpdate,
    LearningPathWithCourses,
    LevelCreate,
    LevelListResponse,
    LevelResponse,
    LevelUpdate,
)
from app.services.catalog_service import (
    CatalogDuplicateSlugError,
    CatalogInUseError,
    CatalogNotFoundError,
    CatalogService,
)

router = APIRouter(prefix="/catalog", tags=["Catalog"])


# ==================== Categories ====================


@router.get("/categories", response_model=CategoryListResponse)
async def list_categories(
    parent_id: int | None = Query(None, description="Filter by parent category ID"),
    db: AsyncSession = Depends(get_db),
) -> CategoryListResponse:
    """List all categories.

    Use parent_id=null to get root categories only.
    Use parent_id=<id> to get children of a specific category.
    """
    catalog_service = CatalogService(db)

    if parent_id is not None:
        categories = await catalog_service.get_all_categories(parent_id=parent_id)
    else:
        categories = await catalog_service.get_all_categories()

    return CategoryListResponse(
        categories=[CategoryResponse.model_validate(cat) for cat in categories],
        total=len(categories),
    )


@router.get("/categories/tree")
async def get_category_tree(
    db: AsyncSession = Depends(get_db),
) -> list[CategoryWithChildren]:
    """Get all categories as a tree structure (admin only)."""
    catalog_service = CatalogService(db)
    root_categories = await catalog_service.get_category_tree()
    return [CategoryWithChildren.model_validate(cat) for cat in root_categories]


@router.get("/categories/{category_id}", response_model=CategoryWithChildren)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
) -> CategoryWithChildren:
    """Get a specific category with its children."""
    catalog_service = CatalogService(db)
    category = await catalog_service.get_category_by_id(category_id)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {category_id} not found",
        )

    # Load children
    category.children = await catalog_service.get_all_categories(parent_id=category_id)

    return CategoryWithChildren.model_validate(category)


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Create a new category (admin only)."""
    catalog_service = CatalogService(db)

    try:
        category = await catalog_service.create_category(category_data)
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return CategoryResponse.model_validate(category)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    """Update an existing category (admin only)."""
    catalog_service = CatalogService(db)

    try:
        category = await catalog_service.update_category(category_id, category_data)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return CategoryResponse.model_validate(category)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a category (admin only).

    Only deletes if category has no children and no courses.
    """
    catalog_service = CatalogService(db)

    try:
        await catalog_service.delete_category(category_id)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CatalogInUseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


# ==================== Levels ====================


@router.get("/levels", response_model=LevelListResponse)
async def list_levels(
    db: AsyncSession = Depends(get_db),
) -> LevelListResponse:
    """List all levels ordered by order field."""
    catalog_service = CatalogService(db)
    levels = await catalog_service.get_all_levels()

    return LevelListResponse(
        levels=[LevelResponse.model_validate(level) for level in levels],
        total=len(levels),
    )


@router.get("/levels/{level_id}", response_model=LevelResponse)
async def get_level(
    level_id: int,
    db: AsyncSession = Depends(get_db),
) -> LevelResponse:
    """Get a specific level by ID."""
    catalog_service = CatalogService(db)
    level = await catalog_service.get_level_by_id(level_id)

    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Level with ID {level_id} not found",
        )

    return LevelResponse.model_validate(level)


@router.post(
    "/levels",
    response_model=LevelResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_level(
    level_data: LevelCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LevelResponse:
    """Create a new level (admin only)."""
    catalog_service = CatalogService(db)

    try:
        level = await catalog_service.create_level(level_data)
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return LevelResponse.model_validate(level)


@router.put("/levels/{level_id}", response_model=LevelResponse)
async def update_level(
    level_id: int,
    level_data: LevelUpdate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LevelResponse:
    """Update an existing level (admin only)."""
    catalog_service = CatalogService(db)

    try:
        level = await catalog_service.update_level(level_id, level_data)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return LevelResponse.model_validate(level)


@router.delete("/levels/{level_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_level(
    level_id: int,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a level (admin only).

    Only deletes if level has no courses.
    """
    catalog_service = CatalogService(db)

    try:
        await catalog_service.delete_level(level_id)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CatalogInUseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


# ==================== Courses ====================


@router.get("/courses", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    category_id: int | None = None,
    level_id: int | None = None,
    published: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> CourseListResponse:
    """List all courses with pagination and filters.

    Published filter:
    - null: returns all courses (admin)
    - true: returns only published courses (public)
    - false: returns only unpublished courses (admin)
    """
    catalog_service = CatalogService(db)
    courses, total = await catalog_service.get_all_courses(
        page=page,
        page_size=page_size,
        category_id=category_id,
        level_id=level_id,
        published=published,
        search=search,
    )

    total_pages = (total + page_size - 1) // page_size

    return CourseListResponse(
        courses=[CourseResponse.model_validate(course) for course in courses],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/courses/{course_id}", response_model=CourseWithDetails)
async def get_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> CourseWithDetails:
    """Get a specific course with level, category, and product details."""
    catalog_service = CatalogService(db)
    course = await catalog_service.get_course_by_id(course_id)

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found",
        )

    # Build response with related info
    level_name = course.level.name if course.level else None
    level_slug = course.level.slug if course.level else None
    category_name = course.category.name if course.category else None
    category_slug = course.category.slug if course.category else None
    product_name = course.product.name if course.product else None
    product_price = course.product.price if course.product else None

    return CourseWithDetails(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        image_url=course.image_url,
        duration_hours=course.duration_hours,
        level_id=course.level_id,
        category_id=course.category_id,
        product_id=course.product_id,
        published=course.published,
        created_at=course.created_at,
        updated_at=course.updated_at,
        level_name=level_name,
        level_slug=level_slug,
        category_name=category_name,
        category_slug=category_slug,
        product_name=product_name,
        product_price=product_price,
    )


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> CourseResponse:
    """Create a new course (admin only).

    Requires an existing product_id to link the course to.
    """
    catalog_service = CatalogService(db)

    try:
        course = await catalog_service.create_course(course_data)
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return CourseResponse.model_validate(course)


@router.put("/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> CourseResponse:
    """Update an existing course (admin only)."""
    catalog_service = CatalogService(db)

    try:
        course = await catalog_service.update_course(course_id, course_data)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return CourseResponse.model_validate(course)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a course (admin only).

    Cascades to learning_path_courses association.
    The linked product remains and can be reused.
    """
    catalog_service = CatalogService(db)

    try:
        await catalog_service.delete_course(course_id)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


# ==================== Learning Paths ====================


@router.get("/learning-paths", response_model=LearningPathListResponse)
async def list_learning_paths(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    published: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> LearningPathListResponse:
    """List all learning paths with pagination and filters."""
    catalog_service = CatalogService(db)
    paths, total = await catalog_service.get_all_learning_paths(
        page=page,
        page_size=page_size,
        published=published,
        search=search,
    )

    total_pages = (total + page_size - 1) // page_size

    return LearningPathListResponse(
        learning_paths=[LearningPathResponse.model_validate(path) for path in paths],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/learning-paths/{path_id}", response_model=LearningPathWithCourses)
async def get_learning_path(
    path_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> LearningPathWithCourses:
    """Get a specific learning path with its courses."""
    catalog_service = CatalogService(db)
    path = await catalog_service.get_learning_path_by_id(path_id)

    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning path with ID {path_id} not found",
        )

    # Get courses in the path
    path_courses = await catalog_service.get_learning_path_courses(path_id)

    # Build course responses with details
    courses = []
    total_duration = 0
    for pc in path_courses:
        course = await catalog_service.get_course_by_id(pc.course_id)
        if course:
            courses.append(
                LearningPathCourseResponse(
                    course_id=course.id,
                    order=pc.order,
                    created_at=pc.created_at,
                    course_title=course.title,
                    course_slug=course.slug,
                    course_duration_hours=course.duration_hours,
                )
            )
            if course.duration_hours:
                total_duration += course.duration_hours

    return LearningPathWithCourses(
        id=path.id,
        title=path.title,
        slug=path.slug,
        description=path.description,
        image_url=path.image_url,
        product_id=path.product_id,
        published=path.published,
        created_at=path.created_at,
        updated_at=path.updated_at,
        courses=courses,
        total_courses=len(courses),
        total_duration_hours=total_duration if total_duration > 0 else None,
    )


@router.post(
    "/learning-paths",
    response_model=LearningPathResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_learning_path(
    path_data: LearningPathCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LearningPathResponse:
    """Create a new learning path with optional initial courses (admin only).

    Requires an existing product_id to link the path to.
    """
    catalog_service = CatalogService(db)

    try:
        path = await catalog_service.create_learning_path(path_data)
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return LearningPathResponse.model_validate(path)


@router.put("/learning-paths/{path_id}", response_model=LearningPathResponse)
async def update_learning_path(
    path_id: UUID,
    path_data: LearningPathUpdate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LearningPathResponse:
    """Update an existing learning path (admin only)."""
    catalog_service = CatalogService(db)

    try:
        path = await catalog_service.update_learning_path(path_id, path_data)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except CatalogDuplicateSlugError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return LearningPathResponse.model_validate(path)


@router.post(
    "/learning-paths/{path_id}/courses",
    response_model=LearningPathCourseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_course_to_learning_path(
    path_id: UUID,
    course_data: LearningPathCourseCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> LearningPathCourseResponse:
    """Add a course to a learning path (admin only).

    After adding, the learning path's product price is automatically recalculated.
    """
    catalog_service = CatalogService(db)

    try:
        path_course = await catalog_service.add_course_to_learning_path(path_id, course_data)
        # Recalculate and update the learning path's product price
        await catalog_service.update_learning_path_price(path_id)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    # Get course details for response
    course = await catalog_service.get_course_by_id(path_course.course_id)

    return LearningPathCourseResponse(
        course_id=path_course.course_id,
        order=path_course.order,
        created_at=path_course.created_at,
        course_title=course.title if course else None,
        course_slug=course.slug if course else None,
        course_duration_hours=course.duration_hours if course else None,
    )


@router.delete(
    "/learning-paths/{path_id}/courses/{course_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_course_from_learning_path(
    path_id: UUID,
    course_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a course from a learning path (admin only).

    After removing, the learning path's product price is automatically recalculated.
    """
    catalog_service = CatalogService(db)

    try:
        await catalog_service.remove_course_from_learning_path(path_id, course_id)
        # Recalculate and update the learning path's product price
        await catalog_service.update_learning_path_price(path_id)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.delete("/learning-paths/{path_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_learning_path(
    path_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a learning path (admin only).

    Cascades to learning_path_courses association.
    The linked product and courses remain.
    """
    catalog_service = CatalogService(db)

    try:
        await catalog_service.delete_learning_path(path_id)
    except CatalogNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
