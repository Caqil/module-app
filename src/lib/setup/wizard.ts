// Setup wizard logic and utilities

import { ApiResponse } from '@/types/global'

export interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
  data?: any
}

export interface SetupState {
  currentStep: number
  steps: SetupStep[]
  isComplete: boolean
  data: Record<string, any>
}

export class SetupWizard {
  private state: SetupState

  constructor() {
    this.state = {
      currentStep: 0,
      isComplete: false,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome',
          description: 'Welcome to your new modular application',
          completed: false,
        },
        {
          id: 'database',
          title: 'Database',
          description: 'Configure your MongoDB connection',
          completed: false,
        },
        {
          id: 'admin',
          title: 'Admin Account',
          description: 'Create your administrator account',
          completed: false,
        },
        {
          id: 'theme',
          title: 'Theme Selection',
          description: 'Choose your default theme',
          completed: false,
        },
      ],
      data: {},
    }
  }

  getCurrentStep(): SetupStep {
    return this.state.steps[this.state.currentStep]
  }

  getStepById(stepId: string): SetupStep | undefined {
    return this.state.steps.find(step => step.id === stepId)
  }

  canGoNext(): boolean {
    return this.state.currentStep < this.state.steps.length - 1
  }

  canGoPrev(): boolean {
    return this.state.currentStep > 0
  }

  nextStep(data?: any): boolean {
    if (!this.canGoNext()) return false

    // Mark current step as completed and save data
    const currentStep = this.getCurrentStep()
    currentStep.completed = true
    if (data) {
      currentStep.data = data
      this.state.data[currentStep.id] = data
    }

    this.state.currentStep++
    return true
  }

  prevStep(): boolean {
    if (!this.canGoPrev()) return false
    this.state.currentStep--
    return true
  }

  getProgress(): number {
    const completedSteps = this.state.steps.filter(step => step.completed).length
    return (completedSteps / this.state.steps.length) * 100
  }

  getState(): SetupState {
    return { ...this.state }
  }

  isStepCompleted(stepId: string): boolean {
    const step = this.getStepById(stepId)
    return step?.completed || false
  }

  getStepData(stepId: string): any {
    return this.state.data[stepId]
  }

  getAllData(): Record<string, any> {
    return { ...this.state.data }
  }

  complete(): void {
    this.state.isComplete = true
    // Mark all steps as completed
    this.state.steps.forEach(step => {
      step.completed = true
    })
  }

  reset(): void {
    this.state.currentStep = 0
    this.state.isComplete = false
    this.state.data = {}
    this.state.steps.forEach(step => {
      step.completed = false
      step.data = undefined
    })
  }
}

// Setup validation utilities
export const validateSetupStep = async (
  stepId: string,
  data: any
): Promise<{ success: boolean; error?: string }> => {
  switch (stepId) {
    case 'welcome':
      // Welcome step doesn't need validation
      return { success: true }

    case 'database':
      return validateDatabaseStep(data)

    case 'admin':
      return validateAdminStep(data)

    case 'theme':
      return validateThemeStep(data)

    default:
      return { success: false, error: 'Invalid setup step' }
  }
}

const validateDatabaseStep = async (data: any) => {
  if (!data.mongodbUri) {
    return { success: false, error: 'MongoDB connection string is required' }
  }

  try {
    // Test the connection through the API
    const response = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'database',
        data: { ...data, testConnection: true },
      }),
    })

    const result: ApiResponse = await response.json()
    return result.success
      ? { success: true }
      : { success: false, error: result.error || 'Database connection failed' }
  } catch (error) {
    return { success: false, error: 'Network error during database validation' }
  }
}

const validateAdminStep = (data: any) => {
  const required = ['siteName', 'adminEmail', 'adminPassword', 'adminFirstName', 'adminLastName']
  
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      return { success: false, error: `${field} is required` }
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.adminEmail)) {
    return { success: false, error: 'Invalid email address' }
  }

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  if (!passwordRegex.test(data.adminPassword)) {
    return {
      success: false,
      error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
    }
  }

  return { success: true }
}

const validateThemeStep = (data: any) => {
  if (!data.selectedTheme) {
    return { success: false, error: 'Please select a theme' }
  }

  if (!data.colorMode) {
    return { success: false, error: 'Please select a color mode' }
  }

  return { success: true }
}

// Setup completion utilities
export const completeSetup = async (allData: Record<string, any>): Promise<ApiResponse> => {
  try {
    const response = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'complete',
        data: allData,
      }),
    })

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: 'Network error during setup completion',
    }
  }
}

// Check if setup is already complete
export const checkSetupStatus = async (): Promise<{
  isComplete: boolean
  siteName?: string
  error?: string
}> => {
  try {
    const response = await fetch('/api/setup')
    const result: ApiResponse = await response.json()

    if (result.success) {
      return {
        isComplete: result.data?.isSetupComplete || false,
        siteName: result.data?.siteName,
      }
    } else {
      return { isComplete: false, error: result.error }
    }
  } catch (error) {
    return { isComplete: false, error: 'Failed to check setup status' }
  }
}

// Setup progress tracking
export const getSetupProgress = (steps: SetupStep[]): {
  completed: number
  total: number
  percentage: number
  currentStepIndex: number
} => {
  const completed = steps.filter(step => step.completed).length
  const total = steps.length
  const percentage = Math.round((completed / total) * 100)
  const currentStepIndex = steps.findIndex(step => !step.completed)

  return {
    completed,
    total,
    percentage,
    currentStepIndex: currentStepIndex === -1 ? total - 1 : currentStepIndex,
  }
}

// Default setup configuration
export const DEFAULT_SETUP_CONFIG = {
  siteName: 'Modular App',
  theme: 'default',
  colorMode: 'system',
  features: {
    userRegistration: true,
    emailVerification: false,
    maintenanceMode: false,
  },
}

// Setup step metadata
export const SETUP_STEP_METADATA = {
  welcome: {
    estimatedTime: '1 minute',
    requirements: [],
    optional: false,
  },
  database: {
    estimatedTime: '2-3 minutes',
    requirements: ['MongoDB connection string'],
    optional: false,
  },
  admin: {
    estimatedTime: '2 minutes',
    requirements: ['Email address', 'Strong password'],
    optional: false,
  },
  theme: {
    estimatedTime: '1 minute',
    requirements: [],
    optional: true,
  },
} as const