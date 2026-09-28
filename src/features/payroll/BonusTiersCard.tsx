import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';
import { usePayrollSettings } from '@/features/payroll/usePayrollSettings';
import type { BonusTier } from '@/types/payroll';

interface DraftTier {
  from_usd: string;
  to_usd: string;
  bonus_percent: string;
}

function tierToDraft(t: BonusTier): DraftTier {
  return {
    from_usd: String(t.from_usd),
    to_usd: t.to_usd === null ? '' : String(t.to_usd),
    bonus_percent: String(t.bonus_percent),
  };
}

function tiersKey(tiers: BonusTier[]): string {
  return tiers
    .map((t) => `${t.id}:${t.from_usd}:${t.to_usd ?? 'null'}:${t.bonus_percent}`)
    .join('|');
}

/**
 * Wrapper. Gates on loading + permission, then mounts the keyed form.
 * Key changes when the underlying tiers change, so the drafts reset to
 * the freshly-fetched values without an effect.
 */
export function BonusTiersCard() {
  const { isSuperAdmin } = useAuth();
  const { tiers, loading, error, refresh } = usePayrollSettings();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bonus tiers</CardTitle>
        </CardHeader>
        <CardBody className="px-5 py-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </CardBody>
      </Card>
    );
  }

  if (!isSuperAdmin) return null;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bonus tiers</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <BonusTiersForm
      key={tiersKey(tiers)}
      tiers={tiers}
      onSaved={refresh}
    />
  );
}

interface FormProps {
  tiers: BonusTier[];
  onSaved: () => Promise<void>;
}

function BonusTiersForm({ tiers, onSaved }: FormProps) {
  const [drafts, setDrafts] = useState<DraftTier[]>(tiers.map(tierToDraft));
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateTier(idx: number, patch: Partial<DraftTier>) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    );
  }

  function addTier() {
    setDrafts((prev) => [
      ...prev,
      { from_usd: '0', to_usd: '', bonus_percent: '0' },
    ]);
  }

  function removeTier(idx: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setActionError(null);
    setSuccess(false);

    for (const d of drafts) {
      const from = Number(d.from_usd);
      const to = d.to_usd.trim() === '' ? null : Number(d.to_usd);
      const pct = Number(d.bonus_percent);
      if (!Number.isFinite(from) || from < 0) {
        setActionError('from_usd must be a non-negative number.');
        return;
      }
      if (to !== null && (!Number.isFinite(to) || to <= from)) {
        setActionError('to_usd must be greater than from_usd.');
        return;
      }
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        setActionError('bonus_percent must be between 0 and 100.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error: delError } = await supabase
        .from('bonus_tiers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (delError) throw new Error(delError.message);

      if (drafts.length > 0) {
        const { error: insError } = await supabase
          .from('bonus_tiers')
          .insert(
            drafts.map((d, i) => ({
              from_usd: Number(d.from_usd),
              to_usd: d.to_usd.trim() === '' ? null : Number(d.to_usd),
              bonus_percent: Number(d.bonus_percent),
              sort_order: i + 1,
              active: true,
            })),
          );
        if (insError) throw new Error(insError.message);
      }

      setSuccess(true);
      await onSaved();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Bonus tiers</CardTitle>
          <p className="text-xs text-muted-gray mt-1">
            Deposit amounts (USD) → bonus percentage. Applied when the bonus
            spreadsheet is uploaded.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={addTier}>
          Add tier
        </Button>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="space-y-3">
          {drafts.length === 0 && (
            <p className="text-xs text-muted-gray">
              No tiers configured. Add one to enable bonus calculation.
            </p>
          )}

          {drafts.map((d, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
            >
              <Input
                label="From USD"
                type="number"
                step="0.01"
                min="0"
                value={d.from_usd}
                onChange={(e) => updateTier(idx, { from_usd: e.target.value })}
                disabled={submitting}
              />
              <Input
                label="To USD"
                type="number"
                step="0.01"
                min="0"
                value={d.to_usd}
                onChange={(e) => updateTier(idx, { to_usd: e.target.value })}
                disabled={submitting}
                placeholder="unlimited"
              />
              <Input
                label="Bonus %"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={d.bonus_percent}
                onChange={(e) =>
                  updateTier(idx, { bonus_percent: e.target.value })
                }
                disabled={submitting}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTier(idx)}
                disabled={submitting}
                className="text-danger mb-1"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        {(actionError || success) && (
          <div
            role="alert"
            className={
              actionError
                ? 'rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger'
                : 'rounded-md bg-success/10 border border-success/30 px-3 py-2 text-xs text-success'
            }
          >
            {actionError ?? 'Saved.'}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            loading={submitting}
          >
            Save tiers
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}