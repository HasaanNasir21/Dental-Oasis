import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { serviceApi } from '../../services/serviceApi'
import type { Service } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'

// Static rich content per slug
const SERVICE_CONTENT: Record<string, { benefits: string[]; info: string[]; description: string }> = {
  'checkup': {
    description: 'A dental checkup is a thorough examination of your teeth, gums, mouth, and overall oral health. During a checkup, the dentist examines your teeth for signs of decay, checks your gum health, looks for signs of oral issues, and may take X-rays if necessary to get a more detailed picture of your dental health. The initial checkup at Dental Oasis is free.',
    benefits: ['Identify cavities and tooth decay', 'Assess gum health', 'Check for signs of infection', 'Detect plaque and tartar build-up', 'Monitor overall oral health', 'Discuss any dental concerns'],
    info: ['Initial checkup is complimentary', 'X-rays may be recommended for a more complete assessment', 'Please inform us of any medications or health conditions'],
  },
  'dental-implant': {
    description: 'Dental implants are used to replace missing teeth. An implant is placed into the jawbone and can support a dental crown, creating a natural-looking and fixed tooth replacement. The suitability of dental implants depends on factors such as bone condition, gum health, and overall oral health.',
    benefits: ['Replace one or more missing teeth', 'Provide a fixed replacement option', 'Help restore chewing function', 'Support natural-looking appearance', 'Can support a dental crown, bridge, or denture'],
    info: ['Suitability depends on bone and gum condition', 'A thorough examination is required before treatment', 'Treatment involves multiple stages over a period of time', 'Results vary from patient to patient'],
  },
  'braces': {
    description: 'Braces are orthodontic appliances attached to the teeth that apply gentle pressure to gradually move teeth into a better position over time. They may be used for crooked teeth, crowding, gaps, and certain bite problems. Treatment duration varies from patient to patient.',
    benefits: ['Help address crooked or misaligned teeth', 'May assist with crowding or spacing issues', 'Can address certain bite problems', 'Available in different types'],
    info: ['Treatment duration varies by individual case', 'Regular adjustment appointments are required', 'Proper cleaning around braces is important', 'Consultation required to assess suitability'],
  },
  'invisible-aligners': {
    description: 'Invisible aligners are clear, removable trays custom-designed to gradually move teeth over time. They offer a less visible alternative to traditional braces for patients who are suitable candidates. Aligners are changed at regular intervals throughout treatment.',
    benefits: ['Less noticeable than traditional braces', 'Removable for eating and cleaning', 'Custom-made to fit your teeth', 'Suitable for certain orthodontic cases'],
    info: ['Not every orthodontic case is suitable for aligners', 'Aligners must be worn for the recommended number of hours daily', 'Consultation required to assess suitability', 'Results vary from patient to patient'],
  },
  'root-canal-treatment': {
    description: 'Root canal treatment may be recommended when the pulp inside a tooth is infected or severely inflamed due to deep decay, a cracked tooth, or repeated dental procedures. The procedure aims to clean the inside of the tooth, remove the affected pulp, and restore the tooth.',
    benefits: ['Address infected or inflamed tooth pulp', 'Help relieve associated toothache', 'Preserve the natural tooth where possible', 'Restore the function of the affected tooth'],
    info: ['A local anesthetic is used during treatment', 'A crown may be recommended to protect the tooth afterwards', 'Multiple visits may be required', 'Prompt treatment is recommended for infected teeth'],
  },
  'removable-denture': {
    description: 'A removable denture is a dental appliance designed to replace missing teeth. It can be taken out of the mouth for cleaning. Dentures can help with chewing, speech, and the appearance of the smile after tooth loss.',
    benefits: ['Replace multiple missing teeth', 'Removable for easy cleaning', 'Can help with chewing and speech', 'Custom-made to fit your mouth'],
    info: ['An adjustment period is normal when wearing new dentures', 'Adhesive may be used for additional stability', 'Regular dental check-ups are recommended', 'Dentures may need to be adjusted or replaced over time'],
  },
  'cast-partial-denture': {
    description: 'A cast partial denture is a removable dental appliance used to replace multiple missing teeth. It consists of a metal framework with attached artificial teeth and gum-colored acrylic. The framework is designed for stability and support.',
    benefits: ['Replace multiple missing teeth', 'Stable metal framework design', 'Removable for cleaning', 'Custom-made for your mouth'],
    info: ['An adjustment period is normal', 'Proper cleaning of the denture is important', 'Regular dental visits are recommended'],
  },
  'e-max': {
    description: 'E-Max is a dental ceramic material commonly used for crowns, veneers, and other dental restorations. It is known for its natural-looking translucency and aesthetic qualities, making it a popular option for visible teeth.',
    benefits: ['Natural-looking translucency', 'Used for crowns and other restorations', 'Aesthetic results for front teeth'],
    info: ['Suitability depends on tooth position and bite', 'Preparation of the tooth is required', 'Results vary from patient to patient'],
  },
  'zirconia': {
    description: 'Zirconia is a strong ceramic material used for dental crowns and restorations. It is valued for its combination of strength and natural appearance, making it a popular option for both front and back teeth.',
    benefits: ['Strong and durable material', 'Natural-looking appearance', 'Suitable for both front and back teeth', 'Tooth-colored restoration'],
    info: ['Preparation of the existing tooth is required', 'Suitability assessed during consultation', 'Results vary from patient to patient'],
  },
  'pfm': {
    description: 'PFM stands for Porcelain Fused to Metal. It is a type of dental crown that combines a metal framework for strength with tooth-colored porcelain on the outer surface for appearance. PFM crowns have been used in dentistry for many years.',
    benefits: ['Metal framework provides strength', 'Tooth-colored porcelain outer surface', 'Suitable for various clinical situations'],
    info: ['Preparation of the tooth is required', 'A small dark line may sometimes be visible at the gum line', 'Suitability discussed during consultation'],
  },
  'veneers': {
    description: 'Veneers are thin coverings, typically made of porcelain or composite, that are bonded to the front surface of teeth. They may be used for certain cosmetic concerns such as tooth discolouration, shape irregularities, or minor spacing.',
    benefits: ['Can address certain cosmetic concerns', 'Thin and natural-looking', 'Custom-made to match surrounding teeth'],
    info: ['Some removal of tooth structure may be required', 'Not suitable for all patients or all teeth', 'Veneers are not a substitute for general dental treatment', 'Consultation required to assess suitability'],
  },
  'tooth-extraction': {
    description: 'Tooth extraction involves the removal of a tooth from the mouth. It may be recommended in situations such as severe tooth damage, certain infections, impacted wisdom teeth, or for specific orthodontic reasons.',
    benefits: ['Address severely damaged or decayed teeth', 'Help with certain infections or abscesses', 'Required for impacted teeth in some cases'],
    info: ['Local anesthetic is used during the procedure', 'Post-extraction care instructions will be provided', 'Replacement options can be discussed after healing', 'Follow-up may be required'],
  },
  'scaling-polishing': {
    description: 'Scaling and polishing is a professional dental cleaning procedure. Scaling involves the removal of hardened plaque (calculus/tartar) from the teeth and along the gumline. Polishing removes surface stains and leaves teeth feeling smoother.',
    benefits: ['Remove tartar and hardened plaque', 'Remove certain surface stains', 'Help support gum health', 'Fresher feeling teeth'],
    info: ['This is not the same as professional teeth whitening', 'Some sensitivity after treatment is normal and usually temporary', 'Regular cleaning appointments are generally recommended'],
  },
  'dental-filling': {
    description: 'A dental filling is used to restore a tooth that has been affected by decay or minor damage. The dentist removes the affected tooth structure and fills the cavity with an appropriate filling material to restore the shape and function of the tooth.',
    benefits: ['Restore a decayed tooth', 'Prevent further decay from spreading', 'Restore normal tooth function', 'Available in tooth-colored composite materials'],
    info: ['The type of filling recommended depends on the extent of decay', 'Some sensitivity after a filling is normal and usually temporary', 'Maintaining good oral hygiene helps prevent further decay'],
  },
}

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) { navigate('/services'); return }
    setLoading(true)
    serviceApi.getBySlug(slug)
      .then((r) => {
        if (r.success && r.data) {
          setService(r.data)
          document.title = `${r.data.name} | Dental Oasis — Johar Town, Lahore`
        } else {
          setError(true)
        }
      })
      .catch(() => {
        // Use static content if API unavailable
        const staticContent = SERVICE_CONTENT[slug]
        if (staticContent) {
          const slugToName: Record<string, string> = {
            'checkup': 'Checkup', 'dental-implant': 'Dental Implant', 'braces': 'Braces',
            'invisible-aligners': 'Invisible Aligners', 'root-canal-treatment': 'Root Canal Treatment',
            'removable-denture': 'Removable Denture', 'cast-partial-denture': 'Cast Partial Denture',
            'e-max': 'E-Max', 'zirconia': 'Zirconia', 'pfm': 'PFM', 'veneers': 'Veneers',
            'tooth-extraction': 'Tooth Extraction', 'scaling-polishing': 'Scaling & Polishing',
            'dental-filling': 'Dental Filling',
          }
          const name = slugToName[slug] || slug
          document.title = `${name} | Dental Oasis`
          setService({ id: 0, name, slug, short_description: null, description: staticContent.description, image_url: `/services/${slug}.jpg`, is_active: true, created_at: '', updated_at: '' })
        } else {
          setError(true)
        }
      })
      .finally(() => setLoading(false))
  }, [slug, navigate])

  if (loading) return <PageLoader />

  if (error || !service) {
    return (
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-2xl text-white mb-4">Service not found</h1>
        <Link to="/services" className="btn-secondary">
          <ChevronLeft size={16} /> Back to Services
        </Link>
      </div>
    )
  }

  const content = SERVICE_CONTENT[service.slug] || { benefits: [], info: [], description: service.description || '' }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li><Link to="/services" className="hover:text-primary-400 transition-colors">Services</Link></li>
            <li aria-hidden="true"><ChevronRight size={14} /></li>
            <li className="text-gray-300" aria-current="page">{service.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          {service.image_url && (
            <div className="aspect-video bg-dark-700 rounded-2xl overflow-hidden mb-8">
              <img
                src={service.image_url}
                alt={`${service.name} dental treatment at Dental Oasis`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
              />
            </div>
          )}
          <div className="flex items-start gap-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{service.name}</h1>
            {service.name === 'Checkup' && (
              <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-sm font-semibold">
                FREE — Initial Checkup
              </span>
            )}
          </div>
          {service.short_description && (
            <p className="text-gray-400 text-lg mt-3">{service.short_description}</p>
          )}
        </div>

        {/* Description */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">About This Treatment</h2>
          <p className="text-gray-300 leading-relaxed">
            {content.description || service.description || 'Please contact us for more information about this service.'}
          </p>
        </div>

        {/* Benefits */}
        {content.benefits.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Potential Benefits & Uses</h2>
            <ul className="space-y-2">
              {content.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-gray-300 text-sm">
                  <CheckCircle size={15} className="text-teal-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Patient info */}
        {content.info.length > 0 && (
          <div className="card mb-8 border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold text-yellow-300 mb-3">Patient Information</h2>
                <ul className="space-y-2">
                  {content.info.map((info) => (
                    <li key={info} className="text-sm text-gray-400">{info}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Medical disclaimer */}
        <div className="card mb-10 border-gray-600/30 bg-dark-800/60">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400">Treatment Disclaimer:</strong> Treatment options vary from patient to patient. The information on this page is for educational purposes only and does not constitute medical advice. Please consult our dentist for a proper examination and personalized treatment recommendation.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary-900/60 to-dark-700 border border-primary-500/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-3">Interested in This Treatment?</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Book an appointment request and our team will contact you to discuss your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/appointment" className="btn-primary">
              <Calendar size={16} />
              Book an Appointment
            </Link>
            <Link to="/services" className="btn-ghost">
              <ChevronLeft size={16} />
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
