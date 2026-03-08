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

      // Store as UTC midnight so calendar date (YYYY-MM-DD) matches everywhere
      const attendanceDate = new Date(date.includes('T') ? date : `${date}T00:00:00.000Z`);

      const existingIndex = attendance.records.findIndex(
        (r: any) => {
          const rDate = new Date(r.date);
          const rDay = rDate.toISOString().slice(0, 10);
          const newDay = attendanceDate.toISOString().slice(0, 10);
          return r.studentId.toString() === studentId && rDay === newDay;
        }
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