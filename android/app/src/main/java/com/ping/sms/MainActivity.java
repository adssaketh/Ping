package com.ping.sms;

import android.content.res.Configuration;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.List;

public class MainActivity extends BridgeActivity {
    // Last colours the web app asked for. Kept here so they can be put back after the screen rotates.
    private static int barBackground = 0;
    private static boolean barDark = false;

    // While the keyboard slides up or down its size is ignored; the final size is applied once at the end.
    // (Resizing the whole web page on every animation frame is what made typing feel laggy.)
    private boolean imeAnimating = false;
    private int lastImeBottom = 0;
    private int lastReportedIme = 0;
    // Height of the window while the keyboard is closed, to tell whether the system already shrank it
    private int baselineRootHeight = 0;

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
     * Android 15+ draws apps edge-to-edge, so the web page would sit underneath the status bar
     * (clock/icons overlapping the search bar) and the on-screen keyboard would cover the message box.
     * Pad the content area by the system bars, display cut-out and keyboard instead.
     */
    private void applySystemBarInsets() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        final View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            int ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
            int rootHeight = view.getRootView().getHeight();
            if (ime == 0 && !imeAnimating) baselineRootHeight = rootHeight;

            if (!imeAnimating) {
                // Some phones shrink the whole window for the keyboard AND report its height as an inset.
                // Shrinking the page again by that height would squeeze it into a thin strip.
                boolean systemAlreadyResized =
                    ime > 0 && baselineRootHeight > 0 && (baselineRootHeight - rootHeight) >= ime * 0.5;
                lastImeBottom = systemAlreadyResized ? 0 : ime;

                // The window may resize a moment after the inset arrives: look again once things settle
                if (ime != lastReportedIme) {
                    lastReportedIme = ime;
                    view.postDelayed(() -> ViewCompat.requestApplyInsets(view), 160);
                }
            }
            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, lastImeBottom));
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.setWindowInsetsAnimationCallback(
            content,
            new WindowInsetsAnimationCompat.Callback(WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
                @NonNull
                @Override
                public WindowInsetsCompat onProgress(
                    @NonNull WindowInsetsCompat insets,
                    @NonNull List<WindowInsetsAnimationCompat> runningAnimations
                ) {
                    return insets;
                }

                @Override
                public void onPrepare(@NonNull WindowInsetsAnimationCompat animation) {
                    if ((animation.getTypeMask() & WindowInsetsCompat.Type.ime()) != 0) imeAnimating = true;
                }

                @Override
                public void onEnd(@NonNull WindowInsetsAnimationCompat animation) {
                    if ((animation.getTypeMask() & WindowInsetsCompat.Type.ime()) != 0) {
                        imeAnimating = false;
                        ViewCompat.requestApplyInsets(content);
                    }
                }
            }
        );
        ViewCompat.requestApplyInsets(content);
    }
}
