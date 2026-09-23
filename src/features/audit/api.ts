import { supabase } from '@/lib/supabase';

/**
 * Row shape of `public.audit_logs` as returned by PostgREST.
 * `before` / `after` / `metadata` are `jsonb` — typed as `unknown` here
 * because their shape varies per action.
 */
export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  /** Prefix match, e.g. 'profile' matches 'profile.created', 'profile.updated'. */
  actionPrefix?: string;
  targetTable?: string;
  limit?: number;
}

const AUDIT_COLUMNS =
  'id, actor_id, actor_email, action, target_table, target_id, before, after, metadata, reason, created_at';

export async function fetchAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLogRow[]> {
  let query = supabase
    .from('audit_logs')
    .select(AUDIT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 200);

  if (filters.actionPrefix) {
    query = query.like('action', `${filters.actionPrefix}%`);
  }
  if (filters.targetTable) {
    query = query.eq('target_table', filters.targetTable);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLogRow[];
}