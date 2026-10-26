import { useEffect, useRef, useState } from 'react';
import { Hash, Loader2, X } from 'lucide-react';
import {
  communityApi,
  getApiErrorMessage,
  type ChatRoom,
} from '../../lib/communityApi';

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: ChatRoom) => void;
}

export function CreateRoomDialog({
  open,
  onClose,
  onCreated,
}: CreateRoomDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setError(null);
    setSubmitting(false);
    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError('Escribe un nombre de al menos 2 caracteres.');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const room = await communityApi.createRoom({
        name: cleanName,
        description: description.trim() || null,
      });
      onCreated(room);
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'No se pudo crear el canal. Intenta de nuevo.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07111F]/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-palette-border bg-palette-background shadow-2xl sm:rounded-2xl"
      >
        <div className="h-1 bg-[#55C7E8]" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-link">
              <Hash className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold">Nuevo espacio</span>
            </div>
            <h2
              id="create-room-title"
              className="text-xl font-bold text-paragraph"
            >
              Crear un canal
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted">
              Reúne a tu equipo alrededor de un tema, proyecto o proceso.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-paragraph transition-colors hover:bg-palette-surface disabled:opacity-50"
            aria-label="Cerrar creación de canal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div>
            <label
              htmlFor="room-name"
              className="mb-1.5 block text-xs font-semibold text-paragraph"
            >
              Nombre del canal
            </label>
            <input
              ref={nameInputRef}
              id="room-name"
              value={name}
              maxLength={120}
              disabled={submitting}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Equipo de ventas"
              className="theme-input w-full py-2.5 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="room-description"
              className="mb-1.5 block text-xs font-semibold text-paragraph"
            >
              Descripción <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              id="room-description"
              value={description}
              maxLength={500}
              rows={3}
              disabled={submitting}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="¿Para qué usará el equipo este canal?"
              className="theme-input w-full resize-none py-2.5 text-sm leading-6"
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="theme-button theme-button-secondary py-2 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || name.trim().length < 2}
              className="theme-button theme-button-primary py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {submitting ? 'Creando…' : 'Crear canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
