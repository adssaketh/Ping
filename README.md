# Ping 💌

Ping is an open-source SMS app for Android with Material You colours, swipeable message categories, copy-OTP
shortcuts, on-device spam protection and local backup and restore.

<img width="2160" height="4320" alt="1000124928" src="https://github.com/user-attachments/assets/2078ceb5-6d76-4417-87e8-ac6f56be114f" />
<img width="2160" height="4320" alt="1000124922" src="https://github.com/user-attachments/assets/bd14f96d-c023-4275-b501-cda84c33e551" />
<img width="2160" height="4320" alt="1000124924" src="https://github.com/user-attachments/assets/5f0b083b-a40a-4b6b-a999-fae571554bb6" />
<img width="2160" height="4320" alt="1000124921" src="https://github.com/user-attachments/assets/7767d845-2cae-476c-914d-e97f88ec5018" />
<img width="2160" height="4320" alt="1000124925" src="https://github.com/user-attachments/assets/1a9ae0af-eafe-47ac-a6aa-c5879505ea5b" />
<img width="2160" height="4320" alt="1000124926" src="https://github.com/user-attachments/assets/4b62f207-22e3-4c44-81f4-e62cd78a267b" />


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


