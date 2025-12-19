import { useState } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

type AuthState = {
  token: string;
  userId: string;
};

function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <AuthPage onAuthSuccess={setAuth} />
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      token={auth.token}
      userId={auth.userId}
      onLogout={() => setAuth(null)}
    />
  );
}

export default App;
