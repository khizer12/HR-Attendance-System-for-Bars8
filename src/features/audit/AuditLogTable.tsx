import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { formatTime } from '@/lib/time';
import type { AuditLogRow } from '@/features/audit/api';

interface AuditLogTableProps {
  rows: AuditLogRow[];
  loading: boolean;
  error: string | null;
}

function actionTone(action: string): 'lime' | 'info' | 'warning' | 'danger' | 'neutral' {
  if (action.includes('created')) return 'lime';
  if (action.includes('deleted')) return 'danger';
  if (action.includes('deactivated')) return 'warning';
  if (action.includes('role_changed')) return 'warning';
  if (action.includes('updated')) return 'info';
  return 'neutral';
}

function summarize(metadata: Record<string, unknown> | null): string {
  const changed = metadata?.changed;
  if (!changed || typeof changed !== 'object') return '—';
  const keys = Object.keys(changed as Record<string, unknown>);
  if (keys.length === 0) return '—';
  return keys.join(', ');
}

export function AuditLogTable({ rows, loading, error }: AuditLogTableProps) {
  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (loading && rows.length === 0) {
    return (
      <Card>
        <CardBody className="py-10 text-center">
          <p className="text-sm text-muted-gray">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardBody className="py-10 text-center">
          <p className="text-sm text-muted-gray">No audit entries match.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <div className="overflow-x-auto px-5 pb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
                <th scope="col" className="font-medium py-2.5 pr-3">When</th>
                <th scope="col" className="font-medium py-2.5 pr-3">Actor</th>
                <th scope="col" className="font-medium py-2.5 pr-3">Action</th>
                <th scope="col" className="font-medium py-2.5 pr-3 hidden md:table-cell">
                  Target
                </th>
                <th scope="col" className="font-medium py-2.5 hidden lg:table-cell">
                  Changed
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors"
                >
                  <td className="py-3 pr-3 text-muted-gray tabular-nums text-xs whitespace-nowrap">
                    {formatTime(r.created_at)}
                  </td>
                  <td className="py-3 pr-3 text-off-white text-xs truncate max-w-[180px]">
                    {r.actor_email ?? 'system'}
                  </td>
                  <td className="py-3 pr-3">
                    <Badge variant={actionTone(r.action)}>{r.action}</Badge>
                  </td>
                  <td className="py-3 pr-3 text-muted-gray text-xs hidden md:table-cell">
                    {r.target_table}
                  </td>
                  <td className="py-3 text-muted-gray text-xs hidden lg:table-cell truncate max-w-[200px]">
                    {summarize(r.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-charcoal-3 text-xs text-muted-gray">
          {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
        </div>
      </CardBody>
    </Card>
  );
}