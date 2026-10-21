package com.ping.sms;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PingSmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
