import apiClient from './apiClient'
import type {
  ApiResponse,
  MonthlyHistoryResponse,
  CurrentMonthPayments,
  MonthlyPaymentSummary,
  MonthlyRolloverResult,
} from '../types'

export const monthlyPaymentApi = {
  /** Full history: current month live + last 12 archived months */
  getHistory: async (): Promise<ApiResponse<MonthlyHistoryResponse>> => {
    const res = await apiClient.get('/api/admin/payments/history')
    return res.data
  },

  /** Live payment totals for the current calendar month */
  getCurrentMonth: async (): Promise<ApiResponse<CurrentMonthPayments>> => {
    const res = await apiClient.get('/api/admin/payments/current-month')
    return res.data
  },

  /** Archived monthly summaries for a single patient */
  getPatientHistory: async (
    clientId: number,
    limit = 12,
  ): Promise<ApiResponse<MonthlyPaymentSummary[]>> => {
    const res = await apiClient.get(`/api/admin/payments/client/${clientId}`, {
      params: { limit },
    })
    return res.data
  },

  /**
   * Manually trigger a monthly rollover.
   * Omit year/month to archive the previous calendar month.
   */
  triggerRollover: async (
    year?: number,
    month?: number,
  ): Promise<ApiResponse<MonthlyRolloverResult>> => {
    const params: Record<string, number> = {}
    if (year !== undefined) params.year = year
    if (month !== undefined) params.month = month
    const res = await apiClient.post('/api/admin/payments/rollover', null, { params })
    return res.data
  },
}
