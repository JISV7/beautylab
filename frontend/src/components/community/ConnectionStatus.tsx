import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { CommunitySocketStatus } from './useCommunitySocket';

interface ConnectionStatusProps {
  status: CommunitySocketStatus;
  onReconnect: () => void;
}

const statusCopy: Record<CommunitySocketStatus, string> = {
  connected: 'Conectado',
  connecting: 'Reconectando',
  disconnected: 'Sin conexión',
};

export function ConnectionStatus({
  status,
  onReconnect,
}: ConnectionStatusProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border border-palette-border bg-palette-surface px-3 py-1.5 text-xs font-semibold text-paragraph shadow-[0_8px_24px_-20px_rgba(13,43,77,0.7)]"
    >
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center">
        {isConnected ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55C7E8] opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2B9CC1]" />
          </>
        ) : isConnecting ? (
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
        )}
      </span>
      <span>{statusCopy[status]}</span>
      {isConnected ? (
        <Wifi className="h-3.5 w-3.5 text-[#1E5AA8]" aria-hidden="true" />
      ) : isConnecting ? null : (
        <button
          type="button"
          onClick={onReconnect}
          className="inline-flex items-center gap-1 rounded-full text-link focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Reintentar conexión en tiempo real"
        >
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
