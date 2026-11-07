package com.ping.sms.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.res.imageResource
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.ImageBitmap
import com.ping.sms.R
import com.ping.sms.theme.PingFonts
import com.ping.sms.theme.PingMotion
import com.ping.sms.theme.PingTheme
import com.ping.sms.ui.icons.Lucide
import com.ping.sms.ui.icons.PingIcon
import dev.chrisbanes.haze.HazeState
import kotlinx.coroutines.launch

/**
 * The search pill is clipped from a full-width pill to a 48 dp circle at the left (index.css 308-314:
 * `clip-path: inset(-10px -10px -14px -10px round 38px)` -> `inset(4px <right> 4px 0 round 24px)`).
 * The visible shape is a rounded rect with animated edges; shadow and clip both follow it.
 */
private class PillShape(private val progress: () -> Float) : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
        val p = progress()
        val circle = with(density) { 48.dp.toPx() }
        val inset = with(density) { 4.dp.toPx() }
        val right = size.width + (circle - size.width) * p
        val top = inset * p
        val bottom = size.height - inset * p
        val radius = (size.height / 2f) + (circle / 2f - size.height / 2f) * p
        return Outline.Rounded(RoundRect(0f, top, right, bottom, CornerRadius(radius)))
    }
}

/**
 * Collapsing top bar (TopSearchBar.tsx + `.topbar-*` CSS). All motion reads Animatables inside graphicsLayer/draw
 * lambdas, so scrolling the list never recomposes the bar; only the boolean [collapsed] flips.
 *  - row: translateY -6 dp, 460 ms emphasized
 *  - pill: clipped to 48 dp circle, 460 ms emphasized
 *  - "Search in Ping" text: opacity 0, 180 ms linear
 *  - logo: opacity 300 ms ease; from translateX -84 dp / scale .88 over 560 ms cubic-bezier(.34,1.3,.64,1);
 *          40 ms delay only when collapsing
 */
@Composable
fun PingTopBar(
    collapsed: Boolean,
    onSearchClick: () -> Unit,
    modifier: Modifier = Modifier,
    glass: GlassConfig? = null,
    hazeState: HazeState? = null,
    avatarInitial: String = "S",
) {
    val colors = PingTheme.colors
    val row = remember { Animatable(0f) }
    val input = remember { Animatable(1f) }
    val logoFade = remember { Animatable(0f) }
    val logoMove = remember { Animatable(0f) }
    LaunchedEffect(collapsed) {
        val t = if (collapsed) 1f else 0f
        val delay = if (collapsed) PingMotion.TopBarLogoDelayMs else 0
        launch { row.animateTo(t, tween(PingMotion.TopBarMs, easing = PingMotion.Emphasized)) }
        launch { input.animateTo(1f - t, tween(PingMotion.TopBarInputMs, easing = androidx.compose.animation.core.LinearEasing)) }
        launch { logoFade.animateTo(t, tween(PingMotion.TopBarLogoFadeMs, delay, PingMotion.CssEase)) }
        launch { logoMove.animateTo(t, tween(PingMotion.TopBarLogoMoveMs, delay, PingMotion.LogoGlide)) }
    }
    val pill = remember { PillShape { row.value } }

    // .topbar px-4 pt-2.5 pb-1.5 ; row h-14
    Box(modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 10.dp, bottom = 6.dp)) {
        Box(
            Modifier.fillMaxWidth().height(56.dp).graphicsLayer { translationY = -6.dp.toPx() * row.value },
        ) {
            val source = remember { MutableInteractionSource() }
            Box(
                Modifier
                    .fillMaxSize()
                    .pressScale(source)
                    .let { m ->
                        if (glass != null && hazeState != null) m.pingGlass(hazeState, pill, glass)
                        else m.cssShadow(pill, Shadows.Sm)
                    }
                    .graphicsLayer { shape = pill; clip = true }
                    .let { if (glass == null) it.background(colors.bar) else it }
                    .clickable(interactionSource = source, indication = null) { onSearchClick() },
            ) {
                Box(Modifier.align(Alignment.CenterStart).padding(start = 14.dp)) {
                    PingIcon(Lucide.Search, colors.outline, 20.dp)
                }
                BasicText(
                    "Search in Ping",
                    modifier = Modifier.align(Alignment.CenterStart).padding(start = 14.dp + 20.dp + 8.dp).graphicsLayer { alpha = input.value },
                    style = TextStyle(color = colors.outline, fontSize = 14.sp, fontFamily = PingFonts.FullStack),
                )
            }

            // the logo glides in to the middle
            Box(
                Modifier.fillMaxSize().graphicsLayer {
                    alpha = logoFade.value.coerceIn(0f, 1f)
                    translationX = -84.dp.toPx() * (1f - logoMove.value)
                    val s = 0.88f + 0.12f * logoMove.value
                    scaleX = s; scaleY = s
                },
                contentAlignment = Alignment.Center,
            ) { PingLogo() }

            // profile picture, stays put at the right (right-2, button p-0.5 -mr-1 => image 6 dp from the row edge)
            Box(
                Modifier.align(Alignment.CenterEnd).padding(end = 6.dp).size(40.dp).clip(CircleShape).background(colors.slots.let { if (colors.isDark) it.primaryDeep else it.primaryContainer }),
                contentAlignment = Alignment.Center,
            ) {
                BasicText(avatarInitial, style = TextStyle(color = colors.accent, fontSize = (40 * 0.42f).sp, fontFamily = PingFonts.FullStack, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold))
            }
        }
    }
}

/**
 * `.ping-logo` (index.css 267-297): 30 dp tall, aspect 451:240. Lettering coloured primary (dark: primary-light) through
 * the PNG as a mask; the dot is a radial highlight (circle at 36 % 30 %) so it looks like a little sphere.
 */
@Composable
fun PingLogo(modifier: Modifier = Modifier) {
    val colors = PingTheme.colors
    val letters = if (colors.isDark) colors.slots.primaryLight else colors.slots.primary
    val dot = if (colors.isDark) lerp(colors.slots.primaryLight, Color.White, 0.45f) else colors.slots.primaryLight
    val text: ImageBitmap = ImageBitmap.imageResource(R.drawable.ping_logo_text)
    val dotMask: ImageBitmap = ImageBitmap.imageResource(R.drawable.ping_logo_dot)
    Canvas(
        modifier.size(width = (30f * 451f / 240f).dp, height = 30.dp)
            .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen },
    ) {
        val dst = IntSize(size.width.toInt(), size.height.toInt())
        drawImage(text, dstSize = dst, colorFilter = ColorFilter.tint(letters, BlendMode.SrcIn))
        // dot: radial highlight clipped by the dot PNG's alpha (own layer, so SrcIn does not touch the lettering).
        // CSS: radial-gradient(circle at 36% 30%, color-mix(dot 38%, white) 0%, dot 62%) -> reaches `dot` at 62 % of the
        // distance to the farthest corner. (colour mixing here is sRGB, CSS uses OKLab: tiny difference, see parity.md)
        val cx = size.width * 0.36f
        val cy = size.height * 0.30f
        val farthest = kotlin.math.hypot(size.width - cx, size.height - cy)
        val brush = Brush.radialGradient(
            0f to lerp(dot, Color.White, 0.62f), 0.62f to dot, 1f to dot,
            center = Offset(cx, cy), radius = farthest,
        )
        drawIntoCanvas { canvas ->
            canvas.saveLayer(androidx.compose.ui.geometry.Rect(0f, 0f, size.width, size.height), androidx.compose.ui.graphics.Paint())
            drawImage(dotMask, dstSize = dst)
            drawRect(brush, blendMode = BlendMode.SrcIn)
            canvas.restore()
        }
    }
}
