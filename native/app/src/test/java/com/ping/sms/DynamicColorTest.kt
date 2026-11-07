package com.ping.sms

import com.ping.sms.golden.GoldenVectors
import com.ping.sms.theme.DynamicColor
import com.ping.sms.theme.SpringConversion
import com.ping.sms.theme.SystemPalettes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DynamicColorTest {
    @Test fun buildSlotsMatchesTypeScript() {
        for ((i, case) in GoldenVectors.slotCases.withIndex()) {
            val p = SystemPalettes(true, case.accent1, case.accent1, case.accent1, case.neutral1, case.neutral2)
            val actual = DynamicColor.buildSlots(p)
            assertEquals("case $i", case.slots, actual)
        }
    }

    @Test fun incompletePalettesGiveNull() {
        val c = GoldenVectors.slotCases[0]
        assertTrue(GoldenVectors.incompleteGivesNull)
        assertNull(DynamicColor.buildSlots(SystemPalettes(true, c.accent1, null, null, c.neutral1, null)))
        assertTrue(GoldenVectors.unsupportedGivesNull)
        assertNull(DynamicColor.buildSlots(SystemPalettes(false)))
    }

    @Test fun springConversion() {
        // standard {420, 36, 0.9}
        assertEquals(0.9258f, SpringConversion.dampingRatio(420f, 36f, 0.9f), 1e-3f)
        assertEquals(466.67f, SpringConversion.composeStiffness(420f, 0.9f), 0.01f)
        // bouncy {520, 26, 0.85}
        assertEquals(0.6184f, SpringConversion.dampingRatio(520f, 26f, 0.85f), 1e-3f)
        // soft {300, 34, 1}
        assertEquals(0.9815f, SpringConversion.dampingRatio(300f, 34f, 1f), 1e-3f)
    }
}
