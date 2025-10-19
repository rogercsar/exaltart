import { useAuthStore } from '@/stores/auth'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
  User,
  Event,
  CreateEventRequest,
  UpdateEventRequest,
  FinancialTransaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  FinancialSummary,
  DevotionalPost,
  CreateDevotionalRequest,
  UpdateDevotionalRequest,
  PaginatedResponse,
  CreateUserRequest,
  UpdateUserRequest,
  Rehearsal,
  CreateRehearsalRequest,
  UpdateRehearsalRequest,
  AttendanceRecord,
  SetAttendanceRequestRecord
} from '@/types/api'

// Base URL for Netlify Functions (supports env override)
const NETLIFY_FUNCTIONS_BASE = (import.meta as any).env?.VITE_NETLIFY_BASE_URL
  ? String((import.meta as any).env.VITE_NETLIFY_BASE_URL).replace(/\/$/, '')
  : '/.netlify/functions'

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
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  getMe: async (): Promise<{ user: User }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/me`)
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/changePassword`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

// Devotionals API
export const devotionalsApi = {
  getAll: async (params?: { page?: number; limit?: number; order?: string; q?: string; frequency?: 'WEEKLY' | 'MONTHLY'; startDate?: string; endDate?: string }): Promise<PaginatedResponse<DevotionalPost>> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = `${NETLIFY_FUNCTIONS_BASE}/getDevotionals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await makeRequest(url)
  },

  create: async (data: CreateDevotionalRequest): Promise<{ devotional: DevotionalPost }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createDevotional`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: UpdateDevotionalRequest): Promise<{ devotional: DevotionalPost }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/updateDevotional?id=${encodeURIComponent(id)}`
    return await makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/deleteDevotional?id=${encodeURIComponent(id)}`
    return await makeRequest(url, {
      method: 'DELETE'
    })
  },

  getById: async (id: string): Promise<{ devotional: DevotionalPost }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getDevotionalById/${id}`)
  }
}

// Observations API
export const observationsApi = {
  getAll: async (params?: { page?: number; limit?: number; order?: string; q?: string; category?: string; startDate?: string; endDate?: string }): Promise<PaginatedResponse<import('@/types/api').Observation>> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = `${NETLIFY_FUNCTIONS_BASE}/getObservations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await makeRequest(url)
  },

  create: async (data: import('@/types/api').CreateObservationRequest): Promise<{ observation: import('@/types/api').Observation }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createObservation`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: import('@/types/api').UpdateObservationRequest): Promise<{ observation: import('@/types/api').Observation }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/updateObservation${id ? `?id=${encodeURIComponent(id)}` : ''}`
    return await makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/deleteObservation${id ? `?id=${encodeURIComponent(id)}` : ''}`
    return await makeRequest(url, {
      method: 'DELETE'
    })
  },

  getById: async (id: string): Promise<{ observation: import('@/types/api').Observation }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getObservationById/${id}`)
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

  create: async (data: CreateUserRequest): Promise<{ user: User }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createUser`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: UpdateUserRequest): Promise<{ user: User }> => {
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
    const raw = await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getEvents`)
    const events = Array.isArray(raw) ? raw : (raw?.events ?? [])
    return { events }
  },

  getById: async (id: string): Promise<{ event: Event }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getEventById/${id}`)
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

// Groups API
export const groupsApi = {
  getAll: async (): Promise<{ groups: import('@/types/api').Group[] }> => {
    const raw = await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getGroups`)
    const groups = (raw?.data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description || '',
      memberIds: Array.isArray(g.members) ? g.members.map((m: any) => m.id) : [],
      members: g.members || [],
      createdById: g.createdBy || '',
      createdAt: g.createdAt,
      updatedAt: g.updatedAt
    }))
    return { groups }
  },

  create: async (data: import('@/types/api').CreateGroupRequest): Promise<{ group: import('@/types/api').Group }> => {
    const raw = await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createGroup`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    const g = raw.group
    return {
      group: {
        id: g.id,
        name: g.name,
        description: g.description || '',
        memberIds: Array.isArray(g.members) ? g.members.map((m: any) => m.id) : [],
        members: g.members || [],
        createdById: g.createdBy || '',
        createdAt: g.createdAt,
        updatedAt: g.updatedAt
      }
    }
  },

  update: async (id: string, data: import('@/types/api').UpdateGroupRequest): Promise<{ group: import('@/types/api').Group }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/updateGroup?id=${encodeURIComponent(id)}`
    const raw = await makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    const g = raw.group
    return {
      group: {
        id: g.id,
        name: g.name,
        description: g.description || '',
        memberIds: Array.isArray(g.members) ? g.members.map((m: any) => m.id) : [],
        members: g.members || [],
        createdById: g.createdBy || '',
        createdAt: g.createdAt,
        updatedAt: g.updatedAt
      }
    }
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/deleteGroup?id=${encodeURIComponent(id)}`
    return await makeRequest(url, { method: 'DELETE' })
  }
}

// Scales API
export const scalesApi = {
  getAll: async (params?: { month?: string; groupId?: string }): Promise<{ scales: any[] }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    const url = `${NETLIFY_FUNCTIONS_BASE}/getScales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const raw = await makeRequest(url)
    const scales = (raw?.data || []).map((s: any) => ({
      id: s.id,
      weekStart: s.weekStart,
      weekEnd: s.weekEnd,
      groupId: s.groupId || undefined,
      assignedMemberIds: Array.isArray(s.members) ? s.members.map((m: any) => m.id) : [],
      status: s.status,
      createdById: s.createdBy || '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      members: s.members || []
    }))
    return { scales }
  },

  create: async (data: import('@/types/api').CreateScaleRequest): Promise<{ scale: any }> => {
    const raw = await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createScale`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    const s = raw.scale
    return { scale: s }
  },

  update: async (id: string, data: import('@/types/api').UpdateScaleRequest): Promise<{ scale: any }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/updateScale?id=${encodeURIComponent(id)}`
    const raw = await makeRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    return { scale: raw.scale }
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/deleteScale?id=${encodeURIComponent(id)}`
    return await makeRequest(url, { method: 'DELETE' })
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

// Rehearsals API
export const rehearsalsApi = {
  getAll: async (): Promise<{ rehearsals: Rehearsal[] }> => {
    const raw = await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getRehearsals`)
    const rehearsals = Array.isArray(raw) ? raw : (raw?.rehearsals ?? [])
    return { rehearsals }
  },

  getById: async (id: string): Promise<{ rehearsal: Rehearsal }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/getRehearsalById/${id}`)
  },

  create: async (data: CreateRehearsalRequest): Promise<{ rehearsal: Rehearsal }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/createRehearsal`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: string, data: UpdateRehearsalRequest): Promise<{ rehearsal: Rehearsal }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/updateRehearsal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/deleteRehearsal/${id}`, {
      method: 'DELETE'
    })
  }
}

// Attendance API
export const attendanceApi = {
  getByRehearsal: async (rehearsalId: string): Promise<{ records: AttendanceRecord[] }> => {
    const url = `${NETLIFY_FUNCTIONS_BASE}/getAttendanceByRehearsal?rehearsalId=${encodeURIComponent(rehearsalId)}`
    return await makeRequest(url)
  },

  setForRehearsal: async (
    rehearsalId: string,
    records: SetAttendanceRequestRecord[]
  ): Promise<{ records: AttendanceRecord[] }> => {
    return await makeRequest(`${NETLIFY_FUNCTIONS_BASE}/setAttendance`, {
      method: 'POST',
      body: JSON.stringify({ rehearsalId, records })
    })
  }
}
