import { useRef, useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';

interface SendResult {
  ok: boolean;
  error?: string;
}

interface CommunityComposerProps {
  roomName: string;
  onSend: (content: string) => Promise<SendResult>;
  onTyping: () => void;
  typingLabel: string | null;
}

const MAX_LENGTH = 2000;
const NEAR_LIMIT = 1800;

export function CommunityComposer({
  roomName,
  onSend,
  onTyping,
  typingLabel,
}: CommunityComposerProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 112)}px`;
  };

  const handleSubmit = async () => {
    const content = value.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    try {
      const result = await onSend(content);
      if (result.ok) {
        setValue('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        setError(result.error ?? 'No se pudo enviar el mensaje.');
      }
    } catch {
      setError('No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-palette-border bg-palette-surface px-3 py-3 sm:px-6 sm:py-4">
      <form
        className="mx-auto max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {typingLabel ? (
          <p
            className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted"
            aria-live="polite"
          >
            <span className="flex items-end gap-0.5" aria-hidden="true">
              <span className="h-1 w-1 animate-bounce rounded-full bg-[#55C7E8] [animation-delay:-200ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-[#55C7E8] [animation-delay:-100ms]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-[#55C7E8]" />
            </span>
            {typingLabel}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-600"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="community-message" className="sr-only">
              Escribe un mensaje en {roomName}
            </label>
            <textarea
              ref={textareaRef}
              id="community-message"
              name="message"
              rows={1}
              maxLength={MAX_LENGTH}
              disabled={sending}
              value={value}
              placeholder={`Escribe en ${roomName}…`}
              onChange={(event) => {
                const nextValue = event.target.value;
                setValue(nextValue);
                if (error) setError(null);
                resizeTextarea();
                if (nextValue.trim()) onTyping();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              className="theme-input block max-h-28 min-h-[44px] w-full resize-none rounded-xl border-palette-border bg-palette-background py-2.5 text-sm leading-6"
              aria-describedby="community-composer-help"
            />
          </div>
          <button
            type="submit"
            disabled={sending || value.trim().length === 0}
            className="theme-button theme-button-primary h-11 rounded-xl px-4 disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={sending ? 'Enviando mensaje' : 'Enviar mensaje'}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {sending ? 'Enviando…' : 'Enviar'}
            </span>
          </button>
        </div>

        <div
          id="community-composer-help"
          className="mt-1.5 flex items-center justify-between gap-3 px-1"
        >
          <p className="hidden text-[10px] text-muted sm:block">
            Enter envía. Shift + Enter agrega una línea.
          </p>
          <span
            className={`ml-auto text-[10px] tabular-nums ${
              value.length >= NEAR_LIMIT
                ? 'font-semibold text-amber-600'
                : 'text-muted'
            }`}
          >
            {value.length >= NEAR_LIMIT
              ? `${value.length} / ${MAX_LENGTH}`
              : ''}
          </span>
        </div>
      </form>
    </div>
  );
}
