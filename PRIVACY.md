# Ping Privacy Policy

**Last updated: 22 October 2026**

Ping is an open-source SMS app for Android. This page explains, in plain words, what Ping can see and what it does with it.

## The short version

- Ping never uploads your messages, contacts or pictures anywhere.
- There is no account, no sign-in and no profile on a server.
- There are no ads, no analytics and no tracking.
- Spam detection runs entirely on your phone.
- You can erase Ping's data at any time.

## What Ping can access, and why

| Permission | Why |
|---|---|
| SMS and MMS (read, receive, send) | To show your conversations, deliver new messages and send the messages you write. |
| Contacts (read only) | To show a name and picture instead of a bare phone number. Ping never changes your contacts. |
| Notifications | To alert you to new messages and to offer a Copy OTP button. |
| Vibrate, keep awake | To make notifications work reliably. |
| Default SMS app role (optional) | Lets Ping receive messages and keep Android's own message store up to date, for example when you delete a message or mark it as read. |

Android's standard internet permission is declared by the app framework. Ping does not use it to send your data anywhere.

## What stays on your device

Your messages already live in Android's own message store. To open quickly, Ping also keeps a working copy of your conversations, contacts, starred messages, drafts and settings in the app's private storage on your phone. This includes:

- your profile picture and name, if you add them,
- the pictures your phone already has for your contacts (for example from Google Contacts),
- senders you marked "Not spam" or reported as spam,
- a short list of single words with a small score, learned from your Not spam / Report spam choices (not your messages).

Ping is excluded from Android cloud backup, so this copy is not uploaded with your phone backup. "Reset" in Settings erases the learned spam list. Clearing Ping's storage in Android settings or uninstalling Ping removes everything it stored.

## Spam protection

Ping checks incoming texts for spam and scams on your phone, using a small model built into the app. The model was trained before the app was released, from a public collection of Indian SMS messages (see Credits), so nothing you receive is uploaded or used to train anything. Suspected spam is moved to a Spam folder and is never deleted.

## Sending messages

Text messages are sent through your mobile carrier, like in any SMS app. Your carrier and the person you message receive them as normal SMS, and your carrier's own privacy policy and charges apply. SMS is not end-to-end encrypted, so avoid sending secrets by text.

## One-time codes and the clipboard

When a message looks like a one-time code, Ping finds the code on your phone and shows a Copy OTP button. Tapping it copies the code to your clipboard (marked as sensitive where Android supports it). Nothing is sent anywhere. Notifications can show message text on your lock screen depending on your Android settings.

## Backup and restore

If you use Back up SMS, the file is saved where you choose. It contains your messages in plain, unencrypted text, so keep it somewhere safe.

## Add to contacts

"Add to contacts" opens Android's own contacts app with the number filled in. The contacts app does the saving; Ping does not need permission to change contacts.

## Your choices

- Turn permissions off, or change the default SMS app, at any time in Android settings.
- Deleting a message or conversation in Ping removes it from your phone when Ping is the default SMS app.
- Use Reset in Ping settings, or clear Ping's storage in Android settings, to erase its working copy.
- Uninstalling Ping removes everything it stored.

## Children

Ping is a general-purpose messaging app and does not knowingly collect any information from anyone.

## Open source

Ping is open source. Its code is public at https://github.com/adssaketh/Ping, so anyone can check that it does what this policy says.

## Credits

Spam protection is built from the Indian Telecom SMS Spam Collection by junioralive: https://github.com/junioralive/india-spam-sms-classification

## Changes to this policy

If Ping's handling of data ever changes, this page will be updated and the date at the top will change. Ping will not start collecting data without telling you here first.

## Contact

Questions about privacy? Open an issue at https://github.com/adssaketh/Ping/issues
