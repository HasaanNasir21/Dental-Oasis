import { createContext, useContext, useEffect, useState } from 'react'
import { settingsApi } from '../services/settingsApi'
import type { ClinicInfo } from '../types'

export const DEFAULT_CLINIC: ClinicInfo = {
  name: 'Dental Oasis',
  address: '270 Block E2, Johar Town, Lahore',
  phone: null,
  whatsapp: null,
  email: null,
  google_maps_url: 'https://maps.google.com/?q=270+Block+E2+Johar+Town+Lahore',
  opening_hours: {
    monday_saturday: '5:00 PM - 9:00 PM',
    sunday: 'Closed',
  },
  social_facebook: null,
  social_instagram: null,
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

interface ClinicContextValue {
  clinic: ClinicInfo
  weekdayHours: { day: string; hours: string; open: boolean }[]
}

const ClinicContext = createContext<ClinicContextValue>({
  clinic: DEFAULT_CLINIC,
  weekdayHours: [
    ...WEEKDAYS.map((day) => ({ day, hours: DEFAULT_CLINIC.opening_hours.monday_saturday, open: true })),
    { day: 'Sunday', hours: DEFAULT_CLINIC.opening_hours.sunday, open: false },
  ],
})

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [clinic, setClinic] = useState<ClinicInfo>(DEFAULT_CLINIC)

  useEffect(() => {
    settingsApi
      .getPublic()
      .then((r) => {
        if (r.success && r.data) setClinic({ ...DEFAULT_CLINIC, ...r.data })
      })
      .catch(() => {})
  }, [])

  const weekdayHours = [
    ...WEEKDAYS.map((day) => ({ day, hours: clinic.opening_hours.monday_saturday, open: true })),
    { day: 'Sunday', hours: clinic.opening_hours.sunday, open: false },
  ]

  return <ClinicContext.Provider value={{ clinic, weekdayHours }}>{children}</ClinicContext.Provider>
}

export function useClinic() {
  return useContext(ClinicContext)
}
