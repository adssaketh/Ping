package com.ping.sms.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ping.sms.theme.PingFonts
import com.ping.sms.theme.PingTheme
import com.ping.sms.util.AvatarColors

/**
 * Coloured initials circle (AvatarCircle.tsx + the classes ConversationList.tsx passes in):
 * list row = 48 dp, semibold, 14 sp, shadow-xs; latest card = 56 dp, bold, 16 sp. A photo replaces the initials.
 */
@Composable
fun AvatarCircle(
    seed: String,
    initials: String,
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    textSizeSp: Float = 14f,
    weight: FontWeight = FontWeight.SemiBold,
    photo: ImageBitmap? = null,
    shadow: Boolean = true,
) {
    val colors = PingTheme.colors
    val palette = AvatarColors.paletteFor(seed)
    val bg = if (colors.isDark) palette.darkBg else palette.lightBg
    val fg = if (colors.isDark) palette.darkText else palette.lightText
    Box(
        modifier = modifier
            .then(if (shadow) Modifier.cssShadow(CircleShape, Shadows.Xs) else Modifier)
            .size(size)
            .clip(CircleShape)
            .background(bg),
        contentAlignment = Alignment.Center,
    ) {
        if (photo != null) {
            Image(photo, null, Modifier.size(size), contentScale = ContentScale.Crop)
        } else {
            BasicText(initials, style = TextStyle(color = fg, fontSize = textSizeSp.sp, fontWeight = weight, fontFamily = PingFonts.FullStack))
        }
    }
}
