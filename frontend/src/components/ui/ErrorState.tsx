import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-red-500/10 rounded-full mb-4">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-red-300 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm gap-2">
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  )
}
