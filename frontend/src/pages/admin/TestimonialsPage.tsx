import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, AlertCircle, Save } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { testimonialApi } from '../../services/testimonialApi'
import type { Testimonial, PaginationMeta } from '../../types'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import { parseApiError, formatDate } from '../../utils/errorHandler'
import { useToast } from '../../context/ToastContext'

// ---- Schemas ----
const testimonialSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  content: z.string().min(10, 'Testimonial must be at least 10 characters').max(2000),
  rating: z.number().int().min(1).max(5),
  is_published: z.boolean(),
})
type TestimonialFormValues = z.infer<typeof testimonialSchema>

// ---- Star Rating Input ----
function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (val: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          aria-pressed={value >= star}
        >
          <Star
            size={22}
            className={
              (hovered ? hovered >= star : value >= star)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600'
            }
          />
        </button>
      ))}
    </div>
  )
}

// ---- Star Display ----
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ---- Testimonial Form Modal ----
function TestimonialFormModal({
  testimonial,
  onClose,
  onSaved,
}: {
  testimonial: Testimonial | null
  onClose: () => void
  onSaved: () => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { showToast } = useToast()
  const isEdit = !!testimonial

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: testimonial?.name ?? '',
      content: testimonial?.content ?? '',
      rating: testimonial?.rating ?? 5,
      is_published: testimonial?.is_published ?? false,
    },
  })

  const onSubmit = async (values: TestimonialFormValues) => {
    setServerError(null)
    try {
      if (isEdit && testimonial) {
        await testimonialApi.update(testimonial.id, values)
        showToast('Testimonial updated successfully.')
      } else {
        await testimonialApi.create(values)
        showToast('Testimonial created successfully.')
      }
      onSaved()
      onClose()
    } catch (e) {
      setServerError(parseApiError(e))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Testimonial' : 'Add Testimonial'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label className="label" htmlFor="t-name">
            Patient Name <span className="text-red-400">*</span>
          </label>
          <input
            id="t-name"
            type="text"
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g. Ali Raza"
            {...register('name')}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        {/* Content */}
        <div>
          <label className="label" htmlFor="t-content">
            Testimonial <span className="text-red-400">*</span>
          </label>
          <textarea
            id="t-content"
            rows={4}
            className={`input resize-none ${errors.content ? 'border-red-500' : ''}`}
            placeholder="What did the patient say about their experience?"
            {...register('content')}
          />
          {errors.content && <p className="field-error">{errors.content.message}</p>}
        </div>

        {/* Rating */}
        <div>
          <label className="label">Rating <span className="text-red-400">*</span></label>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <StarRatingInput value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.rating && <p className="field-error">{errors.rating.message}</p>}
        </div>

        {/* Published toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <Controller
              name="is_published"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    field.value ? 'bg-primary-600' : 'bg-dark-400'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      field.value ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}
            />
            <span className="text-sm text-gray-300">Published (visible on public website)</span>
          </label>
        </div>

        {serverError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2" role="alert">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{serverError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
            {isSubmitting ? <LoadingSpinner size="sm" /> : <Save size={14} />}
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Add Testimonial'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---- Main Page ----
export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [formTestimonial, setFormTestimonial] = useState<Testimonial | null | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const { showToast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    testimonialApi.list({ page, page_size: 20 })
      .then((r) => {
        setTestimonials(r.data)
        setMeta(r.meta)
      })
      .catch((e) => setError(parseApiError(e)))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    document.title = 'Testimonials | Dental Oasis Admin'
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await testimonialApi.delete(deleteId)
      showToast('Testimonial deleted successfully.')
      setDeleteId(null)
      load()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const togglePublished = async (t: Testimonial) => {
    setTogglingId(t.id)
    try {
      await testimonialApi.update(t.id, { is_published: !t.is_published })
      showToast(t.is_published ? 'Testimonial unpublished.' : 'Testimonial published.')
      load()
    } catch (e) {
      showToast(parseApiError(e), 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Testimonials</h1>
          <p className="text-sm text-gray-400 mt-1">Manage patient testimonials shown on the public website</p>
        </div>
        <button onClick={() => setFormTestimonial(null)} className="btn-primary text-sm">
          <Plus size={16} />
          Add Testimonial
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : testimonials.length === 0 ? (
        <EmptyState
          title="No testimonials yet."
          description="Add testimonials to display patient feedback on the public website."
          action={
            <button onClick={() => setFormTestimonial(null)} className="btn-primary text-sm">
              <Plus size={16} /> Add Testimonial
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className={`card flex flex-col gap-3 ${
                  t.is_published ? '' : 'opacity-70 border-dashed'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarDisplay rating={t.rating} />
                      <span className="text-xs text-gray-500">{formatDate(t.created_at)}</span>
                    </div>
                  </div>
                  <span
                    className={`badge text-xs flex-shrink-0 ${
                      t.is_published
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {t.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-400 leading-relaxed flex-1 line-clamp-4">
                  "{t.content}"
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-dark-500">
                  <button
                    onClick={() => togglePublished(t)}
                    disabled={togglingId === t.id}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      t.is_published
                        ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                        : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                    }`}
                    aria-label={t.is_published ? 'Unpublish testimonial' : 'Publish testimonial'}
                  >
                    {togglingId === t.id ? (
                      <LoadingSpinner size="sm" />
                    ) : t.is_published ? (
                      <EyeOff size={13} />
                    ) : (
                      <Eye size={13} />
                    )}
                    {t.is_published ? 'Unpublish' : 'Publish'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFormTestimonial(t)}
                      className="p-1.5 rounded text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                      aria-label={`Edit testimonial by ${t.name}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => { setDeleteId(t.id); setDeleteName(t.name) }}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label={`Delete testimonial by ${t.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      {/* Form Modal */}
      {formTestimonial !== undefined && (
        <TestimonialFormModal
          testimonial={formTestimonial}
          onClose={() => setFormTestimonial(undefined)}
          onSaved={load}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${deleteName}"? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  )
}
