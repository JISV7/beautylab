/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Demo API: every axios request in the app is answered here with placeholder
 * data, so the whole frontend works without the backend.
 *
 * It is ON by default. Set VITE_DEMO_MODE=false (frontend/.env.local) to talk
 * to the real API again. State (purchases, progress, cart, invoices) lives in
 * localStorage under STORAGE_KEY; delete that key to start over.
 *
 * Roles come from the login email: contains "admin" -> platform admin,
 * contains "empresa" or "rrhh" -> company admin, anything else -> customer.
 */
import axios, {
    AxiosError,
    AxiosHeaders,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';
import { DEFAULT_THEME } from '../data/defaultTheme';
import type { Invoice } from '../data/invoice.types';
import type {
    CourseAccessState,
    CourseContent,
    QuizAttemptSummary,
    UserCourse,
} from '../lib/learningApi';
import {
    demoCatalog,
    demoCategories,
    demoClient,
    demoCompanyInfo,
    demoDepartments,
    demoEmployees,
    demoLevels,
    demoVideos,
    type DemoCourse,
} from './data';

export const demoModeEnabled = import.meta.env.VITE_DEMO_MODE !== 'false';

const API_ORIGIN = 'http://localhost:8000';
const STORAGE_KEY = 'cursorg_demo_state_v1';
const TAX = 0.16;
const PASSING_SCORE = 70;
const MAX_ATTEMPTS = 3;

class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

type Body = Record<string, any>;

// ==================== Helpers ====================

const nowIso = () => new Date().toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const money = (value: number) => value.toFixed(2);
const withTax = (value: number) => Math.round(value * (1 + TAX) * 100) / 100;
const sku = (course: DemoCourse) => `CRS-${course.slug.slice(0, 3).toUpperCase()}-${course.price}`;

const findCourse = (id: string): DemoCourse => {
    const course = demoCatalog.find((item) => item.id === id);
    if (!course) throw new HttpError(404, 'Curso no encontrado.');
    return course;
};

interface DemoClass {
    id: string;
    title: string;
    moduleIndex: number;
    position: number;
    isQuiz: boolean;
    minutes: number;
    video: string;
}

const classList = (course: DemoCourse): DemoClass[] =>
    course.syllabus.flatMap((module, moduleIndex) =>
        module.classes.map((title, index) => ({
            id: `${course.id}-m${moduleIndex + 1}-c${index + 1}`,
            title,
            moduleIndex,
            position: index + 1,
            isQuiz: title === 'Evaluación final',
            minutes: 8 + ((moduleIndex * 3 + index * 5) % 13),
            video: demoVideos[(moduleIndex + index) % demoVideos.length],
        })),
    );

const findClass = (course: DemoCourse, classId: string) => {
    const item = classList(course).find((entry) => entry.id === classId);
    if (!item) throw new HttpError(404, 'Clase no encontrada.');
    return item;
};

const licenseCode = (course: DemoCourse, seq: number) =>
    `CRSG-${course.slug.slice(0, 3).toUpperCase()}-${(seq * 7919).toString(36).toUpperCase().padStart(4, '0')}-${(seq * 104729).toString(36).toUpperCase().slice(-4).padStart(4, '0')}`;

const nameFromEmail = (email: string) =>
    demoEmployees.find((employee) => employee.email === email)?.name ??
    email
        .split('@')[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(' ');

const rolesFromEmail = (email: string) => {
    const lower = email.toLowerCase();
    if (lower.includes('admin')) return ['admin'];
    if (lower.includes('empresa') || lower.includes('rrhh')) return ['company_admin'];
    return ['user'];
};

const fakeJwt = (email: string) =>
    `demo.${btoa(JSON.stringify({ sub: email, exp: Math.floor(Date.now() / 1000) + 30 * 86_400 }))}.signature`;

// ==================== Persistent state ====================

interface Owned {
    state: CourseAccessState;
    completed: string[];
    enrollmentId: number;
    enrolledAt: string | null;
    lastActivity: string | null;
    completedAt: string | null;
    licenseCode: string;
    paid: number;
}

interface CartLine {
    id: string;
    courseId: string;
    quantity: number;
    createdAt: string;
}

interface Attempt extends QuizAttemptSummary {
    courseId: string;
    classId: string;
}

interface DemoUser {
    email: string;
    full_name: string;
    roles: string[];
    fiscal_address: string;
    phone: string;
    document_number: string;
    rif?: string;
    business_name?: string;
}

interface DemoState {
    owned: Record<string, Owned>;
    cart: CartLine[];
    invoices: Invoice[];
    invoiceCourses: Record<string, string[]>;
    attempts: Attempt[];
    user: DemoUser | null;
    accounts: Record<string, { name: string; roles: string[] }>;
    companyName: string | null;
    seq: number;
}

function buildInvoice(
    number: string,
    items: { courseId: string; quantity: number }[],
    issuedAt: string,
    paid: number,
    discount = 0,
): Invoice {
    const lines = items.map((item, index) => {
        const course = findCourse(item.courseId);
        const lineTotal = course.price * item.quantity;
        return {
            id: index + 1,
            description: course.title,
            quantity: String(item.quantity),
            unit_price: money(course.price),
            line_total: money(lineTotal),
            tax_rate: '16.00',
            tax_amount: money(lineTotal * TAX),
            is_exempt: false,
        };
    });
    const subtotal = lines.reduce((sum, line) => sum + Number(line.line_total), 0) - discount;
    const tax = subtotal * TAX;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const invoice: Invoice = {
        id: number,
        invoice_number: number,
        control_number: `00-${number}`,
        issue_date: issuedAt.slice(0, 10),
        issue_time: issuedAt.slice(11, 19),
        subtotal: money(subtotal),
        discount_total: money(discount),
        tax_total: money(tax),
        total: money(total),
        status: 'issued',
        client_document_type: 'V',
        client_document_number: '18456221',
        client_business_name: state?.user?.full_name ?? 'María González',
        client_fiscal_address: 'Av. Bolívar Norte, Valencia, Carabobo',
        lines,
        adjustments: [],
        payments: [],
        company: demoCompanyInfo,
        created_at: issuedAt,
    };
    if (paid > 0) addPayment(invoice, paid, issuedAt);
    else refreshInvoiceTotals(invoice);
    return invoice;
}

function refreshInvoiceTotals(invoice: Invoice) {
    const total = Number(invoice.total);
    const paid = (invoice.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
    invoice.total_paid = money(paid);
    invoice.remaining_balance = money(Math.max(total - paid, 0));
    invoice.payment_progress = total > 0 ? Math.round((paid / total) * 10_000) / 100 : 100;
    invoice.status = paid >= total - 0.005 ? 'paid' : paid > 0 ? 'partial' : 'issued';
}

function addPayment(invoice: Invoice, amount: number, at = nowIso(), method = 'pago_movil') {
    invoice.payments = [
        ...(invoice.payments ?? []),
        {
            id: `pay-${invoice.id}-${(invoice.payments?.length ?? 0) + 1}`,
            amount: money(amount),
            status: 'completed',
            created_at: at,
            method_type: method,
        },
    ];
    refreshInvoiceTotals(invoice);
}

function initialState(): DemoState {
    const ids = (courseId: string, count?: number) =>
        classList(findCourse(courseId))
            .slice(0, count)
            .map((item) => item.id);
    const own = (
        courseId: string,
        accessState: CourseAccessState,
        completed: string[],
        enrollmentId: number,
        enrolledHoursAgo: number | null,
        lastHoursAgo: number | null,
        code: string,
        paid?: number,
    ): Owned => ({
        state: accessState,
        completed,
        enrollmentId,
        enrolledAt: enrolledHoursAgo === null ? null : hoursAgo(enrolledHoursAgo),
        lastActivity: lastHoursAgo === null ? null : hoursAgo(lastHoursAgo),
        completedAt: accessState === 'completed' && lastHoursAgo !== null ? hoursAgo(lastHoursAgo) : null,
        licenseCode: code,
        paid: paid ?? withTax(findCourse(courseId).price),
    });

    return {
        owned: {
            'c-sst': own('c-sst', 'in_progress', ids('c-sst', 5), 101, 480, 2, 'CRSG-SST-7K2M-91QA'),
            'c-finanzas': own('c-finanzas', 'in_progress', ids('c-finanzas', 6), 102, 336, 26, 'CRSG-FIN-3P8Z-55LD'),
            'c-atencion': own('c-atencion', 'completed', ids('c-atencion'), 103, 960, 144, 'CRSG-ATC-9Q1R-08MV'),
            'c-liderazgo': own('c-liderazgo', 'ready_to_redeem', [], 104, null, null, 'CRSG-LID-4H8P-22XD'),
            'c-fraude': own('c-fraude', 'payment_pending', [], 105, null, null, 'CRSG-FRD-6T2W-37KC', 600),
        },
        cart: [],
        invoices: [
            buildInvoice('00000148', [{ courseId: 'c-fraude', quantity: 1 }], hoursAgo(72), 600),
            buildInvoice('00000131', [{ courseId: 'c-liderazgo', quantity: 1 }], hoursAgo(216), withTax(1100)),
            buildInvoice('00000117', [{ courseId: 'c-finanzas', quantity: 1 }], hoursAgo(360), withTax(980)),
            buildInvoice('00000102', [{ courseId: 'c-sst', quantity: 1 }], hoursAgo(504), withTax(1250)),
            buildInvoice('00000098', [{ courseId: 'c-atencion', quantity: 1 }], hoursAgo(984), withTax(760)),
        ],
        invoiceCourses: {
            '00000148': ['c-fraude'],
            '00000131': ['c-liderazgo'],
            '00000117': ['c-finanzas'],
            '00000102': ['c-sst'],
            '00000098': ['c-atencion'],
        },
        attempts: [],
        user: null,
        accounts: {},
        companyName: null,
        seq: 200,
    };
}

// Declared before initialState() runs so buildInvoice can read the user name.
let state: DemoState | null = null;

function loadState(): DemoState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as DemoState;
    } catch {
        // Corrupt or blocked storage: start from the seed data.
    }
    return initialState();
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Private mode or quota: keep working in memory.
    }
}

const db = (): DemoState => {
    if (!state) state = loadState();
    return state;
};

const nextSeq = () => ++db().seq;

// ==================== Learning ====================

const totalWithTax = (course: DemoCourse) => withTax(course.price);
const hasAccess = (owned: Owned) => owned.state === 'in_progress' || owned.state === 'completed';

const progressOf = (course: DemoCourse, owned: Owned) => {
    const classes = classList(course);
    const done = classes.filter((item) => owned.completed.includes(item.id)).length;
    return Math.round((done / classes.length) * 100);
};

const licenseStatus = (owned: Owned) =>
    owned.state === 'ready_to_redeem'
        ? 'active'
        : owned.state === 'payment_pending'
          ? 'pending'
          : owned.state === 'unavailable'
            ? 'expired'
            : 'redeemed';

const requireOwned = (courseId: string, needsAccess = true) => {
    const owned = db().owned[courseId];
    if (!owned) throw new HttpError(403, 'No tienes una licencia para este curso.');
    if (needsAccess && !hasAccess(owned)) {
        throw new HttpError(403, 'Canjea tu licencia para acceder al contenido del curso.');
    }
    return owned;
};

function toUserCourse(course: DemoCourse, owned: Owned): UserCourse {
    const total = totalWithTax(course);
    const access = hasAccess(owned);
    const category = demoCategories.find((item) => item.id === course.categoryId);
    return {
        course_id: course.id,
        course_title: course.title,
        course_slug: course.slug,
        course_image_url: course.image,
        category_id: course.categoryId,
        category_name: category?.name ?? null,
        licenses: [
            {
                id: `lic-${course.id}`,
                license_code: owned.licenseCode,
                status: licenseStatus(owned),
                license_type: 'gift',
                redeemed_at: access ? owned.enrolledAt : null,
                redeemed_by_user_id: access ? 'demo-user' : null,
                can_redeem: owned.state === 'ready_to_redeem',
            },
        ],
        total_paid: money(owned.paid),
        total_required: money(total),
        payment_progress: Math.min(Math.round((owned.paid / total) * 10_000) / 100, 100),
        is_fully_paid: owned.paid >= total - 0.005,
        enrollment_id: access ? owned.enrollmentId : null,
        enrollment_status: access ? (owned.state === 'completed' ? 'completed' : 'active') : null,
        progress: access ? progressOf(course, owned) : 0,
        completed_at: owned.completedAt,
        last_activity_at: owned.lastActivity,
        has_access: access,
        can_redeem: owned.state === 'ready_to_redeem',
        access_state: owned.state,
    };
}

interface DemoQuestion {
    id: string;
    prompt: string;
    question_type: 'single_choice' | 'true_false';
    points: number;
    position: number;
    explanation: string;
    options: { id: string; text: string; position: number; is_correct: boolean }[];
}

function quizFor(course: DemoCourse, classId: string): DemoQuestion[] {
    const foreign = demoCatalog
        .filter((item) => item.id !== course.id)
        .flatMap((item) => item.syllabus.flatMap((module) => module.classes))
        .filter((title) => title !== 'Evaluación final');
    const questions: DemoQuestion[] = course.syllabus.map((module, index): DemoQuestion => {
        const id = `${classId}-q${index + 1}`;
        const correct = module.classes[0];
        const topic = module.title.split('· ')[1] ?? module.title;
        const distractors = [1, 4, 9].map((step) => foreign[(index * 11 + step * 3) % foreign.length]);
        const texts = [...distractors];
        texts.splice(index % 4, 0, correct);
        return {
            id,
            prompt: `¿Cuál de estos temas forma parte de «${topic}»?`,
            question_type: 'single_choice',
            points: 25,
            position: index + 1,
            explanation: `«${correct}» se estudia en ${module.title}.`,
            options: texts.map((text, position) => ({
                id: `${id}-o${position + 1}`,
                text,
                position: position + 1,
                is_correct: text === correct,
            })),
        };
    });
    const tfId = `${classId}-q${questions.length + 1}`;
    questions.push({
        id: tfId,
        prompt: 'Debes completar todas las clases obligatorias para llegar al 100 % del curso.',
        question_type: 'true_false',
        points: 25,
        position: questions.length + 1,
        explanation: 'El avance del curso se calcula con las clases obligatorias completadas.',
        options: [
            { id: `${tfId}-o1`, text: 'Verdadero', position: 1, is_correct: true },
            { id: `${tfId}-o2`, text: 'Falso', position: 2, is_correct: false },
        ],
    });
    return questions;
}

const attemptsFor = (classId: string) => db().attempts.filter((item) => item.classId === classId);

const quizStats = (classId: string) => {
    const finished = attemptsFor(classId).filter((item) => item.status === 'completed');
    const best = finished.reduce<number | null>(
        (max, item) => (item.score !== null && (max === null || item.score > max) ? item.score : max),
        null,
    );
    return { finished, best, passed: best !== null && best >= PASSING_SCORE };
};

function courseContent(course: DemoCourse, owned: Owned): CourseContent {
    const classes = classList(course);
    return {
        course_id: course.id,
        title: course.title,
        progress: progressOf(course, owned),
        status: owned.state === 'completed' ? 'completed' : 'active',
        modules: course.syllabus.map((module, moduleIndex) => ({
            id: `${course.id}-m${moduleIndex + 1}`,
            title: module.title,
            description: null,
            position: moduleIndex + 1,
            classes: classes
                .filter((item) => item.moduleIndex === moduleIndex)
                .map((item) => {
                    const stats = quizStats(item.id);
                    return {
                        id: item.id,
                        title: item.title,
                        description: item.isQuiz
                            ? 'Responde la evaluación para cerrar el curso. Necesitas 70 puntos.'
                            : `Clase en video de ${item.minutes} minutos con ejemplos aplicados al puesto de trabajo.`,
                        content_type: item.isQuiz ? 'quiz' : 'video',
                        video_url: item.isQuiz ? null : item.video,
                        thumbnail_url: null,
                        duration_minutes: item.isQuiz ? 15 : item.minutes,
                        is_required: true,
                        has_quiz: item.isQuiz,
                        quiz: item.isQuiz
                            ? {
                                  question_count: course.syllabus.length + 1,
                                  passing_score: PASSING_SCORE,
                                  max_attempts: MAX_ATTEMPTS,
                                  time_limit_minutes: 15,
                              }
                            : null,
                        is_completed: owned.completed.includes(item.id),
                        best_score: stats.best,
                        passed: item.isQuiz ? stats.passed : owned.completed.includes(item.id),
                        attempts_used: stats.finished.length,
                    };
                }),
        })),
    };
}

function completeClass(course: DemoCourse, owned: Owned, classId: string) {
    if (!owned.completed.includes(classId)) owned.completed.push(classId);
    owned.lastActivity = nowIso();
    if (progressOf(course, owned) >= 100 && owned.state !== 'completed') {
        owned.state = 'completed';
        owned.completedAt = nowIso();
    }
}

/** Mark courses as bought: a fresh license to redeem, or settle a pending one. */
function grantCourses(courseIds: string[]) {
    const data = db();
    for (const courseId of courseIds) {
        const course = findCourse(courseId);
        const owned = data.owned[courseId];
        if (owned) {
            owned.paid = totalWithTax(course);
            if (owned.state === 'payment_pending') owned.state = 'ready_to_redeem';
            continue;
        }
        const seq = nextSeq();
        data.owned[courseId] = {
            state: 'ready_to_redeem',
            completed: [],
            enrollmentId: seq,
            enrolledAt: null,
            lastActivity: null,
            completedAt: null,
            licenseCode: licenseCode(course, seq),
            paid: totalWithTax(course),
        };
    }
}

const nextInvoiceNumber = () =>
    String(Math.max(0, ...db().invoices.map((invoice) => Number(invoice.invoice_number))) + 1).padStart(8, '0');

// ==================== Catalog ====================

function catalogCourse(course: DemoCourse) {
    const category = demoCategories.find((item) => item.id === course.categoryId);
    const level = demoLevels.find((item) => item.id === course.levelId);
    return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        image_url: course.image,
        duration_hours: course.hours,
        published: true,
        price: money(course.price),
        tax_rate: '16.00',
        category_id: course.categoryId,
        category_name: category?.name ?? null,
        category_slug: category?.slug ?? null,
        level_id: course.levelId,
        level_name: level?.name ?? null,
        level_slug: level?.slug ?? null,
        created_at: '2026-02-01T10:00:00Z',
        product_id: `prod-${course.id}`,
        product_name: course.title,
        product_sku: sku(course),
        product_price: money(course.price),
    };
}

function filteredCatalog(query: URLSearchParams) {
    const categoryId = Number(query.get('category_id')) || null;
    const levelId = Number(query.get('level_id')) || null;
    const search = (query.get('search') ?? '').trim().toLowerCase();
    return demoCatalog
        .filter((course) => !categoryId || course.categoryId === categoryId)
        .filter((course) => !levelId || course.levelId === levelId)
        .filter(
            (course) =>
                !search ||
                course.title.toLowerCase().includes(search) ||
                course.description.toLowerCase().includes(search),
        )
        .map(catalogCourse);
}

function courseLicenses(course: DemoCourse) {
    const owned = db().owned[course.id];
    if (!owned) return [];
    const total = totalWithTax(course);
    const access = hasAccess(owned);
    const user = currentUser();
    return [
        {
            id: `lic-${course.id}`,
            license_code: owned.licenseCode,
            status: licenseStatus(owned),
            amount_paid: money(owned.paid),
            amount_remaining: money(Math.max(total - owned.paid, 0)),
            purchase_date: owned.enrolledAt ?? hoursAgo(240),
            redemption_date: access ? owned.enrolledAt : null,
            assigned_to_email: access ? user.email : null,
            assigned_to_name: access ? user.full_name : null,
            can_gift: owned.state === 'ready_to_redeem',
        },
    ];
}

// ==================== Cart ====================

function cartSummary() {
    const items = db().cart.map((line) => {
        const course = findCourse(line.courseId);
        return {
            id: line.id,
            user_id: 'demo-user',
            product_id: `prod-${course.id}`,
            quantity: line.quantity,
            created_at: line.createdAt,
            updated_at: line.createdAt,
            product_name: course.title,
            product_price: money(course.price),
            product_sku: sku(course),
        };
    });
    const subtotal = items.reduce((sum, item) => sum + Number(item.product_price) * item.quantity, 0);
    return {
        items,
        total_items: items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: money(subtotal),
        tax_total: money(subtotal * TAX),
        total: money(withTax(subtotal)),
    };
}

const coupons: Record<string, number> = { CURSORG10: 0.1, EMPRESA20: 0.2 };

// ==================== Users ====================

const defaultUser = (): DemoUser => ({
    email: 'maria.gonzalez@industriasandinas.com.ve',
    full_name: 'María González',
    roles: ['user'],
    fiscal_address: 'Av. Bolívar Norte, Valencia, Carabobo',
    phone: '+58 414-5556677',
    document_number: '18456221',
});

function currentUser() {
    const user = db().user ?? defaultUser();
    return {
        id: 'demo-user',
        document_type: 'V',
        is_contributor: false,
        company_id: user.roles.includes('company_admin') || user.roles.includes('user') ? 'co-1' : null,
        department_id: user.roles.includes('user') ? 'd-ops' : null,
        rif: null,
        business_name: null,
        ...user,
    };
}

function signIn(email: string) {
    const data = db();
    const account = data.accounts[email];
    data.user = {
        email,
        full_name: account?.name ?? nameFromEmail(email),
        roles: account?.roles ?? rolesFromEmail(email),
        fiscal_address: 'Av. Bolívar Norte, Valencia, Carabobo',
        phone: '+58 414-5556677',
        document_number: '18456221',
    };
    return {
        access_token: fakeJwt(email),
        refresh_token: fakeJwt(email),
        token_type: 'bearer',
    };
}

// ==================== Company panel (in memory) ====================

const companyDepartments = demoDepartments.map((department) => ({
    id: department.id,
    name: department.name,
    description: department.description,
    courses_assigned: department.courses,
    average_progress: department.progress,
}));

const companyUsers = [
    {
        id: 'u-admin',
        full_name: 'Carolina Méndez',
        email: demoClient.email,
        role: 'company_admin',
        department_id: 'd-admin',
    },
    ...demoEmployees.map((employee, index) => ({
        id: `u-${index + 1}`,
        full_name: employee.name,
        email: employee.email,
        role: 'user',
        department_id: employee.dept,
    })),
].map((user, index) => ({ ...user, is_active: index !== 6, created_at: hoursAgo(2000 - index * 90) }));

const companyCourses = demoCatalog.map((course) => ({
    id: course.id,
    title: course.title,
    image_url: course.image,
    modules: course.syllabus.map((module, moduleIndex) => ({
        id: `${course.id}-m${moduleIndex + 1}`,
        title: module.title,
        description: null as string | null,
        position: moduleIndex + 1,
        classes: classList(course)
            .filter((item) => item.moduleIndex === moduleIndex)
            .map((item) => ({
                id: item.id,
                title: item.title,
                description: null as string | null,
                video_url: item.isQuiz ? null : item.video,
                thumbnail_url: null as string | null,
                duration_minutes: item.isQuiz ? 15 : item.minutes,
                has_evaluation: item.isQuiz,
                content_type: (item.isQuiz ? 'quiz' : 'video') as string,
                is_required: true,
                position: item.position,
            })),
    })),
}));

const customQuizzes: Record<string, Body> = {};

const departmentView = (department: (typeof companyDepartments)[number]) => ({
    ...department,
    employee_count: companyUsers.filter((user) => user.department_id === department.id).length,
});

const userView = (user: (typeof companyUsers)[number]) => ({
    ...user,
    department_name: companyDepartments.find((item) => item.id === user.department_id)?.name ?? null,
});

const findOr404 = <T extends { id: string }>(list: T[], id: string, label: string): T => {
    const item = list.find((entry) => entry.id === id);
    if (!item) throw new HttpError(404, `${label} no encontrado.`);
    return item;
};

const allModules = () => companyCourses.flatMap((course) => course.modules);

function adminQuiz(classId: string) {
    if (customQuizzes[classId]) return customQuizzes[classId];
    const course = demoCatalog.find((item) => classId.startsWith(`${item.id}-`));
    const demoClass = course && classList(course).find((item) => item.id === classId);
    if (!course || !demoClass?.isQuiz) throw new HttpError(404, 'Esta clase no tiene quiz.');
    return {
        id: `quiz-${classId}`,
        class_id: classId,
        title: `Evaluación final · ${course.title}`,
        description: 'Evaluación de cierre del curso.',
        passing_score: PASSING_SCORE,
        max_attempts: MAX_ATTEMPTS,
        time_limit_minutes: 15,
        show_answers_after_submit: true,
        is_published: true,
        questions: quizFor(course, classId).map(({ options, ...question }) => ({
            ...question,
            options: options.map(({ id, text, is_correct, position }) => ({ id, text, is_correct, position })),
        })),
    };
}

// ==================== Routes ====================

interface Ctx {
    params: string[];
    body: Body;
    query: URLSearchParams;
}

type Handler = (ctx: Ctx) => unknown;

const routes: { method: string; pattern: RegExp; handler: Handler }[] = [];
const on = (method: string, path: string, handler: Handler) =>
    routes.push({
        method,
        pattern: new RegExp(`^${path.replace(/:\w+/g, '([^/]+)')}/?$`),
        handler,
    });

// Health, auth and profile
on('GET', '/', () => ({ status: 'ok', mode: 'demo' }));
on('GET', '/health', () => ({ status: 'ok', mode: 'demo' }));
on('POST', '/auth/login', ({ body }) => {
    const email = String(body.username ?? body.email ?? '').trim().toLowerCase();
    if (!email || !body.password) throw new HttpError(422, 'Ingresa tu correo y contraseña.');
    return signIn(email);
});
on('POST', '/auth/refresh', () => signIn(currentUser().email));
on('POST', '/auth/register', ({ body }) => {
    const email = String(body.email ?? '').toLowerCase();
    db().accounts[email] = { name: body.full_name || nameFromEmail(email), roles: ['user'] };
    return { id: `user-${nextSeq()}`, email, full_name: body.full_name };
});
on('POST', '/companies/register', ({ body }) => {
    const email = String(body.email ?? '').toLowerCase();
    db().accounts[email] = { name: body.admin_name || nameFromEmail(email), roles: ['company_admin'] };
    db().companyName = body.name || null;
    return { id: 'co-1', name: body.name, message: 'Empresa registrada.' };
});
on('GET', '/users/me', () => currentUser());
const updateMe: Handler = ({ body }) => {
    const data = db();
    data.user = { ...(data.user ?? defaultUser()), ...body };
    return currentUser();
};
on('PATCH', '/users/me', updateMe);
on('PATCH', '/users/me/fiscal', updateMe);

// Theme and site configuration
on('GET', '/themes', () => ({ themes: [DEFAULT_THEME] }));
on('GET', '/themes/default', () => DEFAULT_THEME);
on('GET', '/themes/admin', () => ({ themes: [DEFAULT_THEME] }));
on('POST', '/themes/activate/:id', () => DEFAULT_THEME);
on('GET', '/fonts', () => []);
on('GET', '/home-config/active', () => {
    throw new HttpError(404, 'Usando la portada predeterminada.');
});
on('GET', '/home-config', () => []);
on('GET', '/company-info/active/public', () => demoCompanyInfo);
on('GET', '/company-info', () => [demoCompanyInfo]);
on('GET', '/printers', () => []);
on('GET', '/coupons', () => ({ coupons: [], total: 0, total_pages: 1, page: 1 }));

// Catalog
on('GET', '/catalog/courses/public', ({ query }) => ({
    courses: filteredCatalog(query),
    categories: demoCategories,
    levels: demoLevels,
}));
on('GET', '/catalog/courses', ({ query }) => {
    const courses = filteredCatalog(query);
    return { courses, total: courses.length, page: 1, total_pages: 1 };
});
on('GET', '/catalog/categories', () => ({ categories: demoCategories }));
on('GET', '/catalog/levels', () => ({ levels: demoLevels }));
on('GET', '/catalog/courses/:id/details', ({ params }) => {
    const course = findCourse(params[0]);
    const base = catalogCourse(course);
    return {
        ...base,
        product_tax_rate: '16.00',
        video_url: demoVideos[0],
        user_licenses: courseLicenses(course),
    };
});
on('GET', '/catalog/courses/:id/admin', ({ params }) => ({
    ...catalogCourse(findCourse(params[0])),
    modules: companyCourses.find((course) => course.id === params[0])?.modules ?? [],
}));

// My courses and learning
on('GET', '/catalog/my-courses', () => {
    const data = db();
    return Object.entries(data.owned).map(([courseId, owned]) =>
        toUserCourse(findCourse(courseId), owned),
    );
});
on('GET', '/catalog/my-courses/:id/player', ({ params }) => {
    const course = findCourse(params[0]);
    const owned = requireOwned(course.id);
    const base = catalogCourse(course);
    return {
        course: {
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.image,
            duration_hours: course.hours,
            level_name: base.level_name,
            category_name: base.category_name,
            video_url: demoVideos[0],
        },
        enrollment: {
            id: owned.enrollmentId,
            status: owned.state === 'completed' ? 'completed' : 'active',
            progress: progressOf(course, owned),
            enrolled_at: owned.enrolledAt,
            completed_at: owned.completedAt,
        },
        license_id: `lic-${course.id}`,
        license_type: 'gift',
    };
});
on('PATCH', '/enrollments/my/:id', ({ params }) => {
    const entry = Object.entries(db().owned).find(([, owned]) => String(owned.enrollmentId) === params[0]);
    if (!entry) throw new HttpError(404, 'Inscripción no encontrada.');
    const [courseId, owned] = entry;
    owned.lastActivity = nowIso();
    return {
        id: owned.enrollmentId,
        status: owned.state === 'completed' ? 'completed' : 'active',
        progress: progressOf(findCourse(courseId), owned),
        enrolled_at: owned.enrolledAt,
        completed_at: owned.completedAt,
    };
});
on('GET', '/catalog/my-courses/:id/content', ({ params }) => {
    const course = findCourse(params[0]);
    return courseContent(course, requireOwned(course.id));
});
on('POST', '/catalog/my-courses/:id/classes/:cid/complete', ({ params }) => {
    const course = findCourse(params[0]);
    const owned = requireOwned(course.id);
    const item = findClass(course, params[1]);
    if (item.isQuiz && !quizStats(item.id).passed) {
        throw new HttpError(400, 'Aprueba la evaluación para completar esta clase.');
    }
    completeClass(course, owned, item.id);
    return {
        class_id: item.id,
        is_completed: true,
        progress: progressOf(course, owned),
        status: owned.state === 'completed' ? 'completed' : 'active',
    };
});
on('GET', '/catalog/my-courses/:id/classes/:cid/quiz', ({ params }) => {
    const course = findCourse(params[0]);
    requireOwned(course.id);
    const item = findClass(course, params[1]);
    if (!item.isQuiz) throw new HttpError(404, 'Esta clase no tiene quiz.');
    const stats = quizStats(item.id);
    const attempts = attemptsFor(item.id);
    const last = attempts[attempts.length - 1];
    return {
        quiz_id: `quiz-${item.id}`,
        class_id: item.id,
        title: `Evaluación final · ${course.title}`,
        description: 'Responde todas las preguntas. Necesitas 70 puntos para aprobar.',
        passing_score: PASSING_SCORE,
        max_attempts: MAX_ATTEMPTS,
        time_limit_minutes: 15,
        question_count: course.syllabus.length + 1,
        is_published: true,
        attempts_used: stats.finished.length,
        attempts_remaining: Math.max(MAX_ATTEMPTS - stats.finished.length, 0),
        best_score: stats.best,
        passed: stats.passed,
        in_progress_attempt_id: attempts.find((attempt) => attempt.status === 'in_progress')?.id ?? null,
        last_attempt: last
            ? {
                  id: last.id,
                  status: last.status,
                  score: last.score,
                  passed: last.passed,
                  started_at: last.started_at,
                  completed_at: last.completed_at,
              }
            : null,
    };
});
on('GET', '/catalog/my-courses/:id/classes/:cid/quiz/attempts', ({ params }) =>
    attemptsFor(params[1]).map(({ id, status, score, passed, started_at, completed_at }) => ({
        id,
        status,
        score,
        passed,
        started_at,
        completed_at,
    })),
);
on('POST', '/catalog/my-courses/:id/classes/:cid/quiz/attempts', ({ params }) => {
    const course = findCourse(params[0]);
    requireOwned(course.id);
    const item = findClass(course, params[1]);
    if (quizStats(item.id).finished.length >= MAX_ATTEMPTS) {
        throw new HttpError(400, 'Ya usaste todos los intentos de esta evaluación.');
    }
    let attempt = attemptsFor(item.id).find((entry) => entry.status === 'in_progress');
    if (!attempt) {
        attempt = {
            id: `att-${nextSeq()}`,
            courseId: course.id,
            classId: item.id,
            status: 'in_progress',
            score: null,
            passed: null,
            started_at: nowIso(),
            completed_at: null,
        };
        db().attempts.push(attempt);
    }
    return {
        attempt_id: attempt.id,
        started_at: attempt.started_at,
        expires_at: new Date(new Date(attempt.started_at).getTime() + 15 * 60_000).toISOString(),
        questions: quizFor(course, item.id).map((question) => ({
            id: question.id,
            prompt: question.prompt,
            question_type: question.question_type,
            points: question.points,
            position: question.position,
            options: question.options.map(({ id, text, position }) => ({ id, text, position })),
        })),
    };
});
on('POST', '/catalog/quiz-attempts/:id/submit', ({ params, body }) => {
    const attempt = db().attempts.find((entry) => entry.id === params[0]);
    if (!attempt) throw new HttpError(404, 'Intento no encontrado.');
    if (attempt.status !== 'in_progress') throw new HttpError(400, 'Este intento ya fue enviado.');
    const course = findCourse(attempt.courseId);
    const answers: { question_id: string; selected_option_ids: string[] }[] = body.answers ?? [];
    const questions = quizFor(course, attempt.classId);
    const results = questions.map((question) => {
        const correctIds = question.options.filter((option) => option.is_correct).map((option) => option.id);
        const selected = answers.find((answer) => answer.question_id === question.id)?.selected_option_ids ?? [];
        const isCorrect =
            selected.length === correctIds.length && selected.every((id) => correctIds.includes(id));
        return {
            question_id: question.id,
            prompt: question.prompt,
            is_correct: isCorrect,
            points_awarded: isCorrect ? question.points : 0,
            points_possible: question.points,
            correct_option_ids: correctIds,
            explanation: question.explanation,
        };
    });
    const possible = results.reduce((sum, result) => sum + result.points_possible, 0);
    const score = Math.round((results.reduce((sum, result) => sum + result.points_awarded, 0) / possible) * 100);
    attempt.status = 'completed';
    attempt.score = score;
    attempt.passed = score >= PASSING_SCORE;
    attempt.completed_at = nowIso();
    if (attempt.passed) completeClass(course, requireOwned(course.id), attempt.classId);
    return {
        attempt_id: attempt.id,
        quiz_id: `quiz-${attempt.classId}`,
        status: 'completed',
        score,
        passed: attempt.passed,
        passing_score: PASSING_SCORE,
        completed_at: attempt.completed_at,
        show_answers: true,
        results,
    };
});

// Licenses and purchases
on('POST', '/licenses/redeem', ({ body }) => {
    const code = String(body.license_code ?? '').trim().toUpperCase();
    const entry = Object.entries(db().owned).find(([, owned]) => owned.licenseCode === code);
    if (!entry) throw new HttpError(404, 'No encontramos una licencia con ese código.');
    const [courseId, owned] = entry;
    if (owned.state === 'payment_pending') throw new HttpError(400, 'Esta licencia tiene un pago pendiente.');
    if (hasAccess(owned)) throw new HttpError(400, 'Esta licencia ya fue canjeada.');
    owned.state = 'in_progress';
    owned.enrolledAt = nowIso();
    owned.lastActivity = nowIso();
    return { success: true, course_id: courseId, message: 'Licencia canjeada.' };
});
on('POST', '/licenses/:id/gift', () => ({ success: true, message: 'Licencia enviada por correo.' }));
on('POST', '/payments/purchase-course', ({ body }) => {
    const course = findCourse(String(body.course_id));
    const data = db();
    const number = nextInvoiceNumber();
    const invoice = buildInvoice(number, [{ courseId: course.id, quantity: 1 }], nowIso(), 0);
    const amounts: number[] = (body.payments ?? []).map((payment: Body) => Number(payment.amount) || 0);
    const total = Number(invoice.total);
    (amounts.length ? amounts : [total]).forEach((amount) => addPayment(invoice, amount));
    data.invoices.unshift(invoice);
    data.invoiceCourses[number] = [course.id];
    if (invoice.status === 'paid') grantCourses([course.id]);
    return {
        success: true,
        invoice_number: number,
        total_paid: invoice.total_paid,
        payments: (invoice.payments ?? []).map((payment) => ({
            id: payment.id,
            invoice_id: invoice.id,
            amount: payment.amount,
            status: payment.status,
        })),
        message: 'Compra registrada. Tu licencia ya está disponible en Mis cursos.',
    };
});

// Cart and checkout
on('GET', '/cart', () => cartSummary());
on('POST', '/cart/items', ({ body }) => {
    const courseId = String(body.product_id ?? '').replace(/^prod-/, '');
    findCourse(courseId);
    const quantity = Math.max(Number(body.quantity) || 1, 1);
    const cart = db().cart;
    const line = cart.find((entry) => entry.courseId === courseId);
    if (line) line.quantity += quantity;
    else cart.push({ id: `cart-${nextSeq()}`, courseId, quantity, createdAt: nowIso() });
    return cartSummary();
});
on('PUT', '/cart/items/:id', ({ params, body }) => {
    const line = db().cart.find((entry) => entry.id === params[0]);
    if (!line) throw new HttpError(404, 'El curso ya no está en tu carrito.');
    line.quantity = Math.max(Number(body.quantity) || 1, 1);
    return cartSummary();
});
on('DELETE', '/cart/items/:id', ({ params }) => {
    const data = db();
    data.cart = data.cart.filter((entry) => entry.id !== params[0]);
    return cartSummary();
});
on('DELETE', '/cart', () => {
    db().cart = [];
    return cartSummary();
});
on('POST', '/coupons/validate', ({ body }) => {
    const code = String(body.code ?? body.coupon_code ?? '').trim().toUpperCase();
    const rate = coupons[code];
    if (!rate) return { valid: false, message: 'El cupón no existe o ya venció. Prueba con CURSORG10.' };
    const subtotal = Number(body.subtotal ?? body.amount ?? cartSummary().subtotal) || 0;
    return {
        valid: true,
        code,
        discount_type: 'percentage',
        discount_value: rate * 100,
        discount_amount: money(subtotal * rate),
        message: `Cupón ${code} aplicado.`,
    };
});
on('POST', '/cart/checkout', ({ body }) => {
    const data = db();
    if (data.cart.length === 0) throw new HttpError(400, 'Tu carrito está vacío.');
    const summary = cartSummary();
    const rate = ((body.coupon_codes ?? []) as string[]).reduce(
        (sum, code) => sum + (coupons[String(code).toUpperCase()] ?? 0),
        0,
    );
    const number = nextInvoiceNumber();
    const invoice = buildInvoice(
        number,
        data.cart.map((line) => ({ courseId: line.courseId, quantity: line.quantity })),
        nowIso(),
        0,
        Number(summary.subtotal) * Math.min(rate, 0.5),
    );
    data.invoices.unshift(invoice);
    data.invoiceCourses[number] = data.cart.map((line) => line.courseId);
    return { invoice_id: invoice.id, invoice_number: number, total: invoice.total, status: invoice.status };
});
on('POST', '/payments/split', ({ body }) => {
    const data = db();
    const invoice = data.invoices.find((entry) => entry.id === String(body.invoice_id));
    if (!invoice) throw new HttpError(404, 'Factura no encontrada.');
    const amounts: number[] = (body.payments ?? []).map((payment: Body) => Number(payment.amount) || 0);
    (amounts.length ? amounts : [Number(invoice.remaining_balance)]).forEach((amount, index) =>
        addPayment(invoice, amount, nowIso(), body.payments?.[index]?.method_type ?? 'pago_movil'),
    );
    if (invoice.status === 'paid') {
        grantCourses(data.invoiceCourses[invoice.id] ?? []);
        data.cart = [];
    }
    return { success: true, invoice_id: invoice.id, total_paid: invoice.total_paid, status: invoice.status };
});

// Invoices
const sortedInvoices = () =>
    [...db().invoices].sort((a, b) => b.created_at.localeCompare(a.created_at));
on('GET', '/invoices', ({ query }) => {
    const page = Math.max(Number(query.get('page')) || 1, 1);
    const pageSize = Math.max(Number(query.get('page_size')) || 10, 1);
    const all = sortedInvoices();
    const totalPages = Math.max(Math.ceil(all.length / pageSize), 1);
    return {
        invoices: all.slice((page - 1) * pageSize, page * pageSize),
        total: all.length,
        page,
        totalPages,
        total_pages: totalPages,
    };
});
on('GET', '/invoices/summary', () => {
    const all = db().invoices;
    const sum = (pick: (invoice: Invoice) => string | undefined) =>
        money(all.reduce((total, invoice) => total + (Number(pick(invoice)) || 0), 0));
    return {
        total_invoices: all.length,
        total_subtotal: sum((invoice) => invoice.subtotal),
        total_iva: sum((invoice) => invoice.tax_total),
        total_paid: sum((invoice) => invoice.total_paid),
    };
});
on('GET', '/invoices/download-all', () =>
    new Blob(
        [sortedInvoices().map((invoice) => `${invoice.invoice_number}\t${invoice.issue_date}\tBs. ${invoice.total}`).join('\n')],
        { type: 'text/plain' },
    ),
);
on('GET', '/invoices/:id', ({ params }) => {
    const invoice = db().invoices.find((entry) => entry.id === params[0]);
    if (!invoice) throw new HttpError(404, 'Factura no encontrada.');
    return invoice;
});

// Company panel
on('GET', '/company/profile', () => ({
    id: 'co-1',
    name: db().companyName ?? demoClient.name,
    rif: demoClient.rif,
    sector: demoClient.sector,
    email: demoClient.email,
    phone: demoClient.phone,
    logo_url: null,
    is_active: true,
}));
on('GET', '/company/summary', () => {
    const employees = companyUsers.filter((user) => user.role === 'user');
    return {
        company_name: db().companyName ?? demoClient.name,
        departments: companyDepartments.length,
        employees: employees.length,
        active_employees: employees.filter((user) => user.is_active).length,
        courses_assigned: companyDepartments.reduce((sum, department) => sum + department.courses_assigned, 0),
        completion_rate: 64,
    };
});
on('GET', '/company/activity', ({ query }) => {
    const actions = ['Completó una clase', 'Aprobó la evaluación', 'Inició un curso', 'Completó el curso'];
    return demoEmployees.slice(0, Number(query.get('limit')) || 8).map((employee, index) => {
        const course = demoCatalog[index % demoCatalog.length];
        const action = actions[index % actions.length];
        return {
            id: `act-${index + 1}`,
            user_name: employee.name,
            action,
            detail: action === 'Completó una clase' ? `${course.syllabus[0].classes[1]} · ${course.title}` : course.title,
            created_at: hoursAgo(index * 5 + 1),
        };
    });
});
on('GET', '/company/departments', () => companyDepartments.map(departmentView));
on('POST', '/company/departments', ({ body }) => {
    const department = {
        id: `d-${nextSeq()}`,
        name: String(body.name ?? 'Nuevo departamento'),
        description: body.description ?? null,
        courses_assigned: 0,
        average_progress: 0,
    };
    companyDepartments.push(department);
    return departmentView(department);
});
on('PATCH', '/company/departments/:id', ({ params, body }) => {
    const department = findOr404(companyDepartments, params[0], 'Departamento');
    Object.assign(department, body);
    return departmentView(department);
});
on('DELETE', '/company/departments/:id', ({ params }) => {
    const index = companyDepartments.findIndex((item) => item.id === params[0]);
    if (index >= 0) companyDepartments.splice(index, 1);
    return { success: true };
});
on('GET', '/company/users', () => companyUsers.map(userView));
on('POST', '/company/users', ({ body }) => {
    const user = {
        id: `u-${nextSeq()}`,
        full_name: body.full_name ?? null,
        email: String(body.email ?? ''),
        role: body.role ?? 'user',
        department_id: body.department_id ?? null,
        is_active: body.is_active ?? true,
        created_at: nowIso(),
    };
    companyUsers.push(user);
    return userView(user);
});
on('PATCH', '/company/users/:id', ({ params, body }) => {
    const user = findOr404(companyUsers, params[0], 'Colaborador');
    const { password: _password, ...changes } = body;
    void _password;
    Object.assign(user, changes);
    return userView(user);
});
on('DELETE', '/company/users/:id', ({ params }) => {
    findOr404(companyUsers, params[0], 'Colaborador').is_active = false;
    return { success: true };
});
on('GET', '/company/classes', () => companyCourses);
on('POST', '/company/modules', ({ body }) => {
    const course = findOr404(companyCourses, String(body.course_id), 'Curso');
    const module = {
        id: `mod-${nextSeq()}`,
        title: String(body.title ?? 'Nuevo módulo'),
        description: body.description ?? null,
        position: body.position ?? course.modules.length + 1,
        classes: [],
    };
    course.modules.push(module);
    return module;
});
on('PATCH', '/company/modules/:id', ({ params, body }) => {
    const module = findOr404(allModules(), params[0], 'Módulo');
    Object.assign(module, body);
    return module;
});
on('DELETE', '/company/modules/:id', ({ params }) => {
    for (const course of companyCourses) course.modules = course.modules.filter((item) => item.id !== params[0]);
    return { success: true };
});
on('POST', '/company/classes', ({ body }) => {
    const module = findOr404(allModules(), String(body.module_id), 'Módulo');
    const item = {
        id: `cls-${nextSeq()}`,
        title: String(body.title ?? 'Nueva clase'),
        description: body.description ?? null,
        video_url: body.video_url ?? null,
        thumbnail_url: body.thumbnail_url ?? null,
        duration_minutes: body.duration_minutes ?? null,
        has_evaluation: Boolean(body.has_evaluation),
        content_type: body.content_type ?? 'video',
        is_required: body.is_required ?? true,
        position: body.position ?? module.classes.length + 1,
    };
    module.classes.push(item);
    return item;
});
on('PATCH', '/company/classes/:id', ({ params, body }) => {
    const item = findOr404(allModules().flatMap((module) => module.classes), params[0], 'Clase');
    Object.assign(item, body);
    return item;
});
on('DELETE', '/company/classes/:id', ({ params }) => {
    for (const module of allModules()) module.classes = module.classes.filter((item) => item.id !== params[0]);
    return { success: true };
});
on('GET', '/company/classes/:id/quiz', ({ params }) => adminQuiz(params[0]));
on('PUT', '/company/classes/:id/quiz', ({ params, body }) => {
    customQuizzes[params[0]] = {
        id: `quiz-${params[0]}`,
        class_id: params[0],
        ...body,
        questions: (body.questions ?? []).map((question: Body, index: number) => ({
            ...question,
            id: `${params[0]}-q${index + 1}`,
            options: (question.options ?? []).map((option: Body, position: number) => ({
                ...option,
                id: `${params[0]}-q${index + 1}-o${position + 1}`,
                position: position + 1,
            })),
        })),
    };
    return customQuizzes[params[0]];
});
on('DELETE', '/company/classes/:id/quiz', ({ params }) => {
    delete customQuizzes[params[0]];
    return { success: true };
});
on('GET', '/company/classes/:id/quiz/attempts', () =>
    demoEmployees.slice(0, 5).map((employee, index) => {
        const score = [92, 75, 58, 84, 100][index];
        return {
            id: `adm-att-${index + 1}`,
            user_id: `u-${index + 1}`,
            user_name: employee.name,
            user_email: employee.email,
            status: 'completed',
            score,
            passed: score >= PASSING_SCORE,
            started_at: hoursAgo(index * 20 + 3),
            completed_at: hoursAgo(index * 20 + 2.7),
        };
    }),
);

// ==================== Adapter ====================

const placeholderUpload = {
    url: demoCatalog[0].image,
    image_url: demoCatalog[0].image,
    file_url: demoCatalog[0].image,
    filename: 'archivo-demo',
};

/** Unlisted endpoints: lists come back empty, writes echo what was sent. */
function fallback(method: string, path: string, body: Body) {
    console.info(`[demo api] sin datos de ejemplo para ${method} ${path}`);
    if (method === 'GET') return [];
    if (path.includes('upload')) return placeholderUpload;
    if (method === 'DELETE') return { success: true };
    return { id: `demo-${nextSeq()}`, ...body, success: true };
}

function parseBody(data: unknown): Body {
    if (data == null || data === '') return {};
    if (typeof data !== 'string') return data instanceof FormData ? Object.fromEntries(data) : (data as Body);
    try {
        return JSON.parse(data);
    } catch {
        return Object.fromEntries(new URLSearchParams(data));
    }
}

function resolveUrl(config: InternalAxiosRequestConfig) {
    const target = config.url ?? '';
    const joined =
        config.baseURL && !/^https?:\/\//i.test(target)
            ? `${config.baseURL.replace(/\/+$/, '')}/${target.replace(/^\/+/, '')}`
            : target;
    const url = new URL(joined, API_ORIGIN);
    Object.entries(config.params ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
    return url;
}

async function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    const url = resolveUrl(config);
    const method = (config.method ?? 'get').toUpperCase();
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const body = parseBody(config.data);

    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 250));

    let status = 200;
    let data: unknown;
    try {
        const route = routes.find((entry) => entry.method === method && entry.pattern.test(path));
        data = route
            ? route.handler({
                  params: (path.match(route.pattern) ?? []).slice(1).map(decodeURIComponent),
                  body,
                  query: url.searchParams,
              })
            : fallback(method, path, body);
        saveState();
    } catch (error) {
        if (!(error instanceof HttpError)) throw error;
        status = error.status;
        data = { detail: error.message };
    }

    const headers = new AxiosHeaders({ 'content-type': 'application/json' });
    if (data instanceof Blob) {
        headers.set('content-type', data.type);
        headers.set('content-disposition', 'attachment; filename="facturas_cursorg_demo.txt"');
    }
    const response: AxiosResponse = { data, status, statusText: String(status), headers, config, request: {} };
    if (status >= 400) {
        throw new AxiosError(
            String((data as Body).detail),
            status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
            config,
            {},
            response,
        );
    }
    return response;
}

// Must run before any module calls axios.create(): instances copy the
// defaults at creation time. main.tsx imports this file first.
if (demoModeEnabled) {
    axios.defaults.adapter = demoAdapter;
    console.info('[demo api] Modo demo activo: todas las llamadas usan datos de ejemplo.');
}
