-- ============================================================
-- survey-study 전용 Supabase 스키마 (N9 기존 테이블과 완전히 독립)
-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요.
-- 기존 N9 테이블(posts, mails 등)은 전혀 건드리지 않습니다.
-- ============================================================

-- 응답자 세션 (1명 = 1행)
CREATE TABLE IF NOT EXISTS survey_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_group TEXT NOT NULL CHECK (survey_group IN ('A', 'B', 'C', 'D')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  grade TEXT,          -- 학년 (선택 입력)
  affiliation TEXT,    -- 소속 (선택 입력)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_sessions_group ON survey_sessions (survey_group);

-- 문항별 응답 (1명 x 8문항 = 최대 8행)
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES survey_sessions (id) ON DELETE CASCADE,
  question_id INT NOT NULL,       -- 1~8
  value NUMERIC,                  -- 척도 점수. 결측(건너뜀)/D그룹이면 NULL
  reason_text TEXT,               -- 이유 서술(A/B/C) 또는 D그룹 서술 응답
  duration_ms INT,                -- 이 문항에 걸린 응답 소요시간(ms)
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_session ON survey_responses (session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question ON survey_responses (question_id);

-- ============================================================
-- RLS: 무기명 설문이므로 익명(anon) 키로 삽입/조회를 허용합니다.
-- (학교 과학 탐구용 공개 설문 수준의 정책. 민감정보는 수집하지 않음)
-- ============================================================
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- 이미 존재하면 무시하고 재생성
DROP POLICY IF EXISTS survey_sessions_anon_all ON survey_sessions;
CREATE POLICY survey_sessions_anon_all ON survey_sessions
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS survey_responses_anon_all ON survey_responses;
CREATE POLICY survey_responses_anon_all ON survey_responses
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
