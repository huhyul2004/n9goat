-- ============================================================
-- survey-study 전용 Supabase 스키마 (N9 기존 테이블과 완전히 독립)
-- Supabase SQL Editor에 그대로 붙여넣어 실행하세요. 여러 번 실행해도 안전합니다.
-- 기존 N9 테이블(posts, mails 등)은 전혀 건드리지 않습니다.
-- ============================================================

-- 응답자 세션 (1명 = 1행)
CREATE TABLE IF NOT EXISTS survey_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_group TEXT NOT NULL CHECK (survey_group IN ('A', 'B', 'C', 'D')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,   -- (레거시) 더 이상 클라이언트가 쓰지 않음. 완료 여부는 서버가 응답 커버리지로 도출.
  grade TEXT,          -- 학년 (선택 입력)
  affiliation TEXT,    -- 소속 (선택 입력)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_sessions_group ON survey_sessions (survey_group);

-- 문항별 응답 (append-only: 같은 문항을 다시 답하면 새 행이 쌓이고, 집계는 최신 행을 채택)
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES survey_sessions (id) ON DELETE CASCADE,
  question_id INT NOT NULL,       -- 1~8
  value NUMERIC,                  -- 척도 점수. 결측(건너뜀)/D그룹이면 NULL
  reason_text TEXT,               -- 이유 서술(A/B/C) 또는 D그룹 서술 응답
  manual_code INT CHECK (manual_code BETWEEN 1 AND 5), -- D그룹 서술에 관리자가 부여하는 5단계 코드
  duration_ms INT,                -- 이 문항에 걸린 응답 소요시간(ms)
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_session ON survey_responses (session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question ON survey_responses (question_id);
-- 세션+문항별 '최신 응답' 선별을 가속 (append-only 집계용)
CREATE INDEX IF NOT EXISTS idx_survey_responses_latest
  ON survey_responses (session_id, question_id, answered_at DESC);

-- 이미 테이블을 만든 뒤 업데이트하는 경우를 위한 마이그레이션 (여러 번 실행해도 안전)
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS manual_code INT CHECK (manual_code BETWEEN 1 AND 5);
-- append-only 전환: 과거 UNIQUE(session_id, question_id) 제약이 있으면 제거
ALTER TABLE survey_responses
  DROP CONSTRAINT IF EXISTS survey_responses_session_id_question_id_key;

-- ============================================================
-- RLS: 익명(anon)은 INSERT(삽입)만 가능. SELECT/UPDATE/DELETE 전면 차단.
--  - 응답 저장은 anon 키로 '조회 없이 삽입'만 수행한다.
--  - 조회·집계·CSV·D그룹 수동코딩은 서버(service_role 키)에서만 수행한다.
--    service_role 은 RLS를 우회하므로 서버 라우트에서만 쓰고, 절대 클라이언트 번들에 노출하지 않는다.
-- ============================================================
ALTER TABLE survey_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- 과거의 '전체 허용(USING true)' 정책 제거
DROP POLICY IF EXISTS survey_sessions_anon_all     ON survey_sessions;
DROP POLICY IF EXISTS survey_responses_anon_all    ON survey_responses;
-- 재실행 대비: 새 정책도 먼저 제거 후 재생성
DROP POLICY IF EXISTS survey_sessions_anon_insert  ON survey_sessions;
DROP POLICY IF EXISTS survey_responses_anon_insert ON survey_responses;

-- 익명/인증 역할: INSERT만 허용 (조건 없는 전체허용 USING 을 남기지 않는다)
CREATE POLICY survey_sessions_anon_insert ON survey_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY survey_responses_anon_insert ON survey_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- SELECT/UPDATE/DELETE 정책을 만들지 않음 → anon/authenticated 의 조회·수정·삭제는 모두 거부된다.

-- 방어적 이중화: 테이블 권한도 최소 원칙으로 정리한다.
-- anon 에게서 모든 권한을 회수하고 INSERT 만 다시 부여한다.
REVOKE ALL    ON survey_sessions  FROM anon;
REVOKE ALL    ON survey_responses FROM anon;
GRANT  INSERT ON survey_sessions  TO anon;
GRANT  INSERT ON survey_responses TO anon;
