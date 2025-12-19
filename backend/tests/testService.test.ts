import { z } from 'zod';
import * as taskService from '../src/services/taskService';
import Task from '../src/models/Task';
import { io } from '../src/server';

jest.mock('../src/models/Task');
jest.mock('../src/server', () => ({
  io: {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  },
}));

const mockedTaskModel = Task as jest.Mocked<typeof Task>;
const mockedIo = io as any;

describe('taskService.createTask', () => {
  const creatorId = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates task when data is valid', async () => {
    const fakeTask = {
      _id: 'task1',
      title: 'Test',
      description: 'Desc',
      priority: 'High',
      status: 'To Do',
      creatorId,
    };

    mockedTaskModel.create.mockResolvedValue(fakeTask as any);

    const result = await taskService.createTask(
      {
        title: 'Test',
        description: 'Desc',
        priority: 'High',
        status: 'To Do',
      } as any,
      creatorId
    );

    expect(mockedTaskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test',
        creatorId,
      })
    );
    expect(result).toBe(fakeTask);
    expect(mockedIo.emit).toHaveBeenCalledWith('taskUpdate', fakeTask);
  });

  it('throws validation error for long title', async () => {
    const longTitle = 'x'.repeat(101);

    await expect(
      taskService.createTask(
        {
          title: longTitle,
          description: '',
          priority: 'High',
          status: 'To Do',
        } as any,
        creatorId
      )
    ).rejects.toBeInstanceOf(z.ZodError);

    expect(mockedTaskModel.create).not.toHaveBeenCalled();
  });

  it('emits assignmentNotification when assignedToId is provided', async () => {
    const fakeTask = {
      _id: 'task2',
      title: 'Assigned',
      description: '',
      priority: 'Medium',
      status: 'To Do',
      creatorId,
      assignedToId: 'otherUser',
    };

    mockedTaskModel.create.mockResolvedValue(fakeTask as any);

    await taskService.createTask(
      {
        title: 'Assigned',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignedToId: 'otherUser',
      } as any,
      creatorId
    );

    expect(mockedIo.to).toHaveBeenCalledWith('otherUser');
    expect(mockedIo.to().emit).toHaveBeenCalledWith(
      'assignmentNotification',
      fakeTask
    );
    expect(mockedIo.emit).toHaveBeenCalledWith('taskUpdate', fakeTask);
  });
});

describe('taskService.updateTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates task and emits taskUpdate', async () => {
    (mockedTaskModel.findByIdAndUpdate as any).mockResolvedValue({
      _id: 'task1',
      title: 'New title',
      status: 'In Progress',
    });

    const result = await taskService.updateTask('task1', {
      title: 'New title',
      status: 'In Progress',
    } as any);

    expect(mockedTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'task1',
      expect.objectContaining({
        title: 'New title',
        status: 'In Progress',
      }),
      { new: true }
    );

    expect(result?.title).toBe('New title');
    expect(result?.status).toBe('In Progress');
    expect(mockedIo.emit).toHaveBeenCalledWith(
      'taskUpdate',
      expect.objectContaining({ title: 'New title' })
    );
  });

  it('converts dueDate string to Date when updating', async () => {
    const dateStr = '2025-01-01T00:00:00.000Z';
    const dateObj = new Date(dateStr);

    (mockedTaskModel.findByIdAndUpdate as any).mockResolvedValue({
      _id: 'task1',
      title: 'Task',
      dueDate: dateObj,
    });

    const result = await taskService.updateTask('task1', {
      dueDate: dateStr,
    } as any);

    expect(mockedTaskModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'task1',
      expect.objectContaining({
        dueDate: dateObj,
      }),
      { new: true }
    );

    expect(result?.dueDate).toEqual(dateObj);
  });
});

describe('taskService.deleteTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes task and emits taskDeleted', async () => {
    (mockedTaskModel.findByIdAndDelete as any).mockResolvedValue(null);

    await taskService.deleteTask('task1');

    expect(mockedTaskModel.findByIdAndDelete).toHaveBeenCalledWith('task1');
    expect(mockedIo.emit).toHaveBeenCalledWith('taskDeleted', { id: 'task1' });
  });
});

describe('taskService.getUserTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns assigned, created, and overdue tasks', async () => {
    const assignedTasks = [{ _id: 'a1' }];
    const createdTasks = [{ _id: 'c1' }];
    const overdueTasks = [{ _id: 'o1' }];

    (mockedTaskModel.find as any)
      .mockResolvedValueOnce(assignedTasks) // assigned
      .mockResolvedValueOnce(createdTasks) // created
      .mockResolvedValueOnce(overdueTasks); // overdue

    const result = await taskService.getUserTasks('user1');

    expect(mockedTaskModel.find).toHaveBeenNthCalledWith(1, {
      assignedToId: 'user1',
    });
    expect(mockedTaskModel.find).toHaveBeenNthCalledWith(2, {
      creatorId: 'user1',
    });
    expect(mockedTaskModel.find).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        assignedToId: 'user1',
        status: { $ne: 'Completed' },
      })
    );

    expect(result.assigned).toEqual(assignedTasks);
    expect(result.created).toEqual(createdTasks);
    expect(result.overdue).toEqual(overdueTasks);
  });
});
