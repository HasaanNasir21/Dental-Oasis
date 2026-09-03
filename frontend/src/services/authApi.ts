import apiClient from './apiClient'
import type { ApiResponse, AdminInfo } from '../types'

export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse<AdminInfo>> => {
    const res = await apiClient.post('/api/auth/login', { username, password })
    return res.data
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const res = await apiClient.post('/api/auth/logout')
    return res.data
  },

  me: async (): Promise<ApiResponse<AdminInfo>> => {
    const res = await apiClient.get('/api/auth/me')
    return res.data
  },
}
