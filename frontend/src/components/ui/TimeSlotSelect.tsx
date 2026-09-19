/**
 * TimeSlotSelect
 *
 * A dropdown that lists appointment time slots in 15-minute increments
 * between OPEN_HOUR:OPEN_MIN and CLOSE_HOUR:CLOSE_MIN (exclusive of close).
 *
 * Clinic hours: 5:00 PM – 10:00 PM  →  17:00 – 22:00
 * Slots: 17:00, 17:15, 17:30, 17:45, 18:00 … 21:45  (last slot before 22:00)
 *
 * Extends React.SelectHTMLAttributes so react-hook-form's register() spread
 * works directly without any type conflicts.
 */

import React from 'react'

// ── Clinic hours configuration ──────────────────────────────────────────────
const OPEN_HOUR = 17    // 5 PM
const OPEN_MIN  = 0
const CLOSE_HOUR = 22   // 10 PM  (exclusive — last slot is 21:45)
const CLOSE_MIN  = 0
const STEP_MINUTES = 15

// ── Slot generation ──────────────────────────────────────────────────────────
function generateSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = []
  let h = OPEN_HOUR
  let m = OPEN_MIN

  while (h < CLOSE_HOUR || (h === CLOSE_HOUR && m <= CLOSE_MIN)) {
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

export const TIME_SLOTS = generateSlots()

// ── Component ────────────────────────────────────────────────────────────────
// Extends SelectHTMLAttributes so react-hook-form register() spreads
// (which pass a native ChangeEvent onChange) work without type errors.
export interface TimeSlotSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

const TimeSlotSelect = React.forwardRef<HTMLSelectElement, TimeSlotSelectProps>(
  ({ id, className = 'input text-sm', placeholder = '— Select time —', ...rest }, ref) => {
    return (
      <select
        id={id}
        ref={ref}
        className={className}
        aria-label="Appointment time"
        {...rest}
      >
        <option value="">{placeholder}</option>
        {TIME_SLOTS.map((slot) => (
          <option key={slot.value} value={slot.value}>
            {slot.label}
          </option>
        ))}
      </select>
    )
  },
)

TimeSlotSelect.displayName = 'TimeSlotSelect'

export default TimeSlotSelect
