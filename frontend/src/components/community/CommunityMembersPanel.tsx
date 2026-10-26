import { Users, X } from 'lucide-react';
import type { CommunityMember } from '../../lib/communityApi';
import { avatarTone, getInitials } from './communityUi';

interface CommunityMembersPanelProps {
  members: CommunityMember[];
  onlineUserIds: Set<string>;
  currentUserId?: string;
  onClose?: () => void;
}

export function CommunityMembersPanel({
  members,
  onlineUserIds,
  currentUserId,
  onClose,
}: CommunityMembersPanelProps) {
  const orderedMembers = [...members].sort((first, second) => {
    const firstOnline = onlineUserIds.has(first.id);
    const secondOnline = onlineUserIds.has(second.id);
    if (firstOnline !== secondOnline) return firstOnline ? -1 : 1;
    return first.full_name.localeCompare(second.full_name, 'es');
  });
  const onlineCount = onlineUserIds.size;

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-palette-border bg-palette-surface">
      <div className="flex items-start justify-between gap-3 border-b border-palette-border px-5 py-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-link">
            <Users className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-bold text-paragraph">Personas</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            {members.length} en tu empresa
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-paragraph transition-colors hover:bg-palette-border"
            aria-label="Cerrar personas"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="border-b border-palette-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#55C7E8]/40 bg-palette-background">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2B9CC1]" />
            <span className="absolute inset-0 animate-ping rounded-full border border-[#55C7E8]/20" />
          </span>
          <div>
            <p className="text-2xl font-bold leading-none text-paragraph">
              {onlineCount}
            </p>
            <p className="mt-1 text-xs text-muted">
              {onlineCount === 1 ? 'persona en línea' : 'personas en línea'}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        <p className="px-2 pb-2 text-xs font-semibold text-muted">
          Equipo de la comunidad
        </p>
        <ul className="space-y-0.5" aria-label="Miembros de la comunidad">
          {orderedMembers.map((member) => {
            const isOnline = onlineUserIds.has(member.id);
            const isCurrentUser = member.id === currentUserId;
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5"
              >
                <div className="relative flex-shrink-0">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${avatarTone(member.id)}`}
                  >
                    {getInitials(member.full_name)}
                  </span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-palette-surface ${
                      isOnline ? 'bg-[#2B9CC1]' : 'bg-slate-300'
                    }`}
                    title={isOnline ? 'En línea' : 'Sin conexión'}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-paragraph">
                    {member.full_name}
                    {isCurrentUser ? (
                      <span className="ml-1.5 text-[10px] font-medium text-muted">
                        tú
                      </span>
                    ) : null}
                  </p>
                  <p
                    className="truncate text-[11px] text-muted"
                    title={member.email}
                  >
                    {member.department_name ?? member.email}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-palette-border px-5 py-3">
        <p className="flex items-center gap-2 text-[10px] leading-4 text-muted">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#55C7E8]" />
          La presencia se actualiza en tiempo real.
        </p>
      </div>
    </aside>
  );
}
