import apiClient from './apiClient'
import type { ApiResponse, PaginatedResponse, Testimonial } from '../types'

export const testimonialApi = {
  // Public
  getPublished: async (): Promise<ApiResponse<Testimonial[]>> => {
    const res = await apiClient.get('/api/testimonials')
    return res.data
  },

  // Admin
  list: async (params: { page?: number; page_size?: number }): Promise<PaginatedResponse<Testimonial>> => {
    const res = await apiClient.get('/api/admin/testimonials', { params })
    return res.data
  },

  create: async (data: { name: string; content: string; rating: number; is_published: boolean }): Promise<ApiResponse<Testimonial>> => {
    const res = await apiClient.post('/api/admin/testimonials', data)
    return res.data
  },

  update: async (
    id: number,
    data: { name?: string; content?: string; rating?: number; is_published?: boolean }
  ): Promise<ApiResponse<Testimonial>> => {
    const res = await apiClient.patch(`/api/admin/testimonials/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/testimonials/${id}`)
    return res.data
  },
}
