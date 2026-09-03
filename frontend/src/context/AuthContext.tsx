import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/authApi'
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
    try {
      const res = await authApi.me()
      if (res.success && res.data) {
        setAdmin(res.data)
      } else {
        setAdmin(null)
      }
    } catch {
      setAdmin(null)
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
      setAdmin(res.data)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setAdmin(null)
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
