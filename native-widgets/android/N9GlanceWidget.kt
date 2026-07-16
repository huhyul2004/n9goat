package com.n9.app.widget

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.datastore.preferences.core.booleanPreferencesKey

/**
 * N9 홈 화면 위젯 (정사각형 2x2 고정, 네비게이션형).
 *
 * 레이아웃 (최신 디자인):
 *   ┌─────────────────┐
 *   │ N9  홈           │  ← 탭 시 n9://home
 *   │ 📊 투표        · │  ← 우측 빨간 점 = 안 읽음
 *   │ 📢 공지        · │
 *   │ 📅 일정          │
 *   │ 📝 게시글      · │
 *   └─────────────────┘
 *
 * 각 줄은 아이콘 + 이름만 표시하고, 안 읽은 항목이 있으면 우측에 빨간 점 뱃지.
 * 탭하면 앱을 실행하며 딥링크(n9://recent/{category})를 전달한다.
 * 상세 데이터(공지 제목, D-day 등)는 표시하지 않는다 — 그건 앱의 최근 리스트 화면 담당.
 */
class N9GlanceWidget : GlanceAppWidget() {

    override val stateDefinition: GlanceStateDefinition<*> =
        PreferencesGlanceStateDefinition

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme {
                WidgetBody()
            }
        }
    }

    companion object {
        // N9WidgetWorker가 갱신해 넣는 "안 읽음" 플래그 키
        val KEY_POLL = booleanPreferencesKey("unread_poll")
        val KEY_NOTICE = booleanPreferencesKey("unread_notice")
        val KEY_CALENDAR = booleanPreferencesKey("unread_calendar")
        val KEY_POST = booleanPreferencesKey("unread_post")
    }
}

private const val SCHEME = "n9"

private fun deepLinkIntent(context: Context, path: String): Intent =
    Intent(Intent.ACTION_VIEW, Uri.parse("$SCHEME://$path")).apply {
        setPackage(context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

@Composable
private fun WidgetBody() {
    val prefs = currentState<androidx.datastore.preferences.core.Preferences>()
    val unreadPoll = prefs[N9GlanceWidget.KEY_POLL] ?: false
    val unreadNotice = prefs[N9GlanceWidget.KEY_NOTICE] ?: false
    val unreadCalendar = prefs[N9GlanceWidget.KEY_CALENDAR] ?: false
    val unreadPost = prefs[N9GlanceWidget.KEY_POST] ?: false

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceTheme.colors.widgetBackground)
            .padding(12.dp)
    ) {
        // 맨 위 N9 홈 줄
        HomeRow()
        Spacer(GlanceModifier.height(6.dp))

        CategoryRow("📊", "투표", "recent/poll", unreadPoll)
        CategoryRow("📢", "공지", "recent/notice", unreadNotice)
        CategoryRow("📅", "일정", "recent/calendar", unreadCalendar)
        CategoryRow("📝", "게시글", "recent/post", unreadPost)
    }
}

@Composable
private fun HomeRow() {
    val context = androidx.glance.LocalContext.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = GlanceModifier
            .fillMaxWidth()
            .clickable(actionStartActivity(deepLinkIntent(context, "home")))
            .padding(vertical = 4.dp)
    ) {
        Text(
            "N9",
            style = TextStyle(
                fontWeight = FontWeight.Bold,
                color = GlanceTheme.colors.primary
            )
        )
        Spacer(GlanceModifier.width(8.dp))
        Text(
            "홈",
            style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant)
        )
    }
}

@Composable
private fun CategoryRow(
    icon: String,
    label: String,
    path: String,
    hasUnread: Boolean,
) {
    val context = androidx.glance.LocalContext.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = GlanceModifier
            .fillMaxWidth()
            .clickable(actionStartActivity(deepLinkIntent(context, path)))
            .padding(vertical = 6.dp)
    ) {
        Text(icon)
        Spacer(GlanceModifier.width(8.dp))
        Text(
            label,
            style = TextStyle(
                color = GlanceTheme.colors.onSurface,
                fontWeight = FontWeight.Medium
            ),
            modifier = GlanceModifier.defaultWeight()
        )
        if (hasUnread) {
            // 안 읽음 빨간 점
            Spacer(
                GlanceModifier
                    .size(8.dp)
                    .background(ColorProvider(android.graphics.Color.parseColor("#EF4444")))
            )
        }
    }
}
