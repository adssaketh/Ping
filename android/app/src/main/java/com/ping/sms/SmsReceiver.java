package com.ping.sms;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import androidx.core.app.NotificationCompat;

public class SmsReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "ping_sms_channel_v2";
    private static final String SPAM_CHANNEL_ID = "ping_sms_spam_channel";
    private static final String CHANNEL_NAME = "SMS Notifications";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Telephony.Sms.Intents.SMS_DELIVER_ACTION.equals(intent.getAction())) {
            return;
        }

        SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
        if (messages == null || messages.length == 0) {
            return;
        }

        StringBuilder fullBody = new StringBuilder();
        String sender = "";
        long timestamp = System.currentTimeMillis();

        for (SmsMessage msg : messages) {
            if (msg != null) {
                if (sender.isEmpty()) {
                    sender = msg.getDisplayOriginatingAddress();
                }
                fullBody.append(msg.getDisplayMessageBody());
                timestamp = msg.getTimestampMillis();
            }
        }

        String body = fullBody.toString();

        // SIM the message arrived on (-1 when unknown), so replies can go out on the same SIM
        int subscriptionId = intent.getIntExtra("subscription", -1);
        if (subscriptionId < 0) {
            subscriptionId = intent.getIntExtra("android.telephony.extra.SUBSCRIPTION_INDEX", -1);
        }

        // 1. Save incoming message to telephony provider so Android inbox has it
        try {
            ContentValues values = new ContentValues();
            values.put(Telephony.Sms.ADDRESS, sender);
            values.put(Telephony.Sms.BODY, body);
            values.put(Telephony.Sms.DATE, timestamp);
            values.put(Telephony.Sms.READ, 0);
            values.put(Telephony.Sms.TYPE, Telephony.Sms.MESSAGE_TYPE_INBOX);
            if (subscriptionId >= 0) {
                values.put(Telephony.Sms.SUBSCRIPTION_ID, subscriptionId);
            }
            context.getContentResolver().insert(Telephony.Sms.Inbox.CONTENT_URI, values);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Broadcast / Notify active webview if running
        PingSmsPlugin.notifyIncomingSms(sender, body, timestamp, subscriptionId);

        // 3. Show System Notification
        showNotification(context, sender, body);
    }

    private void showNotification(Context context, String sender, String body) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        // Suspected spam still arrives, but silently (no pop-up, no sound)
        boolean spam = SpamFilter.isSpam(context, sender, body);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Incoming SMS and OTP alerts");
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            channel.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            );
            manager.createNotificationChannel(channel);

            NotificationChannel spamChannel = new NotificationChannel(
                SPAM_CHANNEL_ID,
                "Possible spam",
                NotificationManager.IMPORTANCE_LOW
            );
            spamChannel.setDescription("Texts Ping suspects are spam. Shown quietly.");
            manager.createNotificationChannel(spamChannel);
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        int notificationId = (int) (System.currentTimeMillis() % 100000);

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.putExtra("sender", sender);
        openIntent.putExtra("body", body);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, notificationId, openIntent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, spam ? SPAM_CHANNEL_ID : CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_ping)
            .setColor(0xFF0B57D0)
            .setContentTitle(spam ? "Possible spam \u00B7 " + sender : sender)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(spam ? NotificationCompat.PRIORITY_LOW : NotificationCompat.PRIORITY_HIGH)
            .setDefaults(spam ? 0 : NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        // "Copy OTP" button, shown on the pop-up banner and in the notification shade
        String otp = OtpExtractor.extract(body);
        if (otp != null && !spam) {
            Intent copyIntent = new Intent(context, CopyOtpReceiver.class);
            copyIntent.setAction(CopyOtpReceiver.ACTION_COPY_OTP);
            copyIntent.putExtra(CopyOtpReceiver.EXTRA_OTP, otp);
            copyIntent.putExtra(CopyOtpReceiver.EXTRA_NOTIFICATION_ID, notificationId);
            PendingIntent copyPending = PendingIntent.getBroadcast(context, notificationId, copyIntent, flags);
            builder.addAction(new NotificationCompat.Action.Builder(0, "Copy OTP " + otp, copyPending).build());
        }

        manager.notify(notificationId, builder.build());
    }
}
