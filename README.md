<img width="1264" height="2624" alt="1000124507" src="https://github.com/user-attachments/assets/d521dae6-6203-4f43-9d24-cd7d1df5b4a5" />
<img width="1264" height="2632" alt="1000124506" src="https://github.com/user-attachments/assets/47d20cbc-5e13-449c-b30c-ac59069d581b" />
<img width="1264" height="2500" alt="1000124505" src="https://github.com/user-attachments/assets/c168bba5-9ba1-4f9e-8b46-5db428c208a0" />
<img width="1264" height="2640" alt="1000124504" src="https://github.com/user-attachments/assets/e9c61309-d7a2-4636-a9e0-37a0e17175e5" />
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
