import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ChevronRight, Star, MapPin, Clock, CheckCircle,
  Shield, Heart, Zap, Award, Calendar,
} from 'lucide-react'
import { serviceApi } from '../../services/serviceApi'
import { testimonialApi } from '../../services/testimonialApi'
import type { ServiceListItem, Testimonial } from '../../types'

const whyChooseUs = [
  { icon: Heart, title: 'Patient-Focused Care', desc: 'We prioritize your comfort and well-being throughout every visit, ensuring a positive experience from start to finish.' },
  { icon: Shield, title: 'Professional Services', desc: 'Our clinic provides a range of dental services in a clean, professional environment using modern equipment.' },
  { icon: CheckCircle, title: 'Free Initial Checkup', desc: 'We offer a complimentary initial dental examination so you can understand your oral health without any upfront cost.' },
  { icon: Zap, title: 'Modern Treatment Options', desc: 'From implants and aligners to crowns and veneers, we offer a comprehensive range of modern dental treatments.' },
  { icon: Clock, title: 'Convenient Evening Hours', desc: 'Open Monday to Saturday, 5:00 PM to 9:00 PM — designed to fit your busy schedule.' },
  { icon: Award, title: 'Personalized Treatment', desc: 'Every patient receives a personalized treatment plan based on their unique dental needs and goals.' },
]

const serviceCategories = [
  { label: 'Preventive', items: ['Checkup', 'Scaling & Polishing'], color: 'from-blue-600/20 to-blue-800/10', border: 'border-blue-500/30' },
  { label: 'Restorative', items: ['Dental Filling', 'Root Canal', 'Dental Implant'], color: 'from-teal-600/20 to-teal-800/10', border: 'border-teal-500/30' },
  { label: 'Orthodontic', items: ['Braces', 'Invisible Aligners'], color: 'from-purple-600/20 to-purple-800/10', border: 'border-purple-500/30' },
  { label: 'Cosmetic', items: ['Veneers', 'E-Max', 'Zirconia', 'PFM'], color: 'from-pink-600/20 to-pink-800/10', border: 'border-pink-500/30' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])

  useEffect(() => {
    serviceApi.list().then((r) => { if (r.success && r.data) setServices(r.data.slice(0, 6)) }).catch(() => {})
    testimonialApi.getPublished().then((r) => { if (r.success && r.data) setTestimonials(r.data.slice(0, 3)) }).catch(() => {})
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16" aria-labelledby="hero-heading">
        {/* Subtle color accents */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-teal-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Clinic Name */}
            <div className="mb-8">
              <span className="inline-block text-xs font-bold tracking-[0.3em] uppercase text-primary-400 mb-3">
                Welcome to
              </span>
              <h1 id="hero-heading" className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight leading-none">
                <span className="block text-white drop-shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                  Dental
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-cyan-300 to-teal-400 drop-shadow-[0_0_60px_rgba(56,189,248,0.5)] pl-[9rem] sm:pl-[10.5rem] lg:pl-[12rem]">
                  Oasis
                </span>
              </h1>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-primary-500/60" />
              <p className="text-2xl sm:text-3xl font-semibold text-gray-300 tracking-wide">
                Your Smile.{' '}
                <span className="text-teal-400">Our Care.</span>
              </p>
            </div>

            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-8 max-w-xl">
              Quality dental care focused on healthy smiles, comfortable treatment, and personalized patient care.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/appointment" className="btn-primary text-base px-7 py-3.5">
                Book an Appointment
                <ChevronRight size={18} />
              </Link>
              <Link to="/services" className="btn-secondary text-base px-7 py-3.5">
                Explore Our Services
              </Link>
            </div>

            {/* Info cards */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-dark-700/60 border border-dark-500 rounded-xl px-4 py-3">
                <MapPin size={18} className="text-primary-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm text-gray-200 font-medium">270 Block E2, Johar Town</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-dark-700/60 border border-dark-500 rounded-xl px-4 py-3">
                <Clock size={18} className="text-primary-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-500">Open</p>
                  <p className="text-sm text-gray-200 font-medium">Mon–Sat · 5:00–9:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-dark-700/60 border border-dark-500 rounded-xl px-4 py-3">
                <CheckCircle size={18} className="text-green-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-gray-500">First Visit</p>
                  <p className="text-sm text-green-300 font-medium">Free Checkup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREE CHECKUP CTA */}
      <section className="py-12" aria-labelledby="free-checkup-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-primary-900 border border-primary-600/40 p-8 md:p-12">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-primary-200 text-xs font-medium mb-3">
                  <CheckCircle size={12} />
                  Complimentary
                </div>
                <h2 id="free-checkup-heading" className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Free Initial Dental Checkup
                </h2>
                <p className="text-primary-200 max-w-md">
                  Book your complimentary first visit. Our dentist will examine your teeth, gums, and overall oral health, and discuss any concerns.
                </p>
              </div>
              <Link to="/appointment" className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors text-base">
                Get Your Free Checkup
                <ChevronRight size={18} />
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20" aria-labelledby="why-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 id="why-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Dental Oasis?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              We are committed to providing a comfortable, professional dental experience for every patient.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card group hover:border-primary-500/40 transition-colors">
                <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-colors">
                  <Icon size={20} className="text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="py-20 bg-dark-800/40" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
            <div>
              <h2 id="services-heading" className="text-3xl md:text-4xl font-bold text-white mb-2">Our Services</h2>
              <p className="text-gray-400">Comprehensive dental care for the whole family.</p>
            </div>
            <Link to="/services" className="btn-secondary text-sm flex-shrink-0">
              View All Services
              <ChevronRight size={16} />
            </Link>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.slug}`}
                  className="card group hover:border-primary-500/40 hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="aspect-video bg-dark-600 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={`${service.name} dental service`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-dark-400" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {service.name}
                    {service.name === 'Checkup' && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full">FREE</span>
                    )}
                  </h3>
                  {service.short_description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{service.short_description}</p>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-primary-400 mt-3">
                    Learn More <ChevronRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Checkup', desc: 'A comprehensive examination of your teeth, gums, and oral health.', free: true },
                { name: 'Dental Implant', desc: 'Replace missing teeth with a natural-looking, fixed tooth replacement.' },
                { name: 'Braces', desc: 'Orthodontic treatment to gradually move and straighten teeth.' },
                { name: 'Invisible Aligners', desc: 'Clear, removable trays for a discreet orthodontic option.' },
                { name: 'Root Canal Treatment', desc: 'Treatment for infected or severely inflamed tooth pulp.' },
                { name: 'Zirconia Crowns', desc: 'Strong, durable ceramic crowns with a natural appearance.' },
              ].map(({ name, desc, free }) => (
                <Link key={name} to="/services" className="card group hover:border-primary-500/40 transition-colors">
                  <div className="aspect-video bg-dark-600 rounded-lg mb-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-dark-400" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                    {name}
                    {free && <span className="ml-2 text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full">FREE</span>}
                  </h3>
                  <p className="text-sm text-gray-400">{desc}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TREATMENT CATEGORIES */}
      <section className="py-20" aria-labelledby="categories-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="categories-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Treatment Categories</h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              We offer a wide range of dental services across all major treatment categories.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCategories.map(({ label, items, color, border }) => (
              <div key={label} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${color} border ${border} p-6`}>
                <h3 className="text-lg font-semibold text-white mb-4">{label}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={13} className="text-teal-400 flex-shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/services" className="mt-5 inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT CLINIC */}
      <section className="py-20 bg-dark-800/40" aria-labelledby="about-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 id="about-heading" className="text-3xl md:text-4xl font-bold text-white mb-6">
                About Dental Oasis
              </h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Dental Oasis is a dental clinic located in Johar Town, Lahore. We are committed to providing a comfortable and professional dental experience for every patient.
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                Our clinic offers a comprehensive range of dental services, from routine checkups and cleaning to dental implants, orthodontics, and cosmetic treatments. We use modern dental equipment and materials to help ensure quality care.
              </p>
              <p className="text-sm text-gray-500 italic mb-8">
                Treatment options vary from patient to patient. Please consult our dentist for a proper examination and personalized treatment recommendation.
              </p>
              <Link to="/about" className="btn-secondary">
                Learn More About Us
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Free Checkup', value: 'Available', icon: CheckCircle, color: 'text-green-400' },
                { label: 'Services Offered', value: '14+', icon: Zap, color: 'text-primary-400' },
                { label: 'Location', value: 'Johar Town', icon: MapPin, color: 'text-teal-400' },
                { label: 'Open', value: 'Mon–Sat', icon: Clock, color: 'text-yellow-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card text-center">
                  <Icon size={24} className={`${color} mx-auto mb-2`} aria-hidden="true" />
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-20" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">Patient Testimonials</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <blockquote key={t.id} className="card">
                  <StarRating rating={t.rating} />
                  <p className="text-gray-300 text-sm leading-relaxed mt-3 mb-4">"{t.content}"</p>
                  <footer className="text-sm font-medium text-white">— {t.name}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OPENING HOURS + LOCATION */}
      <section className="py-20 bg-dark-800/40" aria-labelledby="hours-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h2 id="hours-heading" className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock size={20} className="text-primary-400" aria-hidden="true" />
                Opening Hours
              </h2>
              <ul className="space-y-3">
                {[
                  { day: 'Monday', hours: '5:00 PM – 9:00 PM', open: true },
                  { day: 'Tuesday', hours: '5:00 PM – 9:00 PM', open: true },
                  { day: 'Wednesday', hours: '5:00 PM – 9:00 PM', open: true },
                  { day: 'Thursday', hours: '5:00 PM – 9:00 PM', open: true },
                  { day: 'Friday', hours: '5:00 PM – 9:00 PM', open: true },
                  { day: 'Saturday', hours: '5:00 PM – 9:00 PM', open: true },
                  { day: 'Sunday', hours: 'Closed', open: false },
                ].map(({ day, hours, open }) => (
                  <li key={day} className="flex items-center justify-between py-2 border-b border-dark-500 last:border-0">
                    <span className="text-gray-300 text-sm font-medium">{day}</span>
                    <span className={`text-sm ${open ? 'text-primary-300' : 'text-red-400'}`}>{hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin size={20} className="text-primary-400" aria-hidden="true" />
                Find Us
              </h2>
              <address className="not-italic text-gray-300 mb-6">
                <p className="text-lg font-semibold text-white">Dental Oasis</p>
                <p className="text-gray-400">270 Block E2</p>
                <p className="text-gray-400">Johar Town, Lahore</p>
              </address>
              <a
                href="https://maps.google.com/?q=270+Block+E2+Johar+Town+Lahore"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm inline-flex"
              >
                <MapPin size={15} />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20" aria-labelledby="cta-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Schedule Your Visit?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Book an appointment request today. Our team will contact you to confirm your visit date and time.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/appointment" className="btn-primary text-base px-8 py-3.5">
              <Calendar size={18} />
              Book an Appointment
            </Link>
            <Link to="/contact" className="btn-secondary text-base px-8 py-3.5">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
