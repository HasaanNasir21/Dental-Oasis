import axios from 'axios'

const TOKEN_KEY = 'admin_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      return Promise.reject(new Error('Unable to connect to the server. Please try again.'))
    }
    if (
      error.response?.status === 401 &&
      window.location.pathname.startsWith('/admin') &&
      window.location.pathname !== '/admin/login'
    ) {
      tokenStorage.clear()
      window.dispatchEvent(new CustomEvent('admin-session-expired'))
    }
    return Promise.reject(error)
  }
)

export default apiClient
