import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import MultiverseIntro from '@/components/MultiverseIntro';

function Gate() {
  const { user, loading } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (!user) {
      setShowIntro(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (showIntro) {
    return <MultiverseIntro onComplete={() => setShowIntro(false)} />;
  }

  return <Dashboard onReplayIntro={() => setShowIntro(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
