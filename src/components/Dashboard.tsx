import { useState, useEffect } from 'react';
import Sidebar, { type NavId, NAV_ITEMS } from '@/components/Sidebar';
import TopHud, { type HudStats } from '@/components/TopHud';
import DashboardSection from '@/components/sections/DashboardSection';
import {
  StudyGridSection,
  VaultSection,
  AnalyticsSection,
  SettingsSection,
} from '@/components/sections/PlaceholderSection';
import { useAuth } from '@/hooks/useAuth';
import { getGameProgress, type GameProgress } from '@/lib/firestore';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hudStats, setHudStats] = useState<HudStats | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);

  // Load game progress for HUD stats
  useEffect(() => {
    if (!user) return;
    getGameProgress(user.uid).then((data) => {
      setProgress(data);
      if (data) {
        setHudStats({
          level: data.level,
          energy: data.batteryLevel,
          credits: data.score,
          streak: 0, // Not tracked yet — will be populated by future module
        });
      } else {
        setHudStats({ level: 1, energy: 87, credits: 0, streak: 0 });
      }
    });
  }, [user]);

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? 'Dashboard';

  const handleNavSelect = (id: NavId) => {
    setActiveNav(id);
    setMobileNavOpen(false);
  };

  const renderSection = () => {
    switch (activeNav) {
      case 'dashboard':
        return <DashboardSection />;
      case 'study':
        return <StudyGridSection />;
      case 'vault':
        return <VaultSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'settings':
        return <SettingsSection />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-obsidian-950 text-gray-100">
      {/* Ambient background grid */}
      <div className="pointer-events-none fixed inset-0 grid-bg-fine opacity-20" />
      <div className="pointer-events-none fixed top-0 left-1/3 h-96 w-96 rounded-full bg-neon-cyan/5 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 h-96 w-96 rounded-full bg-neon-blue/5 blur-3xl" />

      <Sidebar
        active={activeNav}
        onSelect={handleNavSelect}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        email={user?.email ?? null}
        onSignOut={signOut}
      />

      {/* Main area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <TopHud
          stats={hudStats}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          activeLabel={activeLabel}
        />

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto scrollbar-cyber p-4 sm:p-6">
          {/* Section header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-neon-cyan shadow-neon-cyan" />
              <h1 className="font-display text-xl font-bold uppercase tracking-wider text-white">
                {activeLabel}
              </h1>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="font-mono text-[10px] uppercase tracking-wider text-gray-600">
                Session ID:
              </span>
              <span className="font-mono text-[10px] text-neon-cyan/50">
                {user?.uid.slice(0, 8) ?? '--------'}
              </span>
            </div>
          </div>

          {renderSection()}
        </main>
      </div>
    </div>
  );
}
