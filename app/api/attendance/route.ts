import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const className = searchParams.get('class');

    await connectDB();

    let query: any = {
      teacherId: session.user.id,
    };

    // Date filter
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);

      query['records.date'] = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const attendance = await Attendance.findOne(query)
      .populate({
        path: 'records.studentId',
        model: Student,
      })
      .lean();

    if (!attendance) {
      return NextResponse.json({ records: [] });
    }

    let records = attendance.records || [];

    // ⭐ Class filtering (CRITICAL FIX)
    if (className && className !== 'all') {
      records = records.filter((r: any) => {
        return (
          r.studentId &&
          r.studentId.className &&
          r.studentId.className === className
        );
      });
    }

    return NextResponse.json({
      ...attendance,
      records,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance' },
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

    const { studentId, status, date } = body;

    if (!studentId || !status || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    const student = await Student.findById(studentId);

    if (!student || student.teacherId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized student access' },
        { status: 403 }
      );
    }

    let attendance = await Attendance.findOne({
      teacherId: session.user.id,
    });

    // Store as UTC midnight so calendar date (YYYY-MM-DD) matches everywhere
    const attendanceDate = new Date(date.includes('T') ? date : `${date}T00:00:00.000Z`);

    if (!attendance) {
      attendance = await Attendance.create({
        teacherId: session.user.id,
        records: [
          {
            studentId,
            className: student.className,
            status,
            date: attendanceDate,
          },
        ],
      });
    } else {
      const newDay = attendanceDate.toISOString().slice(0, 10);
      const existingIndex = attendance.records.findIndex(
        (r: any) => {
          const rDay = new Date(r.date).toISOString().slice(0, 10);
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

      await attendance.save();
    }

    return NextResponse.json(attendance);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Attendance save failed' },
      { status: 500 }
    );
  }
}