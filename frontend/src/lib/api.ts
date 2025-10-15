import { useAuthStore } from '@/stores/auth'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  FinancialTransaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  FinancialSummary,
  PaginatedResponse
} from '@/types/api'

// Base URL for Netlify Functions
const NETLIFY_FUNCTIONS_BASE = '/.netlify/functions'

// Helper function to make fetch requests with auth
const makeRequest = async (url: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  // Handle auth errors
  if (response.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/auth-login`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/auth-register`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  getMe: async (): Promise<{ user: User }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/auth-me`)
  }
}

// Users API
export const usersApi = {
  getAll: async (): Promise<{ users: User[] }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getUsers`)
  },

  getById: async (id: string): Promise<{ user: User }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/users/${id}`)
  },

  create: async (data: Partial<User>): Promise<{ user: User }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createUser`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: Partial<User>): Promise<{ user: User }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/updateUser/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/deleteUser/${id}`, {
      method: 'DELETE'
    })
  }
}

// Events API
export const eventsApi = {
  getAll: async (): Promise<{ events: Event[] }> => {
    const events = await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getEvents`)
    return { events }
  },

  getById: async (id: string): Promise<{ event: Event }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/events/${id}`)
  },

  create: async (data: CreateEventRequest): Promise<{ event: Event }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createEvent`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: UpdateEventRequest): Promise<{ event: Event }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/updateEvent/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/deleteEvent/${id}`, {
      method: 'DELETE'
    })
  }
}

// Transactions API
export const transactionsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    type?: 'INCOME' | 'EXPENSE'
    category?: string
    startDate?: string
    endDate?: string
  }): Promise<PaginatedResponse<FinancialTransaction>> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const url = `${NETLIFY_FUNCTIONS_BASE}/getTransactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const raw = await makeRequest(url)
    return {
      data: raw.data,
      pagination: {
        page: raw.pagination.page,
        limit: raw.pagination.limit,
        total: raw.pagination.total,
        pages: raw.pagination.totalPages
      }
    }
  },

  getById: async (id: string): Promise<{ transaction: FinancialTransaction }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/transactions/${id}`)
  },

  create: async (data: CreateTransactionRequest): Promise<{ transaction: FinancialTransaction }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createTransaction`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: UpdateTransactionRequest): Promise<{ transaction: FinancialTransaction }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/updateTransaction/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/deleteTransaction/${id}`, {
      method: 'DELETE'
    })
  },

  getSummary: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<{ summary: FinancialSummary }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const url = `${NETLIFY_FUNCTIONS_BASE}/getFinancialSummary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await makeRequest(url)
  }
}
