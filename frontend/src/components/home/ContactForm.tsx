import React, { useState } from 'react';
import { Building2, Mail, MessageSquare, Send, User } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Solicitud de contacto enviada:', formData);
    alert(
      'Gracias por escribirnos. Recibimos tu solicitud y te contactaremos en horario laboral LATAM.',
    );
    setFormData({ name: '', email: '', company: '', subject: '', message: '' });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-16 lg:py-24 palette-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact information */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--palette-secondary)] mb-3">
              Contacto
            </p>
            <h2 className="text-h2 mb-4">Hablemos de tu equipo</h2>
            <p className="text-paragraph text-lg opacity-80 mb-8 max-w-xl">
              Cuéntanos qué necesita tu empresa y te mostraremos cómo Cursorg puede
              ayudarte a estructurar una capacitación clara, medible y adaptada a tu
              operación.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--palette-secondary)]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[var(--palette-secondary)]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-h5 mb-1">Escríbenos</h3>
                  <a
                    href="mailto:hola@cursorg.ve"
                    className="text-paragraph hover:text-[var(--palette-secondary)] transition-colors"
                  >
                    hola@cursorg.ve
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--palette-secondary)]/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare
                    className="w-5 h-5 text-[var(--palette-secondary)]"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-h5 mb-1">Atención</h3>
                  <p className="text-paragraph opacity-75">Lunes a viernes · horario LATAM</p>
                </div>
              </div>

              <div className="rounded-2xl border palette-border palette-surface p-5">
                <p className="text-sm font-semibold mb-1">¿Ya eres cliente?</p>
                <p className="text-paragraph text-sm opacity-70">
                  Para consultas de compra o facturación, escríbenos a{' '}
                  <a
                    href="mailto:soporte@cursorg.ve"
                    className="font-semibold text-[var(--palette-secondary)] hover:underline"
                  >
                    soporte@cursorg.ve
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="theme-card !rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="text-paragraph font-medium block mb-2">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--palette-secondary)]" aria-hidden="true" />
                    Nombre y apellido
                  </span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="theme-input w-full"
                  placeholder="Ej. María Pérez"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-paragraph font-medium block mb-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--palette-secondary)]" aria-hidden="true" />
                    Correo corporativo
                  </span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="theme-input w-full"
                  placeholder="maria@empresa.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="company" className="text-paragraph font-medium block mb-2">
                  <span className="flex items-center gap-2">
                    <Building2
                      className="w-4 h-4 text-[var(--palette-secondary)]"
                      aria-hidden="true"
                    />
                    Empresa
                  </span>
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="theme-input w-full"
                  placeholder="Nombre de tu empresa"
                  autoComplete="organization"
                />
              </div>

              <div>
                <label htmlFor="subject" className="text-paragraph font-medium block mb-2">
                  ¿Qué necesitas?
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="theme-input w-full text-paragraph"
                >
                  <option value="" className="text-paragraph">
                    Selecciona una opción
                  </option>
                  <option value="demo" className="text-paragraph">
                    Solicitar una demo
                  </option>
                  <option value="courses" className="text-paragraph">
                    Información sobre cursos
                  </option>
                  <option value="pilot" className="text-paragraph">
                    Plan piloto para mi empresa
                  </option>
                  <option value="support" className="text-paragraph">
                    Soporte de compra o facturación
                  </option>
                  <option value="other" className="text-paragraph">
                    Otro
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="text-paragraph font-medium block mb-2">
                  Cuéntanos un poco más
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="theme-input w-full resize-none"
                  placeholder="¿Cuántos colaboradores quieres capacitar? ¿Qué objetivos tiene tu equipo?"
                />
              </div>

              <button type="submit" className="theme-button theme-button-primary w-full">
                <span>Enviar solicitud</span>
                <Send className="w-4 h-4 decorator-color" aria-hidden="true" />
              </button>

              <p className="text-paragraph text-xs opacity-60 text-center">
                Te responderemos en horario laboral LATAM.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
