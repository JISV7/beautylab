/** Placeholder catalog used by the demo API (see mockApi.ts). */

export interface DemoModule {
    title: string;
    classes: string[];
}

export interface DemoCourse {
    id: string;
    title: string;
    slug: string;
    description: string;
    image: string;
    hours: number;
    price: number;
    categoryId: number;
    levelId: number;
    syllabus: DemoModule[];
}

const photo = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

// Short public sample clips so the player has something real to play.
export const demoVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

export const demoCategories = [
    { id: 1, name: 'Industrial y manufactura', slug: 'industrial', parent_id: null },
    { id: 2, name: 'Comercio y retail', slug: 'comercio', parent_id: null },
    { id: 3, name: 'Servicios financieros', slug: 'finanzas', parent_id: null },
    { id: 4, name: 'Gestión de equipos', slug: 'gestion-equipos', parent_id: null },
    { id: 5, name: 'Productividad', slug: 'productividad', parent_id: null },
].map((category, index) => ({
    ...category,
    description: null,
    order: index + 1,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
}));

export const demoLevels = [
    { id: 1, name: 'Básico', slug: 'basico' },
    { id: 2, name: 'Intermedio', slug: 'intermedio' },
    { id: 3, name: 'Avanzado', slug: 'avanzado' },
].map((level, index) => ({
    ...level,
    description: null,
    order: index + 1,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
}));

export const demoCatalog: DemoCourse[] = [
    {
        id: 'c-sst',
        title: 'Seguridad y Salud en el Trabajo (LOPCYMAT)',
        slug: 'seguridad-salud-trabajo',
        description:
            'Cumple la LOPCYMAT y reduce accidentes en planta. Identificación de peligros, equipos de protección, bloqueo de energías y respuesta ante emergencias, con casos de la industria venezolana.',
        image: photo('1504917595217-d4dc5ebe6122'),
        hours: 12,
        price: 1250,
        categoryId: 1,
        levelId: 1,
        syllabus: [
            {
                title: 'Módulo 1 · Marco legal venezolano',
                classes: [
                    'Qué exige la LOPCYMAT a la empresa',
                    'Derechos y deberes del trabajador',
                    'El comité de seguridad y salud laboral',
                ],
            },
            {
                title: 'Módulo 2 · Riesgos en planta',
                classes: [
                    'Identificación de peligros',
                    'Equipos de protección personal',
                    'Prevención de riesgos en planta',
                    'Bloqueo y etiquetado de equipos',
                ],
            },
            {
                title: 'Módulo 3 · Respuesta ante emergencias',
                classes: ['Plan de evacuación', 'Primeros auxilios básicos', 'Evaluación final'],
            },
        ],
    },
    {
        id: 'c-finanzas',
        title: 'Finanzas prácticas para no financieros',
        slug: 'finanzas-practicas',
        description:
            'Lee estados financieros, arma el presupuesto de tu área y toma decisiones con números en un entorno de inflación y multimoneda.',
        image: photo('1554224155-6726b3ff858f'),
        hours: 8,
        price: 980,
        categoryId: 3,
        levelId: 1,
        syllabus: [
            {
                title: 'Módulo 1 · Lenguaje financiero básico',
                classes: [
                    'Activos, pasivos y patrimonio',
                    'Ingresos, costos y gastos',
                    'Flujo de caja en la operación',
                ],
            },
            {
                title: 'Módulo 2 · Lectura de estados financieros',
                classes: ['Balance general', 'Estado de resultados', 'Indicadores clave'],
            },
            {
                title: 'Módulo 3 · Decisiones con números',
                classes: [
                    'Presupuesto del área',
                    'Costeo en contexto de inflación',
                    'Evaluación final',
                ],
            },
        ],
    },
    {
        id: 'c-atencion',
        title: 'Atención al cliente y ventas consultivas',
        slug: 'atencion-cliente',
        description:
            'Convierte cada contacto en una venta o en un cliente fiel: escucha activa, diagnóstico de necesidades, manejo de objeciones y postventa.',
        image: photo('1556761175-b413da4baf72'),
        hours: 6,
        price: 760,
        categoryId: 2,
        levelId: 2,
        syllabus: [
            {
                title: 'Módulo 1 · El cliente actual',
                classes: [
                    'Expectativas del cliente',
                    'Escucha activa',
                    'Lenguaje que genera confianza',
                ],
            },
            {
                title: 'Módulo 2 · Venta consultiva',
                classes: [
                    'Diagnóstico de necesidades',
                    'Presentar soluciones',
                    'Manejo de objeciones',
                ],
            },
            {
                title: 'Módulo 3 · Postventa',
                classes: ['Seguimiento al cliente', 'Gestión de reclamos', 'Evaluación final'],
            },
        ],
    },
    {
        id: 'c-liderazgo',
        title: 'Liderazgo operativo y supervisión efectiva',
        slug: 'liderazgo-operativo',
        description:
            'Para supervisores y jefes de turno: comunicación con el equipo, metas e indicadores, retroalimentación y resolución de conflictos en planta.',
        image: photo('1521737711867-e3b97375f902'),
        hours: 10,
        price: 1100,
        categoryId: 4,
        levelId: 2,
        syllabus: [
            {
                title: 'Módulo 1 · El rol del supervisor',
                classes: [
                    'De compañero a líder',
                    'Comunicación con el equipo',
                    'Delegar con claridad',
                ],
            },
            {
                title: 'Módulo 2 · Gestión del desempeño',
                classes: [
                    'Metas e indicadores',
                    'Retroalimentación que genera resultados',
                    'Conversaciones difíciles',
                ],
            },
            {
                title: 'Módulo 3 · Equipos en planta',
                classes: ['Turnos y relevo', 'Resolución de conflictos', 'Evaluación final'],
            },
        ],
    },
    {
        id: 'c-fraude',
        title: 'Prevención de fraudes y cumplimiento normativo',
        slug: 'prevencion-fraudes',
        description:
            'Detecta señales de alerta, aplica debida diligencia y reporta operaciones sospechosas según la normativa vigente para el sector financiero.',
        image: photo('1498050108023-c5249f4df085'),
        hours: 9,
        price: 1500,
        categoryId: 3,
        levelId: 3,
        syllabus: [
            {
                title: 'Módulo 1 · Marco normativo',
                classes: [
                    'Normativa aplicable al sector',
                    'Legitimación de capitales',
                    'Políticas internas de cumplimiento',
                ],
            },
            {
                title: 'Módulo 2 · Señales de alerta',
                classes: [
                    'Patrones de fraude interno',
                    'Fraude con medios de pago',
                    'Debida diligencia del cliente',
                ],
            },
            {
                title: 'Módulo 3 · Respuesta',
                classes: [
                    'Reporte de operaciones sospechosas',
                    'Investigación interna',
                    'Evaluación final',
                ],
            },
        ],
    },
    {
        id: 'c-excel',
        title: 'Excel para la gestión operativa',
        slug: 'excel-gestion-operativa',
        description:
            'Arma reportes que se actualizan solos: fórmulas esenciales, tablas dinámicas, BUSCARX y plantillas reutilizables para el día a día.',
        image: photo('1554224155-6726b3ff858f'),
        hours: 6,
        price: 640,
        categoryId: 5,
        levelId: 1,
        syllabus: [
            {
                title: 'Módulo 1 · Bases',
                classes: ['Tablas y formato', 'Fórmulas esenciales', 'Validación de datos'],
            },
            {
                title: 'Módulo 2 · Análisis',
                classes: ['Tablas dinámicas', 'BUSCARX y referencias', 'Gráficos para reportes'],
            },
            {
                title: 'Módulo 3 · Automatización',
                classes: [
                    'Plantillas reutilizables',
                    'Introducción a macros',
                    'Evaluación final',
                ],
            },
        ],
    },
];

export const demoCompanyInfo = {
    id: 1,
    business_name: 'Cursorg C.A.',
    rif: 'J-50123456-7',
    fiscal_address: 'Av. Bolívar Norte, Torre Banaven, piso 8, Valencia, Carabobo',
    email: 'facturacion@cursorg.com.ve',
    phone: '+58 241-555-0142',
    logo_url: null,
    is_active: true,
};

export const demoClient = {
    name: 'Industrias Andinas C.A.',
    sector: 'Industrial y manufactura',
    rif: 'J-40987654-3',
    email: 'rrhh@industriasandinas.com.ve',
    phone: '+58 241-555-0199',
};

export const demoEmployees = [
    { name: 'María González', email: 'maria.gonzalez@industriasandinas.com.ve', dept: 'd-ops' },
    { name: 'José Rodríguez', email: 'jose.rodriguez@industriasandinas.com.ve', dept: 'd-ops' },
    { name: 'Andreína Pérez', email: 'andreina.perez@industriasandinas.com.ve', dept: 'd-ventas' },
    { name: 'Luis Herrera', email: 'luis.herrera@industriasandinas.com.ve', dept: 'd-mant' },
    { name: 'Carolina Méndez', email: 'carolina.mendez@industriasandinas.com.ve', dept: 'd-admin' },
    { name: 'Rafael Sánchez', email: 'rafael.sanchez@industriasandinas.com.ve', dept: 'd-mant' },
    { name: 'Daniela Rojas', email: 'daniela.rojas@industriasandinas.com.ve', dept: 'd-ventas' },
    { name: 'Gabriel Torres', email: 'gabriel.torres@industriasandinas.com.ve', dept: 'd-ops' },
];

export const demoDepartments = [
    { id: 'd-ops', name: 'Operaciones', description: 'Planta y producción', courses: 3, progress: 58 },
    { id: 'd-mant', name: 'Mantenimiento', description: 'Mantenimiento industrial', courses: 2, progress: 41 },
    { id: 'd-ventas', name: 'Ventas', description: 'Fuerza de ventas y atención', courses: 2, progress: 76 },
    { id: 'd-admin', name: 'Administración', description: 'Finanzas y RR. HH.', courses: 2, progress: 63 },
];
