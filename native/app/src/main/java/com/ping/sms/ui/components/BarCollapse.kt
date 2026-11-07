package com.ping.sms.ui.components

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow

/**
 * Same thresholds as ConversationList.tsx lines 258-266 (scroll position in px of CSS = dp):
 * only act when the scroll moved more than 10 since the last decision; at the top (< 24) or moving up (< -6) expand;
 * moving down (> 6) and past 64 collapse.
 */
class BarCollapseTracker {
    var collapsed by mutableStateOf(false)
        private set
    private var last = 0f

    /** [top] = scroll offset in dp from the very top of the list. */
    fun onScroll(top: Float) {
        val delta = top - last
        if (kotlin.math.abs(delta) > 10f) {
            if (top < 24f || delta < -6f) collapsed = false else if (delta > 6f && top > 64f) collapsed = true
            last = top
        }
    }

    fun expand() { collapsed = false }
}

/** Feeds a LazyColumn's scroll offset into a tracker without recomposing the list. [density] converts px to dp. */
@Composable
fun rememberBarCollapse(list: LazyListState, density: Float, rowHeightDp: Float = 76f): BarCollapseTracker {
    val tracker = remember { BarCollapseTracker() }
    LaunchedEffect(list, density) {
        snapshotFlow { list.firstVisibleItemIndex * rowHeightDp + list.firstVisibleItemScrollOffset / density }
            .collect { tracker.onScroll(it) }
    }
    return tracker
}
