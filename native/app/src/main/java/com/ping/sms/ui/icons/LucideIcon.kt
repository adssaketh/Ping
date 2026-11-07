package com.ping.sms.ui.icons

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** A lucide icon: 24x24 viewport, stroked paths (stroke width 2 like lucide-react's default), round caps and joins. */
class LucideIcon(val name: String, private val paths: List<String>) {
    private val cache = HashMap<Float, ImageVector>()

    @Synchronized
    fun vector(strokeWidth: Float = 2f): ImageVector = cache.getOrPut(strokeWidth) {
        ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).apply {
            paths.forEach { d ->
                addPath(
                    pathData = addPathNodes(d),
                    fill = null,
                    stroke = SolidColor(Color.Black),
                    strokeLineWidth = strokeWidth,
                    strokeLineCap = StrokeCap.Round,
                    strokeLineJoin = StrokeJoin.Round,
                )
            }
        }.build()
    }
}

/** Draws a lucide icon in [tint]; [size] is the CSS size of the old `w-N h-N` class (24 dp viewport scaled to it). */
@Composable
fun PingIcon(icon: LucideIcon, tint: Color, size: Dp = 24.dp, modifier: Modifier = Modifier, strokeWidth: Float = 2f) {
    val painter = rememberVectorPainter(remember(icon, strokeWidth) { icon.vector(strokeWidth) })
    Image(painter, contentDescription = null, modifier = modifier.size(size), colorFilter = ColorFilter.tint(tint))
}
