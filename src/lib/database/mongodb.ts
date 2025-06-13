// ========================================
// src/lib/database/mongodb.ts
// ========================================

import mongoose from 'mongoose'
import { DB_CONFIG } from '@/lib/constants'

type ConnectionState = {
  isConnected: boolean
  connection: typeof mongoose | null
  error: string | null
}

const connection: ConnectionState = {
  isConnected: false,
  connection: null,
  error: null,
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (connection.isConnected && connection.connection) {
    return connection.connection
  }

  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined')
    }

    // Configure mongoose
    mongoose.set('strictQuery', false)
    
    const db = await mongoose.connect(mongoUri, {
      maxPoolSize: DB_CONFIG.MAX_POOL_SIZE,
      minPoolSize: DB_CONFIG.MIN_POOL_SIZE,
      connectTimeoutMS: DB_CONFIG.CONNECTION_TIMEOUT,
      retryWrites: DB_CONFIG.RETRY_WRITES,
      retryReads: DB_CONFIG.RETRY_READS,
      bufferCommands: false,
    })

    connection.isConnected = true
    connection.connection = db
    connection.error = null

    console.log('✅ Connected to MongoDB')
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error)
      connection.error = error.message
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected')
      connection.isConnected = false
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
      connection.isConnected = true
      connection.error = null
    })

    return db
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
    connection.error = errorMessage
    connection.isConnected = false
    console.error('❌ Failed to connect to MongoDB:', errorMessage)
    throw new Error(`Database connection failed: ${errorMessage}`)
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!connection.isConnected) {
    return
  }

  try {
    await mongoose.disconnect()
    connection.isConnected = false
    connection.connection = null
    connection.error = null
    console.log('✅ Disconnected from MongoDB')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error disconnecting from MongoDB:', errorMessage)
    throw new Error(`Database disconnection failed: ${errorMessage}`)
  }
}

export function getConnectionState(): ConnectionState {
  return { ...connection }
}
export async function isHealthy(): Promise<boolean> {
  try {
    if (!connection.isConnected || !connection.connection || !mongoose.connection.db) {
      return false
    }

    // Ping the database
    await mongoose.connection.db.admin().ping()
    return true
  } catch (error) {
    console.error('❌ Database health check failed:', error)
    return false
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await disconnectFromDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectFromDatabase()
  process.exit(0)
})
