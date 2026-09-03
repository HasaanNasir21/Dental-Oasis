import { Inbox } from 'lucide-react'

interface Props {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-dark-600 rounded-full mb-4">
        <Inbox size={32} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
