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
<img width="1264" height="2640" alt="1000124504" src="https://github.com/user-attachments/assets/27debaaa-584f-4375-adda-96d80429533b" />
<img width="1264" height="2500" alt="1000124505" src="https://github.com/user-attachments/assets/614db565-c711-482d-8847-68651da05309" />
<img width="1264" height="2632" alt="1000124506" src="https://github.com/user-attachments/assets/eb6d1b66-bf21-4fcf-b8f3-615da1276790" />
<img width="1264" height="2624" alt="1000124507" src="https://github.com/user-attachments/assets/a921a55b-b15a-463d-8331-383686abf6bf" />

