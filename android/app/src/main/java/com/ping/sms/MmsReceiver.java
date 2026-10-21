package com.ping.sms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Required broadcast receiver to register as the Android Default SMS app for WAP PUSH / MMS.
 */
public class MmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // MMS broadcast receiver stub required by Android OS for default SMS handler eligibility
    }
}
