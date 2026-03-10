import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Student from '@/models/Student';
import User from '@/models/User';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const students = await Student.find({ teacherId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, rollNumber, phone, className } = body;

    if (!name || !email || !rollNumber || !phone || !className) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const student = await Student.create({
      name,
      email,
      rollNumber,
      phone,
      className,
      teacherId: session.user.id,
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create student' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const className = url.searchParams.get('className');

    if (!className) {
      return NextResponse.json(
        { error: 'className query parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const password = body?.password as string | undefined;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete all students in a class' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('+password');
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 404 }
      );
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin password' },
        { status: 403 }
      );
    }

    const result = await Student.deleteMany({
      teacherId: session.user.id,
      className,
    });

    return NextResponse.json({
      message: 'Students deleted for class',
      deletedCount: result.deletedCount ?? 0,
      className,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete students for class' },
      { status: 500 }
    );
  }
}
