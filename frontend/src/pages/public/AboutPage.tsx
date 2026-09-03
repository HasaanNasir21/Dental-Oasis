import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, MapPin, Clock, ChevronRight, Heart, Shield, Zap } from 'lucide-react'

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | Dental Oasis — Dental Clinic in Johar Town, Lahore'
  }, [])

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About Dental Oasis</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A dental clinic in Johar Town, Lahore, committed to providing comfortable and professional dental care for every patient.
          </p>
        </div>

        {/* Intro */}
        <div className="card mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Clinic</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Dental Oasis is located at 270 Block E2, Johar Town, Lahore. We provide a range of dental services including checkups, orthodontics, implants, crowns, cosmetic dentistry, and more.
              </p>
              <p className="text-gray-400 leading-relaxed mb-4">
                We are open Monday to Saturday from 5:00 PM to 9:00 PM, making it convenient for patients who are busy during the day.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Every patient who visits Dental Oasis for the first time is welcome to a complimentary initial dental checkup.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-dark-600/60 rounded-xl">
                <MapPin size={18} className="text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-white">Location</p>
                  <p className="text-sm text-gray-400">270 Block E2, Johar Town, Lahore</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-dark-600/60 rounded-xl">
                <Clock size={18} className="text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-white">Opening Hours</p>
                  <p className="text-sm text-gray-400">Monday – Saturday: 5:00 PM – 9:00 PM</p>
                  <p className="text-sm text-red-400">Sunday: Closed</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-dark-600/60 rounded-xl">
                <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-white">Free Initial Checkup</p>
                  <p className="text-sm text-gray-400">Complimentary first visit examination</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What we offer */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: 'Patient-Centered Care',
                desc: 'We focus on your comfort and individual needs, aiming to make every visit as comfortable as possible.',
              },
              {
                icon: Shield,
                title: 'Range of Services',
                desc: 'From routine checkups and cleaning to orthodontics, implants, crowns, and cosmetic treatments.',
              },
              {
                icon: Zap,
                title: 'Modern Equipment',
                desc: 'We use modern dental equipment and materials to help ensure quality dental care.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center">
                <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-primary-400" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Services list */}
        <div className="card mb-10">
          <h2 className="text-xl font-semibold text-white mb-6">Our Services Include</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Checkup (Free)',
              'Dental Implant',
              'Braces',
              'Invisible Aligners',
              'Root Canal Treatment',
              'Removable Denture',
              'Cast Partial Denture',
              'E-Max Crowns',
              'Zirconia Crowns',
              'PFM Crowns',
              'Veneers',
              'Tooth Extraction',
              'Scaling & Polishing',
              'Dental Filling',
            ].map((s) => (
              <div key={s} className="flex items-center gap-2 text-gray-300 text-sm">
                <CheckCircle size={14} className="text-teal-400 flex-shrink-0" aria-hidden="true" />
                {s}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-dark-500">
            <Link to="/services" className="btn-secondary text-sm">
              View All Services
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="card border-gray-600/30 bg-dark-800/60 mb-10">
          <p className="text-xs text-gray-500 leading-relaxed">
            Treatment options vary from patient to patient. Please consult our dentist for a proper examination and personalized treatment recommendation. Information provided on this website is for educational purposes and does not constitute medical advice.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Schedule a Visit</h2>
          <p className="text-gray-400 mb-6">
            Book your appointment request today and our team will get in touch to confirm.
          </p>
          <Link to="/appointment" className="btn-primary">
            <CheckCircle size={16} />
            Book Your Free Checkup
          </Link>
        </div>
      </div>
    </div>
  )
}
