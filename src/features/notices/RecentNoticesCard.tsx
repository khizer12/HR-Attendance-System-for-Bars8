import { Link } from 'react-router-dom';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useNotices } from '@/features/notices';
import { formatDateShort } from '@/lib/time';

/**
 * Standard BARS 8 dashboard card showing the 3 most recent notices.
 * Deliberately NOT Wonderlands styled — the board is a distinct
 * "room" in the app; everywhere else stays burgundy + cream.
 */
export function RecentNoticesCard() {
  const { rows, loading, error } = useNotices();
  const visible = rows.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Notices</CardTitle>
        <Link
          to="/notices"
          className="text-xs text-muted-gray hover:text-off-white transition-colors"
        >
          View all →
        </Link>
      </CardHeader>
      <CardBody className="p-0">
        {error ? (
          <div className="px-5 py-4">
            <p className="text-xs text-danger">{error}</p>
          </div>
        ) : loading && visible.length === 0 ? (
          <div className="px-5 py-4">
            <p className="text-xs text-muted-gray">Loading…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-muted-gray">No notices yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal-3">
            {visible.map((n) => (
              <li key={n.id} className="px-5 py-3">
                <div className="flex items-start gap-2">
                  {n.pinned && (
                    <span className="text-lime mt-0.5 text-xs" aria-hidden="true">
                      ★
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-off-white truncate">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-gray mt-0.5">
                      {n.author_full_name} · {formatDateShort(n.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card> 
  );
}   