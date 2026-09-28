import { supabase } from '@/lib/supabase';
import type { CreateNoticeInput, NoticeWithAuthor } from '@/types/notice';

const JOINED_COLUMNS = `
  id, author_id, title, body, pinned, created_at, updated_at,
  author:profiles!notices_author_id_fkey ( full_name, email )
`;

export async function listNotices(limit = 100): Promise<NoticeWithAuthor[]> {
  const { data, error } = await supabase
    .from('notices')
    .select(JOINED_COLUMNS)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  type Raw = {
    id: string;
    author_id: string;
    title: string;
    body: string;
    pinned: boolean;
    created_at: string;
    updated_at: string;
    author: { full_name: string; email: string } | null;
  };

  return ((data ?? []) as unknown as Raw[]).map((row) => ({
    id: row.id,
    author_id: row.author_id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_full_name: row.author?.full_name ?? 'Former admin',
    author_email: row.author?.email ?? '',
  }));
}

export async function createNotice(input: CreateNoticeInput): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const { error } = await supabase.from('notices').insert({
    author_id: uid,
    title: input.title.trim(),
    body: input.body.trim(),
    pinned: input.pinned,
  });

  if (error) throw new Error(error.message);
}

export async function updateNotice(
  id: string,
  patch: Partial<CreateNoticeInput>,
): Promise<void> {
  const { error } = await supabase.from('notices').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteNotice(id: string): Promise<void> {
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function togglePin(id: string, pinned: boolean): Promise<void> {
  return updateNotice(id, { pinned });
}