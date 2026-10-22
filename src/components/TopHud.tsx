import { Menu, Zap, Battery, Coins, Flame, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export type HudStats = {
  level: number;
  energy: number;
  credits: number;
  streak: number;
};

type Props = {
  stats: HudStats | null;
  onOpenMobileNav: () => void;
  activeLabel: string;
};

type StatConfig = {
  key: keyof HudStats;
  label: string;
  icon: typeof Zap;
  color: string;
  glow: string;
  format: (v: number) => string;
};

const STAT_CONFIG: StatConfig[] = [
  { key: 'level', label: 'Level', icon: Zap, color: 'text-neon-cyan', glow: 'shadow-neon-cyan', format: (v) => `LV.${v}` },
  { key: 'energy', label: 'Energy', icon: Battery, color: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]', format: (v) => `${v}%` },
  { key: 'credits', label: 'Credits', icon: Coins, color: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]', format: (v) => v.toLocaleString() },
  { key: 'streak', label: 'Streak', icon: Flame, color: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]', format: (v) => `${v}d` },
];

export default function TopHud({ stats, onOpenMobileNav, activeLabel }: Props) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-neon-cyan/15 bg-obsidian-900/80 backdrop-blur-md">
      {/* Top scan line */}
      <div className="h-px overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-scan-line" />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: mobile menu + section label */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neon-cyan/15 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600 sm:inline">
              System /
            </span>
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-neon-cyan/90">
              {activeLabel}
            </h2>
          </div>
        </div>

        {/* Center: stat readouts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {STAT_CONFIG.map((stat) => {
            const Icon = stat.icon;
            const value = stats ? stats[stat.key] : 0;
            return (
              <div
                key={stat.key}
                className="group relative flex items-center gap-2 rounded-lg border border-neon-cyan/10 bg-obsidian-850/60 px-3 py-1.5 hud-clip-sm transition-all hover:border-neon-cyan/30 hover:bg-neon-cyan/5"
              >
                <Icon className={`h-4 w-4 ${stat.color} drop-shadow-[0_0_4px_currentColor]`} />
                <div className="flex flex-col leading-none">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600">
                    {stat.label}
                  </span>
                  <span
                    className={`font-display text-sm font-bold ${stat.color} ${
                      stats ? '' : 'opacity-30'
                    }`}
                  >
                    {stats ? stat.format(value) : '---'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: clock */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex flex-col items-end leading-none">
            <span className="font-mono text-xs font-medium text-neon-cyan/70">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600">
              {time.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-neon-cyan/10 bg-obsidian-850/60 px-2.5 py-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-glow-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
              Synced
            </span>
            <ChevronDown className="h-3 w-3 text-gray-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
