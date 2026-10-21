# Ping

Ping is an open-source SMS app for Android with Material You colours, swipeable message categories, copy-OTP
shortcuts, on-device spam protection and local backup and restore.

- **Open source:** the code in this repository is everything the app does.
- **100% offline:** Ping never sends your messages, contacts or anything else off your phone.
- **Spam protection:** runs on your phone, learns from your own Not spam / Report spam choices.

## Credits

Spam protection is built from the **Indian Telecom SMS Spam Collection** by **junioralive**:
https://github.com/junioralive/india-spam-sms-classification (see that repository's LICENSE for its terms).
The model is trained during the GitHub Actions build by `scripts/train-spam-model.mjs`. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

## Building

See [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md). The GitHub Action in `.github/workflows/build-android.yml`
builds a debug APK.
