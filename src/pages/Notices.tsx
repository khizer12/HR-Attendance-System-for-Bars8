import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import {
  CreateNoticeModal,
  NoticeBoard,
  NoticeCard,
  deleteNotice,
  togglePin,
  useNotices,
} from '@/features/notices';

export default function Notices() {
  const { isSuperAdmin } = useAuth();
  const { rows, loading, error, refresh } = useNotices();
  const [composerOpen, setComposerOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleTogglePin(id: string, pinned: boolean) {
    setActionError(null);
    setBusyId(id);
    try {
      await togglePin(id, pinned);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this notice permanently?')) return;
    setActionError(null);
    setBusyId(id);
    try {
      await deleteNotice(id);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Notices</h2>
          <p className="text-muted-gray text-sm mt-1">
            {isSuperAdmin
              ? 'Post announcements visible to the whole team.'
              : 'Announcements from your administrators.'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button variant="primary" onClick={() => setComposerOpen(true)}>
            Post notice
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {actionError}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <NoticeBoard>
          <div className="col-span-full rounded-sm bg-charcoal/40 p-5">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        </NoticeBoard>
      ) : rows.length === 0 ? (
        <NoticeBoard>
          <div className="col-span-full text-center py-16">
            <p
              className="text-sm"
              style={{ color: '#d9c9a0', fontStyle: 'italic' }}
            >
              The board is empty. No notices have been posted yet.
            </p>
          </div>
        </NoticeBoard>
      ) : (
        <NoticeBoard>
          {rows.map((n, i) => (
            <NoticeCard
              key={n.id}
              notice={n}
              index={i}
              animate={busyId === null}
              canManage={isSuperAdmin}
              onTogglePin={(id, p) => void handleTogglePin(id, p)}
              onDelete={(id) => void handleDelete(id)}
            />
          ))}
        </NoticeBoard>
      )}

      <CreateNoticeModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onCreated={() => void refresh()}
      />
    </div>
  );
}