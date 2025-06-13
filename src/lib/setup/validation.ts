// Setup validation schemas and utilities

import { z } from 'zod'

// Individual step validation schemas
export const welcomeStepSchema = z.object({
  acknowledged: z.boolean().optional(),
})

export const databaseStepSchema = z.object({
  mongodbUri: z
    .string()
    .min(1, 'MongoDB connection string is required')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      'Invalid MongoDB connection string format'
    ),
  testConnection: z.boolean().optional(),
})

export const adminStepSchema = z.object({
  siteName: z
    .string()
    .min(1, 'Site name is required')
    .max(200, 'Site name cannot exceed 200 characters'),
  adminEmail: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  adminFirstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  adminLastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
})

export const themeStepSchema = z.object({
  selectedTheme: z
    .string()
    .min(1, 'Please select a theme'),
  colorMode: z
    .enum(['light', 'dark', 'system'])
    .default('system'),
})

// Complete setup validation schema
export const completeSetupSchema = z.object({
  welcome: welcomeStepSchema.optional(),
  database: databaseStepSchema,
  admin: adminStepSchema,
  theme: themeStepSchema.optional(),
})

// Setup progress validation
export const setupProgressSchema = z.object({
  currentStep: z.number().min(0),
  completedSteps: z.array(z.string()),
  data: z.record(z.any()),
})

// Setup status response schema
export const setupStatusSchema = z.object({
  isSetupComplete: z.boolean(),
  siteName: z.string().optional(),
  currentStep: z.string().optional(),
  lastUpdated: z.date().optional(),
})

// Validation utilities
export const validateSetupData = {
  welcome: (data: unknown) => welcomeStepSchema.safeParse(data),
  database: (data: unknown) => databaseStepSchema.safeParse(data),
  admin: (data: unknown) => adminStepSchema.safeParse(data),
  theme: (data: unknown) => themeStepSchema.safeParse(data),
  complete: (data: unknown) => completeSetupSchema.safeParse(data),
}

// Password strength validation
export const getPasswordStrength = (password: string): {
  score: number
  label: string
  color: string
  feedback: string[]
} => {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) {
    score++
  } else {
    feedback.push('At least 8 characters')
  }

  if (/[a-z]/.test(password)) {
    score++
  } else {
    feedback.push('At least one lowercase letter')
  }

  if (/[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('At least one uppercase letter')
  }

  if (/[0-9]/.test(password)) {
    score++
  } else {
    feedback.push('At least one number')
  }

  if (/[@$!%*?&]/.test(password)) {
    score++
  } else {
    feedback.push('At least one special character (@$!%*?&)')
  }

  let label = 'Very Weak'
  let color = 'bg-red-500'

  if (score >= 5) {
    label = 'Very Strong'
    color = 'bg-green-500'
  } else if (score >= 4) {
    label = 'Strong'
    color = 'bg-green-400'
  } else if (score >= 3) {
    label = 'Medium'
    color = 'bg-yellow-500'
  } else if (score >= 2) {
    label = 'Weak'
    color = 'bg-orange-500'
  }

  return { score, label, color, feedback }
}

// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// MongoDB URI validation utility
export const validateMongoDbUri = (uri: string): {
  isValid: boolean
  error?: string
  type?: 'local' | 'atlas' | 'custom'
} => {
  if (!uri) {
    return { isValid: false, error: 'URI is required' }
  }

  if (uri.startsWith('mongodb+srv://')) {
    // MongoDB Atlas connection
    const atlasRegex = /^mongodb\+srv:\/\/[^:]+:[^@]+@[^/]+\/[^?]+/
    if (atlasRegex.test(uri)) {
      return { isValid: true, type: 'atlas' }
    } else {
      return { isValid: false, error: 'Invalid MongoDB Atlas URI format' }
    }
  } else if (uri.startsWith('mongodb://')) {
    // Standard MongoDB connection
    const mongoRegex = /^mongodb:\/\/([^:]+:[^@]+@)?[^/]+\/[^?]+/
    if (mongoRegex.test(uri)) {
      if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
        return { isValid: true, type: 'local' }
      } else {
        return { isValid: true, type: 'custom' }
      }
    } else {
      return { isValid: false, error: 'Invalid MongoDB URI format' }
    }
  } else {
    return { isValid: false, error: 'URI must start with mongodb:// or mongodb+srv://' }
  }
}

// Setup step validation with custom error messages
export const validateStepData = async (
  stepId: string,
  data: any
): Promise<{ success: boolean; errors?: Record<string, string[]>; error?: string }> => {
  try {
    switch (stepId) {
      case 'welcome':
        const welcomeResult = validateSetupData.welcome(data)
        if (!welcomeResult.success) {
          return {
            success: false,
            errors: welcomeResult.error.flatten().fieldErrors,
          }
        }
        return { success: true }

      case 'database':
        const databaseResult = validateSetupData.database(data)
        if (!databaseResult.success) {
          return {
            success: false,
            errors: databaseResult.error.flatten().fieldErrors,
          }
        }
        // Additional MongoDB URI validation
        const uriValidation = validateMongoDbUri(data.mongodbUri)
        if (!uriValidation.isValid) {
          return {
            success: false,
            errors: { mongodbUri: [uriValidation.error || 'Invalid URI'] },
          }
        }
        return { success: true }

      case 'admin':
        const adminResult = validateSetupData.admin(data)
        if (!adminResult.success) {
          return {
            success: false,
            errors: adminResult.error.flatten().fieldErrors,
          }
        }
        return { success: true }

      case 'theme':
        const themeResult = validateSetupData.theme(data)
        if (!themeResult.success) {
          return {
            success: false,
            errors: themeResult.error.flatten().fieldErrors,
          }
        }
        return { success: true }

      default:
        return { success: false, error: 'Invalid step ID' }
    }
  } catch (error) {
    return { success: false, error: 'Validation error occurred' }
  }
}

// Theme validation utilities
export const validateThemeSelection = (themeId: string): boolean => {
  const availableThemes = ['default', 'minimal', 'business', 'dark', 'creative']
  return availableThemes.includes(themeId)
}

export const validateColorMode = (colorMode: string): boolean => {
  const validModes = ['light', 'dark', 'system']
  return validModes.includes(colorMode)
}

// Setup completion validation
export const validateSetupCompletion = (allData: Record<string, any>): {
  success: boolean
  errors?: string[]
  missingSteps?: string[]
} => {
  const requiredSteps = ['database', 'admin']
  const missingSteps: string[] = []
  const errors: string[] = []

  // Check required steps
  for (const step of requiredSteps) {
    if (!allData[step]) {
      missingSteps.push(step)
    }
  }

  if (missingSteps.length > 0) {
    errors.push(`Missing required steps: ${missingSteps.join(', ')}`)
  }

  // Validate individual step data
  for (const [stepId, stepData] of Object.entries(allData)) {
    if (stepData && typeof stepData === 'object') {
      const validation = validateSetupData[stepId as keyof typeof validateSetupData]
      if (validation) {
        const result = validation(stepData)
        if (!result.success) {
          errors.push(`Invalid data for step ${stepId}`)
        }
      }
    }
  }

  return {
    success: errors.length === 0 && missingSteps.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    missingSteps: missingSteps.length > 0 ? missingSteps : undefined,
  }
}