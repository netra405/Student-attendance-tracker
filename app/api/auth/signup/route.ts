// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/db';
// import User from '@/models/User';
// import { sendVerificationEmail, generateVerificationCode, getVerificationExpires } from '@/lib/email';

// export async function POST(request: NextRequest) {
//   try {
//     const { email, name, password } = await request.json();

//     // Validate inputs
//     if (!email || !name || !password) {
//       return NextResponse.json(
//         { error: 'Email, name, and password are required' },
//         { status: 400 }
//       );
//     }

//     if (password.length < 6) {
//       return NextResponse.json(
//         { error: 'Password must be at least 6 characters' },
//         { status: 400 }
//       );
//     }

//     await connectDB();

//     // Check if admin already exists
//     const adminCount = await User.countDocuments({ role: 'admin' });
//     if (adminCount > 0) {
//       return NextResponse.json(
//         { error: 'Admin account already exists. Only one admin is allowed.' },
//         { status: 403 }
//       );
//     }

//     // Check if email exists
//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'Email already registered' },
//         { status: 400 }
//       );
//     }

//     // Generate verification code
//     const verificationCode = generateVerificationCode();
//     const verificationExpires = getVerificationExpires();

//     // Create user (not verified yet)
//     const user = new User({
//       email: email.toLowerCase(),
//       name,
//       password,
//       role: 'admin', // First user is admin
//       emailVerified: false,
//       verificationCode,
//       verificationExpires,
//     });

//     await user.save();

//     // Send verification email
//     const emailSent = await sendVerificationEmail(email, verificationCode);

//     if (!emailSent) {
//       await User.findByIdAndDelete(user._id);
//       return NextResponse.json(
//         { error: 'Failed to send verification email' },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json(
//       {
//         message: 'User created. Check your email for verification code.',
//         userId: user._id,
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error('Signup error:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to create account' },
//       { status: 500 }
//     );
//   }
// }



// import { NextRequest, NextResponse } from 'next/server';
// import { connectDB } from '@/lib/db';
// import User from '@/models/User';
// import {
//   sendVerificationEmail,
//   generateVerificationCode,
//   getVerificationExpires
// } from '@/lib/email';

// export async function POST(request: NextRequest) {
//   try {
//     const { email, name, password } = await request.json();

//     if (!email || !name || !password) {
//       return NextResponse.json(
//         { error: 'Email, name, and password are required' },
//         { status: 400 }
//       );
//     }

//     if (password.length < 6) {
//       return NextResponse.json(
//         { error: 'Password must be at least 6 characters' },
//         { status: 400 }
//       );
//     }

//     await connectDB();

//     // ✅ Allow only ONE user in entire system
//     const userCount = await User.countDocuments();
//     if (userCount > 0) {
//       return NextResponse.json(
//         { error: 'Registration closed. Only one user is allowed.' },
//         { status: 403 }
//       );
//     }

//     // Email duplicate check (extra safety)
//     const existingUser = await User.findOne({
//       email: email.toLowerCase()
//     });

//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'Email already registered' },
//         { status: 400 }
//       );
//     }

//     const verificationCode = generateVerificationCode();
//     const verificationExpires = getVerificationExpires();

//     const user = new User({
//       email: email.toLowerCase(),
//       name,
//       password,
//       role: 'admin',
//       emailVerified: false,
//       verificationCode,
//       verificationExpires
//     });

//     await user.save();

//     const emailSent = await sendVerificationEmail(
//       email,
//       verificationCode
//     );

//     if (!emailSent) {
//       await User.findByIdAndDelete(user._id);

//       return NextResponse.json(
//         { error: 'Failed to send verification email' },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json(
//       {
//         message: 'User created. Check your email for verification code.',
//         userId: user._id
//       },
//       { status: 201 }
//     );

//   } catch (error: any) {
//     console.error('Signup error:', error);

//     return NextResponse.json(
//       {
//         error: error.message || 'Failed to create account'
//       },
//       { status: 500 }
//     );
//   }
// }




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