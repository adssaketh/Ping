package com.ping.sms.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ping.sms.theme.PingFonts
import com.ping.sms.theme.PingMotion
import com.ping.sms.theme.PingTheme
import com.ping.sms.ui.icons.Lucide
import com.ping.sms.ui.icons.LucideIcon
import com.ping.sms.ui.icons.PingIcon
import dev.chrisbanes.haze.HazeState

class TabSpec(val id: String, val label: String, val icon: LucideIcon)

/** BottomTabs.tsx lines 10-16 */
val PingTabs = listOf(
    TabSpec("all", "All", Lucide.MessageSquare),
    TabSpec("personal", "Personal", Lucide.User),
    TabSpec("transactions", "Transactions", Lucide.CreditCard),
    TabSpec("services", "Services", Lucide.Wrench),
    TabSpec("promotions", "Promotions", Lucide.Tag),
)

/**
 * Material 3 navigation bar as a floating pill (BottomTabs.tsx). Layout values: nav `px-3 pt-1 pb-1.5`, bar `max-w-xl`
 * (576 dp) `rounded-[32px]` `px-1.5 pt-1.5 pb-1.5` gap 4 dp; each tab `py-0.5 gap-0.5`; icon box 56x32 round; icon 22 dp;
 * badge min 18 dp, 10 sp bold, at top -4 dp / right 2 dp; label 10.5 sp, active bold. The active pill slides between
 * tabs with the bouncy spring (`layoutId="bottom-tab-pill"`). Enters from y=90 with the standard spring.
 */
@Composable
fun PingBottomTabs(
    selected: Int,
    unread: List<Int>,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
    glass: GlassConfig? = null,
    hazeState: HazeState? = null,
) {
    val colors = PingTheme.colors
    val shape = RoundedCornerShape(32.dp)

    val enter = remember { Animatable(0f) }
    LaunchedEffect(Unit) { enter.animateTo(1f, PingMotion.standard()) }

    val pillIndex by animateFloatAsState(selected.toFloat(), PingMotion.bouncy(), label = "tabPill")
    var barWidthPx by remember { mutableIntStateOf(0) }

    Box(
        modifier
            .fillMaxWidth()
            .padding(start = 12.dp, end = 12.dp, top = 4.dp, bottom = 6.dp)
            .graphicsLayer {
                translationY = 90.dp.toPx() * (1f - enter.value)
                alpha = enter.value.coerceIn(0f, 1f)
            },
        contentAlignment = Alignment.Center,
    ) {
        val barModifier = Modifier
            .widthIn(max = 576.dp)
            .fillMaxWidth()
            .let { m ->
                if (glass != null && hazeState != null) m.pingGlass(hazeState, shape, glass)
                else m.cssShadow(shape, Shadows.withAlpha(Shadows.Md, if (colors.isDark) 0.30f else 0.05f)).clip(shape).background(colors.bar)
            }
            .onSizeChanged { barWidthPx = it.width }
        Box(barModifier) {
            // sliding tonal pill, drawn once behind the tabs
            Box(
                Modifier
                    .padding(top = 8.dp)
                    .size(width = 56.dp, height = 32.dp)
                    .graphicsLayer {
                        val pad = 6.dp.toPx()
                        val gap = 4.dp.toPx()
                        val itemW = (barWidthPx - 2 * pad - 4 * gap) / 5f
                        translationX = pad + pillIndex * (itemW + gap) + (itemW - 56.dp.toPx()) / 2f
                    }
                    .clip(CircleShape)
                    .background(colors.pill),
            )
            Row(Modifier.padding(6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                PingTabs.forEachIndexed { i, tab ->
                    val active = i == selected
                    val source = remember { MutableInteractionSource() }
                    Column(
                        Modifier
                            .weight(1f)
                            .pressScale(source)
                            .clip(RoundedCornerShape(16.dp))
                            .clickable(interactionSource = source, indication = null) { onSelect(i) }
                            .padding(vertical = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Box(Modifier.size(width = 56.dp, height = 32.dp), contentAlignment = Alignment.Center) {
                            PingIcon(tab.icon, if (active) colors.onPill else colors.variant, 22.dp)
                            val count = unread.getOrElse(i) { 0 }
                            if (count > 0) {
                                Box(
                                    Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(top = 0.dp, end = 2.dp)
                                        .graphicsLayer { translationY = -4.dp.toPx() }
                                        .sizeIn(minWidth = 18.dp, minHeight = 18.dp)
                                        .clip(CircleShape)
                                        .background(colors.accent)
                                        .padding(horizontal = 4.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    BasicText(
                                        if (count > 99) "99+" else count.toString(),
                                        style = TextStyle(color = colors.onAccent, fontSize = 10.sp, fontWeight = FontWeight.Bold, fontFamily = PingFonts.FullStack),
                                    )
                                }
                            }
                        }
                        BasicText(
                            tab.label,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            style = TextStyle(
                                color = if (active) colors.strong else colors.variant,
                                fontSize = 10.5.sp,
                                lineHeight = 15.75.sp,
                                fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                                textAlign = TextAlign.Center,
                                fontFamily = PingFonts.FullStack,
                            ),
                        )
                    }
                }
            }
        }
    }
}
