import type { ReportRow } from '@/features/reports/api';
import { formatDuration, formatTime } from '@/lib/time';

/**
 * Excel-friendly CSV: CRLF line endings, UTF-8 BOM prepended by the caller,
 * escaped double quotes, and dates/times formatted for readability.
 */

const HEADER = [
  'Date',
  'Employee',
  'Email',
  'Department',
  'Status',
  'Clock in',
  'Clock out',
  'Worked',
  'Break',
  'Late (min)',
];

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'on_time':
      return 'On time';
    case 'late':
      return 'Late';
    case 'absent':
      return 'Absent';
    default:
      return status;
  }
}

export function rowsToCsv(rows: ReportRow[]): string {
  const lines: string[] = [];
  lines.push(HEADER.join(','));

  for (const r of rows) {
    const cells = [
      r.work_date,
      r.full_name || 'Unnamed user',
      r.email,
      r.department ?? '',
      statusLabel(r.status),
      r.clock_in_at ? formatTime(r.clock_in_at) : '',
      r.clock_out_at ? formatTime(r.clock_out_at) : '',
      r.total_work_minutes !== null
        ? formatDuration(r.total_work_minutes)
        : '',
      r.total_break_minutes !== null
        ? formatDuration(r.total_break_minutes)
        : '',
      r.late_minutes > 0 ? String(r.late_minutes) : '',
    ];
    lines.push(cells.map(escapeCell).join(','));
  }

  // CRLF for Excel compatibility.
  return lines.join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  // Prepend UTF-8 BOM so Excel opens the file with the correct encoding.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}