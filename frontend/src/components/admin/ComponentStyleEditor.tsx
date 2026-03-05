import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface StyleField {
    key: string;
    label: string;
    type: 'color' | 'text' | 'select';
    options?: string[];
}

interface ComponentStyleEditorProps {
    title: string;
    fields: StyleField[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    defaultExpanded?: boolean;
}

export const ComponentStyleEditor: React.FC<ComponentStyleEditorProps> = ({
    title,
    fields,
    values,
    onChange,
    defaultExpanded = false,
}) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
        <div className="theme-surface theme-border border rounded-xl overflow-hidden mb-4">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 theme-text-base font-medium hover:bg-[var(--theme-border-value)] transition-colors"
            >
                <span>{title}</span>
                {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                ) : (
                    <ChevronRight className="w-5 h-5" />
                )}
            </button>

            {/* Fields */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-3 border-t theme-border">
                    {fields.map((field) => (
                        <div key={field.key} className="flex items-center justify-between py-2">
                            <label className="text-sm theme-text-secondary">{field.label}</label>
                            {field.type === 'color' ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs theme-text-secondary font-mono">
                                        {values[field.key]}
                                    </span>
                                    <input
                                        type="color"
                                        value={values[field.key]}
                                        onChange={(e) => onChange(field.key, e.target.value)}
                                        className="w-10 h-8 rounded border theme-border cursor-pointer"
                                    />
                                </div>
                            ) : field.type === 'select' ? (
                                <select
                                    value={values[field.key]}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                    className="text-sm theme-surface theme-border border rounded px-2 py-1 theme-text-base"
                                >
                                    {field.options?.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={values[field.key]}
                                    onChange={(e) => onChange(field.key, e.target.value)}
                                    className="text-sm theme-surface theme-border border rounded px-2 py-1 theme-text-base w-32"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
