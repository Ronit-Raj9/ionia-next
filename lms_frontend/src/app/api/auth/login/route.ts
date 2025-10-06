import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

/**
 * Login endpoint - Fetch user from database by email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Find user by email
    const user = await usersCollection.findOne({ email: email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (user.status === 'inactive' || user.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: `Your account is ${user.status}. Please contact support.` },
        { status: 403 }
      );
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Return user data (excluding sensitive info)
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        role: user.role,
        mockUserId: user.mockUserId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        classId: user.classId,
        schoolId: user.schoolId,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        status: user.status,
        lastLogin: new Date()
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch user by mockUserId or userId (for session restoration)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mockUserId = searchParams.get('mockUserId');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!mockUserId && !userId && !email) {
      return NextResponse.json(
        { success: false, error: 'mockUserId, userId, or email is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Build query
    const query: any = {};
    if (email) {
      query.email = email;
    } else if (userId) {
      query.userId = userId;
    } else if (mockUserId) {
      query.mockUserId = mockUserId;
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        role: user.role,
        mockUserId: user.mockUserId,
        userId: user.userId,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        classId: user.classId,
        schoolId: user.schoolId,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
        status: user.status,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
