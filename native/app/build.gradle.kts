plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

// Same numbers as today's Ping: `package.json` says 2.2.0, the build file says versionName "2.2", and Settings in the
// installed app shows "Version 2.2 (build 52)", so the installed versionCode is 52 (it came from GITHUB_RUN_NUMBER of
// the old workflow). A NEW workflow starts counting from 1 again, so the native build adds an offset: its versionCode
// must always be higher than 52 for the `prod` APK to install over the current Ping.
val runNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
val versionCodeOffset = 1000

android {
    namespace = "com.ping.sms"
    compileSdk { version = release(37) }

    defaultConfig {
        applicationId = "com.ping.sms"
        minSdk = 33
        targetSdk = 37
        versionCode = versionCodeOffset + runNumber
        versionName = "3.0.0-native"
    }

    signingConfigs {
        create("ping") {
            val path = System.getenv("PING_KEYSTORE_PATH")
            if (!path.isNullOrEmpty()) {
                storeFile = file(path)
                storePassword = System.getenv("PING_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("PING_KEY_ALIAS")
                keyPassword = System.getenv("PING_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // R8 and resource shrinking are switched on in Phase 7 (with the Baseline Profile).
            isMinifyEnabled = false
            if (!System.getenv("PING_KEYSTORE_PATH").isNullOrEmpty()) {
                signingConfig = signingConfigs.getByName("ping")
            }
        }
    }

    flavorDimensions += "channel"
    productFlavors {
        // Test build that lives NEXT TO the current Ping and can only read (see master prompt A1b).
        create("dev") {
            dimension = "channel"
            applicationId = "com.ping.sms.dev"
            resValue("string", "app_name", "Ping Dev")
            buildConfigField("boolean", "READ_ONLY", "true")
        }
        // The real app: installs over the current Ping. Built in CI from Phase 1, installed on the phone in Phase 7.
        create("prod") {
            dimension = "channel"
            applicationId = "com.ping.sms"
            resValue("string", "app_name", "Ping")
            buildConfigField("boolean", "READ_ONLY", "false")
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
        resValues = true
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.text)
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.animation)
    implementation(libs.haze)
    implementation(libs.haze.blur)
    debugImplementation(libs.androidx.compose.ui.tooling)

    testImplementation(libs.junit)
}
