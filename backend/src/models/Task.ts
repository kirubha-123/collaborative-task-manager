import mongoose, { Schema, Document } from 'mongoose';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  creatorId: mongoose.Types.ObjectId;
  assignedToId?: mongoose.Types.ObjectId;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed'],
      default: 'To Do'
    },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', taskSchema);
