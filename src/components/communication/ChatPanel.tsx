import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, X } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { EmptyState } from '../common/EmptyState'
import { dayLabel, fmtDate } from '../../types/communication'
import type { ChatMessage, Conversation } from '../../types/communication'

/**
 * SECTION 07 — private 1:1 chat window shared by the owner communication
 * console and the student messages page. Local demo state only: pressing Send
 * appends to in-memory React state, nothing is delivered over a network.
 */
interface ChatPanelProps {
  conversation: Conversation | null
  messages: ChatMessage[]
  viewer: 'OWNER' | 'STUDENT'
  counterpartName: string
  counterpartMeta: string
  onSend: (text: string) => void
  onClose: () => void
  today: string
}

export function ChatPanel({
  conversation,
  messages,
  viewer,
  counterpartName,
  counterpartMeta,
  onSend,
  onClose,
  today,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const [enterToSend, setEnterToSend] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, conversation?.id])

  if (!conversation) {
    return (
      <div className="flex h-full min-h-[26rem] items-center justify-center rounded-3xl border border-line bg-white shadow-card">
        <EmptyState
          icon={<MessageSquare size={40} strokeWidth={1.4} />}
          title="No conversation selected"
          description="Pick a student from the list on the left to open the private chat (demo)."
        />
      </div>
    )
  }

  const send = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSend(trimmed)
    setDraft('')
    inputRef.current?.focus()
  }

  let lastDay = ''

  return (
    <div className="flex h-full min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      {/* header */}
      <header className="flex items-center gap-3 border-b border-line bg-ivory/60 px-4 py-3 sm:px-5">
        <Avatar name={counterpartName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{counterpartName}</p>
          <p className="truncate text-[11.5px] text-muted">{counterpartMeta}</p>
        </div>
        <span className="hidden rounded-full border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-muted sm:inline">
          Private chat · demo
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation"
          className="rounded-full p-1.5 text-muted transition hover:bg-white hover:text-ink sm:hidden"
        >
          <X size={16} />
        </button>
      </header>

      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.length === 0 && (
          <EmptyState
            icon={<MessageSquare size={36} strokeWidth={1.4} />}
            title="No messages yet"
            description={`Start the conversation with ${counterpartName} (demo).`}
          />
        )}

        {messages.map((m) => {
          const showDay = m.date !== lastDay
          lastDay = m.date
          const mine = m.sender === viewer

          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {dayLabel(m.date, today)}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}

              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 sm:max-w-[70%] ${
                    mine
                      ? 'rounded-br-md bg-forest text-white'
                      : 'rounded-bl-md border border-line bg-ivory/70 text-ink'
                  }`}
                >
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  <p
                    className={`mt-1.5 text-[10.5px] ${
                      mine ? 'text-white/70' : 'text-muted'
                    }`}
                  >
                    {fmtDate(m.date)} · {m.at}
                    {mine && (m.read ? ' · read' : '')}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <footer className="border-t border-line bg-white px-4 py-3 sm:px-5">
        <div className="flex items-end gap-2">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={`Message ${counterpartName.split(' ')[0]}… (demo)`}
            aria-label="Message text"
            maxLength={500}
            className="form-input flex-1 rounded-full px-4 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send message"
            title="Send message (demo)"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-forest-dark transition-all hover:bg-gold-dark hover:text-ivory disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={15} aria-hidden />
          </button>
        </div>
        <label className="mt-2 flex items-center gap-1.5 text-[10.5px] text-muted">
          <input
            type="checkbox"
            checked={enterToSend}
            onChange={(e) => setEnterToSend(e.target.checked)}
            className="accent-gold"
          />
          Press Enter to send (demo — no real message leaves this browser)
        </label>
      </footer>
    </div>
  )
}
