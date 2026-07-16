# survey-study — 응답 척도 형식 비교 (독립 기능)

N9 커뮤니티 코드와 **완전히 분리된** 설문 앱입니다.
기존 게시판/메일/채팅 등의 코드나 테이블은 전혀 수정하지 않습니다.

## 연구 설계 (내부 문서 — 응답자에게 비공개)

- **가설**: 응답 척도 형식(5점/4점/0~100/서술형)에 따라 응답의 변별력과
  타당도가 달라진다. 5점은 중심화 경향, 슬라이더는 heaping이 예상됨.
- **그룹** (접속 시 무작위 배정, 응답자는 배정 사실을 모름):

| 그룹 | 응답 방식 | 이유 서술 | 비고 |
|------|-----------|-----------|------|
| A | 1~5 척도 (중간값 "보통이다" 라벨 포함) | O | 중심화 경향 확인 |
| B | 1~4 척도 (중간값 없음, 강제선택) | O | |
| C | 0~100 슬라이더 | O | heaping 확인 |
| D | 서술형 (척도 없음) | — | 준거값 산출용, 관리자 수동 코딩 |

- **8개 구성개념**: 전반 생활 / 식사(급식) / 활동·수업 집중 / 디지털 도구 /
  여가 시간 / 행사 / 휴식·수면 / 대인관계 — 그룹별로 문구와 제시 순서를
  다르게 표현(`questions.ts`의 `variants`, `QUESTION_ORDER`).

### 절대 준수 사항 (응답자 화면)

응답자 화면(인트로/문항/완료/탭 제목)에는 **척도, 리커트, 그룹, 변별,
편향, 비교, 연구, 가설, 조건** 등 설계를 유추할 수 있는 단어를 절대
노출하지 않습니다. 문구를 수정하면 아래 명령으로 재검수하세요:

```bash
grep -rnE "척도|리커트|그룹|변별|편향|비교|연구|가설|조건" \
  src/app/survey-study/page.tsx \
  src/app/survey-study/respond/page.tsx \
  src/app/survey-study/thanks/page.tsx \
  src/app/survey-study/layout.tsx \
  src/survey-study/components/ProgressBar.tsx \
  src/survey-study/components/QuestionInput.tsx
```

→ 매치가 나오면 **주석/내부 식별자만** 허용되고, JSX로 렌더링되는
문자열이면 반드시 수정해야 합니다. (`questions.ts`의 `construct`와
`GROUPS[*].label`은 관리자 대시보드 전용이라 예외)

## 폴더 구조

```
src/survey-study/            ← 이 기능의 모든 로직 (독립 모듈)
  lib/
    types.ts                 타입 정의
    questions.ts             8개 구성개념 × 그룹별 문구/순서 + 무작위 배정
    stats.ts                 평균/표본표준편차(n-1)/분산/중앙집중도/정규화/키워드
    aggregate.ts             그룹×문항 통계 집계 (D그룹 수동코드 매핑 포함)
    db.ts                    Supabase 데이터 레이어 (survey 전용 테이블만 사용)
    csv.ts                   CSV 내보내기 (manual_code 포함)
    schema.sql               ★ Supabase에 실행할 테이블 생성/마이그레이션 SQL
  components/
    ProgressBar.tsx
    QuestionInput.tsx        5점/4점/슬라이더/서술 응답 UI
    GroupedBarChart.tsx      의존성 없는 순수 SVG 막대그래프
    QrCode.tsx               배포 링크 QR

src/app/survey-study/        ← Next.js 라우트 (얇은 페이지 껍데기)
  layout.tsx                 독립 배경/제목 (탭 제목도 위장)
  page.tsx                   응답자 진입 (평범한 "의견 조사" 안내)
  respond/page.tsx           인구통계 → 8문항 흐름 (문항별 즉시 저장) → 제출
  thanks/page.tsx            완료 화면 (감사 인사만)
  dashboard/page.tsx         연구자 대시보드 (비밀번호 보호)

src/app/api/survey-study/
  admin-auth/route.ts        대시보드 비밀번호 서버 검증
```

## 배포 전 준비

1. Supabase SQL Editor에서 `src/survey-study/lib/schema.sql` 전체를 실행합니다.
   → `survey_sessions`, `survey_responses` 테이블 생성.
   이미 만든 적이 있다면 다시 실행해도 안전합니다
   (`manual_code` 컬럼이 `ALTER TABLE ... IF NOT EXISTS`로 추가됩니다).
2. `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (N9와 공유)
   - `SURVEY_ADMIN_PASSWORD` — 대시보드 비밀번호 (**Vercel 배포 시
     환경변수에도 반드시 추가**)

## 사용 방법

- **응답 수집**: `/survey-study` 링크 하나만 배포합니다.
  응답자는 접속할 때마다 A/B/C/D 그룹에 무작위 배정되며, 배정 사실을 알 수 없습니다.
- **부분 데이터**: 문항을 넘길 때마다 즉시 저장되므로 중도 이탈해도
  응답한 문항까지는 확보됩니다 (`completed_at`이 null이면 미완주).
- **QR 배포**: `/survey-study/dashboard` → "배포용 QR" 버튼.
- **분석**: `/survey-study/dashboard` (비밀번호 필요)
  - 그룹별 응답자 수·완주율·평균 소요시간 카드
  - A그룹 "보통이다" 선택률, C그룹 heaping 지표(10의 배수 / 0·50·100 비율)
  - ① 정규화 평균 비교 ② 표준편차 비교 ③ C그룹 분포 히스토그램
  - ④ 기술통계 표(n·결측% 포함) ⑤ D그룹 수동 코딩 UI ⑥ 키워드 빈도
  - CSV 다운로드, 발표용 보기 모드(관리·코딩 UI 숨김)
- **D그룹 코딩**: 대시보드 ⑤에서 서술 응답을 읽고 1~5 코드를 부여하면
  매핑표(기본 1→0, 2→25, 3→50, 4→75, 5→100, 수정 가능·브라우저에 저장)에
  따라 0~100으로 환산되어 차트·통계에 반영됩니다.

## 통계 규칙

- 표준편차는 **표본표준편차(n-1)** 사용.
- 그룹 간 비교는 반드시 **0~100 정규화 후** 비교
  (A: `(v-1)/4*100`, B: `(v-1)/3*100`, C: `v`, D: 수동코드 매핑표).
- 모든 통계에 **n**을 함께 표시, **결측 비율(%)** 별도 표기.
- 중앙집중도: A=3점 비율, C=40~60 비율, B=정의 안 됨(참고: 2·3점 비율), D=없음.

## 알아둘 점 / 한계

- **비밀번호 게이트의 한계**: 대시보드 UI는 비밀번호로 보호되지만,
  Supabase RLS 정책이 익명 키의 조회를 허용하므로(무기명 공개 설문 구조상 필요)
  기술적으로는 anon 키로 데이터 조회가 가능합니다. 민감정보를 수집하지 않는
  전제의 설계입니다. 더 강하게 잠그려면 조회를 서버 라우트 + service role 키로
  옮기고 RLS에서 SELECT를 제거하세요.
- N9 루트 레이아웃의 **플로팅 챗봇 버튼**은 기존 코드라 건드리지 않았습니다.
  설문 화면에서 숨기려면 `Chatbot`/`Watermark`에
  `pathname.startsWith('/survey-study')` 가드를 추가하세요.
- 프롬프트 원안의 Prisma+SQLite 대신 **기존 Supabase 인프라를 재사용**했습니다
  (N9와 같은 프로젝트, 전용 테이블 2개). Vercel 배포 시 별도 DB 전환이 필요 없습니다.
