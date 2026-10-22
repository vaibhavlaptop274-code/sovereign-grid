import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  Activity,
  Gauge,
  Battery,
  Signal,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getGameProgress,
  saveGameProgress,
  DEFAULT_PROGRESS,
  type GameProgress,
} from '@/lib/firestore';
import ModulePanel from '@/components/ModulePanel';

export default function DashboardSection() {
  const { user } = useAuth();
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
      batteryLevel: Math.min(
        100,
        Math.max(0, progress.batteryLevel + Math.round(Math.random() * 6 - 2)),
      ),
    };
    await saveGameProgress(user.uid, next);
    setProgress((prev) => (prev ? { ...prev, ...next } : prev));
    setSaving(false);
  };

  const gridOk = progress?.gridStatus === 'online';

  return (
    <div className="space-y-5">
      {/* Row 1: primary stat panels */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Power Output */}
        <ModulePanel title="Power Output" subtitle="Real-time kW" icon={<Gauge className="h-4 w-4" />}>
          <div className="p-5">
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-neon-cyan neon-text">
                {progress ? progress.powerOutput.toFixed(1) : '---'}
              </span>
              <span className="mb-1 font-mono text-xs text-gray-500">kW</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-obsidian-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-blue transition-all duration-500"
                style={{ width: progress ? `${Math.min(100, progress.powerOutput * 8)}%` : '0%' }}
              />
            </div>
            <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+2.4% vs last cycle</span>
            </div>
          </div>
        </ModulePanel>

        {/* Battery Level */}
        <ModulePanel title="Battery" subtitle="Storage capacity" icon={<Battery className="h-4 w-4" />}>
          <div className="p-5">
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-emerald-400">
                {progress ? progress.batteryLevel : '---'}
              </span>
              <span className="mb-1 font-mono text-xs text-gray-500">%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-obsidian-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
                style={{ width: progress ? `${progress.batteryLevel}%` : '0%' }}
              />
            </div>
            <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-gray-500">
              <Activity className="h-3 w-3 text-emerald-400" />
              <span>Charge stable</span>
            </div>
          </div>
        </ModulePanel>

        {/* Grid Status */}
        <ModulePanel title="Grid Status" subtitle="Network health" icon={<Signal className="h-4 w-4" />}>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span
                className={`relative flex h-3 w-3 rounded-full ${
                  gridOk ? 'bg-emerald-400' : progress?.gridStatus === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                } animate-glow-pulse`}
              />
              <span className="font-display text-2xl font-bold uppercase tracking-wider text-white">
                {progress ? progress.gridStatus : '---'}
              </span>
            </div>
            <div className="mt-4 space-y-1.5">
              {['Transmission', 'Distribution', 'Control'].map((sub) => (
                <div key={sub} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-gray-500">{sub}</span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Nominal
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ModulePanel>

        {/* Level & Score */}
        <ModulePanel title="Operator Level" subtitle="Score / progress" icon={<Cpu className="h-4 w-4" />}>
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-neon-cyan/30 bg-obsidian-800">
                <span className="font-display text-xl font-bold text-neon-cyan">
                  {progress ? progress.level : '--'}
                </span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-cyan font-mono text-[8px] font-bold text-obsidian-950">
                  L
                </span>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-amber-400">
                  {progress ? progress.score.toLocaleString() : '---'}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  Total Score
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-obsidian-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: progress ? `${(progress.score % 1000) / 10}%` : '0%' }}
              />
            </div>
          </div>
        </ModulePanel>
      </div>

      {/* Row 2: placeholder for 3D module + activity feed */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 3D module placeholder - large */}
        <ModulePanel
          title="3D Grid Visualizer"
          subtitle="Module socket"
          icon={<Activity className="h-4 w-4" />}
          className="xl:col-span-2 min-h-[320px]"
        >
          <div className="relative flex flex-1 items-center justify-center bg-obsidian-900 p-8">
            <div className="absolute inset-0 grid-bg-fine opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-neon-cyan/5 blur-3xl animate-glow-pulse" />
            </div>
            <div className="relative z-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-obsidian-800">
                <Cpu className="h-8 w-8 text-neon-cyan/40" />
              </div>
              <p className="font-display text-sm font-medium uppercase tracking-wider text-neon-cyan/40">
                3D Module Socket
              </p>
              <p className="mt-1 font-mono text-[10px] text-gray-600">
                Awaiting grid visualization plugin
              </p>
            </div>
          </div>
        </ModulePanel>

        {/* Activity feed */}
        <ModulePanel
          title="System Log"
          subtitle="Recent events"
          icon={<Activity className="h-4 w-4" />}
          className="min-h-[320px]"
        >
          <div className="p-4 space-y-2">
            {[
              { type: 'up', text: 'Power output increased to 4.2 kW', time: '12:01:04' },
              { type: 'info', text: 'Grid sync check passed', time: '12:00:31' },
              { type: 'down', text: 'Minor voltage drop on L3', time: '11:59:17' },
              { type: 'info', text: 'Battery optimization cycle complete', time: '11:58:02' },
              { type: 'up', text: 'Score milestone: 1,000 pts', time: '11:55:48' },
              { type: 'info', text: 'Operator session authenticated', time: '11:54:00' },
            ].map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md border border-neon-cyan/5 bg-obsidian-800/40 px-3 py-2 transition-colors hover:border-neon-cyan/15"
              >
                <span className="mt-0.5">
                  {entry.type === 'up' ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  ) : entry.type === 'down' ? (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 text-neon-cyan/60" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-gray-300">{entry.text}</p>
                  <p className="font-mono text-[9px] text-gray-600">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ModulePanel>
      </div>

      {/* Simulate tick button */}
      {progress && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleSimulateTick}
            disabled={saving}
            className="group flex items-center gap-2.5 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-neon-cyan transition-all hover:bg-neon-cyan/20 hover:shadow-neon-cyan-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Syncing...' : 'Simulate Tick'}
          </button>
        </div>
      )}
    </div>
  );
}
