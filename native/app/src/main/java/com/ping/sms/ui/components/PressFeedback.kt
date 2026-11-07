package com.ping.sms.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import com.ping.sms.theme.PingMotion

/**
 * `button:not(:disabled):active { transform: scale(.96); transition-duration: 90ms }`, released over 220 ms
 * (src/index.css lines 104-108 and 100-102). The scale is read inside graphicsLayer, so nothing recomposes per frame.
 */
fun Modifier.pressScale(
    source: InteractionSource,
    pressedScale: Float = PingMotion.PressScale,
    pressMs: Int = PingMotion.PressMs,
    releaseMs: Int = PingMotion.ControlMs,
): Modifier = composed {
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) pressedScale else 1f,
        animationSpec = tween(if (pressed) pressMs else releaseMs, easing = PingMotion.Emphasized),
        label = "pressScale",
    )
    graphicsLayer {
        scaleX = scale
        scaleY = scale
    }
}

/** `.row-press`: conversation rows scale to 0.985 in 130 ms (src/index.css line 180). */
fun Modifier.rowPressScale(source: InteractionSource): Modifier =
    pressScale(source, PingMotion.RowPressScale, PingMotion.RowPressMs, 200)
