import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { formatDuration, formatTime } from '@/lib/time';
import type { ReportRow } from '@/features/reports';

interface ReportTableProps {
  rows: ReportRow[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

function statusBadge(status: string) {
  switch (status) {
    case 'on_time':
      return <Badge variant="success">On time</Badge>;
    case 'late':
      return <Badge variant="warning">Late</Badge>;
    case 'absent':
      return <Badge variant="danger">Absent</Badge>;
    default:
      return <Badge variant="muted">{status}</Badge>;
  }
}

export function ReportTable({ rows, loading, loaded, error }: ReportTableProps) {
  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-danger">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (!loaded && !loading) {
    return (
      <Card>
        <CardBody className="py-10 text-center">
          <p className="text-sm text-muted-gray">
            Choose a date range and click <span className="text-off-white">Run report</span>.
          </p>
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
          <p className="text-sm text-muted-gray">
            No records match this filter.
          </p>
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
                <th scope="col" className="font-medium py-2.5 pr-3">Date</th>
                <th scope="col" className="font-medium py-2.5 pr-3">Employee</th>
                <th scope="col" className="font-medium py-2.5 pr-3">Status</th>
                <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
                  In
                </th>
                <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
                  Out
                </th>
                <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
                  Worked
                </th>
                <th scope="col" className="font-medium py-2.5 tabular-nums hidden md:table-cell">
                  Late
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.employee_id}-${r.work_date}-${i}`}
                  className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors"
                >
                  <td className="py-3 pr-3 text-off-white tabular-nums">
                    {r.work_date}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="text-off-white truncate">
                      {r.full_name || 'Unnamed user'}
                    </div>
                    <div className="text-xs text-muted-gray truncate">
                      {r.department ?? r.email}
                    </div>
                  </td>
                  <td className="py-3 pr-3">{statusBadge(r.status)}</td>
                  <td className="py-3 pr-3 text-off-white tabular-nums">
                    {r.clock_in_at ? formatTime(r.clock_in_at) : '—'}
                  </td>
                  <td className="py-3 pr-3 text-off-white tabular-nums">
                    {r.clock_out_at ? formatTime(r.clock_out_at) : '—'}
                  </td>
                  <td className="py-3 pr-3 text-off-white tabular-nums">
                    {r.total_work_minutes !== null
                      ? formatDuration(r.total_work_minutes)
                      : '—'}
                  </td>
                  <td className="py-3 tabular-nums hidden md:table-cell">
                    {r.late_minutes > 0 ? (
                      <span className="text-warning">
                        {r.late_minutes} min
                      </span>
                    ) : (
                      <span className="text-muted-gray">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-charcoal-3 text-xs text-muted-gray">
          {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </div>
      </CardBody>
    </Card>
  );
}