package com.ping.sms.ui.phase1

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ping.sms.BuildConfig
import com.ping.sms.theme.PingTheme
import com.ping.sms.theme.ThemeMode

private enum class Screen { Home, Gallery, Glass }

/** Phase 1 shell: not the real app. Phase 3 replaces it with the inbox. */
@Composable
fun Phase1App() {
    var screen by rememberSaveable { mutableStateOf(Screen.Home) }
    var mode by rememberSaveable { mutableStateOf(ThemeMode.System) }
    var wallpaper by rememberSaveable { mutableStateOf(true) }
    PingTheme(mode, wallpaper) {
        BackHandler(enabled = screen != Screen.Home) { screen = Screen.Home }
        when (screen) {
            Screen.Home -> Column(Modifier.fillMaxSize().background(PingTheme.colors.screen).windowInsetsPadding(WindowInsets.safeDrawing).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Body("Ping native: Phase 1", size = 24f, weight = FontWeight.SemiBold)
                Body("flavor: ${BuildConfig.FLAVOR}   read-only: ${BuildConfig.READ_ONLY}   package: ${BuildConfig.APPLICATION_ID}", size = 12f, color = PingTheme.colors.variant)
                ToolRow("Open") {
                    ToolChip("Component gallery", false) { screen = Screen.Gallery }
                    ToolChip("Glass bar prototype", false) { screen = Screen.Glass }
                }
                ToolRow("Theme") { ThemeMode.entries.forEach { ToolChip(it.name, mode == it) { mode = it } } }
            }
            Screen.Gallery -> GalleryScreen(mode, { mode = it }, wallpaper, { wallpaper = it }, { screen = Screen.Home })
            Screen.Glass -> GlassPrototypeScreen { screen = Screen.Home }
        }
    }
}
