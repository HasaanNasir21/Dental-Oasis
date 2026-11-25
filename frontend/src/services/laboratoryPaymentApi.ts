import apiClient from './apiClient'
import type {
  ApiResponse,
  LaboratoryPayment,
  LaboratoryPaymentCreate,
  LaboratoryPaymentUpdate,
  MonthlyPaymentSummary,
  LaboratoryPaymentStats,
} from '../types'

const BASE_URL = '/laboratory-payments'

export const laboratoryPaymentApi = {
  /**
   * Create a new payment for a laboratory
   */
  async create(data: LaboratoryPaymentCreate): Promise<ApiResponse<LaboratoryPayment>> {
    const response = await apiClient.post<ApiResponse<LaboratoryPayment>>(BASE_URL, data)
    return response.data
  },

  /**
   * Get a payment by ID
   */
  async getById(id: number): Promise<ApiResponse<LaboratoryPayment>> {
    const response = await apiClient.get<ApiResponse<LaboratoryPayment>>(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Update a payment
   */
  async update(id: number, data: LaboratoryPaymentUpdate): Promise<ApiResponse<LaboratoryPayment>> {
    const response = await apiClient.put<ApiResponse<LaboratoryPayment>>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  /**
   * Delete a payment
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Get payments for a specific month
   */
  async getMonthlyPayments(
    laboratoryId: number,
    year: number,
    month: number,
  ): Promise<ApiResponse<MonthlyPaymentSummary>> {
    const response = await apiClient.get<ApiResponse<MonthlyPaymentSummary>>(
      `${BASE_URL}/laboratory/${laboratoryId}/monthly`,
      { params: { year, month } },
    )
    return response.data
  },

  /**
   * Get current month payments for a laboratory
   */
  async getCurrentMonthPayments(laboratoryId: number): Promise<ApiResponse<MonthlyPaymentSummary>> {
    const response = await apiClient.get<ApiResponse<MonthlyPaymentSummary>>(
      `${BASE_URL}/laboratory/${laboratoryId}/current-month`,
    )
    return response.data
  },

  /**
   * Get payment statistics for a laboratory
   */
  async getStats(laboratoryId: number): Promise<ApiResponse<LaboratoryPaymentStats>> {
    const response = await apiClient.get<ApiResponse<LaboratoryPaymentStats>>(
      `${BASE_URL}/laboratory/${laboratoryId}/stats`,
    )
    return response.data
  },
}
