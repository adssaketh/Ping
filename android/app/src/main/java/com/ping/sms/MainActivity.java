package com.ping.sms;

import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.activity.OnBackPressedCallback;
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

    // Back button: only active while the web app has something to go back to (a chat, a menu, a dialog ...).
    // Otherwise Android's normal behaviour applies.
    private final OnBackPressedCallback backCallback = new OnBackPressedCallback(false) {
        @Override
        public void handleOnBackPressed() {
            if (!PingSmsPlugin.notifyBackPressed()) {
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PingSmsPlugin.class);
        super.onCreate(savedInstanceState);
        applySystemBarInsets();
        reapplyBars();
        getOnBackPressedDispatcher().addCallback(this, backCallback);
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

    /** Called from the web app: true while there is something for the back button to close. */
    void setBackEnabled(boolean enabled) {
        backCallback.setEnabled(enabled);
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
     * Android 15+ draws apps edge-to-edge, so the web page would sit underneath the status bar and the
     * navigation bar (clock/icons overlapping the search bar). Pad the content area by those bars and
     * the display cut-out.
     *
     * The on-screen keyboard is deliberately NOT handled here: the window / web view already shrinks for
     * it, and padding for it a second time squeezed the page into a thin strip.
     */
    private void applySystemBarInsets() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        final View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            boolean keyboardOpen = insets.isVisible(WindowInsetsCompat.Type.ime());
            // With the keyboard open it covers the navigation bar, so no extra space is needed below
            view.setPadding(bars.left, bars.top, bars.right, keyboardOpen ? 0 : bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(content);
    }
}
