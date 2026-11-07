package com.ping.sms

import com.ping.sms.ui.phase1.FrameReport
import com.ping.sms.ui.phase1.FrameSample
import org.junit.Assert.assertEquals
import org.junit.Test

class FrameReportTest {
    @Test fun percentilesAndDeadline() {
        val s = (1..100).map { FrameSample(it / 10.0, 5.0, 1.0) } // 0.1 .. 10.0 ms
        val r = FrameReport.of(s)
        assertEquals(100, r.frames)
        assertEquals(5.0, r.p50, 1e-9)
        assertEquals(9.0, r.p90, 1e-9)
        assertEquals(9.9, r.p99, 1e-9)
        assertEquals(10.0, r.maxMs, 1e-9)
        assertEquals(50, r.missed) // 5.1 .. 10.0
        assertEquals(0, r.missed2x)
        assertEquals(1.0, r.gpuP95Ms, 1e-9)
    }

    @Test fun eachFrameUsesItsOwnDeadline() {
        val r = FrameReport.of(listOf(FrameSample(12.0, 11.1, 0.0), FrameSample(12.0, 16.6, 0.0), FrameSample(25.0, 11.1, 0.0)))
        assertEquals(2, r.missed)
        assertEquals(1, r.missed2x)
    }

    @Test fun emptyIsSafe() {
        assertEquals(0, FrameReport.of(emptyList()).frames)
    }
}
