# survey-study — 설문 응답 방식 비교 연구 (독립 기능)

N9 커뮤니티 코드와 **완전히 분리된** 연구용 설문 앱입니다.
기존 게시판/메일/채팅 등의 코드나 테이블은 전혀 수정하지 않습니다.

## 폴더 구조

```
src/survey-study/            ← 이 기능의 모든 로직 (독립 모듈)
  lib/
    types.ts                 타입 정의
    questions.ts             8개 문항 + A/B/C/D 그룹 정의 + 무작위 배정
    stats.ts                 평균/표본표준편차(n-1)/분산/중앙집중도/정규화/키워드
    aggregate.ts             그룹×문항 통계 집계
    db.ts                    Supabase 데이터 레이어 (survey 전용 테이블만 사용)
    csv.ts                   CSV 내보내기
    schema.sql               ★ Supabase에 실행할 테이블 생성 SQL
  components/
    ProgressBar.tsx
    QuestionInput.tsx        5점/4점/슬라이더/서술 응답 UI
    GroupedBarChart.tsx      의존성 없는 순수 SVG 막대그래프
    QrCode.tsx               배포 링크 QR

src/app/survey-study/        ← Next.js 라우트 (얇은 페이지 껍데기)
  layout.tsx                 독립 배경/제목
  page.tsx                   응답자 진입(인트로 + 시작)
  respond/page.tsx           인구통계 → 8문항 흐름 → 제출
  thanks/page.tsx            완료 화면
  dashboard/page.tsx         연구자 대시보드
```

## 배포 전 준비 (딱 1번)

1. Supabase SQL Editor에서 `src/survey-study/lib/schema.sql` 전체를 실행합니다.
   → `survey_sessions`, `survey_responses` 두 테이블이 생성됩니다.
   (기존 N9 테이블은 건드리지 않습니다.)
2. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가
   이미 설정돼 있으면 그대로 사용됩니다(N9와 같은 프로젝트 재사용).

## 사용 방법

- **응답 수집**: `/survey-study` 링크를 배포합니다.
  응답자는 그룹(A/B/C/D)을 알 수 없고, 접속할 때마다 무작위 배정됩니다.
- **QR 배포**: `/survey-study/dashboard` → "배포용 QR" 버튼.
- **분석**: `/survey-study/dashboard`
  - ① 그룹 간 평균 비교(0~100 정규화)
  - ② 그룹 간 표준편차 비교(중심화 경향 확인)
  - ③ 문항별·그룹별 기술통계 표(n 포함)
  - ④ 이유·서술 키워드 빈도
  - CSV 다운로드, 발표용 보기 모드(관리 버튼 숨김)

## 그룹 설계

| 그룹 | 응답 방식 | 이유 서술 |
|------|-----------|-----------|
| A | 1~5 척도 | O |
| B | 1~4 척도 (중간값 없음) | O |
| C | 0~100 슬라이더 | O |
| D | 서술형 (척도 없음) | — |

## 통계 규칙

- 표준편차는 **표본표준편차(n-1)** 사용.
- 그룹 간 비교는 반드시 **0~100 정규화 후** 비교
  (A: `(v-1)/4*100`, B: `(v-1)/3*100`, C: `v`, D: 척도 없음→제외).
- 모든 통계에 **n**을 함께 표시, **결측 비율(%)** 별도 표기.
- 중앙집중도: A=3점 비율, C=40~60 비율, B=정의 안 됨(참고: 2·3점 비율), D=없음.

## 알아둘 점

- N9 루트 레이아웃(`src/app/layout.tsx`)이 전역으로 띄우는 **플로팅 챗봇 버튼**은
  기존 코드라서 건드리지 않았습니다. 설문 화면에서도 우하단에 뜰 수 있습니다.
  숨기고 싶으면 `Chatbot`/`Watermark`에 경로 가드(`pathname.startsWith('/survey-study')`)를
  한 줄 추가하면 되며, 원하시면 따로 처리해 드립니다.
