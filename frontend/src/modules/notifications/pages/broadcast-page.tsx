import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/common/components/ui/card';
import { Input } from '@/common/components/ui/input';
import { Select } from '@/common/components/ui/select';
import { Button } from '@/common/components/ui/button';
import { PageHeader } from '@/common/components/page/page-header';
import { EmptyState } from '@/common/components/feedback/empty-state';
import { LoadingState } from '@/common/components/feedback/loading-state';
import { useConfirm } from '@/common/components/feedback/confirm-dialog-provider';
import { useToast } from '@/common/components/feedback/toast-provider';
import { SearchIcon, TrashIcon } from '@/common/components/ui/action-icons';
import { getErrorMessage } from '@/common/lib/request-error';
import { BroadcastComposerCard } from '@/modules/notifications/components/broadcast-composer-card';
import { useBroadcasts, useClearBroadcasts, useDismissBroadcast, useMarkAllBroadcastsRead, useMarkBroadcastRead } from '@/modules/notifications/hooks/use-notifications';
import type { AppNotification } from '@/common/types/domain';

export function BroadcastPage() {
  const navigate = useNavigate();
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'unread'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [openingId, setOpeningId] = useState<number | null>(null);
  const filters = useMemo(() => ({ search, status, sort }), [search, status, sort]);
  const broadcastsQuery = useBroadcasts(filters);
  const markReadMutation = useMarkBroadcastRead();
  const dismissMutation = useDismissBroadcast();
  const markAllMutation = useMarkAllBroadcastsRead();
  const clearBroadcastsMutation = useClearBroadcasts();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const broadcasts = broadcastsQuery.data ?? [];
  const hasBroadcasts = broadcasts.length > 0;

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
  };

  const openBroadcast = async (item: AppNotification) => {
    if (openingId === item.id) return;
    setOpeningId(item.id);
    try {
      if (!item.isRead) {
        await markReadMutation.mutateAsync(item.id);
      }
      if (item.targetPath) {
        navigate(item.targetPath);
      }
    } catch (error) {
      showToast({ title: 'Gagal membuka broadcast', description: getErrorMessage(error, 'Broadcast tidak berhasil dibuka.'), tone: 'error' });
    } finally {
      setOpeningId((current) => (current === item.id ? null : current));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Broadcast"
        title="Pusat Broadcast"
        actions={(
          <>
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                if (!hasBroadcasts) return;
                const approved = await confirm({
                  title: 'Hapus semua broadcast?',
                  description: 'Semua broadcast pada akun ini akan dihapus. Tindakan ini tidak dapat dibatalkan.',
                  confirmLabel: 'Hapus broadcast',
                  tone: 'danger',
                });
                if (!approved) return;
                try {
                  await clearBroadcastsMutation.mutateAsync();
                  showToast({ title: 'Broadcast dihapus', description: 'Semua broadcast berhasil dihapus.', tone: 'success' });
                } catch (error) {
                  showToast({ title: 'Gagal menghapus broadcast', description: getErrorMessage(error, 'Terjadi kesalahan saat menghapus broadcast.'), tone: 'error' });
                }
              }}
              disabled={!hasBroadcasts || clearBroadcastsMutation.isPending || markAllMutation.isPending}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              {clearBroadcastsMutation.isPending ? 'Menghapus...' : 'Hapus broadcast'}
            </Button>
            <Button type="button" onClick={() => markAllMutation.mutate()} disabled={!hasBroadcasts || markAllMutation.isPending || clearBroadcastsMutation.isPending}>
              {markAllMutation.isPending ? 'Memproses...' : 'Tandai semua dibaca'}
            </Button>
          </>
        )}
      />

      <BroadcastComposerCard />

      <Card className="grid gap-3 md:grid-cols-[1.6fr_0.8fr_0.8fr]">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <Input placeholder="Cari broadcast..." value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} />
          <Button type="submit" variant="secondary" className="action-icon-button search-icon-button shrink-0" aria-label="Telusuri broadcast" title="Telusuri broadcast">
            <SearchIcon className="h-4 w-4" />
          </Button>
        </form>
        <Select value={status} onChange={(event) => setStatus(event.target.value as 'all' | 'unread')}>
          <option value="all">Semua</option>
          <option value="unread">Belum dibaca</option>
        </Select>
        <Select value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')}>
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </Select>
      </Card>

      <Card className="space-y-3">
        {broadcastsQuery.isLoading ? <LoadingState message="Memuat broadcast..." rows={4} /> : broadcastsQuery.isError ? <EmptyState message={getErrorMessage(broadcastsQuery.error, 'Gagal memuat broadcast.')} /> : !broadcasts.length ? <EmptyState message="Belum ada broadcast." /> : (
          <div className="space-y-3">
            {broadcasts.map((item) => (
              <div key={item.id} className={["rounded-[24px] p-5", item.isRead ? 'notification-surface-read' : 'notification-surface-unread'].join(' ')}>
                <div className="flex items-start gap-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void openBroadcast(item)} disabled={dismissMutation.isPending || clearBroadcastsMutation.isPending || openingId === item.id}>
                    <p className="text-base font-semibold theme-text">{item.title}</p>
                    <p className="mt-1 text-sm theme-muted">{item.message}</p>
                    <p className="mt-2 text-xs theme-muted">{new Date(item.createdAt).toLocaleString('id-ID')}</p>
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="action-icon-button delete-icon-button shrink-0"
                    aria-label={`Hapus broadcast ${item.title}`}
                    title="Hapus broadcast"
                    disabled={dismissMutation.isPending || clearBroadcastsMutation.isPending || openingId === item.id}
                    onClick={() => {
                      dismissMutation.mutate(item.id, {
                        onSuccess: () => showToast({ title: 'Broadcast dihapus', description: 'Item broadcast telah dihapus dari daftar.', tone: 'success' }),
                      });
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
