import { useEffect, useState } from 'react'
import {
  MapPin, Clock, Phone, MessageCircle, Mail, ExternalLink,
  Info, CheckCircle, AlertCircle,
} from 'lucide-react'
import { settingsApi } from '../../services/settingsApi'
import type { ClinicInfo } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import { parseApiError } from '../../utils/errorHandler'

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  muted,
}: {
  icon: typeof MapPin
  label: string
  value: string | null | undefined
  href?: string
  muted?: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-dark-500 last:border-0">
      <Icon size={16} className="text-primary-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 break-all"
            >
              {value}
              <ExternalLink size={11} />
            </a>
          ) : (
            <p className={`text-sm break-words ${muted ? 'text-gray-500 italic' : 'text-gray-200'}`}>{value}</p>
          )
        ) : (
          <p className="text-sm text-gray-600 italic">Not configured</p>
        )}
      </div>
    </div>
  )
}

function HoursRow({ day, hours, isOpen }: { day: string; hours: string; isOpen: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-dark-500 last:border-0">
      <span className="text-sm text-gray-300 font-medium">{day}</span>
      <span className={`text-sm font-medium ${isOpen ? 'text-primary-300' : 'text-red-400'}`}>{hours}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ClinicInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    settingsApi.get()
      .then((r) => {
        if (r.success && r.data) setSettings(r.data)
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    document.title = 'Settings | Dental Oasis Admin'
    load()
  }, [])

  if (loading) return <PageLoader />
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Clinic Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          View current clinic configuration. To update these values, edit the backend <code className="text-primary-400 bg-dark-600 px-1.5 py-0.5 rounded text-xs">.env</code> file and restart the server.
        </p>
      </div>

      <div className="space-y-6">
        {/* Clinic Info */}
        <section className="card" aria-labelledby="clinic-info-heading">
          <h2 id="clinic-info-heading" className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Info size={16} className="text-primary-400" />
            Clinic Information
          </h2>
          <div>
            <InfoRow icon={Info} label="Clinic Name" value={settings?.name} />
            <InfoRow icon={MapPin} label="Address" value={settings?.address} />
            <InfoRow
              icon={Phone}
              label="Phone Number"
              value={settings?.phone}
              href={settings?.phone ? `tel:${settings.phone}` : undefined}
            />
            <InfoRow
              icon={MessageCircle}
              label="WhatsApp Number"
              value={settings?.whatsapp}
              href={
                settings?.whatsapp
                  ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`
                  : undefined
              }
            />
            <InfoRow icon={Mail} label="Email" value={settings?.email} href={settings?.email ? `mailto:${settings.email}` : undefined} />
            <InfoRow
              icon={ExternalLink}
              label="Google Maps URL"
              value={settings?.google_maps_url}
              href={settings?.google_maps_url ?? undefined}
            />
          </div>
        </section>

        {/* Opening Hours */}
        <section className="card" aria-labelledby="hours-heading">
          <h2 id="hours-heading" className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-primary-400" />
            Opening Hours
          </h2>
          <div>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <HoursRow key={day} day={day} hours={settings?.opening_hours?.monday_saturday ?? '5:00 PM – 9:00 PM'} isOpen />
            ))}
            <HoursRow day="Sunday" hours={settings?.opening_hours?.sunday ?? 'Closed'} isOpen={false} />
          </div>
        </section>

        {/* How to Update */}
        <section className="card border-yellow-500/20 bg-yellow-500/5" aria-labelledby="update-heading">
          <h2 id="update-heading" className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-yellow-400" />
            How to Update Settings
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Clinic settings are managed through environment variables in the backend configuration file.
          </p>
          <div className="bg-dark-800 rounded-lg p-4 text-xs font-mono text-gray-300 space-y-1 border border-dark-500">
            <p><span className="text-gray-500"># backend/.env</span></p>
            <p><span className="text-primary-400">CLINIC_NAME</span>=Dental Oasis</p>
            <p><span className="text-primary-400">CLINIC_ADDRESS</span>=270 Block E2, Johar Town, Lahore</p>
            <p><span className="text-primary-400">CLINIC_PHONE</span>=<span className="text-gray-500"># Add phone number</span></p>
            <p><span className="text-primary-400">CLINIC_WHATSAPP</span>=<span className="text-gray-500"># Add WhatsApp number</span></p>
            <p><span className="text-primary-400">CLINIC_EMAIL</span>=<span className="text-gray-500"># Add email address</span></p>
            <p><span className="text-primary-400">CLINIC_GOOGLE_MAPS_URL</span>=<span className="text-gray-500"># Add Maps URL</span></p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            After updating the <code className="text-primary-400">.env</code> file, restart the backend server for changes to take effect.
          </p>
        </section>

        {/* Security Note */}
        <section className="card border-red-500/20 bg-red-500/5" aria-labelledby="security-heading">
          <h2 id="security-heading" className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            Security Notice
          </h2>
          <p className="text-sm text-gray-400">
            Sensitive values such as <strong className="text-gray-300">ADMIN_PASSWORD</strong> and <strong className="text-gray-300">SECRET_KEY</strong> are never exposed through this interface. To change the admin password, update the <code className="text-primary-400">.env</code> file directly and restart the server.
          </p>
        </section>
      </div>
    </div>
  )
}
