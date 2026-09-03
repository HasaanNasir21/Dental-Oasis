import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone, MessageCircle, ExternalLink, ChevronRight } from 'lucide-react'
import { settingsApi } from '../../services/settingsApi'
import type { ClinicInfo } from '../../types'

const DEFAULT_INFO: ClinicInfo = {
  name: 'Dental Oasis',
  address: '270 Block E2, Johar Town, Lahore',
  phone: null,
  whatsapp: null,
  email: null,
  google_maps_url: 'https://maps.google.com/?q=270+Block+E2+Johar+Town+Lahore',
  opening_hours: { monday_saturday: '5:00 PM - 9:00 PM', sunday: 'Closed' },
}

export default function ContactPage() {
  const [info, setInfo] = useState<ClinicInfo>(DEFAULT_INFO)

  useEffect(() => {
    document.title = 'Contact | Dental Oasis — Johar Town, Lahore'
    settingsApi.getPublic()
      .then((r) => { if (r.success && r.data) setInfo(r.data) })
      .catch(() => {})
  }, [])

  const waLink = info.whatsapp
    ? `https://wa.me/${info.whatsapp.replace(/\D/g, '')}`
    : null

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            We are located in Johar Town, Lahore. Visit us during our evening hours or book an appointment online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Location */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-primary-400" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-white">Location</h2>
            </div>
            <address className="not-italic mb-6">
              <p className="text-xl font-bold text-white mb-1">Dental Oasis</p>
              <p className="text-gray-400">270 Block E2</p>
              <p className="text-gray-400">Johar Town, Lahore</p>
              <p className="text-gray-400">Pakistan</p>
            </address>
            {info.google_maps_url && (
              <a
                href={info.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm inline-flex"
                aria-label="Open Dental Oasis location in Google Maps"
              >
                <ExternalLink size={14} />
                Open in Google Maps
              </a>
            )}
          </div>

          {/* Opening Hours */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-primary-400" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-white">Opening Hours</h2>
            </div>
            <ul className="space-y-3">
              {[
                { day: 'Monday', open: true },
                { day: 'Tuesday', open: true },
                { day: 'Wednesday', open: true },
                { day: 'Thursday', open: true },
                { day: 'Friday', open: true },
                { day: 'Saturday', open: true },
                { day: 'Sunday', open: false },
              ].map(({ day, open }) => (
                <li key={day} className="flex justify-between py-1.5 border-b border-dark-500 last:border-0">
                  <span className="text-gray-300 text-sm">{day}</span>
                  <span className={`text-sm font-medium ${open ? 'text-primary-300' : 'text-red-400'}`}>
                    {open ? info.opening_hours.monday_saturday : info.opening_hours.sunday}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact actions */}
        {(info.phone || info.whatsapp) && (
          <div className="card mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">Get in Touch</h2>
            <div className="flex flex-wrap gap-4">
              {info.phone && (
                <a
                  href={`tel:${info.phone}`}
                  className="btn-secondary text-sm"
                  aria-label={`Call Dental Oasis at ${info.phone}`}
                >
                  <Phone size={15} />
                  Call Us
                </a>
              )}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
                  aria-label="Contact Dental Oasis on WhatsApp"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Book appointment CTA */}
        <div className="text-center bg-dark-700/60 border border-dark-500 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Book an Appointment</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Submit your appointment request online. Our team will contact you to confirm your visit date and time.
          </p>
          <Link to="/appointment" className="btn-primary">
            Book an Appointment
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
