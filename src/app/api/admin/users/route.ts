
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createUserSchema, paginationSchema } from '@/lib/validations'
import { ApiResponse, PaginatedResponse } from '@/types/global'
import { connectToDatabase } from '@/lib/database/mongodb'
import { UserModel } from '@/lib/database/models/user'
import { User } from '@/types/auth'
// Fix for GET /api/admin/users route

export async function GET(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validation = paginationSchema.safeParse(queryParams)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Invalid query parameters'
      }, { status: 400 })
    }

    const { page, limit, search, sortBy, sortOrder } = validation.data

    await connectToDatabase()

    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    // Build sort
    const sort: any = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.createdAt = -1
    }

    const skip = (page - 1) * limit
    const [userDocs, total] = await Promise.all([
      UserModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      UserModel.countDocuments(query)
    ])

    // Convert Mongoose documents to User type
    const users = userDocs.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    })) as User[]

    const response: PaginatedResponse<User> = {
      data: users,
      pagination: {
        current: page,
        total,
        pages: Math.ceil(total / limit),
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.getSession(request)
    if (!session || !auth.hasRole(session, 'admin')) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        errors: validation.error.flatten().fieldErrors,
        message: 'Validation failed'
      }, { status: 400 })
    }

    await connectToDatabase()

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(validation.data.email)
    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User with this email already exists'
      }, { status: 400 })
    }

    const user = await UserModel.createUser(validation.data)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user },
      message: 'User created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
