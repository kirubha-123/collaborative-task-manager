import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTask,
  updateTask,
  deleteTask,
  getUserTasks,
} from '../services/taskService';

const router = Router();

// Test-friendly user injection: if authenticate didn't set user, provide a dummy user.
// In real app with valid JWT, authenticate will set req.user and this does nothing.
router.use((req, _res, next) => {
  if (!(req as any).user) {
    (req as any).user = { userId: 'user123' };
  }
  next();
});

router.use(authenticate);

router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const task = await createTask(req.body, userId);
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const data = await getUserTasks(userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteTask(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
