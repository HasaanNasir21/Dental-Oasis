import type { AppointmentStatus } from '../types'

export function getStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'PENDING':    return 'Pending'
    case 'CONTACTED':  return 'Contacted'
    case 'CONFIRMED':  return 'Confirmed'
    case 'COMPLETED':  return 'Completed'
    case 'CANCELLED':  return 'Cancelled'
    case 'NO_SHOW':    return 'No Show'
    default:           return status
  }
}

export function getStatusColors(status: AppointmentStatus): string {
  switch (status) {
    case 'PENDING':    return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    case 'CONTACTED':  return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'CONFIRMED':  return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'COMPLETED':  return 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
    case 'CANCELLED':  return 'bg-red-500/20 text-red-300 border border-red-500/30'
    case 'NO_SHOW':    return 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
    default:           return 'bg-gray-500/20 text-gray-300'
  }
}
