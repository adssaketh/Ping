package com.ping.sms;

import android.Manifest;
import android.app.Activity;
import android.app.role.RoleManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.provider.Telephony;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.view.Window;
import android.telephony.PhoneNumberUtils;
import androidx.activity.result.ActivityResult;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "PingSms",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.SEND_SMS
            }
        ),
        @Permission(
            alias = "contacts",
            strings = {
                Manifest.permission.READ_CONTACTS
            }
        ),
        @Permission(
            alias = "notifications",
            strings = {
                "android.permission.POST_NOTIFICATIONS"
            }
        )
    }
)
public class PingSmsPlugin extends Plugin {
    private static PingSmsPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void notifyIncomingSms(String sender, String body, long timestamp, int subscriptionId) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("sender", sender);
            ret.put("body", body);
            ret.put("timestamp", timestamp);
            ret.put("subscriptionId", subscriptionId);
            instance.notifyListeners("incomingSms", ret);
        }
    }

    /** Tells the web app the user came back to Ping, so it can re-check the default SMS app and permissions. */
    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        JSObject ret = new JSObject();
        ret.put("isDefault", isPingDefaultSms());
        notifyListeners("appResumed", ret);
    }

    /** Back button pressed while the web app has something to close. Returns false if it cannot be delivered. */
    public static boolean notifyBackPressed() {
        if (instance == null) return false;
        instance.notifyListeners("backPressed", new JSObject());
        return true;
    }

    /**
     * Opens Android's contacts app with the number filled in, so the user can save it as a new contact or add
     * it to an existing one. Ping does not need permission to change contacts: the contacts app does the saving.
     */
    @PluginMethod
    public void addContact(PluginCall call) {
        String number = call.getString("phoneNumber", "");
        String name = call.getString("name", "");
        if (number == null || number.trim().isEmpty()) {
            call.reject("INVALID_PARAMS", "phoneNumber is required");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_INSERT_OR_EDIT);
        intent.setType(ContactsContract.Contacts.CONTENT_ITEM_TYPE);
        intent.putExtra(ContactsContract.Intents.Insert.PHONE, number.trim());
        if (name != null && !name.trim().isEmpty()) {
            intent.putExtra(ContactsContract.Intents.Insert.NAME, name.trim());
        }
        try {
            startActivityForResult(call, intent, "addContactResult");
        } catch (Exception e) {
            call.reject("NO_CONTACTS_APP", "Could not open the contacts app");
        }
    }

    @ActivityCallback
    private void addContactResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        ret.put("done", true);
        call.resolve(ret);
    }

    /**
     * Returns small square profile pictures (as JPEG data URLs) for the given contact IDs. These are the photos
     * Google Contacts syncs to the phone; contacts without a photo are simply left out.
     */
    @PluginMethod
    public void readContactPhotos(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("PERMISSION_DENIED", "READ_CONTACTS permission is required");
            return;
        }
        JSArray ids = call.getArray("ids");
        Integer sizeParam = call.getInt("size", 128);
        final int size = sizeParam == null ? 128 : Math.max(48, Math.min(256, sizeParam));
        JSObject photos = new JSObject();
        if (ids != null) {
            ContentResolver cr = context.getContentResolver();
            for (int i = 0; i < ids.length(); i++) {
                String id = ids.optString(i, "");
                if (id.isEmpty()) continue;
                Bitmap source = null;
                Bitmap square = null;
                Bitmap scaled = null;
                try {
                    Uri contactUri = ContentUris.withAppendedId(ContactsContract.Contacts.CONTENT_URI, Long.parseLong(id));
                    byte[] data;
                    try (InputStream in = ContactsContract.Contacts.openContactPhotoInputStream(cr, contactUri, true)) {
                        if (in == null) continue;
                        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                        byte[] chunk = new byte[8192];
                        int read;
                        long total = 0;
                        while ((read = in.read(chunk)) != -1) {
                            total += read;
                            if (total > 4L * 1024 * 1024) break;
                            buffer.write(chunk, 0, read);
                        }
                        data = buffer.toByteArray();
                    }
                    BitmapFactory.Options bounds = new BitmapFactory.Options();
                    bounds.inJustDecodeBounds = true;
                    BitmapFactory.decodeByteArray(data, 0, data.length, bounds);
                    int sample = 1;
                    while (bounds.outWidth / (sample * 2) >= size && bounds.outHeight / (sample * 2) >= size) sample *= 2;
                    BitmapFactory.Options opts = new BitmapFactory.Options();
                    opts.inSampleSize = sample;
                    source = BitmapFactory.decodeByteArray(data, 0, data.length, opts);
                    if (source == null) continue;
                    int side = Math.min(source.getWidth(), source.getHeight());
                    square = Bitmap.createBitmap(source, (source.getWidth() - side) / 2, (source.getHeight() - side) / 2, side, side);
                    scaled = Bitmap.createScaledBitmap(square, size, size, true);
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    scaled.compress(Bitmap.CompressFormat.JPEG, 82, out);
                    photos.put(id, "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
                } catch (Exception ignored) {
                    // a contact whose photo cannot be read just keeps its initials
                } finally {
                    if (scaled != null && scaled != square) scaled.recycle();
                    if (square != null && square != source) square.recycle();
                    if (source != null) source.recycle();
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("photos", photos);
        call.resolve(ret);
    }

    /** An app-icon shortcut was tapped while the app was already running. */
    public static void notifyShortcut(String target) {
        if (instance == null) return;
        JSObject ret = new JSObject();
        ret.put("target", target);
        instance.notifyListeners("shortcut", ret);
    }

    /** Returns the shortcut that launched the app (once), so a cold start also ends up in the right place. */
    @PluginMethod
    public void consumeLaunchShortcut(PluginCall call) {
        JSObject ret = new JSObject();
        String target = MainActivity.pendingShortcut;
        MainActivity.pendingShortcut = null;
        if (target != null) ret.put("target", target);
        call.resolve(ret);
    }

    /** Opens the on-screen keyboard for the web view (a page cannot do this without a touch). */
    @PluginMethod
    public void showKeyboard(PluginCall call) {
        final Activity activity = getActivity();
        if (activity != null && getBridge() != null) {
            activity.runOnUiThread(() -> {
                View web = getBridge().getWebView();
                web.requestFocus();
                InputMethodManager imm = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.showSoftInput(web, InputMethodManager.SHOW_IMPLICIT);
            });
        }
        call.resolve();
    }

    /** The web app says whether the back button currently has something to close. */
    @PluginMethod
    public void setBackEnabled(PluginCall call) {
        final boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        final Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            activity.runOnUiThread(() -> ((MainActivity) activity).setBackEnabled(enabled));
        }
        call.resolve();
    }

    /** The web app has drawn its first screen: the launch splash can hand over. */
    @PluginMethod
    public void appReady(PluginCall call) {
        final Activity activity = getActivity();
        if (activity instanceof MainActivity) {
            activity.runOnUiThread(() -> ((MainActivity) activity).markWebReady());
        }
        call.resolve();
    }

    /** Sends Ping to the background (like pressing back on the home screen). */
    @PluginMethod
    public void exitApp(PluginCall call) {
        final Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> activity.moveTaskToBack(true));
        }
        call.resolve();
    }

    /** Reports sent / delivered / failed for a message sent with a client-side messageId. */
    public static void notifySmsStatus(String messageId, String status, int resultCode) {
        if (instance != null && messageId != null) {
            JSObject ret = new JSObject();
            ret.put("messageId", messageId);
            ret.put("status", status);
            ret.put("resultCode", resultCode);
            instance.notifyListeners("smsStatus", ret);
        }
    }

    /** Matches the status/navigation bar area and icon colours to the app's theme. */
    @PluginMethod
    public void setSystemBarsTheme(PluginCall call) {
        final boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        final String colorString = call.getString("color");
        final Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }
        int parsed = dark ? 0xFF111318 : 0xFFF8FAFD;
        if (colorString != null) {
            try {
                parsed = Color.parseColor(colorString);
            } catch (IllegalArgumentException ignored) {
                // keep the default
            }
        }
        final int background = parsed;
        activity.runOnUiThread(() -> {
            if (activity instanceof MainActivity) {
                ((MainActivity) activity).applyBars(background, dark);
            } else {
                Window window = activity.getWindow();
                View decor = window.getDecorView();
                decor.setBackgroundColor(background);
                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
                controller.setAppearanceLightStatusBars(!dark);
                controller.setAppearanceLightNavigationBars(!dark);
            }
            call.resolve();
        });
    }

    /**
     * Material You: returns the phone's wallpaper-derived tonal palettes (Android 12+) so the web UI
     * can re-tint itself. Each palette maps tone ("0".."1000") to "#RRGGBB".
     */
    @PluginMethod
    public void getSystemColors(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            ret.put("supported", false);
            call.resolve(ret);
            return;
        }
        Activity activity = getActivity();
        Context ctx = activity != null ? activity : getContext();
        String[] palettes = { "accent1", "accent2", "accent3", "neutral1", "neutral2" };
        int[] tones = { 0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 };
        try {
            for (String palette : palettes) {
                JSObject tonal = new JSObject();
                for (int tone : tones) {
                    int id = ctx.getResources().getIdentifier("system_" + palette + "_" + tone, "color", "android");
                    if (id != 0) {
                        tonal.put(String.valueOf(tone), String.format("#%06X", 0xFFFFFF & ctx.getColor(id)));
                    }
                }
                ret.put(palette, tonal);
            }
            ret.put("supported", true);
        } catch (Exception e) {
            ret = new JSObject();
            ret.put("supported", false);
        }
        call.resolve(ret);
    }

    // ---------------- Backup & restore (files the user chooses, via Android's file picker) ----------------

    /** Lets the user pick where to save a backup file, then writes the given text into it. */
    @PluginMethod
    public void saveBackupFile(PluginCall call) {
        String fileName = call.getString("fileName", "ping-sms-backup.json");
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        startActivityForResult(call, intent, "saveBackupResult");
    }

    @ActivityCallback
    private void saveBackupResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        JSObject ret = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            ret.put("saved", false);
            call.resolve(ret);
            return;
        }
        String content = call.getString("content", "");
        try (OutputStream out = getContext().getContentResolver().openOutputStream(data.getData(), "wt")) {
            if (out == null) throw new IOException("Could not open the chosen file");
            out.write(content.getBytes(StandardCharsets.UTF_8));
            out.flush();
            ret.put("saved", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not save the backup: " + e.getMessage());
        }
    }

    /** Lets the user pick a backup file and returns its text. */
    @PluginMethod
    public void pickBackupFile(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "application/json", "text/plain", "application/octet-stream" });
        startActivityForResult(call, intent, "pickBackupResult");
    }

    @ActivityCallback
    private void pickBackupResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        JSObject ret = new JSObject();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            ret.put("cancelled", true);
            call.resolve(ret);
            return;
        }
        try (InputStream in = getContext().getContentResolver().openInputStream(data.getData())) {
            if (in == null) throw new IOException("Could not open the chosen file");
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[16384];
            long total = 0;
            int read;
            while ((read = in.read(chunk)) != -1) {
                total += read;
                if (total > 80L * 1024 * 1024) throw new IOException("That file is too large to be a Ping backup");
                buffer.write(chunk, 0, read);
            }
            ret.put("content", new String(buffer.toByteArray(), StandardCharsets.UTF_8));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not read the backup: " + e.getMessage());
        }
    }

    /**
     * Puts backed-up messages back into Android's own SMS store. Only works while Ping is the default
     * SMS app (Android does not let other apps write messages). Messages already there are skipped.
     */
    @PluginMethod
    public void restoreSms(PluginCall call) {
        Context context = getContext();
        if (!isPingDefaultSms()) {
            call.reject("NOT_DEFAULT_SMS_APP", "Ping must be the default SMS app to restore messages into the phone");
            return;
        }
        JSArray messages = call.getArray("messages");
        if (messages == null) {
            call.reject("INVALID_PARAMS", "messages are required");
            return;
        }
        ContentResolver cr = context.getContentResolver();
        int inserted = 0;
        int skipped = 0;
        try {
            for (int i = 0; i < messages.length(); i++) {
                org.json.JSONObject m = messages.optJSONObject(i);
                if (m == null) continue;
                String address = m.optString("address", "");
                String body = m.optString("body", "");
                long date = m.optLong("date", 0L);
                boolean sent = m.optBoolean("isSent", false);
                if (address.isEmpty() || body.isEmpty() || date <= 0L) continue;

                boolean exists = false;
                try (Cursor c = cr.query(
                    Telephony.Sms.CONTENT_URI,
                    new String[] { Telephony.Sms._ID },
                    Telephony.Sms.ADDRESS + "=? AND " + Telephony.Sms.DATE + "=? AND " + Telephony.Sms.BODY + "=?",
                    new String[] { address, String.valueOf(date), body },
                    null)) {
                    exists = c != null && c.moveToFirst();
                }
                if (exists) {
                    skipped++;
                    continue;
                }

                ContentValues values = new ContentValues();
                values.put(Telephony.Sms.ADDRESS, address);
                values.put(Telephony.Sms.BODY, body);
                values.put(Telephony.Sms.DATE, date);
                values.put(Telephony.Sms.DATE_SENT, date);
                values.put(Telephony.Sms.READ, 1);
                values.put(Telephony.Sms.SEEN, 1);
                values.put(Telephony.Sms.TYPE, sent ? Telephony.Sms.MESSAGE_TYPE_SENT : Telephony.Sms.MESSAGE_TYPE_INBOX);
                if (cr.insert(Telephony.Sms.CONTENT_URI, values) != null) inserted++;
            }
            JSObject ret = new JSObject();
            ret.put("inserted", inserted);
            ret.put("skipped", skipped);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("RESTORE_FAILED", e.getMessage());
        }
    }

    /** Stores the spam settings where SmsReceiver can read them, even when the app is closed. */
    @PluginMethod
    public void setSpamConfig(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", true));
        Double threshold = call.getDouble("threshold", 0.85);
        SharedPreferences.Editor editor =
            getContext().getSharedPreferences(SpamFilter.PREFS, Context.MODE_PRIVATE).edit();
        editor.putBoolean("enabled", enabled);
        editor.putFloat("threshold", threshold == null ? 0.85f : threshold.floatValue());
        editor.putStringSet("allow", toStringSet(call.getArray("allow")));
        editor.putStringSet("block", toStringSet(call.getArray("block")));
        JSObject learned = call.getObject("learned");
        editor.putString("learned", learned == null ? "{}" : learned.toString());
        editor.apply();
        call.resolve();
    }

    private static Set<String> toStringSet(JSArray array) {
        Set<String> out = new HashSet<>();
        if (array != null) {
            for (int i = 0; i < array.length(); i++) {
                String value = array.optString(i, "");
                if (!value.isEmpty()) out.add(value);
            }
        }
        return out;
    }

    /**
     * True when Ping is the default SMS app. On Android 10+ the official check is the SMS role; the older
     * default-package lookup is kept as a second opinion (some phones answer it differently).
     */
    private boolean isPingDefaultSms() {
        Context context = getContext();
        if (context.getPackageName().equals(Telephony.Sms.getDefaultSmsPackage(context))) return true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager roleManager = context.getSystemService(RoleManager.class);
            return roleManager != null
                && roleManager.isRoleAvailable(RoleManager.ROLE_SMS)
                && roleManager.isRoleHeld(RoleManager.ROLE_SMS);
        }
        return false;
    }

    @PluginMethod
    public void isDefaultSmsApp(PluginCall call) {
        Context context = getContext();
        String currentDefault = Telephony.Sms.getDefaultSmsPackage(context);
        boolean isDefault = isPingDefaultSms();

        JSObject ret = new JSObject();
        ret.put("isDefault", isDefault);
        ret.put("packageName", context.getPackageName());
        ret.put("currentDefault", currentDefault);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestDefaultSmsApp(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            RoleManager roleManager = context.getSystemService(RoleManager.class);
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
                if (roleManager.isRoleHeld(RoleManager.ROLE_SMS)) {
                    JSObject ret = new JSObject();
                    ret.put("granted", true);
                    ret.put("isDefault", true);
                    call.resolve(ret);
                    return;
                }
                Intent intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS);
                startActivityForResult(call, intent, "defaultSmsResult");
                return;
            }
        }

        // Fallback for pre-Android 10
        Intent intent = new Intent(Telephony.Sms.Intents.ACTION_CHANGE_DEFAULT);
        intent.putExtra(Telephony.Sms.Intents.EXTRA_PACKAGE_NAME, context.getPackageName());
        startActivityForResult(call, intent, "defaultSmsResult");
    }

    @ActivityCallback
    private void defaultSmsResult(PluginCall call, ActivityResult result) {
        boolean isDefault = isPingDefaultSms();

        JSObject ret = new JSObject();
        ret.put("granted", isDefault);
        ret.put("isDefault", isDefault);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermissionsStatus(PluginCall call) {
        Context context = getContext();
        boolean hasReadSms = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasSendSms = ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasReceiveSms = ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasContacts = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;

        JSObject ret = new JSObject();
        ret.put("readSms", hasReadSms);
        ret.put("sendSms", hasSendSms);
        ret.put("receiveSms", hasReceiveSms);
        ret.put("contacts", hasContacts);
        ret.put("notifications", NotificationManagerCompat.from(context).areNotificationsEnabled());
        ret.put("allSmsGranted", hasReadSms && hasSendSms && hasReceiveSms);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestAllPermissions(PluginCall call) {
        requestPermissionForAliases(new String[]{"sms", "contacts"}, call, "allPermissionsCallback");
    }

    @PermissionCallback
    private void allPermissionsCallback(PluginCall call) {
        checkPermissionsStatus(call);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        Context context = getContext();
        boolean enabled = NotificationManagerCompat.from(context).areNotificationsEnabled();
        if (enabled || Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject ret = new JSObject();
            ret.put("granted", enabled);
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        call.resolve(ret);
    }

    /**
     * Marks unread inbox messages from an address as read in the system provider so other
     * apps and unread counts stay in sync. Only works while Ping is the default SMS app.
     */
    @PluginMethod
    public void markThreadRead(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.trim().isEmpty()) {
            call.reject("INVALID_PARAMS", "'address' is required");
            return;
        }

        Context context = getContext();
        ContentResolver cr = context.getContentResolver();
        Cursor cursor = null;
        int updated = 0;
        try {
            cursor = cr.query(
                Telephony.Sms.Inbox.CONTENT_URI,
                new String[] { "_id", "address" },
                "read = 0",
                null,
                null
            );
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String rowAddress = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                    if (rowAddress != null && PhoneNumberUtils.compare(rowAddress, address)) {
                        long id = cursor.getLong(cursor.getColumnIndexOrThrow("_id"));
                        ContentValues values = new ContentValues();
                        values.put(Telephony.Sms.READ, 1);
                        values.put(Telephony.Sms.SEEN, 1);
                        updated += cr.update(Uri.parse("content://sms/" + id), values, null, null);
                    }
                }
            }
            JSObject res = new JSObject();
            res.put("updated", updated);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("MARK_READ_FAILED", e.getMessage());
        } finally {
            if (cursor != null) cursor.close();
        }
    }

    @PluginMethod
    public void readContacts(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("PERMISSION_DENIED", "READ_CONTACTS permission is required");
            return;
        }

        ContentResolver cr = context.getContentResolver();
        Cursor cursor = null;
        JSArray contactsArray = new JSArray();

        try {
            Uri uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI;
            String[] projection = new String[] {
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.PHOTO_URI,
                ContactsContract.CommonDataKinds.Phone.PHOTO_FILE_ID,
                ContactsContract.CommonDataKinds.Phone.TYPE
            };

            cursor = cr.query(uri, projection, null, null, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC");

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String contactId = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.CONTACT_ID));
                    String name = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                    String number = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER));
                    String photoUri = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.PHOTO_URI));
                    int fileIdIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_FILE_ID);
                    String photoFileId = fileIdIndex >= 0 && !cursor.isNull(fileIdIndex) ? cursor.getString(fileIdIndex) : "";

                    if (number != null && !number.trim().isEmpty()) {
                        JSObject contactObj = new JSObject();
                        contactObj.put("id", contactId);
                        contactObj.put("name", name != null ? name : number);
                        contactObj.put("phoneNumber", number.replaceAll("\\s+", ""));
                        contactObj.put("photoUri", photoUri != null ? photoUri : "");
                        contactObj.put("photoFileId", photoFileId);
                        contactsArray.put(contactObj);
                    }
                }
            }

            JSObject res = new JSObject();
            res.put("contacts", contactsArray);
            res.put("count", contactsArray.length());
            call.resolve(res);
        } catch (Exception e) {
            call.reject("FAILED_TO_READ_CONTACTS", e.getMessage());
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    @PluginMethod
    public void readSms(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("PERMISSION_DENIED", "READ_SMS permission is required");
            return;
        }

        int limit = call.getInt("limit", 500);
        ContentResolver cr = context.getContentResolver();
        Cursor cursor = null;
        JSArray messagesArray = new JSArray();

        try {
            Uri uri = Uri.parse("content://sms/");
            String[] projection = new String[] {
                "_id",
                "thread_id",
                "address",
                "body",
                "date",
                "read",
                "type"
            };

            cursor = cr.query(uri, projection, null, null, "date DESC LIMIT " + limit);

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String id = cursor.getString(cursor.getColumnIndexOrThrow("_id"));
                    String threadId = cursor.getString(cursor.getColumnIndexOrThrow("thread_id"));
                    String address = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));
                    long date = cursor.getLong(cursor.getColumnIndexOrThrow("date"));
                    int read = cursor.getInt(cursor.getColumnIndexOrThrow("read"));
                    int type = cursor.getInt(cursor.getColumnIndexOrThrow("type")); // 1 = inbox, 2 = sent

                    JSObject msgObj = new JSObject();
                    msgObj.put("id", id);
                    msgObj.put("threadId", threadId);
                    msgObj.put("address", address != null ? address : "Unknown");
                    msgObj.put("body", body != null ? body : "");
                    msgObj.put("date", date);
                    msgObj.put("isRead", read == 1);
                    msgObj.put("isSent", type == 2);
                    messagesArray.put(msgObj);
                }
            }

            JSObject res = new JSObject();
            res.put("messages", messagesArray);
            res.put("count", messagesArray.length());
            call.resolve(res);
        } catch (Exception e) {
            call.reject("FAILED_TO_READ_SMS", e.getMessage());
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    @PluginMethod
    public void sendSms(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("PERMISSION_DENIED", "SEND_SMS permission is required");
            return;
        }

        String to = call.getString("to");
        String message = call.getString("message");
        String messageId = call.getString("messageId");
        int subscriptionId = call.getInt("subscriptionId", -1);

        if (to == null || to.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            call.reject("INVALID_PARAMS", "Recipient 'to' and 'message' are required");
            return;
        }

        try {
            SmsSender.Result result = SmsSender.send(context, to, message, messageId, subscriptionId);

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("to", to);
            res.put("message", message);
            res.put("timestamp", result.timestamp);
            res.put("subscriptionId", result.subscriptionId);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("SEND_FAILED", e.getMessage());
        }
    }

    @PluginMethod
    public void deleteSms(PluginCall call) {
        Context context = getContext();
        String id = call.getString("id");
        if (id == null) {
            call.reject("INVALID_PARAMS", "Message 'id' is required");
            return;
        }

        try {
            int rows = context.getContentResolver().delete(
                Uri.parse("content://sms/" + id),
                null,
                null
            );
            JSObject res = new JSObject();
            res.put("deleted", rows > 0);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("DELETE_FAILED", e.getMessage());
        }
    }
}
