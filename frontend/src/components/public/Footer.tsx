import { Link } from 'react-router-dom'
import { MapPin, Clock, Mail } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dark-800 border-t border-dark-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" width="20" height="20" aria-hidden="true">
                  <path d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white">Dental Oasis</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Patient-focused dental care in the heart of Johar Town, Lahore. We provide quality dental services in a comfortable and professional environment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/services', label: 'Services' },
                { to: '/about', label: 'About Us' },
                { to: '/appointment', label: 'Book Appointment' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Clock size={14} className="mt-0.5 flex-shrink-0 text-primary-400" />
                <span>
                  <span className="text-gray-300">Mon – Sat</span><br />
                  5:00 PM – 9:00 PM
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="mt-0.5 flex-shrink-0 text-gray-500" />
                <span>
                  <span className="text-gray-300">Sunday</span><br />
                  <span className="text-red-400">Closed</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Location</h3>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-primary-400" />
              <address className="not-italic">
                270 Block E2<br />
                Johar Town, Lahore
              </address>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-dark-600">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {year} Dental Oasis. All rights reserved.
            </p>
            <p className="text-xs text-gray-600 text-center max-w-lg">
              Treatment options vary from patient to patient. Please consult our dentist for a proper examination and personalized treatment recommendation. Information on this website is for educational purposes only and does not constitute medical advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
