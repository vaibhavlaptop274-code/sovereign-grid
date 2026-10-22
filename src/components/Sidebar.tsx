import {
  LayoutDashboard,
  BookOpen,
  Vault,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  X,
} from 'lucide-react';

export type NavId = 'dashboard' | 'study' | 'vault' | 'analytics' | 'settings';

export type NavItem = {
  id: NavId;
  label: string;
  icon: typeof LayoutDashboard;
};

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'study', label: 'Study Grid', icon: BookOpen },
  { id: 'vault', label: 'Vault', icon: Vault },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

type Props = {
  active: NavId;
  onSelect: (id: NavId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  email: string | null;
  onSignOut: () => void;
};

export default function Sidebar({
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
  email,
  onSignOut,
}: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-obsidian-950/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed z-50 lg:static inset-y-0 left-0 flex h-full w-72 flex-col
          border-r border-neon-cyan/15 bg-obsidian-900/95 backdrop-blur-md
          transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between border-b border-neon-cyan/15 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan to-neon-blue shadow-neon-cyan">
              <Zap className="h-6 w-6 text-obsidian-950" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-wider text-white neon-text">
                SOVEREIGN
              </span>
              <span className="font-display text-xs font-medium tracking-[0.3em] text-neon-cyan/70">
                GRID
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="text-gray-500 hover:text-neon-cyan transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 scrollbar-cyber overflow-y-auto">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`
                  group relative flex w-full items-center gap-3 rounded-lg px-3 py-3
                  font-display text-sm font-medium tracking-wide transition-all
                  ${
                    isActive
                      ? 'bg-neon-cyan/10 text-neon-cyan neon-border-strong'
                      : 'text-gray-500 hover:bg-neon-cyan/5 hover:text-neon-cyan/80'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-neon-cyan shadow-neon-cyan" />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]' : ''
                  }`}
                />
                <span className="uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="border-t border-neon-cyan/15 p-4">
          <div className="relative rounded-lg border border-neon-cyan/10 bg-obsidian-850/50 p-3 hud-clip-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neon-cyan/30 bg-obsidian-800 font-display text-sm font-bold text-neon-cyan">
                {email ? email.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-300">{email ?? 'Unknown'}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-neon-cyan/50">
                  Operator Online
                </p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-neon-cyan/15 px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-400 transition-all hover:border-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
