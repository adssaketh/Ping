package com.ping.sms.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.SpringSpec
import androidx.compose.animation.core.spring
import kotlin.math.sqrt

/**
 * The old app uses the `motion` library (Framer Motion) springs {stiffness, damping, mass}. Compose springs have an
 * implicit mass of 1, so the exact translation is
 *     dampingRatio     = damping / (2 * sqrt(stiffness * mass))
 *     composeStiffness = stiffness / mass            <- NOT just `stiffness` (the master prompt only mentioned the ratio)
 * Both give the same natural frequency (sqrt(k/m)) and damping ratio as the original.
 */
object SpringConversion {
    fun dampingRatio(stiffness: Float, damping: Float, mass: Float): Float = damping / (2f * sqrt(stiffness * mass))
    fun composeStiffness(stiffness: Float, mass: Float): Float = stiffness / mass
}

/** Motion tokens from src/motion.ts and src/index.css (see docs/design-tokens.md for line numbers). */
object PingMotion {
    // src/index.css :root
    val Emphasized = CubicBezierEasing(0.2f, 0f, 0f, 1f)
    val EmphasizedDecelerate = CubicBezierEasing(0.05f, 0.7f, 0.1f, 1f)
    val EmphasizedAccelerate = CubicBezierEasing(0.3f, 0f, 0.8f, 0.15f)
    val SpringLike = CubicBezierEasing(0.34f, 1.4f, 0.64f, 1f)

    // CSS keyword / literal curves used in index.css
    val CssEase = CubicBezierEasing(0.25f, 0.1f, 0.25f, 1f) // `transition: opacity 300ms ease`
    val LogoGlide = CubicBezierEasing(0.34f, 1.3f, 0.64f, 1f) // .topbar-logo transform

    // durations (ms)
    const val FadeMs = 180 // fadeFast in motion.ts
    const val ControlMs = 220 // every button / input colour, opacity, transform
    const val PressMs = 90 // pressed buttons scale in 90 ms
    const val PressScale = 0.96f
    const val RowPressMs = 130 // .row-press
    const val RowPressScale = 0.985f
    const val TopBarMs = 460 // .topbar-row / .topbar-pill / .fade-top
    const val TopBarInputMs = 180 // .topbar-input opacity (linear)
    const val TopBarLogoFadeMs = 300
    const val TopBarLogoMoveMs = 560
    const val TopBarLogoDelayMs = 40
    const val SlideMs = 320 // SLIDE_MS in App.tsx (chat pane slide)
    const val RowEnterMs = 380 // .row-enter
    const val BubbleEnterMs = 260 // .ping-bubble-in
    const val FlashMs = 1600 // .ping-flash
    const val SkeletonSweepMs = 1300

    // springs: {stiffness, damping, mass} from motion.ts lines 6-8
    fun <T> standard(): SpringSpec<T> = fromFramer(420f, 36f, 0.9f)
    fun <T> bouncy(): SpringSpec<T> = fromFramer(520f, 26f, 0.85f)
    fun <T> soft(): SpringSpec<T> = fromFramer(300f, 34f, 1f)

    fun <T> fromFramer(stiffness: Float, damping: Float, mass: Float): SpringSpec<T> = spring(
        dampingRatio = SpringConversion.dampingRatio(stiffness, damping, mass),
        stiffness = SpringConversion.composeStiffness(stiffness, mass),
    )
}
