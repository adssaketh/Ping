package com.ping.sms;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * "Send new bank messages to Paddhu Pusthakam automatically" (Ping > Settings > Send to Paddhu Pusthakam).
 *
 * When the switch is on, SmsReceiver calls {@link #submit} for every new bank / payment SMS (the same messages
 * the "Add to Paddhu" button is offered for). The SMS is handed to Paddhu Pusthakam through its content provider
 * (PingInboxProvider.java there), which only accepts calls from this app and just stores the message. Paddhu then
 * decides what to do with it the next time it opens: save it when it is sure, or put it in a review list.
 *
 * Nothing is opened on screen, so this works while both apps are closed. When Paddhu cannot be reached (not
 * installed, or the call failed) the message waits in a small outbox here and is tried again with the next message,
 * when the switch is turned on, and when Ping opens.
 *
 * The SMS id is the same one the notification button uses, so a message added both ways is saved only once.
 */
final class PaddhuInbox {
    private PaddhuInbox() {}

    /** Same as PingInboxProvider.AUTHORITY in Paddhu Pusthakam. */
    static final String AUTHORITY = "com.mansaketh.paddhupusthakam.pinginbox";
    private static final String METHOD_ENQUEUE = "enqueue";

    static final String PREFS = "ping_paddhu";
    private static final String KEY_ENABLED = "autoSend";
    private static final String KEY_LAST_SENT = "lastSentAt";
    private static final String KEY_LAST_ERROR = "lastError";
    private static final String KEY_OUTBOX = "outbox";
    private static final int OUTBOX_MAX = 200;

    private static final Object LOCK = new Object();

    static boolean isEnabled(Context context) {
        return prefs(context).getBoolean(KEY_ENABLED, false);
    }

    static void setEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }

    /** True when this SMS should be handed to Paddhu: the switch is on and it is a real bank / payment message. */
    static boolean shouldSend(Context context, String sender, String body) {
        return isEnabled(context)
            && !PaddhuShare.looksLikePhoneNumber(sender)
            && PaddhuShare.isTransactionSms(body);
    }

    /** The id used for this SMS everywhere (also by the notification button). */
    static String smsId(String body, long timestamp) {
        return "n" + timestamp + "-" + Integer.toHexString(body.hashCode());
    }

    /**
     * Hands one SMS over. Blocks for the length of one provider call, so call it from a background thread.
     * Never throws.
     */
    static void submit(Context context, String sender, String body, long timestamp) {
        try {
            String json = PaddhuShare.exportJson(smsId(body, timestamp), sender, body, timestamp);
            // messages that could not be delivered earlier go first (Paddhu uses each SMS's own date, so order does not matter)
            flushOutbox(context);
            if (!deliver(context, json)) addToOutbox(context, json);
        } catch (Throwable e) {
            setError(context, e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    /** Tries the messages that could not be delivered earlier. Blocks, so call it from a background thread. */
    static void flushOutbox(Context context) {
        List<String> waiting;
        synchronized (LOCK) {
            waiting = new ArrayList<>(outbox(context));
        }
        if (waiting.isEmpty() || !isEnabled(context)) return;
        for (String json : waiting) {
            if (!deliver(context, json)) return; // Paddhu still not reachable: keep the rest for later
            synchronized (LOCK) {
                Set<String> left = new HashSet<>(outbox(context));
                left.remove(json);
                prefs(context).edit().putStringSet(KEY_OUTBOX, left).apply();
            }
        }
    }

    /** One provider call. true only when Paddhu answered that it stored the message. */
    private static boolean deliver(Context context, String json) {
        try {
            Bundle answer = context.getContentResolver()
                .call(Uri.parse("content://" + AUTHORITY), METHOD_ENQUEUE, json, null);
            if (answer != null && answer.getBoolean("ok", false)) {
                prefs(context).edit()
                    .putLong(KEY_LAST_SENT, System.currentTimeMillis())
                    .remove(KEY_LAST_ERROR)
                    .apply();
                return true;
            }
            setError(context, answer == null
                ? "Paddhu Pusthakam did not answer"
                : String.valueOf(answer.getString("error", "refused")));
        } catch (Throwable e) {
            // IllegalArgumentException "Unknown URI" when Paddhu is not installed, SecurityException, ...
            setError(context, e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        return false;
    }

    private static void addToOutbox(Context context, String json) {
        synchronized (LOCK) {
            Set<String> next = new HashSet<>(outbox(context));
            if (next.size() >= OUTBOX_MAX) return; // oldest are not tracked, keep what is there
            next.add(json);
            prefs(context).edit().putStringSet(KEY_OUTBOX, next).apply();
        }
    }

    private static Set<String> outbox(Context context) {
        Set<String> stored = prefs(context).getStringSet(KEY_OUTBOX, null);
        return stored == null ? new HashSet<String>() : stored;
    }

    private static void setError(Context context, String message) {
        prefs(context).edit().putString(KEY_LAST_ERROR, message).apply();
    }

    static int pendingCount(Context context) {
        synchronized (LOCK) {
            return outbox(context).size();
        }
    }

    static long lastSentAt(Context context) {
        return prefs(context).getLong(KEY_LAST_SENT, 0L);
    }

    static String lastError(Context context) {
        return prefs(context).getString(KEY_LAST_ERROR, "");
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
