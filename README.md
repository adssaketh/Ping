# Ping — Modern Standard SMS Text Messaging App

<p align="center">
  <img src="public/ping-icon.png" width="96" height="96" alt="Ping Logo" style="border-radius: 24px;" />
</p>

<p align="center">
  <strong>A clean, private, Material Design 3 standard SMS messaging app built for Android and Modern Web.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20PWA-0B57D0?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Default%20SMS-Eligible-10B981?style=flat-square" alt="Default SMS Eligible" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square" alt="Capacitor" />
  <img src="https://img.shields.io/badge/Tailwind-CSS%204-38BDF8?style=flat-square" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License" />
</p>

---

## 🌟 Highlights & Features

### 📱 Android Default SMS Handler
- **Official Android Default SMS Eligibility**: Contains all four system components mandated by Google Android:
  - `SmsReceiver.java` (`android.provider.Telephony.SMS_DELIVER`) with `BROADCAST_SMS` permission.
  - `MmsReceiver.java` (`android.provider.Telephony.WAP_PUSH_DELIVER`) with `BROADCAST_WAP_PUSH` permission.
  - `HeadlessSmsSendService.java` (`android.intent.action.RESPOND_VIA_MESSAGE`) for quick replies.
  - `MainActivity.java` with `SEND`, `SENDTO`, and `VIEW` intent filters for `sms:`, `smsto:`, `mms:`, and `mmsto:`.
- **1-Tap Default Role Prompt**: Prompts the Android OS `RoleManager` to set Ping as your default SMS handler.

### 💬 Cellular Carrier SMS
- **Real Carrier Messaging**: Sends SMS directly through your phone's cellular connection via `SmsManager`.
- **Live Carrier Delivery Status**: Captures `sent`, `delivered`, and `failed` receipts via `SmsStatusReceiver`.
- **Multi-SIM Support**: Tracks and preserves SIM card `subscriptionId` across conversations.

### 📖 Read SMS & Device Contacts
- **Direct Device SMS Sync**: Reads your phone's SMS messages from Android's `content://sms/` telephony database.
- **Auto Categorization**: Automatically categorizes threads into:
  - **Personal**: Family, friends, and individual contacts.
  - **Transactions**: Banks, credit cards, verification codes, and OTPs with 1-tap copy.
  - **Promotions**: Deals, coupons, sales, and carrier marketing.
- **Phonebook Contacts Integration**: Reads names, phone numbers, and avatars from `ContactsContract.CommonDataKinds.Phone` and matches them to SMS senders.
- **Web Contact Picker API**: Supports Chrome's native contact picker (`navigator.contacts.select`) on web/PWA.

### 🎨 Material Design 3 Experience
- **Google Messages Aesthetic**: Rounded cards, dynamic colors, floating action compose button, and responsive layout.
- **Sound Effects**: Audio feedback for message sent and received events.
- **Smart OTP Actions**: Automatic verification code detection with 1-tap copy from heads-up banners.
- **Dark & Light Modes**: System, light, and dark theme support.
- **Message Scheduling**: Compose texts to be sent at specific future times.

---

## 📂 Project Architecture

```
ping/
├── .github/workflows/
│   └── build-android.yml         # Automated GitHub Actions APK build workflow
├── android/                      # Native Android project (Capacitor scaffold)
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml   # Complete default SMS app permissions & receivers
│   │   ├── java/com/ping/sms/
│   │   │   ├── MainActivity.java           # Bridge activity & plugin registration
│   │   │   ├── PingSmsPlugin.java          # Native Capacitor plugin for SMS & Contacts
│   │   │   ├── SmsReceiver.java            # Incoming SMS deliver broadcast receiver
│   │   │   ├── MmsReceiver.java            # WAP push deliver receiver for MMS
│   │   │   ├── SmsSender.java              # Cellular SMS manager with pending intents
│   │   │   ├── SmsStatusReceiver.java      # Carrier sent/delivered receipt listener
│   │   │   └── HeadlessSmsSendService.java # Respond-via-message quick reply service
│   │   └── res/mipmap-*/                   # Adaptive launcher icons for all screen densities
├── src/
│   ├── components/               # React UI components (ChatView, ConversationList, etc.)
│   ├── context/                  # SMSContext (global SMS, contacts, and device sync state)
│   ├── services/                 # smsBridge (native Capacitor bridge & Web Contact Picker)
│   ├── utils/                    # Seed data, sound effects, OTP parsing, and formatting
│   ├── App.tsx                   # Main application entry point
│   └── main.tsx
├── public/                       # PWA icons and web assets
├── capacitor.config.json         # Capacitor configuration (com.ping.sms)
├── vite.config.ts                # Vite 8 + Tailwind CSS 4 + VitePWA configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ or 22+
- **npm** or **bun**
- (Optional for local Android build) **Android Studio** with Android SDK 34+ and JDK 21

### Local Web Development
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building the Android APK

### Method 1: Automatic 1-Click Build via GitHub Actions (Recommended)
This repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/build-android.yml`):
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Build Android APK"
   git push origin main
   ```
2. Navigate to your repository's **Actions** tab on GitHub.
3. Select **"Build Android APK"** and run the workflow (or trigger it automatically on push).
4. When finished (~1-2 minutes), scroll to the **Artifacts** section at the bottom of the run page.
5. Download `ping-sms-debug-apk.zip`, extract it, and install `app-debug.apk` directly on your Android phone!

### Method 2: Local Android Studio Build
```bash
# 1. Build web production assets
npm run build

# 2. Sync assets with native Android project
npx cap sync android

# 3. Open in Android Studio
npm run android:open
```
In Android Studio:
- Click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate `app-debug.apk`.

---

## ⚙️ Setting Ping as Your Default SMS App
1. Install and launch the Ping APK on your Android phone.
2. Tap **"Set as default"** on the home screen banner or under **Ping settings > Default SMS App**.
3. In the Android system prompt (*"Use Ping instead of Messages as your default SMS app?"*), select **Set as default**.
4. Tap **"Sync Device SMS & Contacts"** to load all your existing carrier messages and phonebook contacts.

---

## 🔒 Permissions & Security
Ping requires standard Android telephony and contacts permissions to operate as your default SMS handler:
- `READ_SMS` & `RECEIVE_SMS`: To display your inbox and handle incoming text messages.
- `SEND_SMS`: To transmit messages through your cellular network.
- `READ_CONTACTS`: To display contact names and avatars for phone numbers.
- `POST_NOTIFICATIONS`: To deliver alerts and verification codes when messages arrive.

Ping adheres to a **Local-First** design: your personal SMS messages and contacts remain on your device and are never transmitted to external third-party servers.

---

## 📄 License
This project is open source under the MIT License.
