package com.ping.sms.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.ping.sms.theme.PingMotion
import com.ping.sms.theme.PingTheme

/**
 * `.skeleton` (index.css 232-252): base = outline at 16 %; a light (white 55 %, dark theme 12 %) sweeps from
 * -100 % to +100 % of the shape's width every 1.3 s. One shared transition value, read only while drawing.
 */
@Composable
fun rememberSkeletonSweep(): State<Float> {
    val t = rememberInfiniteTransition(label = "skeleton")
    return t.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(PingMotion.SkeletonSweepMs, easing = PingMotion.Emphasized), RepeatMode.Restart),
        label = "sweep",
    )
}

@Composable
fun Modifier.skeleton(sweep: State<Float>): Modifier {
    val colors = PingTheme.colors
    val base = colors.outline.copy(alpha = 0.16f)
    val light = Color.White.copy(alpha = if (colors.isDark) 0.12f else 0.55f)
    return this.drawWithContent {
        drawRect(base)
        val w = size.width
        val x = -w + 2f * w * sweep.value
        drawRect(
            brush = Brush.horizontalGradient(listOf(Color.Transparent, light, Color.Transparent), startX = x, endX = x + w),
            topLeft = Offset.Zero,
            size = size,
        )
    }
}

@Composable
private fun SkeletonBar(widthFraction: Float, tall: Boolean, sweep: State<Float>, modifier: Modifier = Modifier) {
    Spacer(
        modifier
            .layout { m, c ->
                val w = (c.maxWidth * widthFraction).toInt()
                val p = m.measure(c.copy(minWidth = w, maxWidth = w))
                layout(p.width, p.height) { p.place(0, 0) }
            }
            .height(if (tall) 14.dp else 12.dp)
            .clip(CircleShape)
            .skeleton(sweep),
    )
}

/** SkeletonRow: avatar 48, bars at 42 + (i*13)%28 %, 11 %, and 68 + (i*7)%26 % (Skeleton.tsx). px-6 py-3.5 gap-3.5. */
@Composable
fun SkeletonRow(index: Int, sweep: State<Float>) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Spacer(Modifier.size(48.dp).clip(CircleShape).skeleton(sweep))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Box0(0.42f + ((index * 13) % 28) / 100f, true, sweep)
                Box0(0.11f, false, sweep)
            }
            Box0(0.68f + ((index * 7) % 26) / 100f, false, sweep)
        }
    }
}

// fractions inside a Row are of the Row's width, same as CSS percentages of the flex container
@Composable
private fun Box0(fraction: Float, tall: Boolean, sweep: State<Float>) = SkeletonBar(fraction, tall, sweep)

@Composable
fun SkeletonList(count: Int = 6, modifier: Modifier = Modifier) {
    val sweep = rememberSkeletonSweep()
    Column(modifier) { repeat(count) { SkeletonRow(it, sweep) } }
}

/** TopProgress (Skeleton.tsx): 3 dp bar, 1/3 wide, slides from -100 % to 300 % of its own width every 1.15 s. */
@Composable
fun TopProgress(modifier: Modifier = Modifier) {
    val colors = PingTheme.colors
    val t = rememberInfiniteTransition(label = "topProgress")
    val x = t.animateFloat(-1f, 3f, infiniteRepeatable(tween(1150, easing = PingMotion.Emphasized), RepeatMode.Restart), label = "x")
    Spacer(
        modifier.fillMaxWidth().height(3.dp).clip(RoundedCornerShape(0.dp)).drawWithContent {
            val w = size.width / 3f
            drawRoundRect(colors.accent, Offset(x.value * w, 0f), androidx.compose.ui.geometry.Size(w, size.height), androidx.compose.ui.geometry.CornerRadius(size.height / 2))
        },
    )
}
