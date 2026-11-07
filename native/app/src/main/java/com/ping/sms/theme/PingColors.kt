package com.ping.sms.theme

import android.content.Context
import android.os.Build
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import kotlin.math.roundToInt

/** Tone ("0" ... "1000") -> "#RRGGBB" */
typealias TonalPalette = Map<String, String>

/** The five wallpaper palettes the phone provides (Android 12+). Same shape as the old `SystemPalettes`. */
class SystemPalettes(
    val supported: Boolean,
    val accent1: TonalPalette? = null,
    val accent2: TonalPalette? = null,
    val accent3: TonalPalette? = null,
    val neutral1: TonalPalette? = null,
    val neutral2: TonalPalette? = null,
)

/** The 21 colour slots of src/index.css (`--c-*`). Names follow the CSS variables. */
@Immutable
class PingSlots(
    val primary: Color,
    val primaryHover: Color,
    val primaryContainer: Color,
    val primaryLight: Color,
    val primaryDeep: Color,
    val onPrimaryDeep: Color,
    val onSurface: Color,
    val onSurfaceDk: Color,
    val outline: Color,
    val outlineDk: Color,
    val variant: Color,
    val variantDk: Color,
    val line: Color,
    val surface: Color,
    val surfaceHi: Color,
    val d0: Color,
    val d1: Color,
    val d2: Color,
    val d3: Color,
    val d4: Color,
    val d5: Color,
) {
    companion object {
        private fun c(hex: Long) = Color(0xFF000000L or hex)

        /** Baseline Ping colours: src/index.css lines 14-36. Used when no wallpaper palette is available. */
        val Baseline = PingSlots(
            primary = c(0x0B57D0), primaryHover = c(0x0842A0), primaryContainer = c(0xD3E3FD),
            primaryLight = c(0xA8C7FA), primaryDeep = c(0x004A77), onPrimaryDeep = c(0x041E49),
            onSurface = c(0x1F1F1F), onSurfaceDk = c(0xE2E2E2), outline = c(0x747775), outlineDk = c(0x8E918F),
            variant = c(0x444746), variantDk = c(0xC4C7C5), line = c(0xE0E2EC), surface = c(0xF8FAFD),
            surfaceHi = c(0xEDF2FA), d0 = c(0x111318), d1 = c(0x1A1D23), d2 = c(0x1E2228), d3 = c(0x252A32),
            d4 = c(0x2D3139), d5 = c(0x353A44),
        )

        fun fromHex(slots: Map<String, String>, fallback: PingSlots = Baseline): PingSlots {
            fun get(name: String, default: Color): Color = slots[name]?.takeIf { it.length == 7 }?.let {
                Color(0xFF000000L or it.substring(1).toLong(16))
            } ?: default
            return PingSlots(
                primary = get("--c-primary", fallback.primary),
                primaryHover = get("--c-primary-hover", fallback.primaryHover),
                primaryContainer = get("--c-primary-container", fallback.primaryContainer),
                primaryLight = get("--c-primary-light", fallback.primaryLight),
                primaryDeep = get("--c-primary-deep", fallback.primaryDeep),
                onPrimaryDeep = get("--c-on-primary-deep", fallback.onPrimaryDeep),
                onSurface = get("--c-on-surface", fallback.onSurface),
                onSurfaceDk = get("--c-on-surface-dk", fallback.onSurfaceDk),
                outline = get("--c-outline", fallback.outline),
                outlineDk = get("--c-outline-dk", fallback.outlineDk),
                variant = get("--c-variant", fallback.variant),
                variantDk = get("--c-variant-dk", fallback.variantDk),
                line = get("--c-line", fallback.line),
                surface = get("--c-surface", fallback.surface),
                surfaceHi = get("--c-surface-hi", fallback.surfaceHi),
                d0 = get("--c-d0", fallback.d0),
                d1 = get("--c-d1", fallback.d1),
                d2 = get("--c-d2", fallback.d2),
                d3 = get("--c-d3", fallback.d3),
                d4 = get("--c-d4", fallback.d4),
                d5 = get("--c-d5", fallback.d5),
            )
        }
    }
}

/**
 * Literal port of src/theme/dynamicColor.ts. We do NOT use Compose's dynamicColorScheme: the old app mapped the
 * wallpaper tones by hand (see buildSlots) and the native app must give the same colours.
 */
object DynamicColor {
    private fun toRgb(hex: String): IntArray {
        val h = hex.removePrefix("#")
        return intArrayOf(h.substring(0, 2).toInt(16), h.substring(2, 4).toInt(16), h.substring(4, 6).toInt(16))
    }

    // JS Math.round rounds halves up, like Kotlin's roundToInt
    private fun toHex(rgb: DoubleArray): String = "#" + rgb.joinToString("") {
        it.roundToInt().coerceIn(0, 255).toString(16).padStart(2, '0')
    }.uppercase()

    /** Blend `a` towards `b` by `t` (0 = a, 1 = b). */
    fun mix(a: String, b: String, t: Double): String {
        val ra = toRgb(a)
        val rb = toRgb(b)
        return toHex(DoubleArray(3) { ra[it] + (rb[it] - ra[it]) * t })
    }

    private fun String?.orElse(other: String?): String? = if (this.isNullOrEmpty()) other else this

    /** Returns the `--c-*` slots, or null if the palettes are incomplete (then the baseline stays). */
    fun buildSlots(p: SystemPalettes?): Map<String, String>? {
        if (p == null || !p.supported || p.accent1 == null || p.neutral1 == null || p.neutral2 == null) return null
        val a = p.accent1
        val n1 = p.neutral1
        val n2 = p.neutral2
        val needed = listOf(a["600"], a["700"], a["100"], a["200"], a["900"], n1["10"], n1["50"], n1["800"], n1["900"], n1["1000"])
        if (needed.any { it.isNullOrEmpty() }) return null

        val out = LinkedHashMap<String, String>()
        fun put(name: String, value: String?) { if (!value.isNullOrEmpty()) out[name] = value }
        put("--c-primary", a["600"])
        put("--c-primary-hover", a["700"])
        put("--c-primary-container", a["100"])
        put("--c-primary-light", a["200"])
        put("--c-primary-deep", a["700"])
        put("--c-on-primary-deep", a["900"])

        put("--c-on-surface", n1["900"])
        put("--c-on-surface-dk", n1["100"].orElse(n1["50"]))
        put("--c-outline", n2["500"].orElse(n1["500"]))
        put("--c-outline-dk", n2["400"].orElse(n1["400"]))
        put("--c-variant", n2["700"].orElse(n1["700"]))
        put("--c-variant-dk", n2["200"].orElse(n1["200"]))
        put("--c-line", n2["100"].orElse(n1["100"]))
        put("--c-surface", n1["10"])
        put("--c-surface-hi", n1["50"])

        // Dark surface ladder, darkest to lightest
        put("--c-d0", mix(n1["1000"]!!, n1["900"]!!, 0.6))
        put("--c-d1", mix(n1["900"]!!, n1["800"]!!, 0.25))
        put("--c-d2", mix(n1["900"]!!, n1["800"]!!, 0.5))
        put("--c-d3", mix(n1["900"]!!, n1["800"]!!, 0.8))
        put("--c-d4", n1["800"])
        put("--c-d5", mix(n1["800"]!!, n1["700"].orElse(n1["800"])!!, 0.6))
        return out
    }

    private val tones = intArrayOf(0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)
    private val names = listOf("accent1", "accent2", "accent3", "neutral1", "neutral2")

    /** Same lookup as PingSmsPlugin.getSystemColors(): resource `system_<palette>_<tone>` in package `android`. */
    fun readSystemPalettes(context: Context): SystemPalettes {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return SystemPalettes(false)
        return try {
            val res = context.resources
            val maps = names.associateWith { palette ->
                buildMap {
                    for (tone in tones) {
                        val id = res.getIdentifier("system_${palette}_$tone", "color", "android")
                        if (id != 0) put(tone.toString(), String.format("#%06X", 0xFFFFFF and context.getColor(id)))
                    }
                }
            }
            SystemPalettes(true, maps["accent1"], maps["accent2"], maps["accent3"], maps["neutral1"], maps["neutral2"])
        } catch (e: Exception) {
            SystemPalettes(false)
        }
    }

    /** Dynamic slots on top of the baseline; baseline when the phone gives nothing usable. */
    fun resolve(p: SystemPalettes?): PingSlots = buildSlots(p)?.let { PingSlots.fromHex(it) } ?: PingSlots.Baseline
}

/**
 * The slots resolved for the current light/dark mode: Tailwind pairs like `bg-m3-surface dark:bg-m3-d0` become one
 * property here. Raw slots stay available for anything unusual.
 */
@Immutable
class PingColors(val slots: PingSlots, val isDark: Boolean) {
    private fun pick(light: Color, dark: Color) = if (isDark) dark else light

    /** App background: `bg-m3-surface dark:bg-m3-d0` */
    val screen get() = pick(slots.surface, slots.d0)
    /** Bars and search pill (solid): `bg-m3-surface-hi dark:bg-m3-d2` */
    val bar get() = pick(slots.surfaceHi, slots.d2)
    /** Sheets, menus, settings cards: `bg-white dark:bg-m3-d2` */
    val card get() = pick(Color.White, slots.d2)
    /** `border-m3-line dark:border-m3-d4` */
    val cardLine get() = pick(slots.line, slots.d4)
    /** `text-m3-on-surface dark:text-m3-on-surface-dk` */
    val onSurface get() = pick(slots.onSurface, slots.onSurfaceDk)
    /** `text-m3-outline dark:text-m3-outline-dk` */
    val outline get() = pick(slots.outline, slots.outlineDk)
    /** `text-m3-variant dark:text-m3-variant-dk` */
    val variant get() = pick(slots.variant, slots.variantDk)
    /** Accent text/icons: `text-m3-primary dark:text-m3-primary-light` */
    val accent get() = pick(slots.primary, slots.primaryLight)
    /** Text on a filled accent: `text-white dark:text-m3-on-primary-deep` */
    val onAccent get() = pick(Color.White, slots.onPrimaryDeep)
    /** Tonal pill (active tab): `bg-m3-primary-container dark:bg-m3-primary-deep` */
    val pill get() = pick(slots.primaryContainer, slots.primaryDeep)
    /** Text/icon on the tonal pill: `text-m3-on-primary-deep dark:text-m3-primary-container` */
    val onPill get() = pick(slots.onPrimaryDeep, slots.primaryContainer)
    /** Strong text: `text-m3-on-surface dark:text-white` */
    val strong get() = pick(slots.onSurface, Color.White)
}
