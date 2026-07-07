import SwiftUI
import WidgetKit

// N9 홈 화면 위젯 레이아웃 (정사각형 .systemSmall 고정, 네비게이션형)
//
//   N9  홈
//   📊 투표      ·   ← 빨간 점 = 안 읽음
//   📢 공지      ·
//   📅 일정
//   📝 게시글    ·
//
// ⚠️ iOS 제약: .systemSmall 위젯은 탭 영역이 위젯 전체 1개(widgetURL)만 가능하다.
//   → 정사각형을 유지하면 "줄별 딥링크"는 불가능하고, 위젯 전체 탭 → n9://home 으로만 열린다.
//   줄별로 각 카테고리 최근 리스트로 바로 가고 싶으면 .systemMedium 을 추가해야 한다
//   (안드로이드 Glance 2x2 는 줄별 탭이 되지만 iOS small 은 플랫폼상 안 됨).

struct N9WidgetEntryView: View {
    var entry: N9Entry
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // 맨 위 N9 홈 줄
            HStack(spacing: 6) {
                Text("N9")
                    .font(.headline).bold()
                    .foregroundStyle(.tint)
                Text("홈")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.bottom, 2)

            categoryRow(icon: "📊", label: "투표", hasUnread: entry.summary.poll)
            categoryRow(icon: "📢", label: "공지", hasUnread: entry.summary.notice)
            categoryRow(icon: "📅", label: "일정", hasUnread: entry.summary.calendar)
            categoryRow(icon: "📝", label: "게시글", hasUnread: entry.summary.post)

            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        // small 위젯 전체 탭 → 홈. (줄별 딥링크는 medium 확장 시 Link 로 처리)
        .widgetURL(URL(string: "n9://home"))
        .containerBackground(for: .widget) {
            colorScheme == .dark ? Color.black : Color.white
        }
    }

    @ViewBuilder
    private func categoryRow(icon: String, label: String, hasUnread: Bool) -> some View {
        HStack(spacing: 8) {
            Text(icon)
            Text(label)
                .font(.subheadline).fontWeight(.medium)
                .foregroundStyle(.primary)
            Spacer(minLength: 0)
            if hasUnread {
                Circle()
                    .fill(Color(red: 0.94, green: 0.27, blue: 0.27)) // #EF4444
                    .frame(width: 7, height: 7)
            }
        }
    }
}
