import { supabase } from '@/lib/supabase';
import type { Role } from '@/types/auth';

export interface EmployeeRow {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department: string | null;
  managed_departments: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  department?: string | null;
  managed_departments?: string[];
}

export interface UpdateEmployeeInput {
  full_name?: string;
  role?: Role;
  department?: string | null;
  managed_departments?: string[];
  active?: boolean;
}

const PROFILE_COLUMNS =
  'id, email, full_name, role, department, managed_departments, active, created_at, updated_at';

export async function listEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('full_name', { ascending: true, nullsFirst: false })
    .order('email', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as EmployeeRow[];
}

export async function getEmployeeById(id: string): Promise<EmployeeRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as EmployeeRow | null) ?? null;
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<EmployeeRow> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not signed in.');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/functions/v1/create-employee`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    user?: { id: string; email: string; role: Role; department: string | null };
    error?: string;
  };

  if (!res.ok) {
    throw new Error(payload.error ?? `Create failed (${res.status})`);
  }
  if (!payload.user) {
    throw new Error('Create returned no user.');
  }

  // Fetch the full row so callers get a complete EmployeeRow.
  const created = await getEmployeeById(payload.user.id);
  if (!created) throw new Error('Created user but profile is missing.');
  return created;
}

export async function updateEmployee(
  id: string,
  patch: UpdateEmployeeInput,
): Promise<EmployeeRow> {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id);

  if (error) throw new Error(error.message);

  const updated = await getEmployeeById(id);
  if (!updated) throw new Error('Employee not found after update.');
  return updated;
}

export async function setEmployeeActive(
  id: string,
  active: boolean,
): Promise<EmployeeRow> {
  return updateEmployee(id, { active });
}