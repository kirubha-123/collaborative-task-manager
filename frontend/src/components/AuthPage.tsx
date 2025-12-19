import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

// Frontend calls /api/...; Vite proxy forwards to backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

const loginSchema = registerSchema.omit({ name: true });

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

type AuthResponse = {
  user: { id: string; name: string; email: string };
  token: string;
};

type Props = {
  onAuthSuccess: (data: { token: string; userId: string }) => void;
};

function AuthPage({ onAuthSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm | LoginForm>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
  });

  const authMutation = useMutation({
    mutationFn: async (data: RegisterForm | LoginForm) => {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await api.post<AuthResponse>(url, data);
      return res.data;
    },
    onSuccess: (data) => {
      onAuthSuccess({ token: data.token, userId: data.user.id });
    },
  });

  const onSubmit = (data: RegisterForm | LoginForm) => {
    authMutation.mutate(data);
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl p-8">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        {mode === 'login' ? 'Login' : 'Create account'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
              {...register('name' as const)}
            />
            {mode === 'register' && 'name' in errors && errors.name && (
              <p className="mt-1 text-xs text-red-400">
                {errors.name.message as string}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            {...register('email' as const)}
          />
          {'email' in errors && errors.email && (
            <p className="mt-1 text-xs text-red-400">
              {errors.email.message as string}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            {...register('password' as const)}
          />
          {'password' in errors && errors.password && (
            <p className="mt-1 text-xs text-red-400">
              {errors.password.message as string}
            </p>
          )}
        </div>

        {authMutation.isError && (
          <p className="text-sm text-red-400">
            {(authMutation.error as any)?.response?.data?.message ??
              'Authentication failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={authMutation.isLoading}
          className="w-full rounded bg-indigo-500 py-2 text-sm font-medium hover:bg-indigo-600 disabled:opacity-60"
        >
          {authMutation.isLoading
            ? 'Please wait...'
            : mode === 'login'
            ? 'Login'
            : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-300">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === 'login' ? 'register' : 'login'))
          }
          className="text-indigo-400 hover:underline"
        >
          {mode === 'login' ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
}

export default AuthPage;
