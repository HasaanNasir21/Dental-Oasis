import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import { AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Delete',
  isLoading = false,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-red-500/10 rounded-full">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} disabled={isLoading} className="btn-ghost text-sm">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isLoading} className="btn-danger text-sm">
          {isLoading ? <LoadingSpinner size="sm" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
