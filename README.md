# Ping 💌

Ping is an open-source SMS app for Android with Material You colours, swipeable message categories, copy-OTP
shortcuts, on-device spam protection and local backup and restore.

<img width="8192" height="8192" alt="1000124943" src="https://github.com/user-attachments/assets/32253691-cb5d-420c-abea-fd367c2b81a1" />
<img width="8192" height="8192" alt="1000124944" src="https://github.com/user-attachments/assets/5bf0c023-46e3-4027-b362-ed76d8fee0d1" />
<img width="8192" height="8192" alt="1000124946" src="https://github.com/user-attachments/assets/12468195-8bb6-472d-9843-2f7a618a0bfe" />
<img width="8192" height="8192" alt="1000124945" src="https://github.com/user-attachments/assets/6d2ddafb-2108-4746-b4c3-f090388d36f5" />


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

## License

Ping is free software, licensed under the [GNU General Public License v3.0](LICENSE). Copyright (C) 2026 Saketh.
You may use, study, share and change it. If you share a changed version, you must share its source code under the
same license. Third-party credits are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
