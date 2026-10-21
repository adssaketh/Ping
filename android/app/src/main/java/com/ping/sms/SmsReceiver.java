package com.ping.sms;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import androidx.core.app.NotificationCompat;

public class SmsReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "ping_sms_channel";
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Incoming SMS and OTP Alerts");
            channel.enableVibration(true);
            manager.createNotificationChannel(channel);
        }

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.putExtra("sender", sender);
        openIntent.putExtra("body", body);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis(),
            openIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(sender)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        manager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
    }
}
