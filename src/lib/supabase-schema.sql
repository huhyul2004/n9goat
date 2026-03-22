-- Supabase SQL Editor에서 실행하세요
-- 기존 테이블이 있으면 삭제 (주의: 데이터 손실)
-- DROP TABLE IF EXISTS activity_logs, comments, chat_messages, calendar_events, polls, mails, posts, invite_codes, profiles;

-- ============================================================
-- 0-A. 회원 프로필 (profiles) — Supabase Auth와 연동
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  school TEXT NOT NULL,
  role TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles (school);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- ============================================================
-- 0-B. 초대 코드 (invite_codes)
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles (id),
  label TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes (is_active);

-- ============================================================
-- 0-C. 활동 로그 (activity_logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles (id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);

-- ============================================================
-- 0-D. 계정 비밀번호 (credentials)
-- ============================================================
CREATE TABLE IF NOT EXISTS credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credentials_account_id ON credentials (account_id);

-- ============================================================
-- 1. 게시글 (posts)
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('question', 'announcement')),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  author_school TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_id TEXT NOT NULL,
  attachment TEXT,
  attachment_name TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_school ON posts (author_school);

-- ============================================================
-- 2. 댓글 (comments)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_school TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at DESC);

-- ============================================================
-- 3. 메일 (mails)
-- ============================================================
CREATE TABLE IF NOT EXISTS mails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id TEXT NOT NULL,
  from_school TEXT NOT NULL,
  from_role TEXT NOT NULL,
  to_id TEXT NOT NULL,
  to_school TEXT NOT NULL,
  to_role TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  attachment TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mails_from_id ON mails (from_id);
CREATE INDEX IF NOT EXISTS idx_mails_to_id ON mails (to_id);
CREATE INDEX IF NOT EXISTS idx_mails_is_read ON mails (is_read);
CREATE INDEX IF NOT EXISTS idx_mails_created_at ON mails (created_at DESC);

-- ============================================================
-- 4. 채팅 메시지 (chat_messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room TEXT NOT NULL,
  content TEXT NOT NULL,
  author_school TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages (room);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages (room, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author_id ON chat_messages (author_id);

-- ============================================================
-- 4-B. 단톡방 (chat_rooms)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_owner_id ON chat_rooms (owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_members ON chat_rooms USING gin (members);

-- ============================================================
-- 5. 캘린더 이벤트 (calendar_events)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  author_school TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events (date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_author_school ON calendar_events (author_school);
CREATE INDEX IF NOT EXISTS idx_calendar_events_author_id ON calendar_events (author_id);

-- ============================================================
-- 6. 투표 (polls) — votes는 JSONB로 저장
-- ============================================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  votes JSONB NOT NULL DEFAULT '{}'::jsonb,
  author_school TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_polls_author_id ON polls (author_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_expires_at ON polls (expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_author_school ON polls (author_school);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- profiles: 로그인한 사용자만 조회, 본인만 수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- invite_codes: 누구나 코드 조회(가입용), 관리자만 생성
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active invite codes" ON invite_codes FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert invite codes" ON invite_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update invite codes" ON invite_codes FOR UPDATE TO authenticated USING (true);

-- activity_logs: 본인 로그만 조회, 관리자는 전체 조회
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read activity logs" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert activity logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- posts: 로그인 사용자만 CRUD
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read posts" ON posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert posts" ON posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors can update own posts" ON posts FOR UPDATE TO authenticated USING (author_id = auth.uid()::text);
CREATE POLICY "Authors can delete own posts" ON posts FOR DELETE TO authenticated USING (author_id = auth.uid()::text);

-- comments: 로그인 사용자만 CRUD
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read comments" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert comments" ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors can update own comments" ON comments FOR UPDATE TO authenticated USING (author_id = auth.uid()::text);
CREATE POLICY "Authors can delete own comments" ON comments FOR DELETE TO authenticated USING (author_id = auth.uid()::text);

-- mails: 발신자/수신자만 조회
ALTER TABLE mails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own mails" ON mails FOR SELECT TO authenticated USING (from_id = auth.uid()::text OR to_id = auth.uid()::text);
CREATE POLICY "Authenticated can insert mails" ON mails FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Recipients can update mails" ON mails FOR UPDATE TO authenticated USING (to_id = auth.uid()::text);

-- chat_messages: 로그인 사용자만
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read chat" ON chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert chat" ON chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors can delete own chat" ON chat_messages FOR DELETE TO authenticated USING (author_id = auth.uid()::text);

-- calendar_events: 로그인 사용자만
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read events" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert events" ON calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authors can update own events" ON calendar_events FOR UPDATE TO authenticated USING (author_id = auth.uid()::text);
CREATE POLICY "Authors can delete own events" ON calendar_events FOR DELETE TO authenticated USING (author_id = auth.uid()::text);

-- polls: 로그인 사용자만
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read polls" ON polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert polls" ON polls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update polls" ON polls FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authors can delete own polls" ON polls FOR DELETE TO authenticated USING (author_id = auth.uid()::text);
