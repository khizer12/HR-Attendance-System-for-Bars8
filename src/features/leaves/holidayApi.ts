import { supabase } from '@/lib/supabase';
import type { Holiday, HolidayInput } from '@/types/leave';

const HOLIDAY_COLUMNS = 'id, name, date, description, created_at';

export async function listHolidays(): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select(HOLIDAY_COLUMNS)
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Holiday[];
}

export async function createHoliday(input: HolidayInput): Promise<Holiday> {
  const { data, error } = await supabase
    .from('holidays')
    .insert({
      name: input.name.trim(),
      date: input.date,
      description: input.description?.trim() || null,
    })
    .select(HOLIDAY_COLUMNS)
    .single<Holiday>();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateHoliday(
  id: string,
  input: HolidayInput,
): Promise<Holiday> {
  const { data, error } = await supabase
    .from('holidays')
    .update({
      name: input.name.trim(),
      date: input.date,
      description: input.description?.trim() || null,
    })
    .eq('id', id)
    .select(HOLIDAY_COLUMNS)
    .single<Holiday>();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteHoliday(id: string): Promise<void> {
  const { error } = await supabase.from('holidays').delete().eq('id', id);
  if (error) throw new Error(error.message);
}