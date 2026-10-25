import React from 'react';
import { Instagram, Mail, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { BrandLogo } from '../brand/BrandLogo';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const { currentMode } = useTheme();

    const footerLinks = {
        product: [
            { id: 'courses', label: 'Cursos', href: '#courses' },
            { id: 'paths', label: 'Rutas de aprendizaje', href: '#courses' },
            { id: 'certificates', label: 'Certificados', href: '#about' },
            { id: 'demo', label: 'Solicitar demo', href: '#contact' },
        ],
        resources: [
            { id: 'help', label: 'Centro de ayuda', href: '#contact' },
            { id: 'blog', label: 'Blog', href: '#about' },
            { id: 'cases', label: 'Casos de uso', href: '#about' },
        ],
        company: [
            { id: 'about-us', label: 'Sobre Cursorg', href: '#about' },
            { id: 'contact', label: 'Contacto', href: '#contact' },
            { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/cursorg.ve' },
        ],
        legal: [
            { id: 'privacy', label: 'Privacidad', href: '#' },
            { id: 'terms', label: 'Términos', href: '#' },
            { id: 'cookies', label: 'Cookies', href: '#' },
        ],
    };

    const contactInfo = [
        { id: 'email', icon: Mail, text: 'hola@cursorg.ve', href: 'mailto:hola@cursorg.ve' },
        { id: 'location', icon: MapPin, text: 'Venezuela · LATAM', href: '#contact' },
    ];

    return (
        <footer className="palette-surface palette-border border-t mt-auto">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <a href="/" className="inline-flex items-center mb-4" aria-label="Cursorg — Inicio">
                            <BrandLogo
                                variant="full"
                                theme={currentMode === 'dark' ? 'dark' : 'light'}
                                size="md"
                            />
                        </a>
                        <p className="text-paragraph mb-6 max-w-sm">
                            Capacitación corporativa sin barreras. Cursos especializados para equipos,
                            pago en moneda local y certificados verificables.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-6">
                            {contactInfo.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className="flex items-center gap-3 text-paragraph hover:palette-primary transition-colors"
                                    >
                                        <Icon className="w-5 h-5 text-paragraph flex-shrink-0" />
                                        <span className="text-paragraph">{item.text}</span>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            <a
                                href="https://instagram.com/cursorg.ve"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Cursorg en Instagram (@cursorg.ve)"
                                className="w-10 h-10 rounded-lg palette-border border flex items-center justify-center text-paragraph hover:palette-primary hover:border-palette-primary transition-all"
                            >
                                <Instagram className="w-5 h-5 text-paragraph" />
                            </a>
                            <span className="text-paragraph text-sm opacity-80">@cursorg.ve</span>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-h3 font-semibold mb-4">Producto</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-paragraph hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-h3 font-semibold mb-4">Recursos</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-paragraph hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-h3 font-semibold mb-4">Empresa</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        {...(link.id === 'instagram'
                                            ? { target: '_blank', rel: 'noopener noreferrer' }
                                            : {})}
                                        className="text-paragraph hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-h3 font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-paragraph hover:palette-primary transition-colors"
                                        title="Contenido disponible próximamente"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="palette-border border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-paragraph text-center md:text-left">
                            © {currentYear} Cursorg. Todos los derechos reservados.
                        </p>
                        <div className="flex items-center gap-6">
                            <a
                                href="https://instagram.com/cursorg.ve"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-paragraph hover:palette-primary transition-colors"
                            >
                                Instagram
                            </a>
                            <a
                                href="mailto:hola@cursorg.ve"
                                className="text-paragraph hover:palette-primary transition-colors"
                            >
                                hola@cursorg.ve
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
