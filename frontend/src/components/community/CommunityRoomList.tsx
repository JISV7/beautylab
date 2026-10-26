import {
  Hash,
  MessagesSquare,
  Plus,
  RadioTower,
  X,
} from 'lucide-react';
import type { ChatRoom } from '../../lib/communityApi';

interface CommunityRoomListProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  memberCount: number;
  onSelect: (room: ChatRoom) => void;
  onCreate: () => void;
  onClose?: () => void;
}

const roomPreview = (room: ChatRoom): string => {
  if (room.last_message) {
    return `${room.last_message.user_name}: ${room.last_message.content}`;
  }
  return room.description ?? 'Sin mensajes todavía';
};

export function CommunityRoomList({
  rooms,
  activeRoomId,
  memberCount,
  onSelect,
  onCreate,
  onClose,
}: CommunityRoomListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-palette-primary text-on-primary">
      <div className="relative overflow-hidden px-5 pb-5 pt-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 top-8 h-32 w-32 rounded-full border border-[#55C7E8]/25"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 text-[#8DE3F5]">
                <RadioTower className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-medium">Sala de operaciones</span>
              </div>
              <h2 className="text-xl font-bold text-white">Canales</h2>
              <p className="mt-1 max-w-[200px] text-sm leading-5 text-white/60">
                Conversaciones internas de tu empresa.
              </p>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-white"
                aria-label="Cerrar canales"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/10" aria-hidden="true" />

      <nav
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]"
        aria-label="Canales de la comunidad"
      >
        {rooms.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessagesSquare
              className="mx-auto h-7 w-7 text-white/30"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-white/60">
              Todavía no hay canales en tu empresa.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {rooms.map((room) => {
              const isActive = room.id === activeRoomId;
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(room)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex w-full items-start gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-white/[0.11]'
                        : 'hover:bg-white/[0.06] focus-visible:bg-white/[0.06]'
                    }`}
                  >
                    {isActive ? (
                      <span
                        className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-[#55C7E8]"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#55C7E8] text-[#0D2B4D]'
                          : 'bg-white/10 text-white/65 group-hover:text-white'
                      }`}
                    >
                      <Hash className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${
                            isActive ? 'text-white' : 'text-white/85'
                          }`}
                        >
                          {room.name}
                        </span>
                        {room.message_count > 0 ? (
                          <span
                            className="flex-shrink-0 text-[10px] font-medium tabular-nums text-white/35"
                            title={`${room.message_count} mensajes`}
                          >
                            {room.message_count}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-xs leading-4 text-white/55"
                        title={roomPreview(room)}
                      >
                        {roomPreview(room)}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        {room.online_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#8DE3F5]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#55C7E8]" />
                            {room.online_count} en línea
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30">
                            Sin conexiones activas
                          </span>
                        )}
                        {room.description ? (
                          <span
                            className="min-w-0 truncate text-[10px] text-white/30"
                            title={room.description}
                          >
                            {room.description}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#55C7E8] px-3 py-2.5 text-sm font-semibold text-[#0D2B4D] transition-colors hover:bg-[#8DE3F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo canal
        </button>
        <p className="mt-3 px-1 text-[10px] leading-4 text-white/40">
          {rooms.length} {rooms.length === 1 ? 'canal' : 'canales'} ·{' '}
          {memberCount} {memberCount === 1 ? 'persona' : 'personas'} en el
          equipo
        </p>
      </div>
    </div>
  );
}
