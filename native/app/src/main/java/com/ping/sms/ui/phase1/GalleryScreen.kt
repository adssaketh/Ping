package com.ping.sms.ui.phase1

import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.ping.sms.theme.PingMotion
import com.ping.sms.theme.PingTheme
import com.ping.sms.theme.ThemeMode
import com.ping.sms.ui.components.AvatarCircle
import com.ping.sms.ui.components.PingBottomSheet
import com.ping.sms.ui.components.PingBottomTabs
import com.ping.sms.ui.components.PingLogo
import com.ping.sms.ui.components.PingTopBar
import com.ping.sms.ui.components.Shadows
import com.ping.sms.ui.components.SkeletonList
import com.ping.sms.ui.components.TopProgress
import com.ping.sms.ui.components.cssShadow
import com.ping.sms.ui.components.pressScale
import com.ping.sms.ui.components.rowPressScale
import com.ping.sms.ui.icons.Lucide
import com.ping.sms.ui.icons.LucideIcon
import com.ping.sms.ui.icons.PingIcon
import com.ping.sms.util.AvatarColors
import kotlinx.coroutines.launch

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Column(Modifier.padding(vertical = 12.dp)) {
        Body(title.uppercase(), Modifier.padding(horizontal = 20.dp, vertical = 6.dp), 12f, FontWeight.SemiBold, PingTheme.colors.variant)
        content()
    }
}

/** Preview gallery (Phase 1 deliverable 4): every core component, with theme and wallpaper-colour switches. */
@Composable
fun GalleryScreen(mode: ThemeMode, onMode: (ThemeMode) -> Unit, wallpaper: Boolean, onWallpaper: (Boolean) -> Unit, onBack: () -> Unit) {
    val c = PingTheme.colors
    val scope = rememberCoroutineScope()
    var sheet by remember { mutableStateOf(false) }
    var collapsed by remember { mutableStateOf(false) }
    var tab by remember { mutableStateOf(0) }

    Box(Modifier.fillMaxSize().background(c.screen)) {
        Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing).verticalScroll(rememberScrollState())) {
            Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.clip(CircleShape).clickable(onClick = onBack).padding(8.dp)) { PingIcon(Lucide.ArrowLeft, c.onSurface, 24.dp) }
                Body("Component gallery", size = 22f, weight = FontWeight.SemiBold)
            }
            Section("Theme") {
                ToolRow("Mode") { ThemeMode.entries.forEach { ToolChip(it.name, mode == it) { onMode(it) } } }
                ToolRow("Colours") { ToolChip("Wallpaper (Material You)", wallpaper) { onWallpaper(true) }; ToolChip("Baseline blue", !wallpaper) { onWallpaper(false) } }
            }
            Section("Colour slots (21, index.css)") {
                val s = c.slots
                val all = listOf("primary" to s.primary, "hover" to s.primaryHover, "container" to s.primaryContainer, "light" to s.primaryLight, "deep" to s.primaryDeep, "on-deep" to s.onPrimaryDeep,
                    "on-surface" to s.onSurface, "on-surface-dk" to s.onSurfaceDk, "outline" to s.outline, "outline-dk" to s.outlineDk, "variant" to s.variant, "variant-dk" to s.variantDk,
                    "line" to s.line, "surface" to s.surface, "surface-hi" to s.surfaceHi, "d0" to s.d0, "d1" to s.d1, "d2" to s.d2, "d3" to s.d3, "d4" to s.d4, "d5" to s.d5)
                androidx.compose.foundation.layout.FlowRow(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    all.forEach { (n, col) -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(Modifier.size(44.dp).clip(RoundedCornerShape(12.dp)).background(col).cssShadow(RoundedCornerShape(12.dp), Shadows.Xs))
                        Body(n, size = 9f, color = c.variant)
                    } }
                }
            }
            Section("Avatars (8 palettes, light and dark text rules)") {
                androidx.compose.foundation.layout.FlowRow(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // seeds chosen so every palette index appears once
                    val seeds = (0 until 8).map { i -> generateSequence(0) { it + 1 }.map { "S$it" }.first { AvatarColors.indexFor(it) == i } }
                    seeds.forEachIndexed { i, sd -> AvatarCircle(sd, "A${i + 1}") }
                    AvatarCircle("AX-AXISBK-S", "AX", size = 56.dp, textSizeSp = 16f, weight = FontWeight.Bold)
                }
            }
            Section("Skeleton (shimmer 1.3 s) and top progress") {
                Box(Modifier.fillMaxWidth().height(3.dp)) { TopProgress() }
                SkeletonList(3)
            }
            Section("Press feedback: scale 0.96 in 90 ms; rows 0.985 in 130 ms") {
                Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    val s1 = remember { MutableInteractionSource() }
                    Box(Modifier.pressScale(s1).clip(CircleShape).background(c.pill).clickable(interactionSource = s1, indication = null) {}.padding(horizontal = 22.dp, vertical = 12.dp)) { Body("Button", color = c.onPill, weight = FontWeight.SemiBold) }
                    val s2 = remember { MutableInteractionSource() }
                    Box(Modifier.rowPressScale(s2).clip(RoundedCornerShape(28.dp)).background(if (c.isDark) c.slots.d1 else Color.White).clickable(interactionSource = s2, indication = null) {}.padding(horizontal = 22.dp, vertical = 12.dp)) { Body("Row") }
                }
            }
            Section("Springs: tap a box (standard / bouncy / soft)") {
                Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    listOf("standard" to 0, "bouncy" to 1, "soft" to 2).forEach { (name, kind) ->
                        val x = remember { Animatable(0f) }
                        var right by remember { mutableStateOf(false) }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(Modifier.size(56.dp).graphicsLayer { translationY = -x.value * 40.dp.toPx() }.clip(RoundedCornerShape(16.dp)).background(c.accent)
                                .clickable { right = !right; scope.launch { x.animateTo(if (right) 1f else 0f, when (kind) { 0 -> PingMotion.standard(); 1 -> PingMotion.bouncy(); else -> PingMotion.soft() }) } })
                            Body(name, size = 11f, color = c.variant, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }
            Section("Shadows (Tailwind xs / sm / md / 2xl, m3 elevation 1-3)") {
                androidx.compose.foundation.layout.FlowRow(Modifier.padding(horizontal = 20.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                    listOf("xs" to Shadows.Xs, "sm" to Shadows.Sm, "md" to Shadows.Md, "2xl" to Shadows.X2l, "elev1" to Shadows.Elevation1, "elev2" to Shadows.Elevation2, "elev3" to Shadows.Elevation3).forEach { (n, sh) ->
                        val shape = RoundedCornerShape(20.dp)
                        Box(Modifier.size(64.dp).cssShadow(shape, sh).clip(shape).background(c.card), contentAlignment = Alignment.Center) { Body(n, size = 11f, color = c.variant) }
                    }
                }
            }
            Section("Font check (compare with the old Ping text)") { FontCheck() }
            Section("Logo") { Box(Modifier.padding(horizontal = 20.dp)) { PingLogo() } }
            Section("Collapsing top bar (tap to toggle)") {
                Box(Modifier.background(c.screen)) { PingTopBar(collapsed, { collapsed = !collapsed }) }
                ToolRow("State") { ToolChip("Collapsed", collapsed) { collapsed = true }; ToolChip("Expanded", !collapsed) { collapsed = false } }
            }
            Section("Bottom tabs (sliding pill, badges)") { PingBottomTabs(tab, listOf(1, 0, 0, 1, 0), { tab = it }) }
            Section("Sheet") { ToolRow("") { ToolChip("Open bottom sheet", false) { sheet = true } } }
            Box(Modifier.height(48.dp))
        }
        PingBottomSheet(visible = sheet, onDismiss = { sheet = false }) {
            val items: List<Pair<LucideIcon, String>> = listOf(Lucide.Copy to "Copy last message", Lucide.Pin to "Pin to top", Lucide.Archive to "Archive", Lucide.Ban to "Block number", Lucide.Trash2 to "Delete")
            Box(Modifier.padding(20.dp)) { Body("Sheet scaffolding", size = 18f, weight = FontWeight.SemiBold) }
            items.forEach { (ic, label) -> Row(Modifier.fillMaxWidth().clickable { sheet = false }.padding(horizontal = 24.dp, vertical = 14.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) { PingIcon(ic, c.variant, 20.dp); Body(label) } }
        }
    }
}
