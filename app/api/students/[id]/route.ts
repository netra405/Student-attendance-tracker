import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Student from '@/models/Student';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.teacherId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Student.deleteOne({ _id: id });

    return NextResponse.json({ message: 'Student deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, rollNumber, phone, className } = body;

    await connectDB();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.teacherId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (typeof name === 'string') student.name = name;
    if (typeof email === 'string') student.email = email;
    if (typeof rollNumber === 'string') student.rollNumber = rollNumber;
    if (typeof phone === 'string') student.phone = phone;
    if (typeof className === 'string') student.className = className;

    await student.save();

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}
