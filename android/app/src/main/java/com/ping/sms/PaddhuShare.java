package com.ping.sms;

import android.content.ComponentName;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.regex.Pattern;

/**
 * Hands one SMS to Paddhu Pusthakam (the budget app). It is sent as a small JSON text in the same format as the
 * date-range file, straight to Paddhu's ShareReceiverActivity, which opens the Add Transaction screen for it.
 * Used by the "Add to Paddhu" button on bank notifications and by the long-press option on a message.
 *
 * The patterns below are the same as isTransactionSms in src/utils/smsUtils.ts: change them together.
 */
public final class PaddhuShare {
    private PaddhuShare() {}

    /** applicationId of Paddhu Pusthakam, and its receiving activity (see AndroidManifest.xml there). */
    static final String PADDHU_PACKAGE = "com.mansaketh.paddhupusthakam";
    static final String PADDHU_RECEIVER = "com.mansaketh.paddhupusthakam.ShareReceiverActivity";

    private static final int CI = Pattern.CASE_INSENSITIVE;

    private static final Pattern NOT_TXN = Pattern.compile(
        "requested money|will be debited|is due|due on|not completed|if debited|passbook|has been initiated|e-mandate|mandate|\\botp\\b|one.?time password|verification code|balance enquiry|statement|total amt due|min amt due",
        CI);
    private static final Pattern AMOUNT = Pattern.compile(
        "(?:rs\\.?|inr|\\u20b9)\\s*\\d|(?:debited|credited)\\s+(?:by|for|with)\\s+\\d", CI);
    private static final Pattern MOVED = Pattern.compile(
        "\\bdebit(?:ed)?\\b(?! card)|credited|spent|\\bpaid\\b|withdrawn|\\bsent\\b|purchase|payment of|\\btxn of\\b|transaction number \\d+ for|received|refund|deposited",
        CI);
    private static final Pattern CARD_BILL = Pattern.compile(
        "payment of .{0,24}(?:has been|is) received (?:on|towards) your .{0,60}credit card|credit ?card payment|payment .{0,30}towards your .{0,40}credit card|thank you for payment .{0,40}credit card",
        CI);
    private static final Pattern PHONE = Pattern.compile("^\\+?[\\d\\s\\-()]{7,}$");

    /** A real, completed money movement (not an OTP, reminder, request or promotion). */
    public static boolean isTransactionSms(String body) {
        if (body == null || body.isEmpty()) return false;
        if (CARD_BILL.matcher(body).find()) return true;
        if (NOT_TXN.matcher(body).find()) return false;
        return AMOUNT.matcher(body).find() && MOVED.matcher(body).find();
    }

    private static final Pattern FD_WORD = Pattern.compile(
        "fixed\\s*deposit|term\\s*deposit|\\bF\\.?D\\.?R?\\b|\\bT\\.?D\\.?R?\\b", CI);
    private static final Pattern FD_BOOKED = Pattern.compile(
        "\\b(book(?:ed|ing)?|open(?:ed)?|creat(?:ed|ion)|renew(?:ed|al)?|placed|constitut(?:ed)?|established|set up)\\b", CI);
    private static final Pattern FD_NOT = Pattern.compile(
        "\\b(matured|closed|closure|premature|broken|liquidat|interest (?:has been )?credited|proceeds)\\b|\\botp\\b|will mature|is maturing|due for", CI);

    /** A fixed deposit being booked or renewed (Paddhu Pusthakam adds it to its Fixed deposits page). */
    public static boolean isFixedDepositSms(String body) {
        if (body == null || body.isEmpty()) return false;
        return FD_WORD.matcher(body).find() && FD_BOOKED.matcher(body).find() && !FD_NOT.matcher(body).find();
    }

    /** Messages from people (phone numbers) are never sent. */
    public static boolean looksLikePhoneNumber(String sender) {
        return sender == null || PHONE.matcher(sender.trim()).matches();
    }

    /** One SMS in the same JSON format as the date-range export. */
    public static String exportJson(String id, String address, String body, long dateMs) throws Exception {
        JSONObject sms = new JSONObject();
        sms.put("id", id);
        sms.put("address", address);
        sms.put("body", body);
        sms.put("date", dateMs);
        JSONArray list = new JSONArray();
        list.put(sms);
        JSONObject root = new JSONObject();
        root.put("app", "Ping");
        root.put("type", "paddhu-sms-export");
        root.put("version", 1);
        root.put("from", dateMs);
        root.put("to", dateMs);
        root.put("sms", list);
        return root.toString();
    }

    /** The intent that opens Paddhu Pusthakam with that JSON. Throws ActivityNotFoundException when it is not installed. */
    public static Intent intentFor(String json) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setComponent(new ComponentName(PADDHU_PACKAGE, PADDHU_RECEIVER));
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, json);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return intent;
    }
}
