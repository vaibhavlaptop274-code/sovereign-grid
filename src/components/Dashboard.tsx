import { Zap, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user, signOut } = useAuth();

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
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-10">
          Signed in as {user?.email}. Your grid overview will appear here.
        </p>

        {/* Placeholder stat cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { label: 'Power Output', value: '4.2 kW', color: 'from-cyan-500/20 to-cyan-500/5' },
            { label: 'Battery Level', value: '87%', color: 'from-emerald-500/20 to-emerald-500/5' },
            { label: 'Grid Status', value: 'Online', color: 'from-amber-500/20 to-amber-500/5' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border border-gray-800/60 bg-gradient-to-br ${stat.color} p-6`}
            >
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
