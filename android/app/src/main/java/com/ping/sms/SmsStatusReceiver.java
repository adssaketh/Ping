package com.ping.sms;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Telephony;

/**
 * Receives the "sent" and "delivered" results for messages sent via {@link SmsSender},
 * updates the system SMS provider, and tells the web UI when it is running.
 */
public class SmsStatusReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        String messageId = intent.getStringExtra(SmsSender.EXTRA_MESSAGE_ID);
        String uriString = intent.getStringExtra(SmsSender.EXTRA_URI);
        int partIndex = intent.getIntExtra(SmsSender.EXTRA_PART_INDEX, 0);
        int partCount = intent.getIntExtra(SmsSender.EXTRA_PART_COUNT, 1);
        Uri uri = uriString != null ? Uri.parse(uriString) : null;
        int resultCode = getResultCode();

        if (SmsSender.ACTION_SENT.equals(action)) {
            if (resultCode != Activity.RESULT_OK) {
                // Any failed part marks the whole message as failed.
                updateProviderType(context, uri, Telephony.Sms.MESSAGE_TYPE_FAILED);
                PingSmsPlugin.notifySmsStatus(messageId, "failed", resultCode);
            } else if (partIndex >= partCount - 1) {
                updateProviderType(context, uri, Telephony.Sms.MESSAGE_TYPE_SENT);
                PingSmsPlugin.notifySmsStatus(messageId, "sent", resultCode);
            }
        } else if (SmsSender.ACTION_DELIVERED.equals(action)) {
            if (resultCode == Activity.RESULT_OK) {
                updateProviderStatus(context, uri, Telephony.Sms.STATUS_COMPLETE);
                PingSmsPlugin.notifySmsStatus(messageId, "delivered", resultCode);
            } else {
                updateProviderStatus(context, uri, Telephony.Sms.STATUS_FAILED);
            }
        }
    }

    static void updateProviderType(Context context, Uri uri, int type) {
        if (uri == null) return;
        try {
            ContentValues values = new ContentValues();
            values.put(Telephony.Sms.TYPE, type);
            context.getContentResolver().update(uri, values, null, null);
        } catch (Exception ignored) {
            // Not the default SMS app any more, or the row was deleted.
        }
    }

    private static void updateProviderStatus(Context context, Uri uri, int status) {
        if (uri == null) return;
        try {
            ContentValues values = new ContentValues();
            values.put(Telephony.Sms.STATUS, status);
            context.getContentResolver().update(uri, values, null, null);
        } catch (Exception ignored) {
        }
    }
}
