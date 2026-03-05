import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendanceRecord {
  studentId: Types.ObjectId;
  className: string;
  status: 'present' | 'absent' | 'leave';
  date: Date;
}

export interface IAttendance extends Document {
  teacherId: Types.ObjectId;
  records: IAttendanceRecord[];
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },

    className: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      required: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    records: [AttendanceRecordSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Attendance ||
  mongoose.model<IAttendance>('Attendance', AttendanceSchema);