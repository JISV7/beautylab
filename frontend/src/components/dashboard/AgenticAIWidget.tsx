import React, { useState } from 'react';
import { Sparkles, Send, Zap, Bot, Lightbulb } from 'lucide-react';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

interface AgenticAIWidgetProps {
    onPromptSubmit?: (prompt: string) => void;
}

export const AgenticAIWidget: React.FC<AgenticAIWidgetProps> = ({ onPromptSubmit }) => {
    const [prompt, setPrompt] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: 'assistant',
            content: 'Hello! I\'m your AI Study Assistant. Ask me anything about your courses, get explanations, or request study tips!',
        },
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: prompt,
        };

        setMessages((prev) => [...prev, userMessage]);
        setPrompt('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Great question! Based on your current progress in Web Development, I recommend focusing on React Hooks next. Would you like me to explain useEffect or useState in more detail?',
            };
            setMessages((prev) => [...prev, aiMessage]);
            setIsTyping(false);
            onPromptSubmit?.(prompt);
        }, 1500);
    };

    const quickPrompts = [
        { id: 'explain', icon: Zap, text: 'Explain React Hooks', prompt: 'Can you explain React Hooks in simple terms?' },
        { id: 'study-tips', icon: Bot, text: 'Study Tips', prompt: 'What are some effective study techniques for programming?' },
        { id: 'project-ideas', icon: Lightbulb, text: 'Project Ideas', prompt: 'Suggest a beginner project to practice JavaScript' },
    ];

    return (
        <div className="dashboard-ai-widget rounded-2xl p-6 mb-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl theme-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="dashboard-ai-widget-title text-xl font-bold">
                        AI Study Assistant
                    </h2>
                    <p className="dashboard-ai-widget-text text-sm theme-text-secondary">
                        Your personal agentic AI helper
                    </p>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="theme-surface rounded-xl p-4 mb-4 max-h-64 overflow-y-auto">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`mb-4 last:mb-0 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                    >
                        <div
                            className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${
                                message.role === 'user'
                                    ? 'theme-primary text-white'
                                    : 'theme-border theme-text-base'
                            }`}
                        >
                            <p className="text-sm">{message.content}</p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="text-left">
                        <div className="inline-block rounded-2xl px-4 py-2 theme-border">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 theme-text-secondary rounded-full animate-bounce" />
                                <span className="w-2 h-2 theme-text-secondary rounded-full animate-bounce delay-100" />
                                <span className="w-2 h-2 theme-text-secondary rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
                {quickPrompts.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setPrompt(item.prompt)}
                            className="flex items-center gap-2 px-3 py-2 theme-surface theme-border border rounded-lg text-sm theme-text-secondary hover:theme-primary hover:text-white transition-colors"
                        >
                            <Icon className="w-4 h-4" />
                            {item.text}
                        </button>
                    );
                })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask anything about your studies..."
                    className="flex-1 px-4 py-3 rounded-xl theme-surface theme-border border theme-text-base placeholder-[var(--theme-text-secondary-value)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary-value)]"
                />
                <button
                    type="submit"
                    disabled={!prompt.trim() || isTyping}
                    className="theme-primary text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Send
                </button>
            </form>
        </div>
    );
};
