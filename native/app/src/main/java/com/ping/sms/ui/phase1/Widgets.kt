package com.ping.sms.ui.phase1

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ping.sms.theme.PingFonts
import com.ping.sms.theme.PingTheme
import com.ping.sms.ui.components.pressScale

/** Test-tool chip (not an app component): tonal pill, filled when selected. */
@Composable
fun ToolChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val c = PingTheme.colors
    val source = remember { MutableInteractionSource() }
    Box(
        Modifier.pressScale(source).clip(CircleShape)
            .background(if (selected) c.pill else c.slots.surfaceHi.let { if (c.isDark) c.slots.d3 else it })
            .clickable(interactionSource = source, indication = null, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 9.dp),
    ) {
        BasicText(label, style = TextStyle(color = if (selected) c.onPill else c.onSurface, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, fontFamily = PingFonts.FullStack))
    }
}

@Composable
fun ToolRow(title: String, content: @Composable () -> Unit) {
    val c = PingTheme.colors
    Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        BasicText(title, style = TextStyle(color = c.variant, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, fontFamily = PingFonts.FullStack))
        androidx.compose.foundation.layout.FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { content() }
    }
}

@Composable
fun Body(text: String, modifier: Modifier = Modifier, size: Float = 14f, weight: FontWeight = FontWeight.Normal, color: androidx.compose.ui.graphics.Color = PingTheme.colors.onSurface, maxLinesOne: Boolean = false) {
    BasicText(text, modifier, maxLines = if (maxLinesOne) 1 else Int.MAX_VALUE, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis, style = TextStyle(color = color, fontSize = size.sp, fontWeight = weight, fontFamily = PingFonts.FullStack))
}
