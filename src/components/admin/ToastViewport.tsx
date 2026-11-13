import { useAdminStore } from '../../context/AdminStore'
import { ToastStack } from '../common/ToastStack'

/** Stacked toast viewport for the Super Admin panel (auto-dismissing). */
export function ToastViewport() {
  const { toasts, dismissToast } = useAdminStore()
  return <ToastStack toasts={toasts} onDismiss={dismissToast} />
}
