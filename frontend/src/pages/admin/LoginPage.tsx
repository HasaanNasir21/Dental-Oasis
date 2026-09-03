import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { parseApiError } from '../../utils/errorHandler'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard'

  useEffect(() => {
    document.title = 'Admin Login | Dental Oasis'
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, isLoading, navigate, from])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ username, password }: FormValues) => {
    setServerError(null)
    try {
      await login(username, password)
      // Navigation is handled by the useEffect above once isAuthenticated becomes true
    } catch (err) {
      setServerError(parseApiError(err))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-40 w-80 h-80 bg-dark-800/60 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4">
            <svg viewBox="0 0 24 24" fill="white" width="28" height="28" aria-hidden="true">
              <path d="M12 2C8.5 2 5 4.5 5 8c0 2 .5 4 1.5 5.5L8 20c.5 2 1.5 2 2 2s1-.5 1.5-1.5L12 18l.5 2.5c.5 1 1 1.5 1.5 1.5s1.5 0 2-2l1.5-6.5C18.5 12 19 10 19 8c0-3.5-3.5-6-7-6z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Dental Oasis</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Admin login form">
            {/* Username */}
            <div className="mb-4">
              <label className="label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={`input ${errors.username ? 'border-red-500' : ''}`}
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
                aria-required="true"
                {...register('username')}
              />
              {errors.username && (
                <p className="field-error" role="alert">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  aria-required="true"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="field-error" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2" role="alert">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-3"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
