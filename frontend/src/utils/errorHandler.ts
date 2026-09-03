import axios from 'axios'

export function parseApiError(error: unknown): string {
  if (typeof error === 'string') return error

  if (error instanceof Error) {
    // Network/connection error set by our interceptor
    if (error.message.includes('Unable to connect')) return error.message
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data?.message) return data.message
    if (error.response?.status === 401) return 'Your session has expired. Please login again.'
    if (error.response?.status === 403) return 'Access denied.'
    if (error.response?.status === 404) return 'Resource not found.'
    if (error.response?.status === 429) return 'Too many requests. Please wait a moment and try again.'
    if (error.response?.status === 409) return data?.message || 'Conflict error.'
    if (error.response?.status >= 500) return 'Server error. Please try again later.'
    return error.message || 'Something went wrong.'
  }

  return 'Something went wrong. Please try again.'
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${ampm}`
}

export function formatDateTime(dateStr: string | null, timeStr: string | null): string {
  if (!dateStr) return '—'
  const date = formatDate(dateStr)
  const time = timeStr ? formatTime(timeStr) : ''
  return time ? `${date} at ${time}` : date
}
