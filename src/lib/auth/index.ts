
import { NextRequest } from 'next/server'
import { sessionManager } from './session'
import { authMiddleware } from './middleware'
import { 
  AuthSession, 
  User, 
  LoginCredentials, 
  RegisterCredentials
} from '@/types/auth'
import { UserRole } from '@/types/global'

// Re-export everything for convenient imports
export { sessionManager } from './session'
export { authMiddleware, protectRoute, protectAdminRoute, protectAPIRoute } from './middleware'
export type { AuthMiddlewareOptions } from './middleware'

// Main Auth class with high-level methods
export class Auth {
  private static instance: Auth
  
  private constructor() {}
  
  static getInstance(): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth()
    }
    return Auth.instance
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<{ user: User; session: AuthSession } | { error: string }> {
    return sessionManager.authenticateUser(credentials)
  }

  async register(credentials: RegisterCredentials): Promise<{ user: User; session: AuthSession } | { error: string }> {
    return sessionManager.registerUser(credentials)
  }

  async logout(): Promise<void> {
    // Session cleanup is handled by clearing cookies in the API route
    // This method exists for consistency and future expansion
  }

  // Session methods
  async getSession(request?: NextRequest): Promise<AuthSession | null> {
    if (request) {
      return sessionManager.getSession(request)
    } else {
      // Server-side only - get from cookies
      return sessionManager.getSessionFromCookies()
    }
  }

  async refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; session: AuthSession } | null> {
    return sessionManager.refreshSession(refreshToken)
  }

  // Password reset methods
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return sessionManager.requestPasswordReset(email)
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return sessionManager.resetPassword(token, newPassword)
  }

  // Email verification methods
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return sessionManager.verifyEmail(token)
  }

  // Utility methods
  isAuthenticated(session: AuthSession | null): boolean {
    return !!session && new Date(session.expires) > new Date()
  }

  hasRole(session: AuthSession | null, role: UserRole): boolean {
    if (!session) return false
    
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    }

    return roleHierarchy[session.user.role] >= roleHierarchy[role]
  }

  isAdmin(session: AuthSession | null): boolean {
    return this.hasRole(session, 'admin')
  }

  isModerator(session: AuthSession | null): boolean {
    return this.hasRole(session, 'moderator')
  }

  // Get user from session
  getUser(session: AuthSession | null): AuthSession['user'] | null {
    return session?.user || null
  }

  // Check if session is expired
  isExpired(session: AuthSession | null): boolean {
    return !session || new Date(session.expires) <= new Date()
  }

  // Get time until session expires
  getTimeUntilExpiry(session: AuthSession | null): number {
    if (!session) return 0
    return Math.max(0, new Date(session.expires).getTime() - Date.now())
  }
}

// Singleton instance
export const auth = Auth.getInstance()

// Server-side auth helpers
export async function getCurrentUser(): Promise<AuthSession['user'] | null> {
  const session = await auth.getSession()
  return session?.user || null
}

export async function requireAuth(): Promise<AuthSession['user']> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireRole(role: UserRole): Promise<AuthSession['user']> {
  const user = await requireAuth()
  if (!auth.hasRole({ user, expires: '', accessToken: '' }, role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

export async function requireAdmin(): Promise<AuthSession['user']> {
  return requireRole('admin')
}

// Client-side auth helpers for React components
export function useAuthHelpers() {
  return {
    isAuthenticated: auth.isAuthenticated,
    hasRole: auth.hasRole,
    isAdmin: auth.isAdmin,
    isModerator: auth.isModerator,
    getUser: auth.getUser,
    isExpired: auth.isExpired,
    getTimeUntilExpiry: auth.getTimeUntilExpiry,
  }
}

// Default export
export default auth