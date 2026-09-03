import apiClient from './apiClient'
import type { ApiResponse, DashboardStats } from '../types'

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const res = await apiClient.get('/api/admin/dashboard')
    return res.data
  },
}
