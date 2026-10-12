import { useEffect, useState, useCallback } from 'react';
import { Zap, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getGameProgress,
  saveGameProgress,
  DEFAULT_PROGRESS,
  type GameProgress,
} from '@/lib/firestore';

const STATUS_COLOR: Record<GameProgress['gridStatus'], string> = {
  online: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
  degraded: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
  offline: 'from-red-500/20 to-red-500/5 border-red-500/20',
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getGameProgress(user.uid);
    setProgress(data ?? { ...DEFAULT_PROGRESS, updatedAt: null });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSimulateTick = async () => {
    if (!user || !progress) return;
    setSaving(true);
    const next: Partial<Omit<GameProgress, 'updatedAt'>> = {
      score: progress.score + 100,
      powerOutput: Math.round((progress.powerOutput + (Math.random() - 0.4)) * 10) / 10,
      batteryLevel: Math.min(100, Math.max(0, progress.batteryLevel + Math.round(Math.random() * 6 - 2))),
    };
    await saveGameProgress(user.uid, next);
    setProgress((prev) => prev ? { ...prev, ...next } : prev);
    setSaving(false);
  };

  const stats = progress
    ? [
        {
          label: 'Power Output',
          value: `${progress.powerOutput} kW`,
          color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
        },
        {
          label: 'Battery Level',
          value: `${progress.batteryLevel}%`,
          color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
        },
        {
          label: 'Grid Status',
          value: progress.gridStatus.charAt(0).toUpperCase() + progress.gridStatus.slice(1),
          color: STATUS_COLOR[progress.gridStatus],
        },
        {
          label: 'Level',
          value: `${progress.level}`,
          color: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
        },
        {
          label: 'Score',
          value: progress.score.toLocaleString(),
          color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-800/60 bg-gray-900/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-white">Sovereign Grid</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-500">
              {progress
                ? 'Your live grid progress — synced to Firestore.'
                : 'Loading your grid data...'}
            </p>
          </div>

          {progress && (
            <button
              onClick={handleSimulateTick}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving...' : 'Simulate Tick'}
            </button>
          )}
        </div>

        {/* Stat cards */}
        {progress ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border bg-gradient-to-br ${stat.color} p-6 transition-all`}
              >
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-800/40 bg-gray-900/30 p-6 animate-pulse"
              >
                <div className="h-4 w-24 bg-gray-800 rounded mb-3" />
                <div className="h-7 w-16 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-600 text-center">
          Progress is saved automatically to Firestore after each tick.
        </p>
      </main>
    </div>
  );
}
