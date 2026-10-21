package com.ping.sms;

import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Last colours the web app asked for. Kept here so they can be put back after the screen rotates.
    private static int barBackground = 0;
    private static boolean barDark = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PingSmsPlugin.class);
        super.onCreate(savedInstanceState);
        applySystemBarInsets();
        reapplyBars();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Rotation (or a window resize on tablets) resets the area behind the status bar: paint it again
        View content = findViewById(android.R.id.content);
        if (content != null) ViewCompat.requestApplyInsets(content);
        reapplyBars();
        if (content != null) content.post(this::reapplyBars);
    }

    @Override
    public void onResume() {
        super.onResume();
        reapplyBars();
    }

    /** Remembers and applies the colour behind the status / navigation bars and the icon style. */
    void applyBars(int background, boolean dark) {
        barBackground = background;
        barDark = dark;
        reapplyBars();
    }

    private void reapplyBars() {
        if (barBackground == 0) return;
        Window window = getWindow();
        View decor = window.getDecorView();
        decor.setBackgroundColor(barBackground);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
        controller.setAppearanceLightStatusBars(!barDark);
        controller.setAppearanceLightNavigationBars(!barDark);
    }

    /**
     * Android 15+ draws apps edge-to-edge, so the web page would sit underneath the status bar
     * (clock/icons overlapping the search bar) and the on-screen keyboard would cover the message box.
     * Pad the content area by the system bars, display cut-out and keyboard instead.
     */
    private void applySystemBarInsets() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime()
            );
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(content);
    }
}
