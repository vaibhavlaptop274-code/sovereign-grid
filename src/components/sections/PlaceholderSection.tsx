import ModulePanel from '@/components/ModulePanel';
import { BookOpen, Terminal, Lightbulb, Code2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  description: string;
  hint: string;
};

export default function PlaceholderSection({
  icon,
  title,
  subtitle,
  description,
  hint,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neon-cyan/20 bg-obsidian-800 text-neon-cyan">
          {icon}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
            {title}
          </h1>
          <p className="font-mono text-xs uppercase tracking-wider text-neon-cyan/50">{subtitle}</p>
        </div>
      </div>

      <ModulePanel title={title} subtitle={subtitle} icon={icon} className="min-h-[400px]">
        <div className="relative flex flex-1 items-center justify-center bg-obsidian-900 p-12">
          <div className="absolute inset-0 grid-bg-fine opacity-30" />
          <div className="relative z-10 max-w-md text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-obsidian-800">
              {icon}
            </div>
            <p className="font-display text-lg font-semibold uppercase tracking-wider text-neon-cyan/60">
              Module Socket
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-neon-cyan/10 bg-obsidian-800/50 px-4 py-2">
              <Terminal className="h-3.5 w-3.5 text-neon-cyan/50" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                {hint}
              </span>
            </div>
          </div>
        </div>
      </ModulePanel>
    </div>
  );
}

/* Convenience section builders */
export function StudyGridSection() {
  return (
    <PlaceholderSection
      icon={<BookOpen className="h-8 w-8 text-neon-cyan/40" />}
      title="Study Grid"
      subtitle="Learning modules"
      description="Interactive study sessions and knowledge modules will appear here. Plug in curriculum content and progress tracking."
      hint="Awaiting study module plugin"
    />
  );
}

export function VaultSection() {
  return (
    <PlaceholderSection
      icon={<BookOpen className="h-8 w-8 text-neon-cyan/40" />}
      title="Vault"
      subtitle="Asset storage"
      description="Your collected assets, achievements, and unlocked content will be stored here. Securely accessible at any time."
      hint="Awaiting vault module plugin"
    />
  );
}

export function AnalyticsSection() {
  return (
    <PlaceholderSection
      icon={<BookOpen className="h-8 w-8 text-neon-cyan/40" />}
      title="Analytics"
      subtitle="Performance metrics"
      description="Deep-dive analytics and historical performance data will be visualized here with interactive charts and trends."
      hint="Awaiting analytics module plugin"
    />
  );
}

export function SettingsSection() {
  return (
    <PlaceholderSection
      icon={<BookOpen className="h-8 w-8 text-neon-cyan/40" />}
      title="Settings"
      subtitle="System configuration"
      description="Configure your operator preferences, display options, and system parameters here."
      hint="Awaiting settings module plugin"
    />
  );
}
