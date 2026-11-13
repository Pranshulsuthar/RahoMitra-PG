import { useOwnerStore } from '../../context/OwnerStore'
import { ToastStack } from '../common/ToastStack'

/** Stacked toast viewport for the PG Owner dashboard (auto-dismissing). */
export function OwnerToastViewport() {
  const { toasts, dismissToast } = useOwnerStore()
  return <ToastStack toasts={toasts} onDismiss={dismissToast} />
}
