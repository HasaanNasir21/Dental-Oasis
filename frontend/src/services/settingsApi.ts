import apiClient from './apiClient'
import type { ApiResponse, ClinicInfo } from '../types'

export const settingsApi = {
  get: async (): Promise<ApiResponse<ClinicInfo>> => {
    const res = await apiClient.get('/api/admin/settings')
    return res.data
  },

  getPublic: async (): Promise<ApiResponse<ClinicInfo>> => {
    const res = await apiClient.get('/api/clinic')
    return res.data
  },

  update: async (data: Partial<{
    name: string
    address: string
    phone: string | null
    whatsapp: string | null
    email: string | null
    google_maps_url: string | null
    hours_monday_saturday: string
    hours_sunday: string
    social_facebook: string | null
    social_instagram: string | null
  }>): Promise<ApiResponse<ClinicInfo>> => {
    const res = await apiClient.patch('/api/admin/settings', data)
    return res.data
  },
}
