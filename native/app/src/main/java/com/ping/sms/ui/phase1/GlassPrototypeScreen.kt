package com.ping.sms.ui.phase1

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.util.Log
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ping.sms.theme.PingTheme
import com.ping.sms.ui.components.AvatarCircle
import com.ping.sms.ui.components.GlassConfig
import com.ping.sms.ui.components.PingBottomSheet
import com.ping.sms.ui.components.PingBottomTabs
import com.ping.sms.ui.components.PingTopBar
import com.ping.sms.ui.components.Shadows
import com.ping.sms.ui.components.cssShadow
import com.ping.sms.ui.components.rememberBarCollapse
import com.ping.sms.ui.icons.Lucide
import com.ping.sms.ui.icons.PingIcon
import com.ping.sms.util.AvatarColors
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState
import androidx.compose.foundation.gestures.scrollBy
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

/** Synthetic sender headers only (made up, no real messages). */
private val Banks = listOf("AXISBK", "HDFCBK", "SBIBNK", "ICICIB", "KOTAKB", "PNBSMS", "PHONPE", "AMAZON", "SWIGGY", "ZOMATO")
private val Prefix = listOf("AX", "JD", "VM", "JK", "AD", "JX", "CP", "VK")
private val Previews = listOf(
    "INR 50.00 debited A/c no. XX0000 on 07-11-26. Not you? Call the number on your card.",
    "Dear customer, your order is out for delivery. Track it in the app.",
    "Your OTP is 000000. Do not share it with anyone.",
    "Hello, your recent transaction in Folio No XXXX has been processed successfully.",
    "Congratulations! You have received a voucher worth Rs.500. Use code TEST500.",
)

private class FakeRow(val id: Int) {
    val sender = "${Prefix[id % Prefix.size]}-${Banks[(id / 3) % Banks.size]}${if (id % 4 == 0) "-S" else ""}"
    val preview = Previews[id % Previews.size]
    val category = when (id % 3) { 0 -> "Bank / Alert"; 1 -> "Service"; else -> "Promo" }
    val unread = id % 11 == 0
    val time = when { id < 3 -> "7:52 am"; id < 12 -> "Thu"; id < 40 -> "1/1/25"; else -> "28/11/${24 - (id / 400)}" }
    val initials = AvatarColors.initials(sender, "")
}

private val rows = List(2000) { FakeRow(it) }

@Composable
private fun PrototypeRow(row: FakeRow) {
    val c = PingTheme.colors
    val shape = RoundedCornerShape(28.dp)
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 8.dp)
            .let { if (row.unread) it.cssShadow(shape, Shadows.Xs).clip(shape).background(if (c.isDark) c.slots.d1 else androidx.compose.ui.graphics.Color.White) else it }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically,
    ) {
        AvatarCircle(row.sender, row.initials)
        Column(Modifier.weight(1f)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Body(row.sender, size = 14f, weight = if (row.unread) FontWeight.Bold else FontWeight.Medium, color = if (row.unread) c.strong else c.onSurface)
                    Body(row.category, size = 10f, weight = FontWeight.Medium, color = c.accent)
                }
                Body(row.time, size = 12f, color = c.outline)
            }
            Body(row.preview, size = 14f, color = c.variant, modifier = Modifier.padding(top = 2.dp), maxLinesOne = true)
        }
    }
}

/**
 * Glass-bar prototype (Phase 1 deliverable 5): the top pill and the bottom tab bar over a fast-scrolling 2,000-row
 * synthetic list, with the same options as Settings > Bar style (Solid/Glass, transparency, blur, edge) and a
 * 10-second automatic scroll test that records real frame times (FrameMetrics) so we can compare settings on the phone.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun GlassPrototypeScreen(onBack: () -> Unit) {
    val c = PingTheme.colors
    val context = LocalContext.current
    val view = LocalView.current
    val density = LocalDensity.current
    val hazeState = rememberHazeState()
    val listState = rememberLazyListState()
    val collapse = rememberBarCollapse(listState, density.density)
    val recorder = rememberFrameRecorder()

    var glassOn by remember { mutableStateOf(true) }
    var opacity by remember { mutableStateOf(62) }
    var blur by remember { mutableStateOf(GlassConfig.Strong) }
    var edge by remember { mutableStateOf(true) }
    var tab by remember { mutableStateOf(0) }
    var panel by remember { mutableStateOf(false) }
    var mode by remember { mutableStateOf("idle") } // idle | single | full
    var progress by remember { mutableStateOf("") }
    val results = remember { mutableStateListOf<String>() }

    val glass = if (glassOn) GlassConfig(opacity, blur, edge) else null
    val topPad = WindowInsets.statusBars.asPaddingValues().calculateTopPadding() + 72.dp
    val bottomPad = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding() + 80.dp
    val label = if (glassOn) "Glass | blur ${blur}px | ${opacity}% | edge ${if (edge) "on" else "off"}" else "Solid"

    /** Scrolls 2400 dp/s, reversing every 2 s. Records frames only when [record]. */
    suspend fun scrollFor(seconds: Float, record: Boolean): FrameReport? {
        listState.scrollToItem(600)
        val hz = view.display?.refreshRate ?: 60f
        if (record) recorder.start(1000.0 / hz)
        var last = androidx.compose.runtime.withFrameNanos { it }
        var elapsed = 0L
        while (kotlin.coroutines.coroutineContext.isActive && elapsed < (seconds * 1e9f).toLong()) {
            val now = androidx.compose.runtime.withFrameNanos { it }
            val dt = now - last
            last = now
            elapsed += dt
            val dir = if ((elapsed / 2_000_000_000L) % 2L == 0L) 1f else -1f
            listState.scrollBy(dir * 2400f * density.density * dt / 1e9f)
        }
        return if (record) recorder.stop() else null
    }

    LaunchedEffect(mode) {
        if (mode == "idle") return@LaunchedEffect
        panel = false
        if (mode == "single") {
            progress = "Running 10 s: $label"
            val r = scrollFor(10f, true)!!
            results.add(0, r.text(label))
        } else {
            class Cfg(val name: String, val on: Boolean, val px: Int, val pct: Int)
            val cfgs = listOf(Cfg("Solid", false, 28, 62), Cfg("Glass 28px 67%", true, 28, 67), Cfg("Glass 18px 67%", true, 18, 67), Cfg("Glass 10px 67%", true, 10, 67))
            val by = cfgs.associateWith { mutableListOf<FrameReport>() }
            fun apply(cf: Cfg) { glassOn = cf.on; blur = cf.px; opacity = cf.pct }
            apply(cfgs[0]); delay(600)
            progress = "Warm-up (4 s, not recorded)"
            scrollFor(4f, false)
            repeat(3) { round ->
                for (cf in cfgs) {
                    apply(cf); delay(800) // let the new bar style draw before measuring
                    progress = "Round ${round + 1}/3: ${cf.name}"
                    by[cf]!!.add(scrollFor(8f, true)!!)
                }
            }
            val sb = StringBuilder("COMPARISON (median of 3 interleaved rounds, 8 s each, after warm-up)\n")
            for (cf in cfgs) {
                val rs = by[cf]!!
                fun med(f: (FrameReport) -> Double) = FrameReport.median(rs.map(f))
                sb.append(String.format(java.util.Locale.US, "%-15s avg %.2f  p95 %.2f  p99 %.2f ms | GPU p95 %.2f | missed %.1f%%  2x %.1f%% | deadline %.1f\n",
                    cf.name, med { it.avgMs }, med { it.p95 }, med { it.p99 }, med { it.gpuP95Ms }, med { it.missedPct }, med { it.missed2xPct }, med { it.medianDeadlineMs }))
            }
            results.add(0, sb.toString().trimEnd())
        }
        Log.i("PingFrames", results.first().replace('\n', ' '))
        progress = ""
        mode = "idle"
        panel = true
    }

    Box(Modifier.fillMaxSize().background(c.screen)) {
        Box(Modifier.fillMaxSize().hazeSource(hazeState)) {
            LazyColumn(state = listState, contentPadding = PaddingValues(top = topPad, bottom = bottomPad), modifier = Modifier.fillMaxSize()) {
                items(rows, key = { it.id }, contentType = { "row" }) { PrototypeRow(it) }
            }
        }
        PingTopBar(
            collapsed = collapse.collapsed, onSearchClick = { collapse.expand(); panel = true },
            modifier = Modifier.align(Alignment.TopCenter).windowInsetsPadding(WindowInsets.statusBars),
            glass = glass, hazeState = hazeState,
        )
        PingBottomTabs(
            selected = tab, unread = listOf(1, 0, 0, 1, 0), onSelect = { tab = it },
            modifier = Modifier.align(Alignment.BottomCenter).windowInsetsPadding(WindowInsets.navigationBars),
            glass = glass, hazeState = hazeState,
        )
        if (progress.isNotEmpty()) Box(Modifier.align(Alignment.Center).clip(RoundedCornerShape(20.dp)).background(c.card).padding(16.dp)) { Body(progress, weight = FontWeight.SemiBold) }
        // tools button (not part of the real app)
        Box(
            Modifier.align(Alignment.BottomEnd).windowInsetsPadding(WindowInsets.navigationBars).padding(end = 20.dp, bottom = 96.dp)
                .cssShadow(CircleShape, Shadows.Lg).size(56.dp).clip(CircleShape).background(c.accent).clickable { panel = true },
            contentAlignment = Alignment.Center,
        ) { PingIcon(Lucide.Settings, c.onAccent, 24.dp) }

        PingBottomSheet(visible = panel, onDismiss = { panel = false }) {
            Body("Glass prototype", Modifier.padding(20.dp), 18f, FontWeight.SemiBold)
            ToolRow("Bar style") { ToolChip("Solid", !glassOn) { glassOn = false }; ToolChip("Glass", glassOn) { glassOn = true } }
            ToolRow("Glass transparency (Settings default 62)") { listOf(40, 62, 67, 80, 95).forEach { ToolChip("$it%", opacity == it) { opacity = it } } }
            ToolRow("Glass blur (Soft 10 / Medium 18 / Strong 28 px)") {
                ToolChip("Soft", blur == GlassConfig.Soft) { blur = GlassConfig.Soft }
                ToolChip("Medium", blur == GlassConfig.Medium) { blur = GlassConfig.Medium }
                ToolChip("Strong", blur == GlassConfig.Strong) { blur = GlassConfig.Strong }
            }
            ToolRow("Glass edge") { ToolChip("On", edge) { edge = true }; ToolChip("Off", !edge) { edge = false } }
            ToolRow("Frame-time tests (release build, battery saver off, let the phone cool down first)") {
                ToolChip("Full comparison (about 2 min)", false) { if (mode == "idle") mode = "full" }
                ToolChip("One 10 s run, current setting", false) { if (mode == "idle") mode = "single" }
                ToolChip("Back", false, onBack)
            }
            results.forEach { Body(it, Modifier.padding(horizontal = 20.dp, vertical = 8.dp), 12f, color = c.variant) }
            if (results.isNotEmpty()) ToolRow("") {
                ToolChip("Copy all results", false) {
                    val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    cm.setPrimaryClip(ClipData.newPlainText("ping-frames", results.joinToString("\n\n")))
                }
            }
        }
    }
}
