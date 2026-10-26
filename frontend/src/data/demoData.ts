/**
 * Placeholder data so the customer dashboard can be explored without the API.
 * Only used when the backend is unreachable and demo mode is allowed
 * (Vite dev server, or VITE_DEMO_MODE=true in a build).
 */
import axios from 'axios';
import type { User } from '../contexts/AuthContext';
import type { CourseContent, UserCourse } from '../lib/learningApi';
import type { Invoice, InvoiceSummary } from './invoice.types';

export const DEMO_TOKEN = 'demo-session';

export const demoModeAllowed =
    import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';

/** True when the request never reached a server (backend down, CORS, offline). */
export const isNetworkError = (error: unknown) =>
    axios.isAxiosError(error) ? !error.response : true;

export const isDemoSession = () => localStorage.getItem('access_token') === DEMO_TOKEN;

export const demoUser: User = {
    id: 'demo-user',
    email: 'maria.gonzalez@industriasandinas.com.ve',
    full_name: 'María González',
    name: 'María González',
    roles: ['user'],
    isAdmin: false,
    isCompanyAdmin: false,
    document_type: 'V',
    document_number: '18456221',
    fiscal_address: 'Av. Bolívar Norte, Torre Banaven, Valencia, Carabobo',
    phone: '+58 414-5556677',
};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const daysAgo = (days: number) => hoursAgo(days * 24);

const baseCourse = {
    licenses: [],
    total_paid: '0.00',
    total_required: '0.00',
    payment_progress: 100,
    is_fully_paid: true,
    enrollment_id: null,
    enrollment_status: null,
    progress: 0,
    completed_at: null,
    last_activity_at: null,
    has_access: false,
    can_redeem: false,
} satisfies Partial<UserCourse>;

export const demoCourses: UserCourse[] = [
    {
        ...baseCourse,
        course_id: 'demo-sst',
        course_title: 'Seguridad y Salud en el Trabajo (LOPCYMAT)',
        course_slug: 'seguridad-salud-trabajo',
        course_image_url:
            'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
        category_id: 1,
        category_name: 'Industrial y manufactura',
        total_paid: '1450.00',
        total_required: '1450.00',
        enrollment_id: 101,
        enrollment_status: 'active',
        progress: 45,
        last_activity_at: hoursAgo(2),
        has_access: true,
        access_state: 'in_progress',
    },
    {
        ...baseCourse,
        course_id: 'demo-finanzas',
        course_title: 'Finanzas prácticas para no financieros',
        course_slug: 'finanzas-practicas',
        course_image_url:
            'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
        category_id: 3,
        category_name: 'Servicios financieros',
        total_paid: '980.00',
        total_required: '980.00',
        enrollment_id: 102,
        enrollment_status: 'active',
        progress: 72,
        last_activity_at: daysAgo(1),
        has_access: true,
        access_state: 'in_progress',
    },
    {
        ...baseCourse,
        course_id: 'demo-atencion',
        course_title: 'Atención al cliente y ventas consultivas',
        course_slug: 'atencion-cliente',
        course_image_url:
            'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=800&q=80',
        category_id: 2,
        category_name: 'Comercio y retail',
        total_paid: '760.00',
        total_required: '760.00',
        enrollment_id: 103,
        enrollment_status: 'completed',
        progress: 100,
        completed_at: daysAgo(6),
        last_activity_at: daysAgo(6),
        has_access: true,
        access_state: 'completed',
    },
    {
        ...baseCourse,
        course_id: 'demo-liderazgo',
        course_title: 'Liderazgo operativo y supervisión efectiva',
        course_slug: 'liderazgo-operativo',
        course_image_url:
            'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
        category_id: 4,
        category_name: 'Gestión de equipos',
        total_paid: '1200.00',
        total_required: '1200.00',
        can_redeem: true,
        access_state: 'ready_to_redeem',
    },
    {
        ...baseCourse,
        course_id: 'demo-fraude',
        course_title: 'Prevención de fraudes y cumplimiento normativo',
        course_slug: 'prevencion-fraudes',
        course_image_url:
            'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
        category_id: 3,
        category_name: 'Servicios financieros',
        total_paid: '600.00',
        total_required: '1500.00',
        payment_progress: 40,
        is_fully_paid: false,
        access_state: 'payment_pending',
    },
];

const demoClass = (id: string, title: string, minutes: number, isCompleted: boolean) => ({
    id,
    title,
    description: null,
    content_type: 'video' as const,
    video_url: null,
    thumbnail_url: null,
    duration_minutes: minutes,
    is_required: true,
    has_quiz: false,
    quiz: null,
    is_completed: isCompleted,
    best_score: null,
    passed: isCompleted,
    attempts_used: 0,
});

const demoContents: Record<string, CourseContent> = {
    'demo-sst': {
        course_id: 'demo-sst',
        title: 'Seguridad y Salud en el Trabajo (LOPCYMAT)',
        progress: 45,
        status: 'active',
        modules: [
            {
                id: 'sst-m1',
                title: 'Módulo 1 · Marco legal venezolano',
                description: null,
                position: 1,
                classes: [
                    demoClass('sst-c1', 'Qué exige la LOPCYMAT a la empresa', 12, true),
                    demoClass('sst-c2', 'Derechos y deberes del trabajador', 10, true),
                    demoClass('sst-c3', 'El comité de seguridad y salud laboral', 14, true),
                ],
            },
            {
                id: 'sst-m2',
                title: 'Módulo 2 · Riesgos en planta',
                description: null,
                position: 2,
                classes: [
                    demoClass('sst-c4', 'Identificación de peligros', 15, true),
                    demoClass('sst-c5', 'Equipos de protección personal', 11, true),
                    demoClass('sst-c6', 'Prevención de riesgos en planta', 18, false),
                    demoClass('sst-c7', 'Bloqueo y etiquetado de equipos', 16, false),
                ],
            },
            {
                id: 'sst-m3',
                title: 'Módulo 3 · Respuesta ante emergencias',
                description: null,
                position: 3,
                classes: [
                    demoClass('sst-c8', 'Plan de evacuación', 12, false),
                    demoClass('sst-c9', 'Primeros auxilios básicos', 20, false),
                    demoClass('sst-c10', 'Reporte e investigación de incidentes', 14, false),
                    demoClass('sst-c11', 'Simulacro guiado', 9, false),
                ],
            },
        ],
    },
};

export const getDemoCourseContent = (courseId: string): CourseContent | null =>
    demoContents[courseId] ?? null;

const demoInvoice = (
    id: string,
    number: string,
    daysBack: number,
    total: string,
    status: string,
): Invoice => {
    const issued = new Date(Date.now() - daysBack * 86_400_000);
    return {
        id,
        invoice_number: number,
        control_number: `00-${number}`,
        issue_date: issued.toISOString().slice(0, 10),
        issue_time: '10:30:00',
        subtotal: (Number(total) / 1.16).toFixed(2),
        discount_total: '0.00',
        tax_total: (Number(total) - Number(total) / 1.16).toFixed(2),
        total,
        status,
        created_at: issued.toISOString(),
    };
};

export const demoInvoices: Invoice[] = [
    demoInvoice('demo-inv-4', '00000148', 3, '1500.00', 'partial'),
    demoInvoice('demo-inv-3', '00000131', 12, '1200.00', 'paid'),
    demoInvoice('demo-inv-2', '00000117', 26, '1740.00', 'paid'),
    demoInvoice('demo-inv-1', '00000102', 41, '1450.00', 'paid'),
];

export const demoInvoiceSummary: InvoiceSummary = {
    total_invoices: 6,
    total_subtotal: '6672.41',
    total_iva: '1067.59',
    total_paid: '6840.00',
};
