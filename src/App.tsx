import { Loader2, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import { firebaseConfigValid } from '@/lib/firebase';

function ConfigError() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Configuration Missing</h1>
        <p className="text-gray-400 leading-relaxed">
          Firebase environment variables were not found. If you deployed to a hosting
          platform like Vercel, add the <code className="text-cyan-400">VITE_FIREBASE_*</code>{' '}
          variables in your project's environment variable settings, then redeploy.
        </p>
      </div>
    </div>
  );
}

function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  if (!firebaseConfigValid) {
    return <ConfigError />;
  }

  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
