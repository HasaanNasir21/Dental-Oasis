import apiClient from './apiClient'
import type { ApiResponse, AppointmentFile } from '../types'

export const appointmentFileApi = {
  /** List all files attached to an appointment */
  list: async (appointmentId: number): Promise<ApiResponse<AppointmentFile[]>> => {
    const res = await apiClient.get(`/api/admin/appointments/${appointmentId}/files`)
    return res.data
  },

  /** Upload a file (jpg, png, pdf) to an appointment */
  upload: async (
    appointmentId: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<ApiResponse<AppointmentFile>> => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiClient.post(
      `/api/admin/appointments/${appointmentId}/files`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (e) => {
              if (e.total) onProgress(Math.round((e.loaded * 100) / e.total))
            }
          : undefined,
      },
    )
    return res.data
  },

  /** Delete a file from an appointment */
  delete: async (
    appointmentId: number,
    fileId: number,
  ): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(
      `/api/admin/appointments/${appointmentId}/files/${fileId}`,
    )
    return res.data
  },
}
