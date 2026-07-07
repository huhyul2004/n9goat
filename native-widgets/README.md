# N9 홈 화면 위젯 (Android Glance + iOS WidgetKit)

정사각형 4카테고리 **네비게이션형** 위젯. 상세 내용은 안 보여주고
`N9 홈 + 투표/공지/일정/게시글` 줄만 표시하며, 탭하면 앱의
**카테고리별 최근 6개 리스트 화면**(`/recent/{category}`)으로 딥링크한다.

> ⚠️ 이 폴더의 `.kt`/`.swift`는 **아직 빌드되지 않는 스테이징 파일**이다.
> Capacitor 네이티브 프로젝트(`android/`, `ios/`)를 만든 뒤 아래 위치로 옮겨야 동작한다.
> Android Studio / Xcode 에서 Glance·WidgetKit 버전에 따라 import 몇 줄은 자동완성으로 미세조정될 수 있다.

---

## 이미 완성되어 배포 가능한 웹 파트 (지금 바로 됨)

| 파일 | 역할 |
|---|---|
| `src/app/recent/[category]/page.tsx` | 위젯 딥링크가 도착하는 **인앱 화면** (poll/notice/calendar/post, 최신 6개) |
| `src/app/api/widget/summary/route.ts` | 위젯 뱃지용 경량 API — 카테고리별 `hasUnread`만 반환, **토큰 없으면 401** |
| `src/lib/widget-token.ts` | 위젯 장기 토큰(90일) 서명/검증 (`signWidgetToken`, `verifyWidgetToken`) |

이 3개는 N9 웹앱에 포함돼 Vercel 배포만 하면 바로 라이브된다.

### 아직 남은 웹 작업 (위젯을 실제로 켜려면)
1. **`WIDGET_TOKEN_SECRET`** 환경변수 추가 (.env.local + Vercel). 아무 긴 랜덤 문자열.
2. **로그인 시 토큰 발급 연결** — 앱 최초 로그인 성공 지점에서 `signWidgetToken(uid)`를 호출해
   토큰을 만들고, 네이티브에 전달(아래 App Group / SharedPreferences)한다. (지금은 발급 지점 미연결)

---

## Android (Capacitor `android/` 프로젝트에 배치)

파일 위치: `android/app/src/main/java/com/n9/app/widget/`
- `N9GlanceWidget.kt` — 위젯 레이아웃 (정사각형, 4줄 + 홈줄, 빨간 점 뱃지, 줄별 딥링크)
- `N9GlanceWidgetReceiver.kt` — 추가/제거 시 갱신 작업 등록
- `N9WidgetWorker.kt` — 30분마다 `/api/widget/summary` 호출 → 뱃지 상태 저장

**필요 설정**
- `build.gradle`(app)에 Glance + WorkManager 의존성:
  ```
  implementation "androidx.glance:glance-appwidget:1.1.0"
  implementation "androidx.work:work-runtime-ktx:2.9.1"
  ```
- `AndroidManifest.xml`에 리시버 등록:
  ```xml
  <receiver android:name="com.n9.app.widget.N9GlanceWidgetReceiver"
            android:exported="false">
    <intent-filter>
      <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
               android:resource="@xml/n9_widget_info" />
  </receiver>
  ```
- `res/xml/n9_widget_info.xml` 위젯 메타(최소 2x2 크기) 추가.
- 딥링크: `MainActivity`에 `n9://` 스킴 `intent-filter` 추가 → Capacitor `appUrlOpen`에서
  `n9://recent/poll` 등을 받아 웹뷰를 `/recent/poll` 로 이동.
- 위젯 토큰은 로그인 시 `getSharedPreferences("n9_widget").edit().putString("token", ...)` 로 저장.

**줄별 딥링크: 안드로이드는 2x2에서도 각 줄 탭이 됨** (Glance `actionStartActivity`).

---

## iOS (Capacitor `ios/` 프로젝트에 Widget Extension 타겟 추가)

Xcode: File > New > Target > **Widget Extension** (이름 `N9Widget`) → 아래 파일로 교체
- `N9Widget.swift` — 위젯 번들 + TimelineProvider + App Group 캐시/서버 fetch
- `N9WidgetEntryView.swift` — SwiftUI 레이아웃 (정사각형 `.systemSmall`)

**필요 설정**
- 메인 앱 + 위젯 타겟 **둘 다** Capabilities > **App Groups** 활성화, 동일 그룹 ID
  `group.com.n9.app` (코드 상단 상수와 일치시킬 것).
- 로그인 시 앱에서 `UserDefaults(suiteName: "group.com.n9.app")`에
  `widget_token`(문자열) + `unread_*`(Bool) 를 써 준다 → 위젯이 앱 실행 없이 즉시 표시.
- 딥링크: 메인 앱 `onOpenURL`(또는 Capacitor `appUrlOpen`)에서 `n9://home` 처리.

**⚠️ iOS 제약 (중요):** `.systemSmall`(정사각형) 위젯은 **탭 영역이 위젯 전체 1개**만 가능하다.
따라서 iOS 정사각형 위젯은 **탭 → `n9://home`** 으로만 열린다(줄별 딥링크 불가).
줄별로 각 카테고리로 바로 가게 하려면 `.systemMedium`(가로형)을 추가해야 한다.
안드로이드 2x2 는 줄별 탭이 되지만, iOS small 은 플랫폼 제약이라 다르다 — 정책 결정 필요.

---

## 딥링크 규약 (양 플랫폼 공통)
```
n9://home             → 앱 메인(/board)
n9://recent/poll      → /recent/poll
n9://recent/notice    → /recent/notice
n9://recent/calendar  → /recent/calendar
n9://recent/post      → /recent/post
```

## 다음 단계 순서 (권장)
1. (웹) `WIDGET_TOKEN_SECRET` 추가 + 로그인 시 `signWidgetToken` 연결 → 배포
2. (앱화) Capacitor 설치 + `npx cap add android` / `npx cap add ios`
3. 위 네이티브 파일들을 각 프로젝트로 이동 + 설정(Manifest / App Group / 딥링크)
4. Android Studio / Xcode 에서 위젯 미리보기로 레이아웃 확인 → 실기기 테스트
