# Converting Ping SMS into an Android App (.APK)

This repository is already configured to be converted into a native Android application (.apk or .aab) directly via **GitHub Actions** or locally with **Capacitor**.

---

## Method 1: Automatic 1-Click Build via GitHub Actions (Zero Warnings, Zero Setup)

A modern GitHub Actions workflow is pre-configured in `.github/workflows/build-android.yml` targeting the latest Ubuntu 24.04 runner, Java 21, and modern Node 24 actions without any deprecation warnings.

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Build Android app with Ping"
   git push origin main
   ```
2. **Go to your GitHub Repository**:
   - Click on the **Actions** tab at the top.
   - Select **"Build Android APK"** from the left sidebar.
   - Click **Run workflow** (or simply push a new commit).
3. **Download your Android APK**:
   - Once the build finishes (~1-2 minutes), scroll down to the **Artifacts** section on the workflow run page.
   - Download `ping-sms-debug-apk.zip`.
   - Unzip it and install `app-debug.apk` directly on any Android phone!

---

## Method 2: Build Locally using Capacitor & Android Studio

The Android project (`android/`) is already initialized and pre-configured with the Ping app icon and bundle ID `com.ping.sms`.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build and Sync**:
   ```bash
   npm run build
   npx cap sync android
   ```

3. **Open in Android Studio**:
   ```bash
   npm run android:open
   ```
   In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your debug or release APK.

---

## Android Default SMS Handler Architecture

Ping is pre-configured to meet all Google Android requirements to operate as your **Default SMS App**:

1. **Eligible Manifest Declarations**:
   - `android.provider.Telephony.SMS_DELIVER` BroadcastReceiver (`SmsReceiver.java`) with `BROADCAST_SMS` permission.
   - `android.provider.Telephony.WAP_PUSH_DELIVER` BroadcastReceiver (`MmsReceiver.java`) with `BROADCAST_WAP_PUSH` permission.
   - `android.intent.action.RESPOND_VIA_MESSAGE` Service (`HeadlessSmsSendService.java`) with `SEND_RESPOND_VIA_MESSAGE` permission.
   - `android.intent.action.SEND` / `SENDTO` / `VIEW` intent filters for `sms:`, `smsto:`, `mms:`, and `mmsto:` schemes.

2. **Native SMS & Contacts Integration**:
   - **Read Device SMS**: Queries Android's telephony `content://sms/` database and automatically categorizes messages into **Personal**, **Transactions** (Bank/OTP), and **Promotions**.
   - **Read Device Contacts**: Queries Android's `ContactsContract.CommonDataKinds.Phone` to display names, phone numbers, and avatars.
   - **Send Carrier SMS**: Sends real cellular SMS directly via Android `SmsManager`.
   - **Real-Time Incoming SMS**: `SmsReceiver` intercepts incoming SMS messages, writes them to the telephony inbox, alerts the app in real time, and triggers high-priority notifications with 1-tap OTP copy.

3. **Setting Ping as your Default SMS App on Android**:
   - Open Ping on your phone.
   - Tap **"Set as default"** on the home banner or under **Ping settings > Default SMS App**.
   - Android will display the system prompt: *"Use Ping instead of Messages as your default SMS app?"* — tap **Set as default**.
   - Alternatively, navigate to Android **Settings > Apps > Default Apps > SMS app > select Ping**.

---

## Method 3: Direct Native PWA Install on Android (Instant)

1. Open this app in Chrome on your Android phone.
2. Tap the **Install App** button in the top bar or tap the Chrome browser menu (⋮) > **"Install app"** or **"Add to Home screen"**.
3. It installs as a standalone native Android application with its own launcher icon, full-screen display, and system notifications!
