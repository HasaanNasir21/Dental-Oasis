import { useCallback, useRef, useState } from 'react'
import {
  Paperclip,
  UploadCloud,
  Trash2,
  FileText,
  Image,
  X,
  AlertCircle,
} from 'lucide-react'
import { appointmentFileApi } from '../../services/appointmentFileApi'
import type { AppointmentFile } from '../../types'
import { useToast } from '../../context/ToastContext'
import { parseApiError } from '../../utils/errorHandler'
import LoadingSpinner from '../ui/LoadingSpinner'

const ACCEPTED = '.jpg,.jpeg,.png,.pdf'
const MAX_MB = 10

interface Props {
  appointmentId: number
  files: AppointmentFile[]
  onFilesChanged: (files: AppointmentFile[]) => void
}

function FileItem({
  file,
  onDelete,
}: {
  file: AppointmentFile
  onDelete: (id: number) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    onDelete(file.id)
  }

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700 border border-dark-500 group">
      {/* Thumbnail / icon */}
      {file.file_type === 'image' ? (
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
          title="View full image"
          aria-label={`View image ${file.file_name}`}
        >
          <img
            src={file.file_url}
            alt={file.file_name}
            className="w-12 h-12 object-cover rounded-md border border-dark-400 hover:opacity-80 transition-opacity"
          />
        </a>
      ) : (
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          title="Open PDF"
          aria-label={`Open PDF ${file.file_name}`}
        >
          <FileText size={22} className="text-red-400" />
        </a>
      )}

      {/* File info */}
      <div className="flex-1 min-w-0">
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white hover:text-primary-300 truncate block font-medium transition-colors"
        >
          {file.file_name}
        </a>
        <p className="text-xs text-gray-500 mt-0.5 uppercase">
          {file.file_type === 'pdf' ? 'PDF Document' : 'Image'}
        </p>
      </div>

      {/* Delete */}
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          aria-label={`Delete file ${file.file_name}`}
          title="Delete file"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-red-400">Delete?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {deleting ? '...' : 'Yes'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="p-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Cancel delete"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppointmentFiles({
  appointmentId,
  files,
  onFilesChanged,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleUpload = useCallback(
    async (file: File) => {
      setUploadError(null)

      // Client-side size guard
      if (file.size > MAX_MB * 1024 * 1024) {
        setUploadError(`File is too large. Maximum size is ${MAX_MB} MB.`)
        return
      }

      // Client-side type guard
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
        setUploadError('Only JPG, PNG, and PDF files are allowed.')
        return
      }

      setUploading(true)
      setUploadProgress(0)
      try {
        const res = await appointmentFileApi.upload(
          appointmentId,
          file,
          setUploadProgress,
        )
        if (res.success && res.data) {
          onFilesChanged([...files, res.data])
          showToast('File uploaded successfully.')
        }
      } catch (e) {
        setUploadError(parseApiError(e))
      } finally {
        setUploading(false)
        setUploadProgress(0)
        // Reset input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [appointmentId, files, onFilesChanged, showToast],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDelete = async (fileId: number) => {
    try {
      await appointmentFileApi.delete(appointmentId, fileId)
      onFilesChanged(files.filter((f) => f.id !== fileId))
      showToast('File deleted.')
    } catch (e) {
      showToast(parseApiError(e), 'error')
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Paperclip size={14} className="text-primary-400" />
        <p className="text-sm font-semibold text-white">
          Attachments
        </p>
        <span className="text-xs text-gray-500 ml-1">
          — X-rays, scans, PDFs ({files.length}/10)
        </span>
      </div>

      {/* Existing files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <FileItem key={f.id} file={f} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Upload zone — hidden when at limit */}
      {files.length < 10 && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload file — click or drag and drop"
            className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer
              ${dragOver
                ? 'border-primary-400 bg-primary-500/10'
                : 'border-dark-400 hover:border-primary-500/50 hover:bg-dark-700/60'
              }
              ${uploading ? 'pointer-events-none opacity-60' : ''}
            `}
            onClick={() => !uploading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <>
                <LoadingSpinner size="sm" />
                <p className="text-xs text-gray-400">
                  Uploading… {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                </p>
                {uploadProgress > 0 && (
                  <div className="w-full max-w-xs h-1 bg-dark-500 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <UploadCloud size={20} className="text-gray-500" />
                <p className="text-xs text-gray-400 text-center">
                  <span className="text-primary-400 font-medium">Click to upload</span>
                  {' '}or drag &amp; drop
                </p>
                <p className="text-xs text-gray-600">JPG, PNG or PDF · max {MAX_MB} MB</p>
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            onChange={handleFileInput}
            aria-hidden="true"
          />
        </>
      )}

      {/* Upload error */}
      {uploadError && (
        <div
          role="alert"
          className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300">{uploadError}</p>
        </div>
      )}
    </div>
  )
}
