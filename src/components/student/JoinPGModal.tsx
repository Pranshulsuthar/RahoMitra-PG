import { useState, type FormEvent } from 'react'
import { KeyRound, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Modal } from '../admin/Modal'
import { Button } from '../common/Button'
import { submitAdmissionCode, type StudentAdmissionRequest } from '../../api/student'

interface JoinPGModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (request: StudentAdmissionRequest) => void
}

export function JoinPGModal({ open, onClose, onSuccess }: JoinPGModalProps) {
  const [code, setCode] = useState('')
  const [roomPreference, setRoomPreference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successRequest, setSuccessRequest] = useState<StudentAdmissionRequest | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await submitAdmissionCode({
        code: code.trim().toUpperCase(),
        roomPreference: roomPreference.trim() || undefined,
      })
      setSuccessRequest(res)
      if (onSuccess) onSuccess(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit admission code'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setRoomPreference('')
    setError(null)
    setSuccessRequest(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleReset}
      title="Join PG with Admission Code"
      subtitle="Enter the unique code provided by your PG owner to submit your admission request."
    >
      {successRequest ? (
        <div className="space-y-5 py-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-soft text-forest">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">Admission Request Submitted!</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Your request for <strong className="text-forest">{successRequest.propertyName}</strong> has been sent to the PG owner for approval.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-ivory/60 p-4 text-left text-xs space-y-1.5">
            <p><span className="text-ink-mute">Code:</span> <strong className="font-mono text-ink">{successRequest.code}</strong></p>
            <p><span className="text-ink-mute">Status:</span> <strong className="text-gold-dark">PENDING OWNER APPROVAL</strong></p>
            <p><span className="text-ink-mute">Location:</span> {successRequest.propertyLocality}, {successRequest.propertyCity}</p>
          </div>
          <Button variant="primary" className="w-full" onClick={handleReset}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="adm-code" className="block text-xs font-semibold text-ink mb-1.5">
              Admission Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                id="adm-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ADM-A1B2C3D4"
                className="form-input pl-10 font-mono text-sm tracking-wider uppercase"
                disabled={isSubmitting}
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-mute">
              Ask your PG owner or warden for their single-use admission code.
            </p>
          </div>

          <div>
            <label htmlFor="room-pref" className="block text-xs font-semibold text-ink mb-1.5">
              Room / Sharing Preference (Optional)
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                id="room-pref"
                type="text"
                value={roomPreference}
                onChange={(e) => setRoomPreference(e.target.value)}
                placeholder="e.g. Single, Double Sharing, or Room 101"
                className="form-input pl-10 text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={handleReset} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || !code.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying code…
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
