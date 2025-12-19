import { z } from 'zod';
import Task, { ITask } from '../models/Task';
import { io } from '../server';

export const CreateTaskDto = z.object({
  title: z.string().max(100),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  status: z
    .enum(['To Do', 'In Progress', 'Review', 'Completed'])
    .default('To Do'),
  assignedToId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskDto>;

const UpdateTaskDto = CreateTaskDto.partial();

export type UpdateTaskInput = z.infer<typeof UpdateTaskDto>;

export const createTask = async (
  data: CreateTaskInput,
  creatorId: string
): Promise<ITask> => {
  const validated = CreateTaskDto.parse(data);

  const task = await Task.create({
    ...validated,
    dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    creatorId,
  });

  if (validated.assignedToId) {
    io.to(validated.assignedToId).emit('assignmentNotification', task);
  }
  io.emit('taskUpdate', task);

  return task;
};

export const updateTask = async (
  taskId: string,
  updates: UpdateTaskInput
): Promise<ITask | null> => {
  const validated = UpdateTaskDto.parse(updates);

  const docUpdates: any = { ...validated };
  if (validated.dueDate) {
    docUpdates.dueDate = new Date(validated.dueDate);
  }

  const task = await Task.findByIdAndUpdate(taskId, docUpdates, {
    new: true,
  });

  if (task) {
    if (validated.assignedToId) {
      io.to(validated.assignedToId).emit('assignmentNotification', task);
    }
    io.emit('taskUpdate', task);
  }

  return task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await Task.findByIdAndDelete(taskId);
  io.emit('taskDeleted', { id: taskId });
};

export const getUserTasks = async (userId: string) => {
  const assigned = await Task.find({ assignedToId: userId });
  const created = await Task.find({ creatorId: userId });
  const now = new Date();
  const overdue = await Task.find({
    assignedToId: userId,
    dueDate: { $lt: now },
    status: { $ne: 'Completed' },
  });

  return { assigned, created, overdue };
};

// helper export for tests (DTO etc.)
export const __test = {
  CreateTaskDto,
};
