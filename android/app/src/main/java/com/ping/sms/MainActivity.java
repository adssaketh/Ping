package com.ping.sms;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewTreeObserver;
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

    /** Which app-icon shortcut started (or re-opened) the app; the web app collects it once it has loaded. */
    static String pendingShortcut = null;

    private void handleShortcutIntent(Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        String target = null;
        switch (intent.getAction()) {
            case "com.ping.sms.action.NEW_MESSAGE":
                target = "new_message";
                break;
            case "com.ping.sms.action.SEARCH":
                target = "search";
                break;
            case "com.ping.sms.action.PERSONAL":
                target = "personal";
                break;
            case "com.ping.sms.action.TRANSACTIONS":
                target = "transactions";
                break;
            default:
                break;
        }
        if (target == null) return;
        pendingShortcut = target;
        // Handled: make sure a rotation or restart does not run it a second time
        intent.setAction(Intent.ACTION_MAIN);
        PingSmsPlugin.notifyShortcut(target);
    }

    // Launch: the first frame is held back (the splash stays on screen) until the web app says it has drawn
    // its first screen, so there is no blank or blue flash between the splash and the inbox.
    private boolean webReady = false;

    void markWebReady() {
        webReady = true;
    }

    private void holdFirstFrameUntilReady() {
        final View content = findViewById(android.R.id.content);
        if (content == null) return;
        final long start = SystemClock.uptimeMillis();
        content.getViewTreeObserver().addOnPreDrawListener(new ViewTreeObserver.OnPreDrawListener() {
            @Override
            public boolean onPreDraw() {
                // safety net: never keep the splash for more than 2.5 seconds
                if (webReady || SystemClock.uptimeMillis() - start > 2500) {
                    content.getViewTreeObserver().removeOnPreDrawListener(this);
                    return true;
                }
                return false;
            }
        });
    }

    /** Paint the window and web view in the app's own background colour from the very first frame. */
    private void applyEarlyBackground() {
        SharedPreferences prefs = getSharedPreferences("ping_ui", MODE_PRIVATE);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
            == Configuration.UI_MODE_NIGHT_YES;
        int color = prefs.getInt("bar_bg", night ? 0xFF111318 : 0xFFF8FAFD);
        getWindow().getDecorView().setBackgroundColor(color);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(color);
        }
    }

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
        applyEarlyBackground();
        holdFirstFrameUntilReady();
        reapplyBars();
        getOnBackPressedDispatcher().addCallback(this, backCallback);
        handleShortcutIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShortcutIntent(intent);
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
        getSharedPreferences("ping_ui", MODE_PRIVATE).edit().putInt("bar_bg", background).apply();
        reapplyBars();
    }

    private void reapplyBars() {
        if (barBackground == 0) return;
        Window window = getWindow();
        View decor = window.getDecorView();
        decor.setBackgroundColor(barBackground);
        // the web view shows this colour wherever the page has not painted yet (keyboard resize, first frame)
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(barBackground);
        }
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
