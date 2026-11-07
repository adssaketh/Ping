package com.ping.sms.ui.components

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.dropShadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.shadow.Shadow
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp

/** One CSS box-shadow layer: `x y blur spread rgb(0 0 0 / alpha)`. */
class CssShadow(val y: Dp, val blur: Dp, val spread: Dp, val alpha: Float, val x: Dp = 0.dp)

/** Tailwind v4.3 default shadows (node_modules/tailwindcss/theme.css lines 406-412) and the m3-elevation-* utilities (index.css 154-165). */
object Shadows {
    val Xs = listOf(CssShadow(1.dp, 2.dp, 0.dp, 0.05f))
    val Sm = listOf(CssShadow(1.dp, 3.dp, 0.dp, 0.10f), CssShadow(1.dp, 2.dp, (-1).dp, 0.10f))
    val Md = listOf(CssShadow(4.dp, 6.dp, (-1).dp, 0.10f), CssShadow(2.dp, 4.dp, (-2).dp, 0.10f))
    val Lg = listOf(CssShadow(10.dp, 15.dp, (-3).dp, 0.10f), CssShadow(4.dp, 6.dp, (-4).dp, 0.10f))
    val X2l = listOf(CssShadow(25.dp, 50.dp, (-12).dp, 0.25f))
    val Elevation1 = listOf(CssShadow(1.dp, 3.dp, 1.dp, 0.08f), CssShadow(1.dp, 2.dp, 0.dp, 0.12f))
    val Elevation2 = listOf(CssShadow(2.dp, 6.dp, 2.dp, 0.10f), CssShadow(1.dp, 2.dp, 0.dp, 0.14f))
    val Elevation3 = listOf(CssShadow(4.dp, 8.dp, 3.dp, 0.12f), CssShadow(1.dp, 3.dp, 0.dp, 0.18f))

    /** `shadow-md shadow-black/5`: same geometry, colour replaced. */
    fun withAlpha(shadows: List<CssShadow>, alpha: Float) = shadows.map { CssShadow(it.y, it.blur, it.spread, alpha, it.x) }
}

/**
 * Draws CSS-style shadows with the real Compose drop-shadow API (not the elevation shadow, which looks different).
 * CSS blur radius B has a Gaussian sigma of B/2; the conversion used here is documented in docs/design-tokens.md and
 * must be checked by eye against the screenshots on the phone (listed as unverified in docs/parity.md).
 */
fun Modifier.cssShadow(shape: Shape, shadows: List<CssShadow>): Modifier =
    shadows.fold(this) { m, s ->
        m.dropShadow(
            shape,
            Shadow(radius = s.blur / 2, color = Color.Black.copy(alpha = s.alpha), spread = s.spread, offset = DpOffset(s.x, s.y)),
        )
    }
