import { useNavigate } from 'react-router-dom';
import { Card } from '@/common/components/ui/card';
import type { DashboardConfig } from '@/modules/dashboard/types/dashboard.types';
import { cn } from '@/common/utils/cn';

export function DashboardQuickActions({ config }: { config: DashboardConfig }) {
  const navigate = useNavigate();
  const items = config.quickActions ?? [];

  if (items.length === 0) return null;

  return (
    <section>
      <Card className="dashboard-surface">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] theme-muted">Akses Cepat</p>
            <h3 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.03em] theme-text">Empat laman utama yang paling sering dipakai</h3>
            <p className="mt-2 text-sm leading-6 theme-muted">
              Shortcut universal untuk membuka alur kerja utama tanpa berpindah menu satu per satu.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {items.map((item) => (
            <button
              key={`${item.href}-${item.label}`}
              type="button"
              onClick={() => navigate(item.href)}
              className={cn(
                'dashboard-quick-access-card dashboard-interactive-card group relative min-w-0 overflow-hidden rounded-[26px] border px-4 py-4 text-left transition duration-300 md:px-5 md:py-5',
              )}
            >
              <div className="flex min-h-[124px] flex-col justify-between gap-5 md:min-h-[136px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-[1.02rem] font-semibold tracking-[-0.03em] text-[var(--text)] md:text-[1.1rem]">
                      {item.label}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)] md:text-[13px] md:leading-6">
                      {item.note}
                    </p>
                  </div>
                  {typeof item.badgeCount === 'number' && item.badgeCount > 0 ? (
                    <span className="dashboard-quick-access-badge inline-flex min-w-[24px] shrink-0 items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold tracking-[0.01em]">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted)]/90 transition duration-300 group-hover:text-[var(--text)]/78">
                    Shortcut
                  </span>
                  <span className="text-sm font-medium tracking-[-0.01em] text-[var(--text)]/78 transition duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--text)]">
                    Buka
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
