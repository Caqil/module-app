
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { themeManager } from '@/lib/themes/manager'
import { ApiResponse, FileUpload } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const overwrite = formData.get('overwrite') === 'true'
    const activate = formData.get('activate') === 'true'

    if (!file) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public/uploads/themes')
    await mkdir(uploadDir, { recursive: true })

    // Save uploaded file
    const fileName = `${generateId()}_${file.name}`
    const filePath = join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const fileUpload: FileUpload = {
      filename: file.name,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: filePath,
      buffer
    }

    await connectToDatabase()
    const result = await themeManager.installTheme(fileUpload, session.user.id, {
      overwrite,
      activate,
      skipValidation: false,
      backup: true
    })

    return NextResponse.json<ApiResponse>({
      success: result.success,
      data: result.themeId ? { themeId: result.themeId } : undefined,
      message: result.message
    }, result.success ? { status: 201 } : { status: 400 })

  } catch (error) {
    console.error('Install theme error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}