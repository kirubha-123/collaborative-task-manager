import request from 'supertest';
import app from '../src/app';
import * as taskService from '../src/services/taskService';

jest.mock('../src/services/taskService');

// mock auth middleware so routes never return 401 in tests
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: () => void) => {
    req.user = { userId: 'user123' };
    next();
  },
}));

const mockedService = taskService as jest.Mocked<typeof taskService>;

describe('Task routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/tasks creates a task', async () => {
    const fakeTask = {
      _id: 'task1',
      title: 'Route Test',
      description: 'From route test',
      priority: 'Medium',
      status: 'To Do',
      creatorId: 'user123',
    };

    mockedService.createTask.mockResolvedValue(fakeTask as any);

    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Route Test',
        description: 'From route test',
        priority: 'Medium',
        status: 'To Do',
      })
      .expect(201);

    expect(res.body.title).toBe('Route Test');
    expect(mockedService.createTask).toHaveBeenCalled();
  });
});
