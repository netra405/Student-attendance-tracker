import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  email: string;
  rollNumber: string;
  phone: string;
  className: string;
  teacherId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a student name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide a roll number'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    className: {
      type: String,
      required: [true, 'Please provide a class name'],
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>('Student', StudentSchema);
