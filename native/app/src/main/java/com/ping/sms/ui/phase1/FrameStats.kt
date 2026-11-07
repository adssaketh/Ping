package com.ping.sms.ui.phase1

import android.app.Activity
import android.os.Handler
import android.os.HandlerThread
import android.view.FrameMetrics
import android.view.Window
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import java.util.Locale
import kotlin.math.ceil

/** One drawn frame. [deadlineMs] is the frame's own deadline from the system (adaptive refresh rates change it). */
class FrameSample(val totalMs: Double, val deadlineMs: Double, val gpuMs: Double)

/** Summary of recorded frames. A frame is "missed" when it took longer than its own deadline. */
class FrameReport(
    val frames: Int,
    val avgMs: Double,
    val p50: Double,
    val p90: Double,
    val p95: Double,
    val p99: Double,
    val maxMs: Double,
    val medianDeadlineMs: Double,
    val missed: Int,
    val missed2x: Int,
    val gpuAvgMs: Double,
    val gpuP95Ms: Double,
) {
    val missedPct get() = if (frames == 0) 0.0 else 100.0 * missed / frames
    val missed2xPct get() = if (frames == 0) 0.0 else 100.0 * missed2x / frames

    fun text(label: String): String = String.format(
        Locale.US,
        "%s\n%d frames, typical deadline %.1f ms\ntotal ms: avg %.2f  p50 %.2f  p90 %.2f  p95 %.2f  p99 %.2f  max %.1f\nGPU ms: avg %.2f  p95 %.2f\nmissed own deadline: %.1f%%   missed by 2x: %.1f%%",
        label, frames, medianDeadlineMs, avgMs, p50, p90, p95, p99, maxMs, gpuAvgMs, gpuP95Ms, missedPct, missed2xPct,
    )

    companion object {
        /** Nearest-rank percentile of an ascending list. */
        fun percentile(sorted: List<Double>, p: Double): Double {
            if (sorted.isEmpty()) return 0.0
            val rank = ceil(p / 100.0 * sorted.size).toInt().coerceIn(1, sorted.size)
            return sorted[rank - 1]
        }

        fun of(samples: List<FrameSample>): FrameReport {
            val total = samples.map { it.totalMs }.sorted()
            val gpu = samples.map { it.gpuMs }.sorted()
            return FrameReport(
                frames = samples.size,
                avgMs = if (total.isEmpty()) 0.0 else total.average(),
                p50 = percentile(total, 50.0), p90 = percentile(total, 90.0), p95 = percentile(total, 95.0), p99 = percentile(total, 99.0),
                maxMs = total.lastOrNull() ?: 0.0,
                medianDeadlineMs = percentile(samples.map { it.deadlineMs }.sorted(), 50.0),
                missed = samples.count { it.totalMs > it.deadlineMs },
                missed2x = samples.count { it.totalMs > 2 * it.deadlineMs },
                gpuAvgMs = if (gpu.isEmpty()) 0.0 else gpu.average(),
                gpuP95Ms = percentile(gpu, 95.0),
            )
        }

        fun median(values: List<Double>): Double = percentile(values.sorted(), 50.0)
    }
}

/** Collects every frame the window draws (Android FrameMetrics, API 31+: total time, frame deadline, GPU time). */
class FrameRecorder(private val window: Window?) {
    private val thread = HandlerThread("ping-frames").apply { start() }
    private val handler = Handler(thread.looper)
    private val samples = ArrayList<FrameSample>(4096)
    @Volatile private var recording = false
    @Volatile private var fallbackDeadlineMs = 16.7
    private val listener = Window.OnFrameMetricsAvailableListener { _, m, _ ->
        if (!recording) return@OnFrameMetricsAvailableListener
        val deadline = m.getMetric(FrameMetrics.DEADLINE) / 1_000_000.0
        val s = FrameSample(
            totalMs = m.getMetric(FrameMetrics.TOTAL_DURATION) / 1_000_000.0,
            deadlineMs = if (deadline > 0.0) deadline else fallbackDeadlineMs,
            gpuMs = m.getMetric(FrameMetrics.GPU_DURATION) / 1_000_000.0,
        )
        synchronized(samples) { samples.add(s) }
    }

    fun start(fallbackDeadlineMs: Double) {
        this.fallbackDeadlineMs = fallbackDeadlineMs
        synchronized(samples) { samples.clear() }
        recording = true
        window?.addOnFrameMetricsAvailableListener(listener, handler)
    }

    fun stop(): FrameReport {
        recording = false
        window?.removeOnFrameMetricsAvailableListener(listener)
        return FrameReport.of(synchronized(samples) { samples.toList() })
    }

    fun release() {
        recording = false
        window?.removeOnFrameMetricsAvailableListener(listener)
        thread.quitSafely()
    }
}

@Composable
fun rememberFrameRecorder(): FrameRecorder {
    val window = (LocalContext.current as? Activity)?.window
    val recorder = remember(window) { FrameRecorder(window) }
    DisposableEffect(recorder) { onDispose { recorder.release() } }
    return recorder
}
