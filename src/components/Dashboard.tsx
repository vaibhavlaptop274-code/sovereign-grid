import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SolarSystem3D from '@/components/SolarSystem3D';

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <SolarSystem3D />

      {/* Minimal sign-out button tucked cleanly in bottom-left */}
      <button
        onClick={() => signOut()}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-md transition-all hover:border-sky-400/50 hover:text-white"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
