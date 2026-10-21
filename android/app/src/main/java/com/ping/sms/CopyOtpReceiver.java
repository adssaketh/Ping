package com.ping.sms;

import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipDescription;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PersistableBundle;
import android.widget.Toast;
import androidx.core.app.NotificationManagerCompat;

/** Handles the "Copy OTP" button on an incoming-SMS notification. */
public class CopyOtpReceiver extends BroadcastReceiver {
    public static final String ACTION_COPY_OTP = "com.ping.sms.COPY_OTP";
    public static final String EXTRA_OTP = "otp";
    public static final String EXTRA_NOTIFICATION_ID = "notificationId";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_COPY_OTP.equals(intent.getAction())) return;
        String otp = intent.getStringExtra(EXTRA_OTP);
        if (otp == null || otp.isEmpty()) return;

        ClipboardManager clipboard = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard == null) return;

        ClipData clip = ClipData.newPlainText("OTP", otp);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Hide the code in Android's clipboard preview
            PersistableBundle extras = new PersistableBundle();
            extras.putBoolean(ClipDescription.EXTRA_IS_SENSITIVE, true);
            clip.getDescription().setExtras(extras);
        }
        clipboard.setPrimaryClip(clip);

        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1);
        if (notificationId != -1) {
            NotificationManagerCompat.from(context).cancel(notificationId);
        }
        Toast.makeText(context, "OTP " + otp + " copied", Toast.LENGTH_SHORT).show();
    }
}
