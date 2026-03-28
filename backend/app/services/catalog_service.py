"""Catalog service for categories, levels, courses, and learning paths."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.course import Course
from app.models.learning_path import LearningPath
from app.models.learning_path_course import LearningPathCourse
from app.models.level import Level
from app.models.product import Product
from app.schemas.catalog import (
    CategoryCreate,
    CategoryUpdate,
    CourseCreate,
    CourseUpdate,
    LearningPathCourseCreate,
    LearningPathCreate,
    LearningPathUpdate,
    LevelCreate,
    LevelUpdate,
)


class CatalogNotFoundError(ValueError):
    """Raised when a catalog item is not found."""

    pass


class CatalogDuplicateSlugError(ValueError):
    """Raised when attempting to create an item with a duplicate slug."""

    pass


class CatalogInUseError(ValueError):
    """Raised when attempting to delete an item that is in use."""

    pass


class CatalogService:
    """Service for catalog management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Category Operations ====================

    async def get_category_by_id(self, category_id: int) -> Category | None:
        """Get category by ID."""
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        return result.scalar_one_or_none()

    async def get_all_categories(
        self,
        parent_id: int | None = None,
    ) -> list[Category]:
        """Get all categories, optionally filtered by parent."""
        query = select(Category).order_by(Category.order, Category.name)
        if parent_id is not None:
            query = query.where(Category.parent_id == parent_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_category_tree(self) -> list[Category]:
        """Get all categories as a tree structure (root categories with children)."""
        # Get root categories
        root_categories = await self.get_all_categories(parent_id=None)

        # Build tree recursively
        for category in root_categories:
            category.children = await self.get_all_categories(parent_id=category.id)

        return root_categories

    async def create_category(self, category_data: CategoryCreate) -> Category:
        """Create a new category."""
        # Check for duplicate slug
        existing = await self.db.execute(
            select(Category).where(Category.slug == category_data.slug)
        )
        if existing.scalar_one_or_none():
            raise CatalogDuplicateSlugError(
                f"Category with slug '{category_data.slug}' already exists"
            )

        # Verify parent exists if provided
        if category_data.parent_id is not None:
            parent = await self.get_category_by_id(category_data.parent_id)
            if not parent:
                raise CatalogNotFoundError(
                    f"Parent category with ID {category_data.parent_id} not found"
                )

        category = Category(
            name=category_data.name,
            slug=category_data.slug,
            description=category_data.description,
            parent_id=category_data.parent_id,
            order=category_data.order,
        )

        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def update_category(
        self,
        category_id: int,
        category_data: CategoryUpdate,
    ) -> Category:
        """Update an existing category."""
        category = await self.get_category_by_id(category_id)
        if not category:
            raise CatalogNotFoundError(f"Category with ID {category_id} not found")

        # Check for duplicate slug if updating slug
        if category_data.slug is not None and category_data.slug != category.slug:
            existing = await self.db.execute(
                select(Category).where(
                    Category.slug == category_data.slug,
                    Category.id != category_id,
                )
            )
            if existing.scalar_one_or_none():
                raise CatalogDuplicateSlugError(
                    f"Category with slug '{category_data.slug}' already exists"
                )
            category.slug = category_data.slug

        # Verify parent exists if changing parent
        if category_data.parent_id is not None and category_data.parent_id != category.parent_id:
            if category_data.parent_id == category_id:
                raise ValueError("A category cannot be its own parent")
            parent = await self.get_category_by_id(category_data.parent_id)
            if not parent:
                raise CatalogNotFoundError(
                    f"Parent category with ID {category_data.parent_id} not found"
                )
            category.parent_id = category_data.parent_id

        # Update fields
        if category_data.name is not None:
            category.name = category_data.name
        if category_data.description is not None:
            category.description = category_data.description
        if category_data.order is not None:
            category.order = category_data.order

        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete_category(self, category_id: int) -> bool:
        """Delete a category (only if not in use)."""
        category = await self.get_category_by_id(category_id)
        if not category:
            raise CatalogNotFoundError(f"Category with ID {category_id} not found")

        # Check if category has children
        children_result = await self.db.execute(
            select(func.count()).select_from(Category).where(Category.parent_id == category_id)
        )
        children_count = children_result.scalar() or 0
        if children_count > 0:
            raise CatalogInUseError(
                f"Cannot delete category - it has {children_count} child category(ies)"
            )

        # Check if category has courses
        courses_result = await self.db.execute(
            select(func.count()).select_from(Course).where(Course.category_id == category_id)
        )
        courses_count = courses_result.scalar() or 0
        if courses_count > 0:
            raise CatalogInUseError(f"Cannot delete category - it has {courses_count} course(s)")

        await self.db.delete(category)
        await self.db.commit()
        return True

    # ==================== Level Operations ====================

    async def get_level_by_id(self, level_id: int) -> Level | None:
        """Get level by ID."""
        result = await self.db.execute(select(Level).where(Level.id == level_id))
        return result.scalar_one_or_none()

    async def get_all_levels(self) -> list[Level]:
        """Get all levels ordered by order field."""
        result = await self.db.execute(select(Level).order_by(Level.order))
        return list(result.scalars().all())

    async def create_level(self, level_data: LevelCreate) -> Level:
        """Create a new level."""
        # Check for duplicate slug
        existing = await self.db.execute(select(Level).where(Level.slug == level_data.slug))
        if existing.scalar_one_or_none():
            raise CatalogDuplicateSlugError(f"Level with slug '{level_data.slug}' already exists")

        level = Level(
            name=level_data.name,
            slug=level_data.slug,
            description=level_data.description,
            order=level_data.order,
        )

        self.db.add(level)
        await self.db.commit()
        await self.db.refresh(level)
        return level

    async def update_level(
        self,
        level_id: int,
        level_data: LevelUpdate,
    ) -> Level:
        """Update an existing level."""
        level = await self.get_level_by_id(level_id)
        if not level:
            raise CatalogNotFoundError(f"Level with ID {level_id} not found")

        # Check for duplicate slug if updating slug
        if level_data.slug is not None and level_data.slug != level.slug:
            existing = await self.db.execute(
                select(Level).where(
                    Level.slug == level_data.slug,
                    Level.id != level_id,
                )
            )
            if existing.scalar_one_or_none():
                raise CatalogDuplicateSlugError(
                    f"Level with slug '{level_data.slug}' already exists"
                )
            level.slug = level_data.slug

        # Update fields
        if level_data.name is not None:
            level.name = level_data.name
        if level_data.description is not None:
            level.description = level_data.description
        if level_data.order is not None:
            level.order = level_data.order

        await self.db.commit()
        await self.db.refresh(level)
        return level

    async def delete_level(self, level_id: int) -> bool:
        """Delete a level (only if not in use)."""
        level = await self.get_level_by_id(level_id)
        if not level:
            raise CatalogNotFoundError(f"Level with ID {level_id} not found")

        # Check if level has courses
        courses_result = await self.db.execute(
            select(func.count()).select_from(Course).where(Course.level_id == level_id)
        )
        courses_count = courses_result.scalar() or 0
        if courses_count > 0:
            raise CatalogInUseError(f"Cannot delete level - it has {courses_count} course(s)")

        await self.db.delete(level)
        await self.db.commit()
        return True

    # ==================== Course Operations ====================

    async def get_course_by_id(self, course_id: UUID) -> Course | None:
        """Get course by ID with related relationships."""
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(Course)
            .options(
                selectinload(Course.level),
                selectinload(Course.category),
                selectinload(Course.product),
            )
            .where(Course.id == course_id)
        )
        return result.scalar_one_or_none()

    async def get_course_by_slug(self, slug: str) -> Course | None:
        """Get course by slug."""
        result = await self.db.execute(select(Course).where(Course.slug == slug))
        return result.scalar_one_or_none()

    async def get_all_courses(
        self,
        page: int = 1,
        page_size: int = 10,
        category_id: int | None = None,
        level_id: int | None = None,
        published: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[Course], int]:
        """Get all courses with pagination and filters."""
        # Build base query
        query = select(Course)

        # Apply filters
        if category_id is not None:
            query = query.where(Course.category_id == category_id)
        if level_id is not None:
            query = query.where(Course.level_id == level_id)
        if published is not None:
            query = query.where(Course.published == published)
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                (Course.title.ilike(search_filter)) | (Course.description.ilike(search_filter))
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Course.title)

        result = await self.db.execute(query)
        courses = list(result.scalars().all())

        return courses, total

    async def create_course(self, course_data: CourseCreate) -> Course:
        """Create a new course."""
        # Check for duplicate slug
        existing = await self.get_course_by_slug(course_data.slug)
        if existing:
            raise CatalogDuplicateSlugError(f"Course with slug '{course_data.slug}' already exists")

        # Verify product exists
        product_result = await self.db.execute(
            select(Product).where(Product.id == course_data.product_id)
        )
        if not product_result.scalar_one_or_none():
            raise CatalogNotFoundError(f"Product with ID {course_data.product_id} not found")

        # Verify level exists if provided
        if course_data.level_id is not None:
            level = await self.get_level_by_id(course_data.level_id)
            if not level:
                raise CatalogNotFoundError(f"Level with ID {course_data.level_id} not found")

        # Verify category exists if provided
        if course_data.category_id is not None:
            category = await self.get_category_by_id(course_data.category_id)
            if not category:
                raise CatalogNotFoundError(f"Category with ID {course_data.category_id} not found")

        course = Course(
            title=course_data.title,
            slug=course_data.slug,
            description=course_data.description,
            image_url=course_data.image_url,
            duration_hours=course_data.duration_hours,
            level_id=course_data.level_id,
            category_id=course_data.category_id,
            product_id=course_data.product_id,
            published=course_data.published,
        )

        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def update_course(
        self,
        course_id: UUID,
        course_data: CourseUpdate,
    ) -> Course:
        """Update an existing course."""
        course = await self.get_course_by_id(course_id)
        if not course:
            raise CatalogNotFoundError(f"Course with ID {course_id} not found")

        # Check for duplicate slug if updating slug
        if course_data.slug is not None and course_data.slug != course.slug:
            existing = await self.get_course_by_slug(course_data.slug)
            if existing:
                raise CatalogDuplicateSlugError(
                    f"Course with slug '{course_data.slug}' already exists"
                )
            course.slug = course_data.slug

        # Verify product exists if changing product
        if course_data.product_id is not None and course_data.product_id != course.product_id:
            product_result = await self.db.execute(
                select(Product).where(Product.id == course_data.product_id)
            )
            if not product_result.scalar_one_or_none():
                raise CatalogNotFoundError(f"Product with ID {course_data.product_id} not found")
            course.product_id = course_data.product_id

        # Verify level exists if changing level
        if course_data.level_id is not None and course_data.level_id != course.level_id:
            level = await self.get_level_by_id(course_data.level_id)
            if not level:
                raise CatalogNotFoundError(f"Level with ID {course_data.level_id} not found")
            course.level_id = course_data.level_id

        # Verify category exists if changing category
        if course_data.category_id is not None and course_data.category_id != course.category_id:
            category = await self.get_category_by_id(course_data.category_id)
            if not category:
                raise CatalogNotFoundError(f"Category with ID {course_data.category_id} not found")
            course.category_id = course_data.category_id

        # Update fields
        if course_data.title is not None:
            course.title = course_data.title
        if course_data.description is not None:
            course.description = course_data.description
        if course_data.image_url is not None:
            course.image_url = course_data.image_url
        if course_data.duration_hours is not None:
            course.duration_hours = course_data.duration_hours
        if course_data.published is not None:
            course.published = course_data.published

        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def delete_course(self, course_id: UUID) -> bool:
        """Delete a course (cascades to learning_path_courses)."""
        course = await self.get_course_by_id(course_id)
        if not course:
            raise CatalogNotFoundError(f"Course with ID {course_id} not found")

        # Note: learning_path_courses will be deleted via cascade
        # The product will remain (can be reused or deleted separately)

        await self.db.delete(course)
        await self.db.commit()
        return True

    # ==================== Learning Path Operations ====================

    async def get_learning_path_by_id(self, path_id: UUID) -> LearningPath | None:
        """Get learning path by ID."""
        result = await self.db.execute(select(LearningPath).where(LearningPath.id == path_id))
        return result.scalar_one_or_none()

    async def get_learning_path_by_slug(self, slug: str) -> LearningPath | None:
        """Get learning path by slug."""
        result = await self.db.execute(select(LearningPath).where(LearningPath.slug == slug))
        return result.scalar_one_or_none()

    async def get_all_learning_paths(
        self,
        page: int = 1,
        page_size: int = 10,
        published: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[LearningPath], int]:
        """Get all learning paths with pagination and filters."""
        # Build base query
        query = select(LearningPath)

        # Apply filters
        if published is not None:
            query = query.where(LearningPath.published == published)
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                (LearningPath.title.ilike(search_filter))
                | (LearningPath.description.ilike(search_filter))
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(LearningPath.title)

        result = await self.db.execute(query)
        paths = list(result.scalars().all())

        return paths, total

    async def create_learning_path(
        self,
        path_data: LearningPathCreate,
    ) -> LearningPath:
        """Create a new learning path with optional initial courses."""
        # Check for duplicate slug
        existing = await self.get_learning_path_by_slug(path_data.slug)
        if existing:
            raise CatalogDuplicateSlugError(
                f"Learning path with slug '{path_data.slug}' already exists"
            )

        # Verify product exists
        product_result = await self.db.execute(
            select(Product).where(Product.id == path_data.product_id)
        )
        if not product_result.scalar_one_or_none():
            raise CatalogNotFoundError(f"Product with ID {path_data.product_id} not found")

        path = LearningPath(
            title=path_data.title,
            slug=path_data.slug,
            description=path_data.description,
            image_url=path_data.image_url,
            product_id=path_data.product_id,
            published=path_data.published,
        )

        self.db.add(path)
        await self.db.flush()  # Get path ID before committing

        # Add initial courses if provided
        if path_data.courses:
            for course_data in path_data.courses:
                # Verify course exists
                course = await self.get_course_by_id(course_data.course_id)
                if not course:
                    raise CatalogNotFoundError(f"Course with ID {course_data.course_id} not found")

                path_course = LearningPathCourse(
                    learning_path_id=path.id,
                    course_id=course_data.course_id,
                    order=course_data.order,
                )
                self.db.add(path_course)

        await self.db.commit()
        await self.db.refresh(path)
        return path

    async def update_learning_path(
        self,
        path_id: UUID,
        path_data: LearningPathUpdate,
    ) -> LearningPath:
        """Update an existing learning path."""
        path = await self.get_learning_path_by_id(path_id)
        if not path:
            raise CatalogNotFoundError(f"Learning path with ID {path_id} not found")

        # Check for duplicate slug if updating slug
        if path_data.slug is not None and path_data.slug != path.slug:
            existing = await self.get_learning_path_by_slug(path_data.slug)
            if existing:
                raise CatalogDuplicateSlugError(
                    f"Learning path with slug '{path_data.slug}' already exists"
                )
            path.slug = path_data.slug

        # Verify product exists if changing product
        if path_data.product_id is not None and path_data.product_id != path.product_id:
            product_result = await self.db.execute(
                select(Product).where(Product.id == path_data.product_id)
            )
            if not product_result.scalar_one_or_none():
                raise CatalogNotFoundError(f"Product with ID {path_data.product_id} not found")
            path.product_id = path_data.product_id

        # Update fields
        if path_data.title is not None:
            path.title = path_data.title
        if path_data.description is not None:
            path.description = path_data.description
        if path_data.image_url is not None:
            path.image_url = path_data.image_url
        if path_data.published is not None:
            path.published = path_data.published

        await self.db.commit()
        await self.db.refresh(path)
        return path

    async def delete_learning_path(self, path_id: UUID) -> bool:
        """Delete a learning path (cascades to learning_path_courses)."""
        path = await self.get_learning_path_by_id(path_id)
        if not path:
            raise CatalogNotFoundError(f"Learning path with ID {path_id} not found")

        # learning_path_courses will be deleted via cascade
        # The product and courses will remain

        await self.db.delete(path)
        await self.db.commit()
        return True

    # ==================== Learning Path Course Operations ====================

    async def add_course_to_learning_path(
        self,
        path_id: UUID,
        course_data: LearningPathCourseCreate,
    ) -> LearningPathCourse:
        """Add a course to a learning path."""
        path = await self.get_learning_path_by_id(path_id)
        if not path:
            raise CatalogNotFoundError(f"Learning path with ID {path_id} not found")

        course = await self.get_course_by_id(course_data.course_id)
        if not course:
            raise CatalogNotFoundError(f"Course with ID {course_data.course_id} not found")

        # Check if course is already in the path
        existing = await self.db.execute(
            select(LearningPathCourse).where(
                LearningPathCourse.learning_path_id == path_id,
                LearningPathCourse.course_id == course_data.course_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Course is already in this learning path")

        path_course = LearningPathCourse(
            learning_path_id=path_id,
            course_id=course_data.course_id,
            order=course_data.order,
        )

        self.db.add(path_course)
        await self.db.commit()
        await self.db.refresh(path_course)
        return path_course

    async def remove_course_from_learning_path(
        self,
        path_id: UUID,
        course_id: UUID,
    ) -> bool:
        """Remove a course from a learning path."""
        path_course = await self.db.execute(
            select(LearningPathCourse).where(
                LearningPathCourse.learning_path_id == path_id,
                LearningPathCourse.course_id == course_id,
            )
        )
        result = path_course.scalar_one_or_none()

        if not result:
            raise CatalogNotFoundError(f"Course {course_id} not found in learning path {path_id}")

        await self.db.delete(result)
        await self.db.commit()
        return True

    async def get_learning_path_courses(
        self,
        path_id: UUID,
    ) -> list[LearningPathCourse]:
        """Get all courses in a learning path ordered by order field."""
        result = await self.db.execute(
            select(LearningPathCourse)
            .where(LearningPathCourse.learning_path_id == path_id)
            .order_by(LearningPathCourse.order)
        )
        return list(result.scalars().all())

    # ==================== Price Calculation ====================

    async def calculate_learning_path_price(self, path_id: UUID) -> Decimal:
        """Calculate the total price of a learning path based on its courses."""
        path = await self.get_learning_path_by_id(path_id)
        if not path:
            raise CatalogNotFoundError(f"Learning path with ID {path_id} not found")

        # Get all courses in the path
        path_courses = await self.get_learning_path_courses(path_id)

        total_price = Decimal("0.00")
        for path_course in path_courses:
            # Get the product for each course
            course_result = await self.db.execute(
                select(Course).where(Course.id == path_course.course_id)
            )
            course = course_result.scalar_one_or_none()
            if course:
                product_result = await self.db.execute(
                    select(Product).where(Product.id == course.product_id)
                )
                product = product_result.scalar_one_or_none()
                if product:
                    total_price += product.price

        return total_price

    async def update_learning_path_price(self, path_id: UUID) -> Decimal:
        """Update the learning path's product price based on its courses."""
        path = await self.get_learning_path_by_id(path_id)
        if not path:
            raise CatalogNotFoundError(f"Learning path with ID {path_id} not found")

        new_price = await self.calculate_learning_path_price(path_id)

        # Update the product price
        product_result = await self.db.execute(select(Product).where(Product.id == path.product_id))
        product = product_result.scalar_one_or_none()
        if product:
            product.price = new_price
            await self.db.commit()

        return new_price
