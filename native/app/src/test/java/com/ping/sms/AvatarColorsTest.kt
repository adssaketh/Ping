package com.ping.sms

import com.ping.sms.golden.GoldenVectors
import com.ping.sms.util.AvatarColors
import org.junit.Assert.assertEquals
import org.junit.Test

class AvatarColorsTest {
    @Test fun avatarIndexMatchesTypeScript() {
        for ((seed, expected) in GoldenVectors.avatarIndex) {
            assertEquals("seed '$seed'", expected, AvatarColors.indexFor(seed))
        }
    }

    @Test fun initialsMatchTypeScript() {
        for ((name, phone, expected) in GoldenVectors.initials) {
            assertEquals("name '$name' phone '$phone'", expected, AvatarColors.initials(name, phone))
        }
    }
}
