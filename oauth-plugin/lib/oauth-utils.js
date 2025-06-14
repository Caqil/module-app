const crypto = require('crypto')

class OAuthUtils {
  static generateState() {
    return crypto.randomBytes(32).toString('hex')
  }

  static validateState(receivedState, expectedState) {
    return receivedState === expectedState
  }

  static isEmailDomainAllowed(email, allowedDomains) {
    if (!allowedDomains || allowedDomains.length === 0) {
      return true
    }

    const domain = email.split('@')[1]
    return allowedDomains.includes(domain)
  }

  static generateJWT(payload) {
    const jwt = require('jsonwebtoken')
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
  }

  static generateRefreshToken(payload) {
    const jwt = require('jsonwebtoken')
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' })
  }

  static async hashPassword(password) {
    const bcrypt = require('bcryptjs')
    return bcrypt.hash(password, 12)
  }

  static async verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs')
    return bcrypt.compare(password, hash)
  }

  static sanitizeConfig(config) {
    const sanitized = { ...config }
    
    // Remove or mask sensitive fields
    Object.keys(sanitized).forEach(provider => {
      if (sanitized[provider] && typeof sanitized[provider] === 'object') {
        Object.keys(sanitized[provider]).forEach(key => {
          if (key.includes('Secret') || key.includes('secret')) {
            sanitized[provider][key] = sanitized[provider][key] ? '••••••••' : ''
          }
        })
      }
    })

    return sanitized
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }

  static createErrorResponse(message, status = 400) {
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  static createSuccessResponse(data, status = 200) {
    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  static async logOAuthEvent(type, provider, email, database, error = null) {
    try {
      const event = {
        type,
        provider,
        email,
        error,
        timestamp: new Date(),
        ip: null // Could be extracted from request context
      }
      
      // In production, you might want to store this in a dedicated collection
      console.log(`OAuth Event [${type}]:`, { provider, email, error })
      
      return true
    } catch (err) {
      console.error('Failed to log OAuth event:', err)
      return false
    }
  }

  static parseUserAgent(userAgent) {
    // Simple user agent parsing for analytics
    const browsers = {
      chrome: /Chrome/i,
      firefox: /Firefox/i,
      safari: /Safari/i,
      edge: /Edge/i
    }

    const os = {
      windows: /Windows/i,
      mac: /Mac/i,
      linux: /Linux/i,
      android: /Android/i,
      ios: /iPhone|iPad/i
    }

    const result = {
      browser: 'unknown',
      os: 'unknown'
    }

    for (const [name, regex] of Object.entries(browsers)) {
      if (regex.test(userAgent)) {
        result.browser = name
        break
      }
    }

    for (const [name, regex] of Object.entries(os)) {
      if (regex.test(userAgent)) {
        result.os = name
        break
      }
    }

    return result
  }

  static async rateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    // Simple in-memory rate limiting (in production, use Redis)
    if (!this.rateLimitMap) {
      this.rateLimitMap = new Map()
    }

    const now = Date.now()
    const key = `oauth_${identifier}`
    const attempts = this.rateLimitMap.get(key) || []

    // Remove attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs)

    if (validAttempts.length >= maxAttempts) {
      return false // Rate limited
    }

    // Add current attempt
    validAttempts.push(now)
    this.rateLimitMap.set(key, validAttempts)

    return true // Allow
  }

  static extractIPAddress(request) {
    // Extract IP address from request (handles proxies)
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (real) {
      return real.trim()
    }
    
    return request.ip || 'unknown'
  }

  static createSecureCookie(name, value, maxAge) {
    const options = [
      `${name}=${value}`,
      `Max-Age=${maxAge}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/'
    ]

    return options.join('; ')
  }

  static validateOAuthCallback(query) {
    const { code, state, error, error_description } = query

    if (error) {
      throw new Error(error_description || error)
    }

    if (!code) {
      throw new Error('Authorization code not provided')
    }

    if (!state) {
      throw new Error('State parameter missing')
    }

    return { code, state }
  }
}

// Rate limiting cleanup (run periodically)
setInterval(() => {
  if (OAuthUtils.rateLimitMap) {
    const now = Date.now()
    const windowMs = 15 * 60 * 1000
    
    for (const [key, attempts] of OAuthUtils.rateLimitMap.entries()) {
      const validAttempts = attempts.filter(time => now - time < windowMs)
      
      if (validAttempts.length === 0) {
        OAuthUtils.rateLimitMap.delete(key)
      } else {
        OAuthUtils.rateLimitMap.set(key, validAttempts)
      }
    }
  }
}, 5 * 60 * 1000) // Cleanup every 5 minutes

module.exports = OAuthUtils