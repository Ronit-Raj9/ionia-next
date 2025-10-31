import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/authUtils';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * Change Password Endpoint
 * Allows users to update their password
 */
export async function POST(request: NextRequest) {
  try {
    // Get session to identify user
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated. Please login first.'
      }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'All fields are required'
      }, { status: 400 });
    }

    // Validate new password matches confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'New password and confirmation do not match'
      }, { status: 400 });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[@#$%&*]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return NextResponse.json({
        success: false,
        error: 'Password must contain uppercase, lowercase, number, and special character (@#$%&*)'
      }, { status: 400 });
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Find user by userId from session
    const user = await usersCollection.findOne({ userId: session.userId });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Verify current password
    if (user.password) {
      if (!verifyPassword(currentPassword, user.password)) {
        return NextResponse.json({
          success: false,
          error: 'Current password is incorrect'
        }, { status: 401 });
      }
    } else {
      // User has no password (legacy account)
      // Allow setting password without current password verification
      console.log(`User ${user.email} setting password for first time (legacy account)`);
    }

    // Hash new password
    const hashedNewPassword = hashPassword(newPassword);

    // Update password in database
    const result = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update password'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to change password'
    }, { status: 500 });
  }
}

