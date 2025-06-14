
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pluginManager } from '@/lib/plugins/manager'
import { ApiResponse, FileUpload } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Plugin install API called')
    
    const session = await auth.getSession(request)
    console.log('🔍 Session:', session ? 'Found' : 'Not found')
    
    if (!session || !auth.hasRole(session, 'admin')) {
      console.log('🔍 Auth failed - no admin role')
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const overwrite = formData.get('overwrite') === 'true'
    const activate = formData.get('activate') === 'true'

    console.log('🔍 File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      overwrite,
      activate
    })

    if (!file) {
      console.log('🔍 No file provided')
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public/uploads/plugins')
    console.log('🔍 Upload dir:', uploadDir)
    await mkdir(uploadDir, { recursive: true })

    // Save uploaded file
    const fileName = `${generateId()}_${file.name}`
    const filePath = join(uploadDir, fileName)
    console.log('🔍 Saving file to:', filePath)
    
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)
    console.log('🔍 File saved successfully')

    const fileUpload: FileUpload = {
      filename: file.name,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: filePath,
      buffer
    }

    console.log('🔍 Connecting to database...')
    await connectToDatabase()
    console.log('🔍 Database connected')
    
    console.log('🔍 Calling pluginManager.installPlugin...')
    const result = await pluginManager.installPlugin(fileUpload, session.user.id, {
      overwrite,
      activate,
      skipValidation: false,
      backup: true
    })
    
    console.log('🔍 Plugin manager result:', result)

    return NextResponse.json<ApiResponse>({
      success: result.success,
      data: result.pluginId ? { pluginId: result.pluginId } : undefined,
      message: result.message,
      error: result.success ? undefined : result.message // Add error to response
    }, result.success ? { status: 201 } : { status: 400 })

  } catch (error) {
    console.error('🔍 Install plugin error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
