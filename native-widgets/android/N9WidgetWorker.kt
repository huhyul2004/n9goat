package com.n9.app.widget

import android.content.Context
import androidx.datastore.preferences.core.MutablePreferences
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * 주기적으로 /api/widget/summary 를 호출해 카테고리별 "안 읽음" 여부를
 * Glance 상태에 저장한다. 위젯은 그 상태를 읽어 빨간 점을 그린다.
 *
 * 위젯 토큰은 앱 최초 로그인 시 SharedPreferences("n9_widget", "token") 에 저장해 둔다고 가정.
 */
class N9WidgetWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val token = applicationContext
            .getSharedPreferences("n9_widget", Context.MODE_PRIVATE)
            .getString("token", null) ?: return@withContext Result.success()

        val summary = try {
            fetchSummary(token)
        } catch (e: Exception) {
            return@withContext Result.retry()
        }

        // 모든 위젯 인스턴스 상태 갱신
        val manager = GlanceAppWidgetManager(applicationContext)
        val ids = manager.getGlanceIds(N9GlanceWidget::class.java)
        for (id in ids) {
            updateAppWidgetState(
                applicationContext,
                PreferencesGlanceStateDefinition,
                id,
            ) { prefs: MutablePreferences ->
                prefs[N9GlanceWidget.KEY_POLL] = summary.poll
                prefs[N9GlanceWidget.KEY_NOTICE] = summary.notice
                prefs[N9GlanceWidget.KEY_CALENDAR] = summary.calendar
                prefs[N9GlanceWidget.KEY_POST] = summary.post
                prefs
            }
            N9GlanceWidget().update(applicationContext, id)
        }
        Result.success()
    }

    private data class Summary(
        val poll: Boolean,
        val notice: Boolean,
        val calendar: Boolean,
        val post: Boolean,
    )

    private fun fetchSummary(token: String): Summary {
        val url = URL("$BASE_URL/api/widget/summary?token=$token")
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 8000
            readTimeout = 8000
        }
        conn.inputStream.use { stream ->
            val body = stream.bufferedReader().readText()
            val json = JSONObject(body)
            fun unread(key: String) =
                json.optJSONObject(key)?.optBoolean("hasUnread", false) ?: false
            return Summary(
                poll = unread("poll"),
                notice = unread("notice"),
                calendar = unread("calendar"),
                post = unread("post"),
            )
        }
    }

    companion object {
        // 배포된 N9 서버 주소
        private const val BASE_URL = "https://n9schools.vercel.app"
        private const val PERIODIC = "n9_widget_periodic"
        private const val ONCE = "n9_widget_once"

        fun enqueuePeriodic(context: Context) {
            // WorkManager 최소 주기는 15분
            val req = PeriodicWorkRequestBuilder<N9WidgetWorker>(30, TimeUnit.MINUTES).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                req,
            )
        }

        fun enqueueOnce(context: Context) {
            val req = OneTimeWorkRequestBuilder<N9WidgetWorker>().build()
            WorkManager.getInstance(context)
                .enqueueUniqueWork(ONCE, ExistingWorkPolicy.REPLACE, req)
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(PERIODIC)
        }
    }
}
