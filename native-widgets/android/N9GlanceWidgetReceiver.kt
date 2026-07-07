package com.n9.app.widget

import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

/**
 * 위젯이 홈 화면에 추가/제거될 때 주기 갱신 작업(N9WidgetWorker)을 등록/해제한다.
 * AndroidManifest.xml 에 <receiver> 로 등록해야 한다 (README 참고).
 */
class N9GlanceWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = N9GlanceWidget()

    // 첫 위젯이 추가될 때
    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        N9WidgetWorker.enqueuePeriodic(context)
        N9WidgetWorker.enqueueOnce(context) // 즉시 1회 갱신
    }

    // 마지막 위젯이 제거될 때
    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        N9WidgetWorker.cancel(context)
    }

    // 위젯이 업데이트 요청받을 때(수동 새로고침 등)도 1회 갱신
    override fun onUpdate(
        context: Context,
        appWidgetManager: android.appwidget.AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        N9WidgetWorker.enqueueOnce(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
    }
}
