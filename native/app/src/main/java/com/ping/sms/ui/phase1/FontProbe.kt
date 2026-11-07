package com.ping.sms.ui.phase1

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.DeviceFontFamilyName
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ping.sms.theme.PingFonts
import com.ping.sms.theme.PingTheme
import kotlin.math.abs

/**
 * Font check (Phase 1, question "which face did the old WebView resolve?"). The old CSS stack asks for
 * 'Google Sans', 'Google Sans Text', 'Roboto Flex', Roboto, then system-ui. For every name this asks the phone for that
 * family and reports whether it is a separate installed font or just resolves to the system default (a name that is
 * not installed, or is remapped by the phone maker, gives the same shapes as the default).
 * Chromium (WebView) reads the same system font list, so the first name that is "separate" is the one Ping used.
 */
object FontProbe {
    val names = listOf("Google Sans", "Google Sans Text", "Roboto Flex", "Roboto", "sans-serif", "sans-serif-medium")
    private const val Sample = "Hamburgefonstiv 0123456789 gjy@/&"

    private fun width(tf: Typeface): Float = Paint().apply { textSize = 100f; typeface = tf }.measureText(Sample)

    fun verdict(name: String): String {
        val def = width(Typeface.DEFAULT)
        val w = width(Typeface.create(name, Typeface.NORMAL))
        return if (abs(w - def) < 0.01f) "same as system default" else "SEPARATE font"
    }
}

@Composable
fun FontCheck() {
    val c = PingTheme.colors
    val rows = remember { FontProbe.names.map { it to FontProbe.verdict(it) } }
    Column(Modifier.padding(horizontal = 20.dp)) {
        fun fam(n: String) = FontFamily(Font(DeviceFontFamilyName(n), FontWeight.Normal))
        val line = "INR 50.00 debited A/c no. XX6372 Ping settings"
        Body("System default (this is what 'system-ui' gives)", size = 11f, color = c.variant)
        BasicText(line, Modifier.padding(bottom = 10.dp), style = TextStyle(color = c.onSurface, fontSize = 16.sp, fontFamily = FontFamily.Default))
        rows.forEach { (n, v) ->
            Body("$n: $v", size = 11f, color = c.variant)
            BasicText(line, Modifier.padding(bottom = 10.dp), style = TextStyle(color = c.onSurface, fontSize = 16.sp, fontFamily = fam(n)))
        }
        Body("PingFonts.FullStack (interim, the stack above in order)", size = 11f, color = c.variant)
        BasicText(line, Modifier.padding(bottom = 10.dp), style = TextStyle(color = c.onSurface, fontSize = 16.sp, fontFamily = PingFonts.FullStack))
    }
}
