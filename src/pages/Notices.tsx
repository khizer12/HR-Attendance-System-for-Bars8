import { useAuth } from '@/features/auth';
import { useNotices } from '@/features/notices';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { formatDateShort, formatTime } from '@/lib/time';

export default function Notices() {
  const { isSuperAdmin } = useAuth();
  const { rows, loading, error } = useNotices();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="font-heading text-2xl">Notices</h2>
        <p className="text-muted-gray text-sm mt-1">
          {isSuperAdmin
            ? 'Post announcements visible to the whole team.'
            : 'Announcements from your administrators.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Board</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {loading && rows.length === 0 ? (
            <div className="px-5 py-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-gray">No notices yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-3">
              {rows.map((n) => (
                <li key={n.id} className="px-5 py-4">
                  <h3 className="font-heading text-base text-off-white">
                    {n.pinned && <span className="text-lime mr-2">●</span>}
                    {n.title}
                  </h3>
                  <p className="text-xs text-muted-gray mt-1">
                    {n.author_full_name} · {formatDateShort(n.created_at)} ·{' '}
                    {formatTime(n.created_at)}
                  </p>
                  <p className="text-sm text-off-white mt-3 whitespace-pre-wrap">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}