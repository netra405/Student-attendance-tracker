import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendVerificationEmail, generateVerificationCode, getVerificationExpires } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, email, password, currentPassword } = body;

    await connectDB();

    const user = await User.findById(session.user.id).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Change Email
    if (action === 'change-email') {
      if (!email) {
        return NextResponse.json(
          { error: 'New email is required' },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();
      const verificationExpires = getVerificationExpires();

      user.email = email.toLowerCase();
      user.emailVerified = false;
      user.verificationCode = verificationCode;
      user.verificationExpires = verificationExpires;
      await user.save();

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationCode);

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Verification code sent to new email',
        userId: user._id,
      });
    }

    // Change Password
    if (action === 'change-password') {
      if (!password || !currentPassword) {
        return NextResponse.json(
          { error: 'Current and new password are required' },
          { status: 400 }
        );
      }

      // Verify current password
      const passwordMatch = await user.comparePassword(currentPassword);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Update password
      user.password = password;
      await user.save();

      return NextResponse.json({
        message: 'Password changed successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Admin update error:', error);
    return NextResponse.json(
      { error: error.message || 'Update failed' },
      { status: 500 }
    );
  }
}
