import React, { useState } from 'react';
import { Send, Mail, MessageSquare, User } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-16 lg:py-24 palette-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Info */}
          <div>
            <h2 className="text-subtitle-font text-subtitle-size text-subtitle-color text-subtitle-weight mb-4">Get in Touch</h2>
            <p className="text-p-font text-p-size text-p-color mb-8">
              Have questions about our courses? Want to learn more about Codyn?
              We're here to help you on your learning journey.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg palette-primary flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-h4-font text-h4-size text-h4-color text-h4-weight mb-1">Email Us</h4>
                  <p className="text-p-font text-p-size text-p-color">support@codyn.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg palette-secondary flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-h4-font text-h4-size text-h4-color text-h4-weight mb-1">Live Chat</h4>
                  <p className="text-p-font text-p-size text-p-color">Available Mon-Fri, 9am-5pm EST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="theme-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="text-p-font text-p-size text-p-color font-medium block mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="theme-input w-full"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-p-font text-p-size text-p-color font-medium block mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="theme-input w-full"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="text-p-font text-p-size text-p-color font-medium block mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="theme-input w-full text-p-color"
                >
                  <option value="" className="text-p-color">Select a subject</option>
                  <option value="courses" className="text-p-color">Course Inquiry</option>
                  <option value="technical" className="text-p-color">Technical Support</option>
                  <option value="partnership" className="text-p-color">Partnership</option>
                  <option value="other" className="text-p-color">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="text-p-font text-p-size text-p-color font-medium block mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="theme-input w-full resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button type="submit" className="theme-button theme-button-primary w-full">
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
