import React from 'react';
import { Code2, Github, Twitter, Linkedin, Facebook, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        product: [
            { label: 'Courses', href: '#courses' },
            { label: 'Learning Paths', href: '#paths' },
            { label: 'AI Lab', href: '#ai-lab' },
            { label: 'Pricing', href: '#pricing' },
        ],
        resources: [
            { label: 'Documentation', href: '#docs' },
            { label: 'Help Center', href: '#help' },
            { label: 'Community', href: '#community' },
            { label: 'Blog', href: '#blog' },
        ],
        company: [
            { label: 'About Us', href: '#about' },
            { label: 'Careers', href: '#careers' },
            { label: 'Contact', href: '#contact' },
            { label: 'Partners', href: '#partners' },
        ],
        legal: [
            { label: 'Privacy Policy', href: '#privacy' },
            { label: 'Terms of Service', href: '#terms' },
            { label: 'Cookie Policy', href: '#cookies' },
            { label: 'GDPR', href: '#gdpr' },
        ],
    };

    const socialLinks = [
        { icon: Github, href: '#', label: 'GitHub' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Youtube, href: '#', label: 'YouTube' },
    ];

    const contactInfo = [
        { icon: Mail, text: 'hello@codyn.com', href: 'mailto:hello@codyn.com' },
        { icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
        { icon: MapPin, text: 'San Francisco, CA', href: '#' },
    ];

    return (
        <footer className="palette-surface palette-border border-t mt-auto">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <a href="/" className="flex items-center gap-2 mb-4">
                            <div className="palette-primary rounded-lg p-2">
                                <Code2 className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-h4-size text-h4-color text-h4-weight font-bold palette-text">Codyn</span>
                        </a>
                        <p className="text-p-size text-p-color mb-6 max-w-xs">
                            Master the future of technology with cutting-edge courses in web development,
                            programming, and agentic AI.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-6">
                            {contactInfo.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={index}
                                        href={item.href}
                                        className="flex items-center gap-3 text-p-size palette-text-secondary hover:palette-primary transition-colors"
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm">{item.text}</span>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social, index) => {
                                const Icon = social.icon;
                                return (
                                    <a
                                        key={index}
                                        href={social.href}
                                        aria-label={social.label}
                                        className="w-10 h-10 rounded-lg palette-border border flex items-center justify-center text-p-size palette-text-secondary hover:palette-primary hover:border-palette-primary transition-all"
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="footer-link text-sm palette-text-secondary hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="footer-link text-sm palette-text-secondary hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="footer-link text-sm palette-text-secondary hover:palette-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="text-subtitle-size text-subtitle-color text-subtitle-weight font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="footer-link text-sm palette-text-secondary hover:palette-primary transition-colors"
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
                        <p className="text-sm palette-text-secondary text-center md:text-left">
                            © {currentYear} Codyn. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <a
                                href="#privacy"
                                className="text-sm palette-text-secondary hover:palette-primary transition-colors"
                            >
                                Privacy
                            </a>
                            <a
                                href="#terms"
                                className="text-sm palette-text-secondary hover:palette-primary transition-colors"
                            >
                                Terms
                            </a>
                            <a
                                href="#cookies"
                                className="text-sm palette-text-secondary hover:palette-primary transition-colors"
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
