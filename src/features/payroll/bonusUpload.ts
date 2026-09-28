import * as XLSX from 'xlsx';

import { supabase } from '@/lib/supabase';
import type { BonusTier, PayrollCurrency } from '@/types/payroll';

export interface BonusUploadRow {
  email: string;
  deposit_usd: number;
  employee_id: string | null;
  employee_full_name: string | null;
  currency: PayrollCurrency | null;
  tier_from: number | null;
  tier_percent: number | null;
  bonus_usd: number | null;
  bonus_payroll_currency: number | null;
  error: string | null;
}

export interface BonusUploadResult {
  rows: BonusUploadRow[];
  matched: number;
  unmatched: number;
}

function pickField(row: Record<string, unknown>, names: string[]): unknown {
  const lower = Object.keys(row).reduce<Record<string, unknown>>((acc, k) => {
    acc[k.trim().toLowerCase()] = row[k];
    return acc;
  }, {});
  for (const n of names) {
    if (n in lower) return lower[n];
  }
  return undefined;
}

function findTier(tiers: BonusTier[], deposit: number): BonusTier | null {
  for (const t of tiers) {
    if (deposit < t.from_usd) continue;
    if (t.to_usd === null || deposit <= t.to_usd) return t;
  }
  return null;
}

export async function parseBonusFile(file: File): Promise<BonusUploadResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], matched: 0, unmatched: 0 };
  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  const [profilesRes, tiersRes, settingsRes] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name'),
    supabase
      .from('bonus_tiers')
      .select(
        'id, from_usd, to_usd, bonus_percent, sort_order, active, created_at, updated_at',
      )
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('payroll_settings')
      .select('usd_to_aed_rate')
      .eq('id', 1)
      .maybeSingle(),
  ]);

  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (tiersRes.error) throw new Error(tiersRes.error.message);
  if (settingsRes.error) throw new Error(settingsRes.error.message);

  const profiles = (profilesRes.data ?? []) as Array<{
    id: string;
    email: string;
    full_name: string;
  }>;
  const tiers = (tiersRes.data ?? []) as BonusTier[];
  const usdToAed = Number(settingsRes.data?.usd_to_aed_rate ?? 3.6725);

  const profileByEmail = new Map(
    profiles.map((p) => [p.email.toLowerCase(), p]),
  );

  const empIds = profiles.map((p) => p.id);
  const salaryRes = await supabase
    .from('salary_structures')
    .select('employee_id, currency')
    .in('employee_id', empIds)
    .is('effective_to', null);
  if (salaryRes.error) throw new Error(salaryRes.error.message);

  const currencyByEmployee = new Map<string, PayrollCurrency>(
    (salaryRes.data ?? []).map(
      (s: { employee_id: string; currency: PayrollCurrency }) => [
        s.employee_id,
        s.currency,
      ],
    ),
  );

  const out: BonusUploadRow[] = [];
  let matched = 0;
  let unmatched = 0;

  for (const row of raw) {
    const emailRaw = pickField(row, ['email', 'employee_email']);
    const depositRaw = pickField(row, [
      'deposit',
      'deposit_amount_usd',
      'amount',
      'usd',
    ]);

    const email =
      typeof emailRaw === 'string' ? emailRaw.trim().toLowerCase() : '';
    const deposit = Number(depositRaw);

    if (!email || !Number.isFinite(deposit) || deposit < 0) {
      out.push({
        email: email || '—',
        deposit_usd: Number.isFinite(deposit) ? deposit : 0,
        employee_id: null,
        employee_full_name: null,
        currency: null,
        tier_from: null,
        tier_percent: null,
        bonus_usd: null,
        bonus_payroll_currency: null,
        error: 'Invalid email or deposit value',
      });
      unmatched++;
      continue;
    }

    const profile = profileByEmail.get(email);
    if (!profile) {
      out.push({
        email,
        deposit_usd: deposit,
        employee_id: null,
        employee_full_name: null,
        currency: null,
        tier_from: null,
        tier_percent: null,
        bonus_usd: null,
        bonus_payroll_currency: null,
        error: 'No matching employee',
      });
      unmatched++;
      continue;
    }

    const currency = currencyByEmployee.get(profile.id);
    if (!currency) {
      out.push({
        email,
        deposit_usd: deposit,
        employee_id: profile.id,
        employee_full_name: profile.full_name,
        currency: null,
        tier_from: null,
        tier_percent: null,
        bonus_usd: null,
        bonus_payroll_currency: null,
        error: 'Employee has no salary structure',
      });
      unmatched++;
      continue;
    }

    const tier = findTier(tiers, deposit);
    if (!tier) {
      out.push({
        email,
        deposit_usd: deposit,
        employee_id: profile.id,
        employee_full_name: profile.full_name,
        currency,
        tier_from: null,
        tier_percent: null,
        bonus_usd: null,
        bonus_payroll_currency: null,
        error: 'No bonus tier matched',
      });
      unmatched++;
      continue;
    }

    const bonusUsd =
      Math.round(deposit * (tier.bonus_percent / 100) * 100) / 100;
    const bonusInCurrency =
      currency === 'USDT'
        ? bonusUsd
        : Math.round(bonusUsd * usdToAed * 100) / 100;

    out.push({
      email,
      deposit_usd: deposit,
      employee_id: profile.id,
      employee_full_name: profile.full_name,
      currency,
      tier_from: tier.from_usd,
      tier_percent: tier.bonus_percent,
      bonus_usd: bonusUsd,
      bonus_payroll_currency: bonusInCurrency,
      error: null,
    });
    matched++;
  }

  return { rows: out, matched, unmatched };
}

export async function applyBonuses(
  runId: string,
  rows: BonusUploadRow[],
): Promise<{ applied: number; skipped: number }> {
  const valid = rows.filter((r) => r.error === null && r.employee_id);

  const { data, error } = await supabase
    .from('payroll_items')
    .select(
      'id, employee_id, base_earned, absence_deduction, late_deduction, late_waived, manual_addition, manual_deduction',
    )
    .eq('run_id', runId);
  if (error) throw new Error(error.message);

  const items = (data ?? []) as Array<{
    id: string;
    employee_id: string;
    base_earned: number;
    absence_deduction: number;
    late_deduction: number;
    late_waived: boolean;
    manual_addition: number;
    manual_deduction: number;
  }>;

  const itemByEmployee = new Map(items.map((i) => [i.employee_id, i]));

  let applied = 0;
  let skipped = 0;

  for (const row of valid) {
    const item = itemByEmployee.get(row.employee_id!);
    if (!item) {
      skipped++;
      continue;
    }
    const bonus = row.bonus_payroll_currency ?? 0;
    const netPay =
      Math.round(
        (item.base_earned +
          bonus -
          item.absence_deduction -
          (item.late_waived ? 0 : item.late_deduction) +
          item.manual_addition -
          item.manual_deduction) *
          100,
      ) / 100;

    const { error: uErr } = await supabase
      .from('payroll_items')
      .update({
        bonus_amount: bonus,
        bonus_note: `Deposits ${row.deposit_usd} USD · tier ${row.tier_percent}%`,
        net_pay: Math.max(0, netPay),
      })
      .eq('id', item.id);
    if (uErr) throw new Error(uErr.message);
    applied++;
  }

  return { applied, skipped };
}