package com.ping.sms.util

import androidx.compose.ui.graphics.Color
import kotlin.math.abs

/**
 * Deterministic avatar colour per sender, ported literally from `getAvatarColorClasses` / `getInitials`
 * (src/utils/smsUtils.ts ~lines 124-165). Golden-tested against the TypeScript.
 */
object AvatarColors {
    class Palette(val lightBg: Color, val lightText: Color, val darkBg: Color, val darkText: Color)

    private fun c(hex: Long) = Color(0xFF000000L or hex)

    // M3_AVATAR_PALETTES: bg-[..] text-white  /  dark:bg-[..] dark:text-[..]
    val palettes: List<Palette> = listOf(
        Palette(c(0x0B57D0), Color.White, c(0xA8C7FA), c(0x041E49)),
        Palette(c(0x1E8E3E), Color.White, c(0x6DD58C), c(0x0A3818)),
        Palette(c(0x9333EA), Color.White, c(0xD8B4FE), c(0x3B0764)),
        Palette(c(0xE37400), Color.White, c(0xFFB74D), c(0x4E2700)),
        Palette(c(0xC2185B), Color.White, c(0xF48FB1), c(0x4A001F)),
        Palette(c(0x007B83), Color.White, c(0x4DD0E1), c(0x00363A)),
        Palette(c(0x5C6BC0), Color.White, c(0x9FA8DA), c(0x1A237E)),
        Palette(c(0x795548), Color.White, c(0xBCAAA4), c(0x3E2723)),
    )

    /**
     * JS: `hash = seed.charCodeAt(i) + ((hash << 5) - hash)` then `Math.abs(hash) % 8`.
     * `hash << 5` first converts hash to a 32-bit int (wraps), the subtraction and addition happen in 64-bit doubles
     * (exact, the values stay below 2^34), so a Long reproduces it exactly. Kotlin Char = UTF-16 unit = charCodeAt.
     */
    fun indexFor(seed: String): Int {
        var hash = 0L
        for (ch in seed) {
            val shifted = (hash.toInt() shl 5).toLong()
            hash = ch.code.toLong() + (shifted - hash)
        }
        return (abs(hash) % palettes.size).toInt()
    }

    fun paletteFor(seed: String): Palette = palettes[indexFor(seed)]

    private val whitespace = Regex("[\\s\\p{Z}\\uFEFF]+")

    /** getInitials(name, fallbackPhone) */
    fun initials(name: String, fallbackPhone: String): String {
        val trimmed = name.trim { it.isWhitespace() || it == '\uFEFF' || Character.isSpaceChar(it) }
        if (trimmed.isEmpty()) return if (fallbackPhone.isNotEmpty()) fallbackPhone.takeLast(2) else "??"
        val parts = trimmed.split(whitespace)
        return if (parts.size >= 2) {
            (parts.first().take(1) + parts.last().take(1)).uppercase()
        } else {
            parts[0].take(2).uppercase()
        }
    }
}
