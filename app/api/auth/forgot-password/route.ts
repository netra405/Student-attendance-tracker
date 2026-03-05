import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  generateVerificationCode,
  getVerificationExpires,
  sendResetPasswordEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond success to avoid email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset code has been sent." },
        { status: 200 }
      );
    }

    const code = generateVerificationCode();
    const expires = getVerificationExpires();

    user.resetPasswordCode = code;
    user.resetPasswordExpires = expires;
    await user.save();

    const emailSent = await sendResetPasswordEmail(normalizedEmail, code);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "If an account exists, a reset code has been sent." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

