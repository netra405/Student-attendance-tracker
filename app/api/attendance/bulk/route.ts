import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Invalid records format' },
        { status: 400 }
      );
    }

    await connectDB();

    let attendance = await Attendance.findOne({
      teacherId: session.user.id,
    });

    if (!attendance) {
      attendance = await Attendance.create({
        teacherId: session.user.id,
        records: [],
      });
    }

    for (const record of records) {
      const { studentId, status, date } = record;

      const student = await Student.findById(studentId);

      if (!student || student.teacherId.toString() !== session.user.id) {
        continue;
      }

      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const existingIndex = attendance.records.findIndex(
        (r: any) =>
          r.studentId.toString() === studentId &&
          new Date(r.date).getTime() === attendanceDate.getTime()
      );

      if (existingIndex >= 0) {
        attendance.records[existingIndex].status = status;
      } else {
        attendance.records.push({
          studentId,
          className: student.className,
          status,
          date: attendanceDate,
        });
      }
    }

    await attendance.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Attendance save failed' },
      { status: 500 }
    );
  }
}