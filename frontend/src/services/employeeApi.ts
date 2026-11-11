import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  Employee,
  EmployeeListItem,
  EmployeeOption,
  EmployeeCreate,
  EmployeeUpdate,
  EmployeePayment,
  EmployeePaymentListItem,
  EmployeePaymentCreate,
  EmployeePaymentUpdate,
  PaymentSummary,
  EmployeeSummary,
} from '../types'

export const employeeApi = {
  // ---- Employees ----
  list: async (params: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<PaginatedResponse<EmployeeListItem>> => {
    const res = await apiClient.get('/api/admin/employees', { params })
    return res.data
  },

  listAll: async (): Promise<ApiResponse<EmployeeOption[]>> => {
    const res = await apiClient.get('/api/admin/employees/all')
    return res.data
  },

  create: async (data: EmployeeCreate): Promise<ApiResponse<Employee>> => {
    const res = await apiClient.post('/api/admin/employees', data)
    return res.data
  },

  getById: async (id: number): Promise<ApiResponse<Employee>> => {
    const res = await apiClient.get(`/api/admin/employees/${id}`)
    return res.data
  },

  update: async (id: number, data: EmployeeUpdate): Promise<ApiResponse<Employee>> => {
    const res = await apiClient.patch(`/api/admin/employees/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/employees/${id}`)
    return res.data
  },

  getPayments: async (id: number): Promise<ApiResponse<EmployeePayment[]>> => {
    const res = await apiClient.get(`/api/admin/employees/${id}/payments`)
    return res.data
  },

  getSummary: async (id: number): Promise<ApiResponse<EmployeeSummary>> => {
    const res = await apiClient.get(`/api/admin/employees/${id}/summary`)
    return res.data
  },

  // ---- Employee Payments ----
  listPayments: async (params: {
    page?: number
    page_size?: number
    employee_id?: number
    from_date?: string
    to_date?: string
  }): Promise<PaginatedResponse<EmployeePaymentListItem>> => {
    const res = await apiClient.get('/api/admin/employee-payments', { params })
    return res.data
  },

  getPaymentSummary: async (params: {
    employee_id?: number
    from_date?: string
    to_date?: string
  }): Promise<ApiResponse<PaymentSummary>> => {
    const res = await apiClient.get('/api/admin/employee-payments/summary', { params })
    return res.data
  },

  createPayment: async (data: EmployeePaymentCreate): Promise<ApiResponse<EmployeePayment>> => {
    const res = await apiClient.post('/api/admin/employee-payments', data)
    return res.data
  },

  getPaymentById: async (id: number): Promise<ApiResponse<EmployeePayment>> => {
    const res = await apiClient.get(`/api/admin/employee-payments/${id}`)
    return res.data
  },

  updatePayment: async (id: number, data: EmployeePaymentUpdate): Promise<ApiResponse<EmployeePayment>> => {
    const res = await apiClient.patch(`/api/admin/employee-payments/${id}`, data)
    return res.data
  },

  deletePayment: async (id: number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete(`/api/admin/employee-payments/${id}`)
    return res.data
  },
}
