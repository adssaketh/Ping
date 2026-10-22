# Signing the Ping APK

Android only lets a new APK replace an installed one when both are signed with the **same key**. Without a
stable key every GitHub build is signed with a throw-away debug key, so each new APK has to be uninstalled
first, which also erases the app's data (profile picture, settings, learned spam rules).

The GitHub workflow signs the APK for you once the four secrets below exist. Until then it keeps building the
debug APK as before.

## 1. Create your key (once)

On a computer with Java installed (or Termux on Android with `pkg install openjdk-17`):

```
keytool -genkeypair -v -keystore ping-release.jks -alias ping -keyalg RSA -keysize 4096 -validity 10000
```

Choose a strong password and remember it. Then turn the file into text:

```
base64 -w0 ping-release.jks > ping-release.b64.txt      (macOS: base64 -i ping-release.jks)
```

## 2. Add four secrets to the GitHub repo

Repo > Settings > Secrets and variables > Actions > New repository secret:

| Secret name | Value |
|---|---|
| `PING_KEYSTORE_BASE64` | the whole text inside `ping-release.b64.txt` |
| `PING_KEYSTORE_PASSWORD` | the password you chose |
| `PING_KEY_ALIAS` | `ping` |
| `PING_KEY_PASSWORD` | the same password |

## 3. Build

Run the **Build Android APK** workflow. The artifact is now `ping-sms-signed-apk` (a release build, faster and
smaller than a debug build). Install it once (uninstall the old debug version first). After that every new build
installs over the previous one and keeps your data.

## Keep the key safe

- Never commit `ping-release.jks` or the passwords to the repository (this project is public).
- Keep a backup copy somewhere private. If the key is lost, installed apps can no longer be updated.
- Anyone who has the key can publish updates that Android will accept as yours.
