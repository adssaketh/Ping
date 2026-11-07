package com.ping.sms.theme

import androidx.compose.ui.text.font.DeviceFontFamilyName
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight

/**
 * Typography decision (Phase 1, confirmed on the user's OnePlus 13R, ColorOS 17, Android 17, 7 Nov 2026).
 * The old app bundles NO font files: its CSS stack is
 *   'Google Sans', 'Google Sans Text', 'Roboto Flex', Roboto, system-ui, ...
 * so every phone shows its own system font. The on-device Font check showed that on this phone none of those four names
 * is a separate font (all resolve to the system default, One Sans, a proprietary OnePlus font that cannot be bundled).
 * The native app therefore asks the phone for the SAME stack in the SAME order: identical to today on this phone, and on a
 * phone that does have Google Sans (e.g. a Pixel) it picks that, exactly like the old app. No font is bundled.
 * (Changing to one bundled open font such as Roboto Flex would change how Ping looks on the user's phone: not done.)
 */
object PingFonts {
    val FullStack: FontFamily = FontFamily(
        listOf("Google Sans", "Google Sans Text", "Roboto Flex", "Roboto").flatMap { name ->
            listOf(FontWeight.Normal, FontWeight.Medium, FontWeight.SemiBold, FontWeight.Bold).map { w ->
                Font(DeviceFontFamilyName(name), w)
            }
        },
    )
}
