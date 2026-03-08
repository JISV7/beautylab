import React from 'react';
import { Code2, Github, Twitter, Linkedin, Facebook, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        product: [
            { id: 'courses', label: 'Courses', href: '#courses' },
            { id: 'paths', label: 'Learning Paths', href: '#paths' },
            { id: 'ai-lab', label: 'AI Lab', href: '#ai-lab' },
            { id: 'pricing', label: 'Pricing', href: '#pricing' },
        ],
        resources: [
            { id: 'docs', label: 'Documentation', href: '#docs' },
            { id: 'help', label: 'Help Center', href: '#help' },
            { id: 'community', label: 'Community', href: '#community' },
            { id: 'blog', label: 'Blog', href: '#blog' },
        ],
        company: [
            { id: 'about-us', label: 'About Us', href: '#about' },
            { id: 'careers', label: 'Careers', href: '#careers' },
            { id: 'contact', label: 'Contact', href: '#contact' },
            { id: 'partners', label: 'Partners', href: '#partners' },
        ],
        legal: [
            { id: 'privacy', label: 'Privacy Policy', href: '#privacy' },
            { id: 'terms', label: 'Terms of Service', href: '#terms' },
            { id: 'cookies', label: 'Cookie Policy', href: '#cookies' },
            { id: 'gdpr', label: 'GDPR', href: '#gdpr' },
        ],
    };

    const socialLinks = [
        { id: 'github', icon: Github, href: '#', label: 'GitHub' },
        { id: 'twitter', icon: Twitter, href: '#', label: 'Twitter' },
        { id: 'linkedin', icon: Linkedin, href: '#', label: 'LinkedIn' },
        { id: 'facebook', icon: Facebook, href: '#', label: 'Facebook' },
        { id: 'instagram', icon: Instagram, href: '#', label: 'Instagram' },
        { id: 'youtube', icon: Youtube, href: '#', label: 'YouTube' },
    ];

    const contactInfo = [
        { id: 'email', icon: Mail, text: 'hello@codyn.com', href: 'mailto:hello@codyn.com' },
        { id: 'phone', icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
        { id: 'location', icon: MapPin, text: 'San Francisco, CA', href: '#' },
    ];

    return (
        <footer className="palette-surface palette-border border-t mt-auto">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <a href="/" className="flex items-center gap-2 mb-4">
                            <div className="rounded-lg p-2" style={{ backgroundColor: '#F83A3A' }}>
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-h4-font text-h4-size text-h4-color text-h4-weight font-bold palette-text">Codyn</span>
                        </a>
                        <p className="text-p-font text-p-size text-p-color mb-6 max-w-xs">
                            Master the future of technology with cutting-edge courses in web development,
                            programming, and agentic AI.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-6">
                            {contactInfo.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className="flex items-center gap-3 text-p-font text-p-size palette-text-secondary hover:palette-primary transition-colors"
                                    >
                                        <Icon className="w-4 h-4 text-p-color flex-shrink-0" />
                                        <span className="text-sm text-p-color">{item.text}</span>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={social.id}
                                        href={social.href}
                                        aria-label={social.label}
                                        className="w-10 h-10 rounded-lg palette-border border flex items-center justify-center text-p-size palette-text-secondary hover:palette-primary hover:border-palette-primary transition-all"
                                    >
                                        <Icon className="w-5 h-5 text-p-color" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-p-font text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-p-font text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-p-font text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-p-font text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={link.href}
                                        className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
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
                        <p className="text-p-font text-p-size text-p-color text-center md:text-left">
                            © {currentYear} Codyn. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <a
                                href="#privacy"
                                className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
                            >
                                Privacy
                            </a>
                            <a
                                href="#terms"
                                className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
                            >
                                Terms
                            </a>
                            <a
                                href="#cookies"
                                className="text-p-font text-p-size text-p-color hover:palette-primary transition-colors"
                            >
                                Cookies
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
