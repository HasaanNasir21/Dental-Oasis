/**
 * TreatmentSelect
 *
 * A multi-select treatment picker built as a custom checkbox-style dropdown.
 * Allows picking 1–N treatments from the APPOINTMENT_REASONS list.
 *
 * Usage:
 *   <TreatmentSelect value={treatments} onChange={setTreatments} />
 *
 * The value is a string[] of treatment names (matching AppointmentReason values).
 */

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, X, Check } from 'lucide-react'
import { APPOINTMENT_REASONS, type AppointmentReason } from '../../types'

export interface TreatmentSelectProps {
  id?: string
  value: string[]
  onChange: (treatments: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export default function TreatmentSelect({
  id,
  value,
  onChange,
  placeholder = 'Select treatment(s)…',
  disabled = false,
  className = '',
}: TreatmentSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const toggle = (treatment: AppointmentReason) => {
    if (value.includes(treatment)) {
      onChange(value.filter((t) => t !== treatment))
    } else {
      onChange([...value, treatment])
    }
  }

  const remove = (treatment: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((t) => t !== treatment))
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`
          input text-sm w-full text-left flex items-center gap-2 min-h-[2.5rem] h-auto py-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select treatments"
      >
        <span className="flex-1 flex flex-wrap gap-1.5 min-w-0">
          {value.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            value.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-200 text-xs font-medium"
              >
                {t}
                <button
                  type="button"
                  onClick={(e) => remove(t, e)}
                  className="text-primary-300 hover:text-white transition-colors ml-0.5"
                  aria-label={`Remove ${t}`}
                  tabIndex={-1}
                >
                  <X size={11} />
                </button>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Treatment options"
          className="
            absolute z-50 mt-1 w-full bg-dark-700 border border-dark-500
            rounded-xl shadow-xl overflow-y-auto max-h-56
          "
        >
          {APPOINTMENT_REASONS.map((treatment) => {
            const selected = value.includes(treatment)
            return (
              <button
                key={treatment}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(treatment)}
                className={`
                  w-full text-left px-3 py-2 text-sm flex items-center gap-2.5
                  transition-colors
                  ${selected
                    ? 'bg-primary-500/15 text-primary-200'
                    : 'text-gray-300 hover:bg-dark-600 hover:text-white'
                  }
                `}
              >
                <span
                  className={`
                    w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                    transition-colors
                    ${selected
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-dark-400 bg-transparent'
                    }
                  `}
                  aria-hidden="true"
                >
                  {selected && <Check size={10} strokeWidth={3} className="text-white" />}
                </span>
                {treatment}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
