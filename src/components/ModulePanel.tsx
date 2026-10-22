import { type ReactNode } from 'react';
import { Maximize2 } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function ModulePanel({
  title,
  subtitle,
  icon,
  actions,
  className = '',
  children,
}: Props) {
  return (
    <div
      className={`
        group relative flex flex-col overflow-hidden
        border border-neon-cyan/15 bg-obsidian-850/50
        hud-clip corner-deco
        transition-all duration-300
        hover:border-neon-cyan/30 hover:shadow-neon-cyan
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neon-cyan/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neon-cyan/15 bg-obsidian-800 text-neon-cyan">
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:text-neon-cyan transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 scrollbar-cyber">{children}</div>
    </div>
  );
}
