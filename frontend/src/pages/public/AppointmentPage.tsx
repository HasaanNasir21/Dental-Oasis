import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { CheckCircle, ChevronRight, AlertCircle } from 'lucide-react'
import { appointmentApi } from '../../services/appointmentApi'
import { parseApiError } from '../../utils/errorHandler'
import { APPOINTMENT_REASONS } from '../../types'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const schema = z
  .object({
    patient_name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
    contact_number: z
      .string()
      .min(7, 'Please enter a valid contact number')
      .max(20)
      .regex(/^[0-9+\-\s()]{7,20}$/, 'Please enter a valid contact number'),
    address: z.string().max(1000).optional().or(z.literal('')),
    reason: z.string().min(1, 'Please select a reason for your visit'),
    other_problem: z.string().max(2000).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.reason === 'Other' && (!data.other_problem || !data.other_problem.trim())) {
      ctx.addIssue({
        path: ['other_problem'],
        code: z.ZodIssueCode.custom,
        message: 'Please describe your problem when "Other" is selected.',
      })
    }
  })

type FormValues = z.infer<typeof schema>

export default function AppointmentPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '', address: '', other_problem: '' },
  })

  const reason = watch('reason')
  const showOtherField = reason === 'Other'

  useEffect(() => {
    document.title = 'Book an Appointment | Dental Oasis — Johar Town, Lahore'
  }, [])

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await appointmentApi.createPublic({
        patient_name: values.patient_name,
        contact_number: values.contact_number,
        address: values.address || undefined,
        reason: values.reason,
        other_problem: showOtherField ? values.other_problem || undefined : undefined,
      })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setServerError(parseApiError(err))
    }
  }

  if (submitted) {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-400" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Request Submitted</h1>
          <p className="text-lg text-gray-300 mb-3">Appointment request submitted successfully.</p>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Thank you. Our clinic will contact you to confirm your appointment date and time. Please note that your appointment is not confirmed until our team reaches out to you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/" className="btn-primary">Back to Home</Link>
            <Link to="/services" className="btn-secondary">Explore Services</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Book an Appointment</h1>
          <p className="text-gray-400 leading-relaxed">
            Fill in the form below and our team will contact you to confirm your appointment date and time.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm">
            <AlertCircle size={14} />
            This form creates an appointment request. Your appointment is confirmed only after we contact you.
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Appointment booking form">
            {/* Full Name */}
            <div className="mb-5">
              <label className="label" htmlFor="patient_name">
                Full Name <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="patient_name"
                type="text"
                className={`input ${errors.patient_name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
                autoComplete="name"
                aria-required="true"
                aria-describedby={errors.patient_name ? 'name-error' : undefined}
                {...register('patient_name')}
              />
              {errors.patient_name && (
                <p id="name-error" className="field-error" role="alert">{errors.patient_name.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div className="mb-5">
              <label className="label" htmlFor="contact_number">
                Contact Number <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                id="contact_number"
                type="tel"
                className={`input ${errors.contact_number ? 'border-red-500' : ''}`}
                placeholder="e.g. 0300 0000000"
                autoComplete="tel"
                aria-required="true"
                aria-describedby={errors.contact_number ? 'contact-error' : undefined}
                {...register('contact_number')}
              />
              {errors.contact_number && (
                <p id="contact-error" className="field-error" role="alert">{errors.contact_number.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="mb-5">
              <label className="label" htmlFor="address">Address</label>
              <textarea
                id="address"
                rows={2}
                className="input resize-none"
                placeholder="Your address (optional)"
                autoComplete="street-address"
                {...register('address')}
              />
            </div>

            {/* Reason */}
            <div className="mb-5">
              <label className="label" htmlFor="reason">
                Reason for Visit <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <select
                id="reason"
                className={`input ${errors.reason ? 'border-red-500' : ''}`}
                aria-required="true"
                aria-describedby={errors.reason ? 'reason-error' : undefined}
                {...register('reason')}
              >
                <option value="">Select a reason...</option>
                {APPOINTMENT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.reason && (
                <p id="reason-error" className="field-error" role="alert">{errors.reason.message}</p>
              )}
            </div>

            {/* Other problem — shown conditionally */}
            {showOtherField && (
              <div className="mb-5 animate-fade-in">
                <label className="label" htmlFor="other_problem">
                  Please describe your problem <span className="text-red-400" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="other_problem"
                  rows={4}
                  className={`input resize-none ${errors.other_problem ? 'border-red-500' : ''}`}
                  placeholder="Please describe your dental concern..."
                  aria-required="true"
                  aria-describedby={errors.other_problem ? 'other-error' : undefined}
                  {...register('other_problem')}
                />
                {errors.other_problem && (
                  <p id="other-error" className="field-error" role="alert">{errors.other_problem.message}</p>
                )}
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3" role="alert">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center text-base py-3.5"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Appointment Request
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By submitting this form, you agree to be contacted by our clinic to confirm your appointment.
              Your appointment is not confirmed until our team reaches out to you.
            </p>
          </form>
        </div>

        {/* Info */}
        <div className="mt-8 card border-blue-500/20 bg-blue-500/5">
          <h2 className="text-base font-semibold text-white mb-3">What Happens Next?</h2>
          <ol className="space-y-2">
            {[
              'We receive your appointment request.',
              'Our team reviews your request and contacts you.',
              'We agree on a suitable date and time.',
              'Your appointment is confirmed.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-600/30 text-primary-300 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
