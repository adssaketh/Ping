package com.ping.sms;

import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Telephony;
import android.telephony.SmsManager;
import android.telephony.SubscriptionManager;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Shared SMS sending logic used by the Capacitor plugin and the
 * "respond via message" service. Sends through the chosen SIM, records the
 * message in the system provider as OUTBOX, and wires sent / delivery
 * PendingIntents to {@link SmsStatusReceiver} so the final state is tracked.
 */
public final class SmsSender {
    public static final String ACTION_SENT = "com.ping.sms.SMS_SENT";
    public static final String ACTION_DELIVERED = "com.ping.sms.SMS_DELIVERED";
    public static final String EXTRA_MESSAGE_ID = "messageId";
    public static final String EXTRA_URI = "providerUri";
    public static final String EXTRA_PART_INDEX = "partIndex";
    public static final String EXTRA_PART_COUNT = "partCount";

    private static final AtomicInteger REQUEST_CODES = new AtomicInteger(1);

    private SmsSender() {}

    public static final class Result {
        public final long timestamp;
        public final int subscriptionId;

        Result(long timestamp, int subscriptionId) {
            this.timestamp = timestamp;
            this.subscriptionId = subscriptionId;
        }
    }

    /**
     * @param messageId      optional client-side id echoed back in status events
     * @param subscriptionId SIM subscription to send with, or -1 for the system default SMS SIM
     */
    public static Result send(Context context, String to, String message, String messageId, int subscriptionId)
        throws Exception {
        Context app = context.getApplicationContext();
        int subId = resolveSubscriptionId(subscriptionId);
        SmsManager smsManager = getSmsManager(app, subId);

        long now = System.currentTimeMillis();
        Uri providerUri = insertOutbox(app, to, message, now, subId);

        ArrayList<String> parts = smsManager.divideMessage(message);
        int count = Math.max(parts.size(), 1);

        ArrayList<PendingIntent> sentIntents = new ArrayList<>(count);
        ArrayList<PendingIntent> deliveryIntents = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            sentIntents.add(statusIntent(app, ACTION_SENT, messageId, providerUri, i, count));
            // Delivery reports are only requested for the final part to avoid noisy duplicates.
            deliveryIntents.add(
                i == count - 1 ? statusIntent(app, ACTION_DELIVERED, messageId, providerUri, i, count) : null
            );
        }

        try {
            if (count > 1) {
                smsManager.sendMultipartTextMessage(to, null, parts, sentIntents, deliveryIntents);
            } else {
                smsManager.sendTextMessage(to, null, message, sentIntents.get(0), deliveryIntents.get(0));
            }
        } catch (Exception e) {
            SmsStatusReceiver.updateProviderType(app, providerUri, Telephony.Sms.MESSAGE_TYPE_FAILED);
            throw e;
        }

        return new Result(now, subId);
    }

    /** Returns a valid subscription id, falling back to the default SMS SIM, or -1 when unavailable. */
    static int resolveSubscriptionId(int requested) {
        if (requested >= 0 && SubscriptionManager.isValidSubscriptionId(requested)) {
            return requested;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            int def = SubscriptionManager.getDefaultSmsSubscriptionId();
            if (SubscriptionManager.isValidSubscriptionId(def)) {
                return def;
            }
        }
        return -1;
    }

    @SuppressWarnings("deprecation")
    private static SmsManager getSmsManager(Context context, int subId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            SmsManager base = context.getSystemService(SmsManager.class);
            if (subId >= 0 && base != null) {
                return base.createForSubscriptionId(subId);
            }
            if (base != null) return base;
        }
        if (subId >= 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            return SmsManager.getSmsManagerForSubscriptionId(subId);
        }
        return SmsManager.getDefault();
    }

    private static Uri insertOutbox(Context context, String to, String message, long now, int subId) {
        try {
            ContentValues values = new ContentValues();
            values.put(Telephony.Sms.ADDRESS, to);
            values.put(Telephony.Sms.BODY, message);
            values.put(Telephony.Sms.DATE, now);
            values.put(Telephony.Sms.READ, 1);
            values.put(Telephony.Sms.TYPE, Telephony.Sms.MESSAGE_TYPE_OUTBOX);
            if (subId >= 0) {
                values.put(Telephony.Sms.SUBSCRIPTION_ID, subId);
            }
            // Only succeeds while Ping is the default SMS app; otherwise Android refuses the write.
            return context.getContentResolver().insert(Telephony.Sms.CONTENT_URI, values);
        } catch (Exception e) {
            return null;
        }
    }

    private static PendingIntent statusIntent(
        Context context,
        String action,
        String messageId,
        Uri providerUri,
        int partIndex,
        int partCount
    ) {
        Intent intent = new Intent(context, SmsStatusReceiver.class);
        intent.setAction(action);
        if (messageId != null) intent.putExtra(EXTRA_MESSAGE_ID, messageId);
        if (providerUri != null) intent.putExtra(EXTRA_URI, providerUri.toString());
        intent.putExtra(EXTRA_PART_INDEX, partIndex);
        intent.putExtra(EXTRA_PART_COUNT, partCount);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, REQUEST_CODES.getAndIncrement(), intent, flags);
    }
}
