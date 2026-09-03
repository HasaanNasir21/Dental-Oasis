import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-dark-900/95 backdrop-blur-md border-b border-dark-600 shadow-xl' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Dental Oasis - Home">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
              <svg viewBox="0 0 24 24" fill="white" width="20" height="20" aria-hidden="true">
                <path d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white">Dental Oasis</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-400 bg-primary-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-dark-600'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/appointment" className="btn-primary text-sm px-5 py-2.5">
              Book Appointment
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-600 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-0 top-16 bg-dark-900/98 backdrop-blur-md z-40 flex flex-col p-6 gap-2 animate-fade-in"
        >
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="mt-4 pt-4 border-t border-dark-600">
            <Link to="/appointment" className="btn-primary w-full justify-center">
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
