
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { 
  JWTPayload, 
  AuthSession, 
  User,
  LoginCredentials,
  RegisterCredentials 
} from '@/types/auth'
import { AUTH_CONFIG, ERROR_MESSAGES } from '@/lib/constants'
import { 
  signJWT, 
  verifyJWT,
  getErrorMessage 
} from '@/lib/utils'
import { UserModel } from '@/lib/database/models/user'
import { connectToDatabase } from '@/lib/database/mongodb'

export class SessionManager {
  private static instance: SessionManager
  
  private constructor() {}
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Create session after successful authentication
  async createSession(user: User): Promise<{ accessToken: string; refreshToken: string; session: AuthSession }> {
    try {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: user._id!.toString(),
        email: user.email,
        role: user.role,
      }

      const accessToken = signJWT(payload)
      const refreshToken = this.generateRefreshToken(payload)

      const session: AuthSession = {
        user: {
          id: user._id!.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
        },
        expires: new Date(Date.now() + this.getTokenExpiration(AUTH_CONFIG.JWT_EXPIRES_IN)).toISOString(),
        accessToken,
        refreshToken,
      }

      return { accessToken, refreshToken, session }
    } catch (error) {
      throw new Error(`Failed to create session: ${getErrorMessage(error)}`)
    }
  }

  // Verify and get session from request
  async getSession(request: NextRequest): Promise<AuthSession | null> {
    try {
      const token = this.extractTokenFromRequest(request)
      if (!token) return null

      const payload = verifyJWT(token)
      if (!payload) return null

      // Get fresh user data from database
      await connectToDatabase()
      const user = await UserModel.findById(payload.userId)
      if (!user || !user.isActive) return null

      const session: AuthSession = {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
        },
        expires: new Date(payload.exp * 1000).toISOString(),
        accessToken: token,
      }

      return session
    } catch (error) {
      console.error('Session verification failed:', error)
      return null
    }
  }

  // Get session from cookies (server-side)
  async getSessionFromCookies(): Promise<AuthSession | null> {
    try {
      const cookieStore = cookies()
      const token = (await cookieStore).get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value
      
      if (!token) return null

      const payload = verifyJWT(token)
      if (!payload) return null

      // Get fresh user data from database
      await connectToDatabase()
      const user = await UserModel.findById(payload.userId)
      if (!user || !user.isActive) return null

      const session: AuthSession = {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
        },
        expires: new Date(payload.exp * 1000).toISOString(),
        accessToken: token,
      }

      return session
    } catch (error) {
      console.error('Cookie session verification failed:', error)
      return null
    }
  }

  // Refresh session token
 async refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; session: AuthSession } | null> {
  try {
    const payload = this.verifyRefreshToken(refreshToken)
    if (!payload) return null

    await connectToDatabase()
    const userDoc = await UserModel.findById(payload.userId)
    if (!userDoc || !userDoc.isActive) return null

    // Convert to User type
    const user = userDoc.toJSON() as unknown as User

    return this.createSession(user)
  } catch (error) {
    console.error('Session refresh failed:', error)
    return null
  }
}

  // Set session cookies
  setSessionCookies(response: NextResponse, accessToken: string, refreshToken?: string): void {
    const accessTokenMaxAge = this.getTokenExpiration(AUTH_CONFIG.JWT_EXPIRES_IN) / 1000
    
    response.cookies.set(AUTH_CONFIG.SESSION_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/',
    })

    if (refreshToken) {
      const refreshTokenMaxAge = this.getTokenExpiration(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN) / 1000
      
      response.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshTokenMaxAge,
        path: '/',
      })
    }
  }

  // Clear session cookies
  clearSessionCookies(response: NextResponse): void {
    response.cookies.delete(AUTH_CONFIG.SESSION_COOKIE_NAME)
    response.cookies.delete(AUTH_CONFIG.REFRESH_COOKIE_NAME)
  }

  // Authenticate user login
  // Temporary Debug Patch for src/lib/auth/session.ts
// Replace the authenticateUser function with this version to get detailed debug info

async authenticateUser(credentials: LoginCredentials): Promise<{ user: User; session: AuthSession } | { error: string }> {
  try {
    console.log('🔍 [AUTH DEBUG] Login attempt started:', {
      email: credentials.email,
      passwordLength: credentials.password.length,
      timestamp: new Date().toISOString()
    })

    await connectToDatabase()
    console.log('✅ [AUTH DEBUG] Database connected')
    
    // Find user with detailed logging
    const userDoc = await UserModel.findOne({ 
      email: credentials.email.toLowerCase() 
    }).select('+password')
    
    console.log('👤 [AUTH DEBUG] User lookup result:', {
      userFound: !!userDoc,
      searchEmail: credentials.email.toLowerCase(),
      userExists: userDoc ? 'YES' : 'NO'
    })

    if (!userDoc) {
      console.log('❌ [AUTH DEBUG] User not found for email:', credentials.email)
      return { error: ERROR_MESSAGES.INVALID_CREDENTIALS }
    }

    console.log('👤 [AUTH DEBUG] User details:', {
      email: userDoc.email,
      role: userDoc.role,
      isActive: userDoc.isActive,
      isEmailVerified: userDoc.isEmailVerified,
      loginAttempts: userDoc.loginAttempts || 0,
      hasPassword: !!userDoc.password,
      passwordHashStart: userDoc.password ? userDoc.password.substring(0, 10) + '...' : 'NO PASSWORD'
    })

    // Check if account is locked
    const isLocked = userDoc.isAccountLocked()
    console.log('🔒 [AUTH DEBUG] Account lock status:', {
      isLocked,
      lockUntil: userDoc.lockUntil,
      currentTime: new Date(),
      loginAttempts: userDoc.loginAttempts
    })

    if (isLocked) {
      console.log('❌ [AUTH DEBUG] Account is locked')
      return { error: ERROR_MESSAGES.ACCOUNT_LOCKED }
    }

    // Check if user is active
    if (!userDoc.isActive) {
      console.log('❌ [AUTH DEBUG] Account is inactive')
      return { error: 'Account is disabled' }
    }

    // Password comparison with detailed logging
    console.log('🔐 [AUTH DEBUG] Starting password comparison...')
    const isPasswordValid = await userDoc.comparePassword(credentials.password)
    
    console.log('🔐 [AUTH DEBUG] Password comparison result:', {
      isValid: isPasswordValid,
      providedPasswordLength: credentials.password.length,
      storedPasswordHash: userDoc.password ? 'EXISTS' : 'MISSING'
    })

    if (!isPasswordValid) {
      console.log('❌ [AUTH DEBUG] Password invalid, incrementing login attempts')
      await userDoc.incrementLoginAttempts()
      return { error: ERROR_MESSAGES.INVALID_CREDENTIALS }
    }

    console.log('✅ [AUTH DEBUG] Password valid, proceeding with login')

    // Reset login attempts and update last login
    await userDoc.resetLoginAttempts()
    userDoc.lastLogin = new Date()
    await userDoc.save()

    console.log('✅ [AUTH DEBUG] User updated, creating session')

    // Convert to User type
    const user = userDoc.toJSON() as unknown as User
    const { session } = await this.createSession(user)

    console.log('✅ [AUTH DEBUG] Login successful for:', user.email)

    return { user, session }
  } catch (error) {
    console.error('❌ [AUTH DEBUG] Authentication failed with error:', error)
    console.error('❌ [AUTH DEBUG] Error stack:', error)
    return { error: ERROR_MESSAGES.SERVER_ERROR }
  }

}

  // Register new user
  async registerUser(credentials: RegisterCredentials): Promise<{ user: User; session: AuthSession } | { error: string }> {
  try {
    await connectToDatabase()

    const existingUser = await UserModel.findByEmail(credentials.email)
    if (existingUser) {
      return { error: ERROR_MESSAGES.USER_ALREADY_EXISTS }
    }

    const userData = {
      email: credentials.email,
      password: credentials.password,
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      role: 'user' as const,
      isActive: true,
      isEmailVerified: false,
    }

    const userDoc = await UserModel.createUser(userData)

    // Convert Mongoose document to User type
    const user = userDoc.toJSON() as User

    const verificationToken = userDoc.generateEmailVerificationToken()
    await userDoc.save()

    const { session } = await this.createSession(user)

    console.log(`Email verification token for ${user.email}: ${verificationToken}`)

    return { user, session }
  } catch (error) {
    console.error('Registration failed:', error)
    return { error: ERROR_MESSAGES.SERVER_ERROR }
  }
}

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await connectToDatabase()

      const user = await UserModel.findByEmail(email)
      if (!user) {
        // Don't reveal if user exists
        return { success: true, message: 'If the email exists, a reset link has been sent' }
      }

      const resetToken = user.generateResetToken()
      await user.save()

      // TODO: Send password reset email
      console.log(`Password reset token for ${user.email}: ${resetToken}`)

      return { success: true, message: 'Password reset email sent' }
    } catch (error) {
      console.error('Password reset request failed:', error)
      return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      await connectToDatabase()

      const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      }).select('+resetPasswordToken +resetPasswordExpires')

      if (!user) {
        return { success: false, message: ERROR_MESSAGES.INVALID_TOKEN }
      }

      // Update password
      user.password = newPassword
      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()

      return { success: true, message: 'Password reset successfully' }
    } catch (error) {
      console.error('Password reset failed:', error)
      return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
  }

  // Verify email with token
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      await connectToDatabase()

      const user = await UserModel.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      }).select('+emailVerificationToken +emailVerificationExpires')

      if (!user) {
        return { success: false, message: ERROR_MESSAGES.INVALID_TOKEN }
      }

      // Verify email
      user.isEmailVerified = true
      user.emailVerificationToken = undefined
      user.emailVerificationExpires = undefined
      await user.save()

      return { success: true, message: 'Email verified successfully' }
    } catch (error) {
      console.error('Email verification failed:', error)
      return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
  }

  // Private helper methods
  private extractTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // Try cookies
    const token = request.cookies.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value
    return token || null
  }

  private generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    })
  }

  private verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    } catch {
      return null
    }
  }

  private getTokenExpiration(duration: string): number {
    // Parse duration like "7d", "1h", "30m"
    const match = duration.match(/^(\d+)([dhm])$/)
    if (!match) return 0

    const [, amount, unit] = match
    const multipliers = { d: 24 * 60 * 60 * 1000, h: 60 * 60 * 1000, m: 60 * 1000 }
    return parseInt(amount) * multipliers[unit as keyof typeof multipliers]
  }
}

// Singleton instance
export const sessionManager = SessionManager.getInstance()
