package com.ping.sms;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;
import androidx.core.content.ContextCompat;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * On-device spam check used for notifications (so spam stays quiet even while Ping is closed).
 * Mirrors src/spam/tokenize.js, src/spam/score.js and the decision in src/spam/classifier.ts, and
 * reads the same model file the app ships: assets/public/spam-model.json.
 */
final class SpamFilter {
    static final String PREFS = "ping_spam";

    private static final Pattern URL = Pattern.compile(
        "(?:https?://|www\\.)\\S+|\\b[a-z0-9-]{2,}\\.(?:com|in|co|ly|link|xyz|top|info|me|net|org|app|cc|tk|page|site|online)\\b(?:/\\S*)?");
    private static final Pattern MONEY = Pattern.compile("(?:rs\\.?|inr|\u20B9)\\s*\\d[\\d,]*(?:\\.\\d+)?");
    private static final Pattern PHONE = Pattern.compile("\\b(?:\\+?91[\\s-]?)?[6-9]\\d{9}\\b");
    private static final Pattern DIGITS = Pattern.compile("\\d+");
    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{M}_]{2,}");
    private static final Pattern REGISTERED_SENDER =
        Pattern.compile("^[a-z]{2}-[a-z0-9]{3,10}(?:-[a-z])?$", Pattern.CASE_INSENSITIVE);

    private static final class Rule {
        final Pattern re;
        final double weight;
        final boolean strong;

        Rule(Pattern re, double weight, boolean strong) {
            this.re = re;
            this.weight = weight;
            this.strong = strong;
        }
    }

    private static final class Model {
        double bias;
        final Map<String, Double> weights = new HashMap<>();
        final List<Rule> rules = new ArrayList<>();
        final List<Pattern> safe = new ArrayList<>();
    }

    private static Model model;
    private static boolean loadFailed;

    private SpamFilter() {}

    /** True when the message looks like spam and the user has spam protection switched on. */
    static boolean isSpam(Context context, String sender, String body) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            if (!prefs.getBoolean("enabled", true)) return false;

            String key = senderKey(sender);
            Set<String> block = prefs.getStringSet("block", Collections.<String>emptySet());
            if (block != null && block.contains(key)) return true;
            Set<String> allow = prefs.getStringSet("allow", Collections.<String>emptySet());
            if (allow != null && allow.contains(key)) return false;
            if (isKnownContact(context, sender)) return false;

            Model m = load(context);
            if (m == null || body == null) return false;

            double[] result = new double[3]; // probability, safe (0/1), strong (0/1)
            score(m, body, loadLearned(prefs.getString("learned", "{}")), result);
            boolean safe = result[1] > 0.5;
            boolean strong = result[2] > 0.5;
            if (safe) return false;
            String trimmedSender = sender == null ? "" : sender.trim();
            if (REGISTERED_SENDER.matcher(trimmedSender).matches() && !strong) return false;
            double threshold = prefs.getFloat("threshold", 0.85f);
            return result[0] >= threshold;
        } catch (Throwable t) {
            return false;
        }
    }

    /** Digits of a phone number, otherwise the lower-cased sender ID (same as senderKey() in classifier.ts). */
    static String senderKey(String sender) {
        String raw = sender == null ? "" : sender.trim();
        String digits = raw.replaceAll("\\D", "");
        return digits.length() >= 7 ? digits : raw.toLowerCase(Locale.ROOT);
    }

    private static boolean isKnownContact(Context context, String sender) {
        if (sender == null) return false;
        if (sender.replaceAll("\\D", "").length() < 7) return false;
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS)
            != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        Uri uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(sender));
        try (Cursor cursor = context.getContentResolver()
            .query(uri, new String[] { ContactsContract.PhoneLookup._ID }, null, null, null)) {
            return cursor != null && cursor.moveToFirst();
        } catch (Exception e) {
            return false;
        }
    }

    private static void score(Model m, String text, Map<String, Double> learned, double[] out) {
        String t = text.toLowerCase(Locale.ROOT);
        t = URL.matcher(t).replaceAll(" __url__ ");
        t = MONEY.matcher(t).replaceAll(" __money__ ");
        t = PHONE.matcher(t).replaceAll(" __phone__ ");
        t = DIGITS.matcher(t).replaceAll(" __num__ ");

        double logOdds = m.bias;
        Set<String> seen = new HashSet<>();
        Matcher words = WORD.matcher(t);
        while (words.find()) {
            String token = words.group();
            if (seen.add(token)) {
                Double w = m.weights.get(token);
                if (w != null) logOdds += w;
                Double lw = learned.get(token);
                if (lw != null) logOdds += lw;
            }
        }

        boolean strong = false;
        for (Rule rule : m.rules) {
            if (rule.re.matcher(text).find()) {
                logOdds += rule.weight;
                if (rule.strong) strong = true;
            }
        }
        boolean safe = false;
        if (!strong) {
            for (Pattern p : m.safe) {
                if (p.matcher(text).find()) {
                    safe = true;
                    break;
                }
            }
        }
        double clamped = Math.max(-30.0, Math.min(30.0, logOdds));
        out[0] = 1.0 / (1.0 + Math.exp(-clamped));
        out[1] = safe ? 1.0 : 0.0;
        out[2] = strong ? 1.0 : 0.0;
    }

    // Word scores learned from the user's Not spam / Report spam taps (kept on the phone)
    private static String learnedJson = "{}";
    private static Map<String, Double> learnedWeights = new HashMap<>();

    private static synchronized Map<String, Double> loadLearned(String json) {
        if (json == null) json = "{}";
        if (!json.equals(learnedJson)) {
            Map<String, Double> parsed = new HashMap<>();
            try {
                JSONObject obj = new JSONObject(json);
                Iterator<String> keys = obj.keys();
                while (keys.hasNext()) {
                    String k = keys.next();
                    parsed.put(k, obj.optDouble(k, 0.0));
                }
            } catch (Throwable t) {
                parsed.clear();
            }
            learnedWeights = parsed;
            learnedJson = json;
        }
        return learnedWeights;
    }

    private static synchronized Model load(Context context) {
        if (model != null || loadFailed) return model;
        try (InputStream in = context.getAssets().open("public/spam-model.json")) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int read;
            while ((read = in.read(chunk)) != -1) buffer.write(chunk, 0, read);
            JSONObject root = new JSONObject(new String(buffer.toByteArray(), StandardCharsets.UTF_8));

            Model m = new Model();
            m.bias = root.optDouble("bias", 0.0);
            JSONObject weights = root.optJSONObject("weights");
            if (weights != null) {
                Iterator<String> keys = weights.keys();
                while (keys.hasNext()) {
                    String k = keys.next();
                    m.weights.put(k, weights.optDouble(k, 0.0));
                }
            }
            int flags = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
            JSONArray rules = root.optJSONArray("rules");
            if (rules != null) {
                for (int i = 0; i < rules.length(); i++) {
                    JSONObject r = rules.getJSONObject(i);
                    m.rules.add(new Rule(
                        Pattern.compile(r.getString("re"), flags),
                        r.optDouble("w", 0.0),
                        r.optBoolean("strong", false)));
                }
            }
            JSONArray safe = root.optJSONArray("safe");
            if (safe != null) {
                for (int i = 0; i < safe.length(); i++) {
                    m.safe.add(Pattern.compile(safe.getString(i), flags));
                }
            }
            model = m;
        } catch (Throwable t) {
            loadFailed = true;
        }
        return model;
    }
}
