import type { AppointmentStatus } from '../../types'
import { getStatusLabel, getStatusColors } from '../../utils/statusHelpers'

interface Props {
  status: AppointmentStatus
  className?: string
}

export default function StatusBadge({ status, className = '' }: Props) {
  return (
    <span className={`badge text-xs font-semibold ${getStatusColors(status)} ${className}`}>
      {getStatusLabel(status)}
    </span>
  )
}
