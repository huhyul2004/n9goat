import WidgetKit
import SwiftUI

// N9 위젯 번들 + 타임라인 프로바이더 + 데이터 모델.
// App Group(UserDefaults)에서 앱이 저장해 둔 요약을 즉시 읽고,
// 백그라운드에서 /api/widget/summary 로 갱신한다.

// 메인 앱과 공유하는 App Group ID (Capabilities > App Groups 에서 동일하게 설정)
private let APP_GROUP = "group.com.n9.app"
private let BASE_URL = "https://n9schools.vercel.app"

struct N9Summary {
    var poll = false
    var notice = false
    var calendar = false
    var post = false
}

struct N9Entry: TimelineEntry {
    let date: Date
    let summary: N9Summary
}

struct N9Provider: TimelineProvider {
    func placeholder(in context: Context) -> N9Entry {
        N9Entry(date: Date(), summary: N9Summary(poll: true, notice: true))
    }

    func getSnapshot(in context: Context, completion: @escaping (N9Entry) -> Void) {
        completion(N9Entry(date: Date(), summary: readCachedSummary()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<N9Entry>) -> Void) {
        Task {
            let summary = (try? await fetchSummary()) ?? readCachedSummary()
            let entry = N9Entry(date: Date(), summary: summary)
            // 30분마다 갱신
            let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }

    /// 앱이 로그인 시 App Group 에 써 둔 캐시(요약)를 읽는다 — 앱 실행 없이 즉시 표시용
    private func readCachedSummary() -> N9Summary {
        let d = UserDefaults(suiteName: APP_GROUP)
        return N9Summary(
            poll: d?.bool(forKey: "unread_poll") ?? false,
            notice: d?.bool(forKey: "unread_notice") ?? false,
            calendar: d?.bool(forKey: "unread_calendar") ?? false,
            post: d?.bool(forKey: "unread_post") ?? false
        )
    }

    /// 위젯 토큰으로 서버에서 최신 요약을 가져온다
    private func fetchSummary() async throws -> N9Summary {
        let d = UserDefaults(suiteName: APP_GROUP)
        guard let token = d?.string(forKey: "widget_token"), !token.isEmpty else {
            return readCachedSummary()
        }
        guard let url = URL(string: "\(BASE_URL)/api/widget/summary?token=\(token)") else {
            return readCachedSummary()
        }
        let (data, resp) = try await URLSession.shared.data(from: url)
        guard (resp as? HTTPURLResponse)?.statusCode == 200 else {
            return readCachedSummary()
        }
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        func unread(_ key: String) -> Bool {
            (json[key] as? [String: Any])?["hasUnread"] as? Bool ?? false
        }
        let summary = N9Summary(
            poll: unread("poll"),
            notice: unread("notice"),
            calendar: unread("calendar"),
            post: unread("post")
        )
        // 다음 위젯 표시를 위해 캐시에 저장
        d?.set(summary.poll, forKey: "unread_poll")
        d?.set(summary.notice, forKey: "unread_notice")
        d?.set(summary.calendar, forKey: "unread_calendar")
        d?.set(summary.post, forKey: "unread_post")
        return summary
    }
}

struct N9Widget: Widget {
    let kind = "N9Widget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: N9Provider()) { entry in
            N9WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("N9")
        .description("공지·일정·투표·게시글을 한눈에")
        .supportedFamilies([.systemSmall]) // 정사각형 고정
    }
}

@main
struct N9WidgetBundle: WidgetBundle {
    var body: some Widget {
        N9Widget()
    }
}
