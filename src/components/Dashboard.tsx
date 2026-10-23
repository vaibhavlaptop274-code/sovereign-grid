import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SolarSystem3D from '@/components/SolarSystem3D';

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <SolarSystem3D />

      {/* Minimal sign-out button overlay */}
      <button
        onClick={() => signOut()}
        className="absolute top-5 right-5 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
