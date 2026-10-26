import { Fragment, useEffect, useRef } from 'react';
import { MessagesSquare, RefreshCw } from 'lucide-react';
import type { ChatMessage } from '../../lib/communityApi';
import {
  avatarTone,
  formatDateLabel,
  formatMessageTime,
  getInitials,
  isGroupedWithPrevious,
  isSameCalendarDay,
} from './communityUi';

interface CommunityMessageListProps {
  roomName: string;
  messages: ChatMessage[];
  currentUserId?: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CommunityMessageList({
  roomName,
  messages,
  currentUserId,
  loading,
  error,
  onRetry,
}: CommunityMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const frame = window.requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [latestMessageId, roomName, loading]);

  if (loading) {
    return (
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7"
        aria-busy="true"
        aria-label="Cargando mensajes"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className={`flex animate-pulse gap-3 ${
                item % 2 === 1 ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="h-9 w-9 flex-shrink-0 rounded-full bg-palette-surface" />
              <div
                className={`w-full max-w-md space-y-2 ${
                  item % 2 === 1 ? 'items-end' : ''
                }`}
              >
                <div className="h-2.5 w-24 rounded-full bg-palette-surface" />
                <div className="h-12 w-full rounded-2xl bg-palette-surface" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-paragraph">
            No pudimos cargar los mensajes
          </h3>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="theme-button theme-button-secondary mt-4"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-palette-surface text-link">
            <span
              className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#55C7E8]"
              aria-hidden="true"
            />
            <MessagesSquare className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-paragraph">
            Sé el primero en escribir…
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Este canal todavía está en silencio. Comparte una idea, una duda o
            un avance con el equipo en {roomName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 sm:px-7 [scrollbar-color:var(--palette-border)_transparent] [scrollbar-width:thin]"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label={`Mensajes de ${roomName}`}
    >
      <ol className="mx-auto max-w-3xl">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showDate =
            !previous ||
            !isSameCalendarDay(previous.created_at, message.created_at);
          const grouped = isGroupedWithPrevious(message, previous);
          const isOwn = message.user_id === currentUserId;

          return (
            <Fragment key={message.id}>
              {showDate ? (
                <li
                  className="flex items-center gap-3 py-5"
                  aria-label={`Mensajes de ${formatDateLabel(message.created_at)}`}
                >
                  <span className="h-px flex-1 bg-palette-border" />
                  <span className="rounded-full border border-palette-border bg-palette-surface px-3 py-1 text-[11px] font-semibold text-muted">
                    {formatDateLabel(message.created_at)}
                  </span>
                  <span className="h-px flex-1 bg-palette-border" />
                </li>
              ) : null}

              <li
                className={`flex w-full gap-2.5 sm:gap-3 ${
                  isOwn ? 'flex-row-reverse' : ''
                } ${grouped ? 'mt-1' : 'mt-3'}`}
              >
                <div className="w-9 flex-shrink-0">
                  {!grouped ? (
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold ${
                        isOwn
                          ? 'bg-palette-primary text-on-primary'
                          : avatarTone(message.user_id)
                      }`}
                      aria-hidden="true"
                    >
                      {getInitials(message.user_name)}
                    </span>
                  ) : null}
                </div>

                <div
                  className={`flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%] lg:max-w-[68%] ${
                    isOwn ? 'items-end' : 'items-start'
                  }`}
                >
                  {!grouped ? (
                    <div
                      className={`mb-1.5 flex items-center gap-2 px-1 ${
                        isOwn ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span className="truncate text-xs font-semibold text-paragraph">
                        {message.user_name}
                      </span>
                      {isOwn ? (
                        <span className="rounded-full bg-palette-surface px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                          Tú
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    className={`w-full px-3.5 py-2.5 shadow-[0_10px_30px_-28px_rgba(13,43,77,0.8)] ${
                      isOwn
                        ? 'rounded-2xl rounded-tr-md bg-palette-secondary text-on-secondary'
                        : 'rounded-2xl rounded-tl-md border border-palette-border bg-palette-surface'
                    }`}
                  >
                    <p
                      className={`whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere] ${
                        isOwn ? 'text-on-secondary' : 'text-paragraph'
                      }`}
                    >
                      {message.content}
                    </p>
                    <span
                      className={`mt-1 block text-right text-[10px] tabular-nums ${
                        isOwn ? 'text-on-secondary opacity-70' : 'text-muted'
                      }`}
                      title={formatDateLabel(message.created_at)}
                    >
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
