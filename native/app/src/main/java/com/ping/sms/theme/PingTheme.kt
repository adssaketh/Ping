package com.ping.sms.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/** Settings > Theme: System default / Light / Dark (`themeMode` in DEFAULT_SETTINGS, default 'system'). */
enum class ThemeMode { System, Light, Dark }

val LocalPingColors = staticCompositionLocalOf { PingColors(PingSlots.Baseline, false) }

object PingTheme {
    val colors: PingColors
        @Composable get() = LocalPingColors.current
}

/**
 * [useWallpaperColors] = Material You: the 21 slots come from the wallpaper palettes (Android 12+, always true on our
 * minSdk 33) through [DynamicColor.buildSlots]; off = the baseline Ping blue (only for the gallery comparison).
 */
@Composable
fun PingTheme(
    mode: ThemeMode = ThemeMode.System,
    useWallpaperColors: Boolean = true,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val configuration = LocalConfiguration.current // re-read when the wallpaper / uiMode changes
    val systemDark = isSystemInDarkTheme()
    val isDark = when (mode) {
        ThemeMode.System -> systemDark
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
    }
    val slots = remember(useWallpaperColors, configuration, systemDark) {
        if (useWallpaperColors) DynamicColor.resolve(DynamicColor.readSystemPalettes(context)) else PingSlots.Baseline
    }
    val colors = remember(slots, isDark) { PingColors(slots, isDark) }

    // Old app: smsBridge.setSystemBarsTheme(isDark, surface). Edge-to-edge here: transparent bars, icon colour follows theme.
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !isDark
            controller.isAppearanceLightNavigationBars = !isDark
            window.decorView.setBackgroundColor(colors.screen.toArgb())
        }
    }
    CompositionLocalProvider(LocalPingColors provides colors) { content() }
}
