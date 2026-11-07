package com.ping.sms.ui.components

import androidx.compose.foundation.border
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.dp
import com.ping.sms.theme.PingTheme
import dev.chrisbanes.haze.HazeInput
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.blur.HazeBlurStyle
import dev.chrisbanes.haze.blur.HazeColorEffect
import dev.chrisbanes.haze.blur.hazeBlur

/** Settings > Bar style > Glass: transparency (`glassOpacity`, default 62), blur Soft/Medium/Strong = 10/18/28 px (default Strong), edge. */
@Immutable
class GlassConfig(val opacityPercent: Int = 62, val blurPx: Int = 28, val border: Boolean = true) {
    companion object {
        const val Soft = 10
        const val Medium = 18
        const val Strong = 28
    }
}

private val Saturate15 = ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(1.5f) })

/**
 * `.bar-glass` (index.css 344-357): background = colour-mix(surface-hi | d2, alpha%), `backdrop-filter: blur(px)
 * saturate(1.5)`, optional inset 1 px rim (white 42 % / dark 16 %) and a soft drop shadow.
 * Haze 2.1 (haze + haze-blur, Apache-2.0) blurs the content behind on the GPU; its colour-effect list gives us
 * saturate(1.5) and the tint, in that order like the CSS filter + background.
 */
@Composable
fun Modifier.pingGlass(state: HazeState, shape: Shape, config: GlassConfig): Modifier {
    val colors = PingTheme.colors
    val tint = colors.bar.copy(alpha = config.opacityPercent / 100f)
    val style = remember(config.blurPx, tint) {
        HazeBlurStyle {
            blurRadius(config.blurPx.dp)
            noiseFactor(0f)
            colorEffects(listOf(HazeColorEffect.colorFilter(Saturate15), HazeColorEffect.tint(tint)))
        }
    }
    val input = remember(state) { HazeInput.Sources(state) }
    val shadow = listOf(CssShadow(6.dp, 20.dp, 0.dp, if (colors.isDark) 0.35f else 0.07f))
    var m = this
    if (config.border) m = m.cssShadow(shape, shadow)
    m = m.hazeBlur(input, style)
    if (config.border) m = m.border(1.dp, Color.White.copy(alpha = if (colors.isDark) 0.16f else 0.42f), shape)
    return m
}
