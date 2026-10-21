package com.ping.sms;

import android.app.Service;
import android.content.Intent;
import android.net.Uri;
import android.os.IBinder;
import android.telephony.TelephonyManager;
import android.util.Log;

/**
 * Handles "respond via message" (for example declining a call with a text).
 * Android starts this service with a smsto: URI and the reply text; it sends the
 * message through the default SMS SIM and stops itself.
 */
public class HeadlessSmsSendService extends Service {
    private static final String TAG = "PingHeadlessSms";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && TelephonyManager.ACTION_RESPOND_VIA_MESSAGE.equals(intent.getAction())) {
            final Uri data = intent.getData();
            String text = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (text == null) text = intent.getStringExtra("sms_body");

            String recipient = data != null ? data.getSchemeSpecificPart() : null;
            if (recipient != null) {
                // Strip any query string such as "?body=..." and use the first of multiple recipients.
                int q = recipient.indexOf('?');
                if (q >= 0) recipient = recipient.substring(0, q);
                int comma = recipient.indexOf(',');
                if (comma >= 0) recipient = recipient.substring(0, comma);
                recipient = Uri.decode(recipient).trim();
            }

            if (recipient != null && !recipient.isEmpty() && text != null && !text.trim().isEmpty()) {
                try {
                    SmsSender.send(this, recipient, text, null, -1);
                } catch (Exception e) {
                    Log.w(TAG, "Respond-via-message send failed", e);
                }
            }
        }
        stopSelf(startId);
        return START_NOT_STICKY;
    }
}
