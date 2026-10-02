/**
 * TimeSlotSelect
 *
 * When `selectedDate` is provided the component fetches available slots for
 * that date from the backend and shows only those. Slots occupied by
 * CONTACTED or CONFIRMED appointments are excluded automatically.
 *
 * When no date is provided it falls back to showing all 15-minute clinic
 * slots (original behaviour) so it still works in contexts that don't yet
 * pass a date.
 *
 * Clinic hours: 5:00 PM – 10:00 PM  (17:00 – 22:00 exclusive)
 * Slots: 17:00, 17:15 … 21:45  (20 slots total)
 *
 * Extends React.SelectHTMLAttributes so react-hook-form's register() spread
 * works directly without any type conflicts.
 */

import React, { useEffect, useState } from 'react'
import { appointmentApi } from '../../services/appointmentApi'

// ── Clinic hours configuration ──────────────────────────────────────────────
const OPEN_HOUR   = 17   // 5 PM
const OPEN_MIN    = 0
const CLOSE_HOUR  = 22   // 10 PM (exclusive — last slot is 21:45)
const STEP_MINUTES = 15

// ── Slot generation ──────────────────────────────────────────────────────────
function generateSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = []
  let h = OPEN_HOUR
  let m = OPEN_MIN

  // Stop when we reach or exceed 22:00 (CLOSE_HOUR:00)
  while (h < CLOSE_HOUR) {
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const label = formatSlotLabel(h, m)
    slots.push({ value, label })

    m += STEP_MINUTES
    if (m >= 60) {
      m -= 60
      h += 1
    }
  }

  return slots
}

export function formatSlotLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  const displayMin = String(minute).padStart(2, '0')
  return `${displayHour}:${displayMin} ${period}`
}

/** All possible clinic time slots (static, no availability check). */
export const TIME_SLOTS = generateSlots()

/** Convert an HH:MM string to a human-readable label. */
function slotLabel(value: string): string {
  const [h, m] = value.split(':').map(Number)
  return formatSlotLabel(h, m)
}

// ── Component ────────────────────────────────────────────────────────────────
export interface TimeSlotSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
  /**
   * When provided the component will fetch available slots for this date from
   * the API and show only those. Format: YYYY-MM-DD.
   */
  selectedDate?: string
  /**
   * Appointment ID to exclude from the conflict check (pass when editing an
   * existing appointment so its own current slot stays selectable).
   */
  excludeAppointmentId?: number
}

const TimeSlotSelect = React.forwardRef<HTMLSelectElement, TimeSlotSelectProps>(
  (
    {
      id,
      className = 'input text-sm',
      placeholder = '— Select time —',
      selectedDate,
      excludeAppointmentId,
      value,
      ...rest
    },
    ref,
  ) => {
    // null  = not yet fetched / date not provided → show all slots
    // []    = fetched but none available (Sunday or all booked)
    // [...] = fetched available slots
    const [availableSlots, setAvailableSlots] = useState<string[] | null>(null)
    const [loadingSlots, setLoadingSlots] = useState(false)

    useEffect(() => {
      // Guard: empty string or clearly invalid date → show all slots
      if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        setAvailableSlots(null)
        return
      }

      let cancelled = false
      setLoadingSlots(true)
      setAvailableSlots(null)

      appointmentApi
        .getAvailableSlots(selectedDate, excludeAppointmentId)
        .then((res) => {
          if (!cancelled && res.success && res.data) {
            setAvailableSlots(res.data)
          }
        })
        .catch(() => {
          // On error fall back gracefully to showing all slots
          if (!cancelled) setAvailableSlots(null)
        })
        .finally(() => {
          if (!cancelled) setLoadingSlots(false)
        })

      return () => {
        cancelled = true
      }
    }, [selectedDate, excludeAppointmentId])

    // Which slots to render: available slots from API when a date is selected,
    // otherwise the full static list.
    const slotsToShow: { value: string; label: string }[] =
      availableSlots !== null
        ? availableSlots.map((v) => ({ value: v, label: slotLabel(v) }))
        : TIME_SLOTS

    return (
      <div className="relative">
        <select
          id={id}
          ref={ref}
          className={className}
          aria-label="Appointment time"
          value={value}
          {...rest}
        >
          <option value="">{placeholder}</option>

          {slotsToShow.length === 0 && !loadingSlots && selectedDate && (
            <option value="" disabled>
              No slots available on this date
            </option>
          )}

          {slotsToShow.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>

        {/* Subtle loading indicator — shown while fetching */}
        {loadingSlots && (
          <span
            className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none"
            aria-live="polite"
          >
            loading…
          </span>
        )}
      </div>
    )
  },
)

TimeSlotSelect.displayName = 'TimeSlotSelect'

export default TimeSlotSelect
