import { useState, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  applyBonuses,
  parseBonusFile,
  type BonusUploadResult,
} from '@/features/payroll/bonusUpload';
import { cn } from '@/utils/cn';

interface BonusUploadModalProps {
  open: boolean;
  runId: string;
  onClose: () => void;
  onApplied: () => void;
}

export function BonusUploadModal({
  open,
  runId,
  onClose,
  onApplied,
}: BonusUploadModalProps) {
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<BonusUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setParsing(false);
    setApplying(false);
    setResult(null);
    setError(null);
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    try {
      const r = await parseBonusFile(file);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  }

  async function handleApply() {
    if (!result) return;
    setError(null);
    setApplying(true);
    try {
      const res = await applyBonuses(runId, result.rows);
      window.alert(`Applied ${res.applied} bonuses. Skipped ${res.skipped}.`);
      onApplied();
      onClose();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  }

  function handleClose() {
    if (applying) return;
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload bonus file"
      description="Spreadsheet with columns: email, deposit_amount_usd"
      className="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-charcoal-3 bg-charcoal-2 p-4">
          <label className="block text-xs font-medium text-off-white mb-2">
            Choose file (.xlsx or .csv)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => void handleFile(e)}
            disabled={parsing || applying}
            className="block text-xs text-off-white file:mr-3 file:rounded-md file:border-0 file:bg-lime file:text-near-black file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-lime-dim file:cursor-pointer"
          />
          <p className="text-xs text-muted-gray mt-2">
            Expected headers (case-insensitive): <code>email</code> (or{' '}
            <code>employee_email</code>) and <code>deposit_amount_usd</code>{' '}
            (or <code>amount</code>).
          </p>
        </div>

        {parsing && (
          <p className="text-xs text-muted-gray text-center">Parsing…</p>
        )}

        {result && (
          <>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="text-success">{result.matched} matched</span>
              {result.unmatched > 0 && (
                <span className="text-warning">
                  {result.unmatched} unmatched
                </span>
              )}
            </div>

            <div className="max-h-96 overflow-auto rounded-md border border-charcoal-3">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-charcoal-2">
                  <tr className="text-left text-muted-gray">
                    <th className="font-medium py-2 px-3">Employee</th>
                    <th className="font-medium py-2 px-3 tabular-nums">
                      Deposit (USD)
                    </th>
                    <th className="font-medium py-2 px-3 tabular-nums">Tier</th>
                    <th className="font-medium py-2 px-3 tabular-nums">
                      Bonus
                    </th>
                    <th className="font-medium py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'border-t border-charcoal-3/60',
                        r.error && 'bg-danger/5',
                      )}
                    >
                      <td className="py-2 px-3 text-off-white truncate max-w-[180px]">
                        {r.employee_full_name ?? r.email}
                      </td>
                      <td className="py-2 px-3 tabular-nums text-off-white">
                        {r.deposit_usd.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 tabular-nums text-muted-gray">
                        {r.tier_percent !== null ? `${r.tier_percent}%` : '—'}
                      </td>
                      <td className="py-2 px-3 tabular-nums text-off-white">
                        {r.bonus_payroll_currency !== null && r.currency
                          ? `${r.bonus_payroll_currency.toFixed(2)} ${r.currency}`
                          : '—'}
                      </td>
                      <td className="py-2 px-3 text-muted-gray">
                        {r.error ? (
                          <span className="text-danger">{r.error}</span>
                        ) : (
                          <span className="text-success">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={applying}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleApply()}
            disabled={!result || result.matched === 0}
            loading={applying}
          >
            Apply {result ? `${result.matched} bonuses` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}