export interface Post {
  id: string;
  category: "question" | "announcement";
  title: string;
  content: string;
  author_school: string;
  author_role: string;
  author_id: string;
  attachment?: string; // base64 data URL or Supabase storage URL
  attachment_name?: string;
  is_anonymous?: boolean;
  pinned?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_school: string;
  author_role: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Mail {
  id: string;
  from_id: string;
  from_school: string;
  from_role: string;
  to_id: string;
  to_school: string;
  to_role: string;
  subject: string;
  body: string;
  is_read: boolean;
  attachment?: string;
  attachment_name?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room: string; // school name or "전체"
  content: string;
  author_school: string;
  author_role: string;
  author_id: string;
  attachment?: string;
  attachment_name?: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  owner_id: string;
  members: string[]; // array of user IDs (소속_직책)
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  author_school: string;
  author_role: string;
  author_id: string;
  created_at: string;
}

export interface Poll {
  id: string;
  title: string;
  options: string[];
  votes: Record<string, string>; // author_id -> option
  allow_other?: boolean; // 기타 항목 허용 여부
  author_school: string;
  author_role: string;
  author_id: string;
  created_at: string;
  expires_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  school: string;
  role: string;
  is_admin: boolean;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  label: string;
  is_active: boolean;
  used_count: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  target_table?: string;
  target_id?: string;
  details: Record<string, unknown>;
  created_at: string;
}
