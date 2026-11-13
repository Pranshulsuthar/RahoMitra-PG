import { useMemo, useState } from 'react'
import { Check, ClipboardCopy, KeyRound, RefreshCw, Send, X } from 'lucide-react'
import { useOwnerStore } from '../../context/OwnerStore'
import { StatusBadge } from '../admin/StatusBadge'
import { FormSelect } from './FormInput'
import { cn } from '../../utils/cn'

const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
]

/**
 * Admission code generator + code list.
 * IMPORTANT: codes are locally simulated — never secure, server-validated,
 * single-use or actually distributed.
 */
export function AdmissionCodeGenerator({ propertyIds }: { propertyIds: string[] }) {
  const {
    properties,
    rooms,
    codes,
    selectedPropertyId,
    generateCode,
    revokeCode,
    simulateIncomingRequest,
    pushToast,
  } = useOwnerStore()

  const scopedProperties = useMemo(
    () => properties.filter((p) => propertyIds.includes(p.id)),
    [properties, propertyIds],
  )

  const [propertyId, setPropertyId] = useState(
    selectedPropertyId !== 'ALL' ? selectedPropertyId : (scopedProperties[0]?.id ?? ''),
  )
  const [roomPreference, setRoomPreference] = useState('')
  const [expiry, setExpiry] = useState('7')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const propertyRooms = rooms.filter((r) => r.propertyId === propertyId)
  const scopedCodes = codes.filter((c) => propertyIds.includes(c.propertyId))

  const generate = () => {
    const code = generateCode({
      propertyId,
      roomPreference,
      expiresInDays: Number(expiry),
    })
    if (code) setRoomPreference('')
  }

  const copy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800)
      pushToast(`Code ${code} copied — share it with the student (demo).`, 'info')
    } catch {
      pushToast('Copy not available in this browser — note the code manually.', 'error')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[23rem_minmax(0,1fr)]">
      {/* ------------------------------------------------------ generator */}
      <section className="h-fit min-w-0 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2.5 text-base sm:text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold-dark">
            <KeyRound className="h-4.5 w-4.5" aria-hidden />
          </span>
          Generate admission code
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">
          Frontend simulation only — codes are <strong className="text-gold-dark">not</strong>{' '}
          secure, server-validated or actually sent anywhere.
        </p>

        <div className="mt-5 space-y-4">
          <FormSelect
            id="code-property"
            label="PG property"
            required
            value={propertyId}
            onChange={(value) => {
              setPropertyId(value)
              setRoomPreference('')
            }}
            options={scopedProperties.map((p) => ({ value: p.id, label: p.name }))}
            hint="Share this code with the student offline or directly."
          />
          <FormSelect
            id="code-room"
            label="Room preference (optional)"
            value={roomPreference}
            onChange={setRoomPreference}
            options={[
              { value: '', label: 'No preference — allocate any free bed' },
              ...propertyRooms.map((r) => ({
                value: r.id,
                label: `Room ${r.number} · ${r.beds.filter((b) => b.status === 'AVAILABLE').length} free`,
              })),
            ]}
          />
          <FormSelect
            id="code-expiry"
            label="Code expiry"
            value={expiry}
            onChange={setExpiry}
            options={EXPIRY_OPTIONS}
          />
          <button
            type="button"
            onClick={generate}
            disabled={!propertyId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Generate code (demo)
          </button>
        </div>
      </section>

      {/* ---------------------------------------------------- code list */}
      <section className="min-w-0 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg">Admission codes</h2>
          <span className="rounded-full bg-ivory px-3 py-1 text-[11px] font-bold text-ink-soft">
            {scopedCodes.length} total · demo
          </span>
        </div>

        {scopedCodes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-ivory/40 px-4 py-8 text-center text-sm text-ink-mute">
            No admission codes yet — generate one on the left.
          </p>
        ) : (
          <ul className="space-y-3">
            {scopedCodes.map((code) => {
              const property = properties.find((p) => p.id === code.propertyId)
              const room = rooms.find((r) => r.id === code.roomPreference)
              const isUsable = code.status === 'ACTIVE'
              return (
                <li
                  key={code.id}
                  className={cn(
                    'rounded-2xl border px-4 py-3.5 transition-colors',
                    isUsable ? 'border-line bg-white hover:border-gold/40' : 'border-line bg-ivory/50 opacity-75',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <code className="rounded-lg border border-dashed border-forest/40 bg-forest-soft px-2.5 py-1 font-mono text-[13px] font-bold tracking-wider text-forest">
                          {code.code}
                        </code>
                        <StatusBadge status={code.status} />
                      </div>
                      <p className="mt-1.5 truncate text-xs text-ink-mute">
                        {property?.name ?? 'Unknown property'} ·{' '}
                        {room ? `room ${room.number}` : 'any free bed'} · expires{' '}
                        <span className="font-semibold text-ink-soft">{code.expiresOn}</span> ·
                        created {code.createdOn}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copy(code.code, code.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-forest/25 px-3.5 py-2 text-[11.5px] font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
                      >
                        {copiedId === code.id ? (
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {copiedId === code.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => simulateIncomingRequest(code.id)}
                        disabled={!isUsable}
                        title="Simulates a student submitting this code (demo step 3–4)"
                        className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-2 text-[11.5px] font-bold text-forest-dark transition-colors hover:bg-gold-dark hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" aria-hidden />
                        Simulate request
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeCode(code.id)}
                        disabled={!isUsable}
                        className="inline-flex items-center gap-1.5 rounded-full border border-danger/35 px-3.5 py-2 text-[11.5px] font-bold text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                        Revoke
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
