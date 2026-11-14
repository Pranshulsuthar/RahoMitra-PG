import { X } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { FilterSelect, SearchInput } from '../admin/Filters'
import { dayLabel } from '../../types/communication'
import type { Conversation } from '../../types/communication'

/**
 * SECTION 07 — conversation list sidebar shared by the owner communication
 * console and the student messages page. Owner sees every thread of his own
 * properties; the student only ever receives his single private thread.
 */
interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  search: string
  onSearch: (v: string) => void
  filter: string
  onFilter: (v: string) => void
  filterOptions: Array<{ value: string; label: string }>
  viewer: 'OWNER' | 'STUDENT'
  today: string
  previewFor: (conversationId: string) => string
  emptyTitle: string
  emptyDescription: string
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  search,
  onSearch,
  filter,
  onFilter,
  filterOptions,
  viewer,
  today,
  previewFor,
  emptyTitle,
  emptyDescription,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="space-y-2.5 border-b border-line bg-ivory/50 px-4 py-3.5">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Search student, room or PG…"
        />
        <FilterSelect
          label="Show"
          value={filter}
          onChange={onFilter}
          options={filterOptions}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-ink">{emptyTitle}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{emptyDescription}</p>
            {(search || filter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  onSearch('')
                  onFilter('ALL')
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink transition hover:border-gold/50 hover:bg-gold-soft"
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {conversations.map((c) => {
              const unread = viewer === 'OWNER' ? c.ownerUnread : c.studentUnread
              const active = c.id === activeId
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${
                      active ? 'bg-gold-soft' : 'hover:bg-ivory/70'
                    }`}
                  >
                    <Avatar name={c.studentName} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-ink">
                          {c.studentName}
                        </span>
                        <span className="shrink-0 text-[10.5px] text-muted">
                          {dayLabel(c.lastMessageOn, today)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-muted">
                          Room {c.roomNumber} · {previewFor(c.id)}
                        </span>
                        {unread > 0 && (
                          <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-forest px-1.5 text-[10px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
