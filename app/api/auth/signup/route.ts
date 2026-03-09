




import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import {
  sendVerificationEmail,
  generateVerificationCode,
  getVerificationExpires
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name and password required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const userCount = await User.countDocuments();

    // ⭐ Single admin lock
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Registration closed. Admin already exists." },
        { status: 403 }
      );
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = getVerificationExpires();

    const user = await User.create({
      email: email.toLowerCase(),
      name,
      password,
      role: "admin",
      emailVerified: false,
      verificationCode,
      verificationExpires
    });

    const emailSent = await sendVerificationEmail(
      email,
      verificationCode
    );

    if (!emailSent) {
      await User.findByIdAndDelete(user._id);

      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Verification code sent",
        userId: user._id.toString()
      },
      { status: 201 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Signup failed" },
      { status: 500 }
    );
  }
}