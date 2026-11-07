package com.ping.sms.ui.components

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.Transition
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.updateTransition
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.ping.sms.theme.PingMotion
import com.ping.sms.theme.PingTheme

/**
 * Bottom-sheet scaffolding from ConversationActionSheet.tsx lines 178-194, shared by every sheet:
 *  - scrim `bg-black/45`, fades in/out over 180 ms (`fadeFast`)
 *  - panel `bg-white dark:bg-m3-d2 rounded-t-[32px] shadow-2xl pb-3`, `max-h-[88vh]`
 *  - enter: y +80 dp, opacity 0 -> 1 with the standard spring; exit: y +60 dp, opacity 0
 *  - from 640 dp wide (Tailwind `sm:`) it becomes a centred dialog: max width 384 dp (`sm:max-w-sm`), all corners 32
 * Place this at the ROOT of the screen (it fills the screen like `fixed inset-0`). Back closes it.
 */
@Composable
fun PingBottomSheet(
    visible: Boolean,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val state = remember { MutableTransitionState(false) }
    state.targetState = visible
    if (!state.currentState && !state.targetState) return
    val t: Transition<Boolean> = rememberSheetTransition(state)
    val fade = t.animateFloat({ tween(PingMotion.FadeMs, easing = PingMotion.Emphasized) }, label = "scrim") { if (it) 1f else 0f }
    val rise = t.animateFloat({ if (targetState) PingMotion.standard() else PingMotion.standard() }, label = "rise") { if (it) 1f else 0f }
    val colors = PingTheme.colors
    BackHandler(enabled = visible) { onDismiss() }
    val showing = visible

    BoxWithConstraints(modifier.fillMaxSize()) {
        val centered = maxWidth >= 640.dp
        val maxH = maxHeight * 0.88f
        Box(
            Modifier.fillMaxSize().graphicsLayer { alpha = fade.value }.background(Color.Black.copy(alpha = 0.45f))
                .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { onDismiss() },
        )
        val shape = if (centered) RoundedCornerShape(32.dp) else RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)
        Box(Modifier.fillMaxSize(), contentAlignment = if (centered) Alignment.Center else Alignment.BottomCenter) {
            Column(
                Modifier
                    .graphicsLayer {
                        val r = rise.value
                        val from = if (showing) 80.dp.toPx() else 60.dp.toPx()
                        translationY = from * (1f - r)
                        alpha = r.coerceIn(0f, 1f)
                    }
                    .then(if (centered) Modifier.widthIn(max = 384.dp) else Modifier.fillMaxWidth())
                    .heightIn(max = maxH)
                    .cssShadow(shape, Shadows.X2l)
                    .clip(shape)
                    .background(colors.card)
                    .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) { }
                    .verticalScroll(rememberScrollState())
                    .navigationBarsPadding()
                    .padding(bottom = 12.dp),
            ) { content() }
        }
    }
}

@Composable
private fun rememberSheetTransition(state: MutableTransitionState<Boolean>): Transition<Boolean> =
    updateTransition(state, label = "sheet")
