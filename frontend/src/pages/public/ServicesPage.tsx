import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CheckCircle } from 'lucide-react'
import { serviceApi } from '../../services/serviceApi'
import type { ServiceListItem } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'

// Static service data as fallback
const STATIC_SERVICES = [
  { id: 1, name: 'Checkup', slug: 'checkup', short_description: 'A comprehensive examination of your teeth, gums, and overall oral health. Initial checkup is free.', image_url: '/services/checkup.jpg', is_active: true, free: true },
  { id: 2, name: 'Dental Implant', slug: 'dental-implant', short_description: 'A fixed tooth replacement option to restore missing teeth.', image_url: '/services/dental-implant.jpg', is_active: true },
  { id: 3, name: 'Braces', slug: 'braces', short_description: 'Orthodontic appliances that gradually move teeth to improve alignment.', image_url: '/services/braces.jpg', is_active: true },
  { id: 4, name: 'Invisible Aligners', slug: 'invisible-aligners', short_description: 'Clear removable trays designed to gradually move teeth with less visibility.', image_url: '/services/invisible-aligners.jpg', is_active: true },
  { id: 5, name: 'Root Canal Treatment', slug: 'root-canal-treatment', short_description: 'Treatment for infected or severely inflamed tooth pulp.', image_url: '/services/root-canal-treatment.jpg', is_active: true },
  { id: 6, name: 'Removable Denture', slug: 'removable-denture', short_description: 'A removable appliance that can replace missing teeth.', image_url: '/services/removable-denture.jpg', is_active: true },
  { id: 7, name: 'Cast Partial Denture', slug: 'cast-partial-denture', short_description: 'A removable appliance to replace multiple missing teeth with a stable framework.', image_url: '/services/cast-partial-denture.jpg', is_active: true },
  { id: 8, name: 'E-Max', slug: 'e-max', short_description: 'A dental ceramic used for natural-looking crowns and restorations.', image_url: '/services/e-max.jpg', is_active: true },
  { id: 9, name: 'Zirconia', slug: 'zirconia', short_description: 'Strong ceramic material for durable, natural-looking dental crowns.', image_url: '/services/zirconia.jpg', is_active: true },
  { id: 10, name: 'PFM', slug: 'pfm', short_description: 'Porcelain Fused to Metal — combining strength with tooth-colored porcelain.', image_url: '/services/pfm.jpg', is_active: true },
  { id: 11, name: 'Veneers', slug: 'veneers', short_description: 'Thin coverings placed over the front surface of teeth for cosmetic improvement.', image_url: '/services/veneers.jpg', is_active: true },
  { id: 12, name: 'Tooth Extraction', slug: 'tooth-extraction', short_description: 'Safe removal of a tooth when necessary due to damage, infection or other reasons.', image_url: '/services/tooth-extraction.jpg', is_active: true },
  { id: 13, name: 'Scaling & Polishing', slug: 'scaling-polishing', short_description: 'Professional cleaning to remove tartar and surface stains.', image_url: '/services/scaling-polishing.jpg', is_active: true },
  { id: 14, name: 'Dental Filling', slug: 'dental-filling', short_description: 'Restoration of a tooth affected by decay using appropriate filling material.', image_url: '/services/dental-filling.jpg', is_active: true },
]

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Dental Services | Dental Oasis — Johar Town, Lahore'
    serviceApi.list()
      .then((r) => {
        if (r.success && r.data && r.data.length > 0) {
          setServices(r.data)
        } else {
          setServices(STATIC_SERVICES as ServiceListItem[])
        }
      })
      .catch(() => setServices(STATIC_SERVICES as ServiceListItem[]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Dental Services</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We offer a comprehensive range of dental services to help you maintain and improve your oral health.
          </p>
          <p className="text-sm text-gray-500 mt-4 max-w-xl mx-auto">
            Treatment options vary from patient to patient. Please consult our dentist for a proper examination and personalized treatment recommendation.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.slug}`}
              className="card group hover:border-primary-500/40 hover:-translate-y-1 transition-all duration-200 flex flex-col"
            >
              <div className="aspect-video bg-dark-600 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={`${service.name} dental treatment`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-dark-400" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                    {service.name}
                  </h2>
                  {service.name === 'Checkup' && (
                    <span className="flex-shrink-0 text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                {service.short_description && (
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{service.short_description}</p>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-primary-400 mt-4">
                Learn More <ChevronRight size={12} />
              </span>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-dark-700/60 border border-dark-500 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Not Sure Which Treatment You Need?</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Book a free initial checkup and our dentist will examine your oral health and recommend the right treatment for you.
          </p>
          <Link to="/appointment" className="btn-primary">
            Book Your Free Checkup
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
