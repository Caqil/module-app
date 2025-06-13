// Auth types

import { BaseEntity, UserRole } from "./global"

export interface User extends BaseEntity {
  email: string
  password: string
  firstName: string
  lastName: string
  avatar?: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: Date
  loginAttempts: number
  lockUntil?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  metadata: Record<string, any>
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  avatar?: string
  role?: UserRole
  isActive?: boolean
  preferences?: Partial<User['preferences']>
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  agreeToTerms: boolean
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface AuthSession {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    avatar?: string
    isActive: boolean
  }
  expires: string
  accessToken: string
  refreshToken?: string
}

export interface AuthContextType {
  user: AuthSession['user'] | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  refreshSession: () => Promise<void>
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
  confirmPassword: string
}

export interface EmailVerification {
  token: string
}
