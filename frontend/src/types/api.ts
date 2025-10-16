// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MEMBER'
  birthDate?: string
  phone?: string
  ministryEntryDate: string
  photoUrl?: string
  createdAt: string
  updatedAt: string
}

// User create/update requests
export interface CreateUserRequest {
  name: string
  email: string
  password?: string
  role: 'ADMIN' | 'MEMBER'
  birthDate?: string
  phone?: string
  photoUrl?: string
}

export interface UpdateUserRequest extends Partial<
  Omit<CreateUserRequest, 'role'>
> {
  role?: 'ADMIN' | 'MEMBER'
}

// Event types
export interface Event {
  id: string
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
  authorId: string
  author: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

// Financial Transaction types
export interface FinancialTransaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category?: string
  date: string
  proofUrl?: string
  authorId: string
  author: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

// API Response types
export interface ApiResponse<T> {
  message?: string
  data?: T
  error?: string
  details?: any[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  birthDate?: string
  role?: 'ADMIN' | 'MEMBER'
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

// Password change (self-service)
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
}

// Event types
export interface CreateEventRequest {
  title: string
  description?: string
  location?: string
  startTime: string
  endTime: string
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

// Transaction types
export interface CreateTransactionRequest {
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category?: string
  date: string
  proofUrl?: string
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {}

// Financial Summary
export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  incomeCount: number
  expenseCount: number
}

// Devotional types
export interface DevotionalPost {
  id: string
  title: string
  content: string
  frequency: 'WEEKLY' | 'MONTHLY'
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateDevotionalRequest {
  title: string
  content: string
  frequency: 'WEEKLY' | 'MONTHLY'
  publishedAt?: string
}

export interface UpdateDevotionalRequest extends Partial<CreateDevotionalRequest> {}

// Observation types
export interface Observation {
  id: string
  title: string
  content: string
  category?: string | null
  publishedAt: string
  authorId?: string | null
  author?: {
    id: string
    name: string
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface CreateObservationRequest {
  title: string
  content: string
  category?: string
  publishedAt?: string
}

export interface UpdateObservationRequest extends Partial<CreateObservationRequest> {}

