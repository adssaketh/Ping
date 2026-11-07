package com.ping.sms.theme

import androidx.compose.ui.text.font.DeviceFontFamilyName
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight

/**
 * INTERIM typography (Phase 1). The old app bundles NO font files: its CSS stack is
 *   'Google Sans', 'Google Sans Text', 'Roboto Flex', Roboto, system-ui, ...
 * so the screenshots show whichever of those the phone resolved. Until we know which one that was (open question in
 * docs/handoff/phase-1.md), we ask the phone for the same stack in the same order. On the user's phone this should give
 * the same face the WebView used. When the face is identified we bundle the matching licensed font and delete this.
 */
object PingFonts {
    // Compose allows one DeviceFontFamilyName per Font entry; the CSS fallbacks are chained through FontFamily
    // fallbacks by listing them after, so a missing first name falls to the next.
    val FullStack: FontFamily = FontFamily(
        listOf("Google Sans", "Google Sans Text", "Roboto Flex", "Roboto").flatMap { name ->
            listOf(FontWeight.Normal, FontWeight.Medium, FontWeight.SemiBold, FontWeight.Bold).map { w ->
                Font(DeviceFontFamilyName(name), w)
            }
        },
    )
}
