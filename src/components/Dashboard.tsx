import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SolarSystem3D from '@/components/SolarSystem3D';

export default function Dashboard() {
  const { signOut } = useAuth();

  return (
    <div className="relative h-screen w-import { useState, useEffect } from 'react';
import { LogOut, Globe2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SolarSystem3D from '@/components/SolarSystem3D';
import EarthBase3D from '@/components/EarthBase3D';

export default function Dashboard() {
  const { signOut } = useAuth();
  const [viewMode, setViewMode] = useState<'space' | 'earth_base'>('space');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && viewMode === 'space') {
        setViewMode('earth_base');
      }
    };
    const handleCustomEnter = () => setViewMode('earth_base');

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('enter-earth-base', handleCustomEnter);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('enter-earth-base', handleCustomEnter);
    };
  }, [viewMode]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {viewMode === 'space' ? (
        <>
          <SolarSystem3D />

          {/* Prominent "Enter Earth Atmosphere" Button in Space View */}
          <button
            onClick={() => setViewMode('earth_base')}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-40 glass-pill active px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold text-white flex items-center gap-2.5 shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:scale-105 transition-transform"
          >
            <Globe2 className="h-4 w-4 text-emerald-300 animate-pulse" />
            <span>Enter Earth Atmosphere (Base View)</span>
            <span className="kbd-badge">E</span>
          </button>
        </>
      ) : (
        <EarthBase3D onExitToSpace={() => setViewMode('space')} />
      )}

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
} overflow-hidden bg-black">
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
