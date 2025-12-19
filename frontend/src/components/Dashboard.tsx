import { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSocket } from '../hooks/useSocket';

// Use relative base; Vite proxy will forward /api to backend
const API_URL = '';

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  dueDate?: string;
};

type DashboardData = {
  assigned: Task[];
  created: Task[];
  overdue: Task[];
};

type Props = {
  token: string;
  userId: string;
  onLogout: () => void;
};

type TaskForm = {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
};

function Dashboard({ token, userId, onLogout }: Props) {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<'All' | Task['status']>('All');
  const [priorityFilter, setPriorityFilter] =
    useState<'All' | Task['priority']>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [notification, setNotification] = useState<string | null>(null);

  useSocket(userId, (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  });

  const fetchDashboard = async (): Promise<DashboardData> => {
    const res = await axios.get(`${API_URL}/api/tasks/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: TaskForm) => {
      const res = await axios.post(`${API_URL}/api/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (payload: { id: string; updates: Partial<Task> }) => {
      const { id, updates } = payload;
      const res = await axios.put(`${API_URL}/api/tasks/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_URL}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const { register, handleSubmit, reset } = useForm<TaskForm>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'To Do',
    },
  });

  const onCreateTask = (values: TaskForm) => {
    createTaskMutation.mutate(values);
    reset();
  };

  const applyFilters = (tasks: Task[]) => {
    let result = [...tasks];

    if (statusFilter !== 'All') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== 'All') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    result.sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    return result;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-sm"
        >
          Logout
        </button>
      </header>

      {notification && (
        <div className="mx-6 mt-3 rounded bg-emerald-500 text-xs px-3 py-2">
          {notification}
        </div>
      )}

      <main className="flex-1 px-6 py-4 space-y-6">
        {/* Filter / sort bar */}
        <section className="bg-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="All">All</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1">Sort by due date</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs"
            >
              <option value="asc">Earliest first</option>
              <option value="desc">Latest first</option>
            </select>
          </div>
        </section>

        {/* Create task */}
        <section className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3">Create task</h2>
          <form
            onSubmit={handleSubmit(onCreateTask)}
            className="grid gap-3 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Title</label>
              <input
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register('title')}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Description</label>
              <textarea
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                {...register('description')}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Priority</label>
              <select
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                {...register('priority')}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1">Status</label>
              <select
                className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
                {...register('status')}
              >
                <option>To Do</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createTaskMutation.isLoading}
                className="w-full md:w-auto px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-sm font-medium disabled:opacity-60"
              >
                {createTaskMutation.isLoading ? 'Creating...' : 'Create task'}
              </button>
            </div>
          </form>
        </section>

        {/* Columns */}
        <section className="grid gap-4 md:grid-cols-3">
          <TaskColumn
            title="Created by me"
            tasks={applyFilters(data?.created ?? [])}
            loading={isLoading}
            error={isError}
            onUpdate={(id, updates) =>
              updateTaskMutation.mutate({ id, updates })
            }
            onDelete={(id) => deleteTaskMutation.mutate(id)}
          />
          <TaskColumn
            title="Assigned to me"
            tasks={applyFilters(data?.assigned ?? [])}
            loading={isLoading}
            error={isError}
            onUpdate={(id, updates) =>
              updateTaskMutation.mutate({ id, updates })
            }
            onDelete={(id) => deleteTaskMutation.mutate(id)}
          />
          <TaskColumn
            title="Overdue"
            tasks={applyFilters(data?.overdue ?? [])}
            loading={isLoading}
            error={isError}
            onUpdate={(id, updates) =>
              updateTaskMutation.mutate({ id, updates })
            }
            onDelete={(id) => deleteTaskMutation.mutate(id)}
          />
        </section>
      </main>
    </div>
  );
}

type TaskColumnProps = {
  title: string;
  tasks: Task[];
  loading: boolean;
  error: boolean;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
};

function TaskColumn({
  title,
  tasks,
  loading,
  error,
  onUpdate,
  onDelete,
}: TaskColumnProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {loading && <p className="text-xs text-slate-300">Loading...</p>}
      {error && (
        <p className="text-xs text-red-400">Failed to load tasks.</p>
      )}
      {!loading && tasks.length === 0 && (
        <p className="text-xs text-slate-400">No tasks.</p>
      )}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t._id}
            className="rounded border border-slate-700 px-3 py-2 text-xs space-y-1"
          >
            <p className="font-medium">{t.title}</p>
            <p className="text-slate-300 line-clamp-2">
              {t.description || 'No description'}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Priority: {t.priority} · Status: {t.status}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <select
                defaultValue={t.status}
                onChange={(e) =>
                  onUpdate(t._id, {
                    status: e.target.value as Task['status'],
                  })
                }
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-[11px]"
              >
                <option>To Do</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Completed</option>
              </select>
              <button
                onClick={() => onDelete(t._id)}
                className="ml-auto px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-[11px]"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
