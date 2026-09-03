import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/authApi'
import { tokenStorage } from '../services/apiClient'
import type { AdminInfo } from '../types'

interface AuthContextValue {
  admin: AdminInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    // If no token stored, skip the /me call entirely
    if (!tokenStorage.get()) {
      setAdmin(null)
      setIsLoading(false)
      return
    }
    try {
      const res = await authApi.me()
      if (res.success && res.data) {
        setAdmin(res.data)
      } else {
        setAdmin(null)
        tokenStorage.clear()
      }
    } catch {
      setAdmin(null)
      tokenStorage.clear()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const onExpired = () => {
      setAdmin(null)
      tokenStorage.clear()
      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login')
      }
    }
    window.addEventListener('admin-session-expired', onExpired)
    return () => window.removeEventListener('admin-session-expired', onExpired)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    if (res.success && res.data) {
      // Store token from response for cross-domain auth
      if (res.token) {
        tokenStorage.set(res.token)
      }
      setAdmin(res.data)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setAdmin(null)
      tokenStorage.clear()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
