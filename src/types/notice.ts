export interface Notice {
  id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoticeWithAuthor extends Notice {
  author_full_name: string;
  author_email: string;
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  pinned: boolean;
}