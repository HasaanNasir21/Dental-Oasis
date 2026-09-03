import { useEffect, useMemo, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { appointmentApi } from '../../services/appointmentApi'
import type { Appointment } from '../../types'
import AppointmentDetailModal from '../../components/admin/AppointmentDetailModal'
import { formatTime } from '../../utils/errorHandler'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'

type ViewMode = 'month' | 'week' | 'day'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function localIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

function addDays(d: Date, n: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export default function CalendarPage() {
  const today = new Date()
  const [anchor, setAnchor] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const range = useMemo(() => {
    if (viewMode === 'month') {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
      return { start, end }
    }
    if (viewMode === 'week') {
      const start = startOfWeek(anchor)
      return { start, end: addDays(start, 6) }
    }
    return { start: anchor, end: anchor }
  }, [anchor, viewMode])

  const loadAppointments = useCallback(() => {
    setLoading(true)
    appointmentApi.getCalendar(localIso(range.start), localIso(range.end))
      .then((r) => { if (r.success && r.data) setAppointments(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range])

  useEffect(() => {
    document.title = 'Calendar | Dental Oasis Admin'
    loadAppointments()
  }, [loadAppointments])

  const shift = (dir: number) => {
    if (viewMode === 'month') {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1))
    } else if (viewMode === 'week') {
      setAnchor(addDays(anchor, dir * 7))
    } else {
      setAnchor(addDays(anchor, dir))
    }
  }

  const appointmentsByDate: Record<string, Appointment[]> = {}
  appointments.forEach((a) => {
    if (a.appointment_date) {
      if (!appointmentsByDate[a.appointment_date]) appointmentsByDate[a.appointment_date] = []
      appointmentsByDate[a.appointment_date].push(a)
    }
  })

  const todayStr = localIso(today)
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getDay()
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()

  const heading =
    viewMode === 'month'
      ? `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`
      : viewMode === 'week'
        ? `${localIso(range.start)} – ${localIso(range.end)}`
        : localIso(anchor)

  const renderAppointmentButton = (appt: Appointment) => (
    <button
      key={appt.id}
      type="button"
      onClick={() => setSelectedId(appt.id)}
      className="w-full text-left px-1.5 py-0.5 rounded text-xs bg-dark-600 hover:bg-dark-500 transition-colors truncate"
      title={`${appt.patient_name} — ${appt.reason}`}
    >
      <span className="text-primary-300">{appt.appointment_time ? formatTime(appt.appointment_time) : ''}</span>
      <span className="text-gray-300 ml-1">{appt.patient_name}</span>
    </button>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">Appointments in the clinic timezone (Asia/Karachi)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                viewMode === mode ? 'bg-primary-600 text-white' : 'btn-ghost'
              }`}
            >
              {mode}
            </button>
          ))}
          <button type="button" onClick={() => setAnchor(new Date(today.getFullYear(), today.getMonth(), today.getDate()))} className="btn-ghost text-sm">
            Today
          </button>
          <button type="button" onClick={() => shift(-1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600" aria-label="Previous">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-semibold min-w-[180px] text-center">{heading}</span>
          <button type="button" onClick={() => shift(1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600" aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : viewMode === 'month' ? (
        <div className="card p-0 overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-dark-500 min-w-[700px]">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr min-w-[700px]">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-dark-600 bg-dark-800/30" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${anchor.getFullYear()}-${pad(anchor.getMonth() + 1)}-${pad(day)}`
              const dayAppts = appointmentsByDate[dateStr] || []
              const isToday = dateStr === todayStr
              const isSunday = (firstDay + i) % 7 === 0
              return (
                <div key={day} className={`min-h-[100px] p-1.5 border-b border-r border-dark-600 ${isToday ? 'bg-primary-900/20' : isSunday ? 'bg-dark-800/40' : ''}`}>
                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary-600 text-white' : 'text-gray-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayAppts.slice(0, 3).map(renderAppointmentButton)}
                    {dayAppts.length > 3 && <p className="text-xs text-gray-500 pl-1">+{dayAppts.length - 3} more</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: viewMode === 'week' ? 7 : 1 }).map((_, i) => {
            const dayDate = viewMode === 'week' ? addDays(range.start, i) : anchor
            const dateStr = localIso(dayDate)
            const dayAppts = (appointmentsByDate[dateStr] || []).slice().sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''))
            return (
              <section key={dateStr} className="card">
                <h2 className="text-white font-semibold mb-3">
                  {DAY_NAMES[dayDate.getDay()]} {dateStr}
                  {dateStr === todayStr ? <span className="ml-2 text-xs text-primary-400">Today</span> : null}
                </h2>
                {dayAppts.length === 0 ? (
                  <p className="text-sm text-gray-500">No appointments.</p>
                ) : (
                  <ul className="space-y-2">
                    {dayAppts.map((appt) => (
                      <li key={appt.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(appt.id)}
                          className="w-full text-left p-3 rounded-lg bg-dark-600 hover:bg-dark-500 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-primary-300 text-sm">{formatTime(appt.appointment_time)}</p>
                            <p className="text-white font-medium">{appt.patient_name}</p>
                            <p className="text-xs text-gray-400">{appt.reason}</p>
                          </div>
                          <StatusBadge status={appt.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}

      {selectedId && (
        <AppointmentDetailModal
          appointmentId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={loadAppointments}
        />
      )}
    </div>
  )
}
