package com.ping.sms;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Finds the one-time code in an SMS. Mirrors extractOtpCode() in src/utils/smsUtils.ts:
 * returns null unless the text looks like an OTP message, and skips look-alike numbers such as
 * masked account numbers, OTP-IDs and amounts.
 */
final class OtpExtractor {
    private static final Pattern KEYWORD = Pattern.compile(
        "otp|one[- ]?time|pass\\s?code|password|verification|verify|security code|auth|log\\s?in|\\bcode\\b|\\bpin\\b|\\bg-\\d",
        Pattern.CASE_INSENSITIVE);
    private static final Pattern NUMBER = Pattern.compile("\\b\\d{4,8}\\b");
    private static final Pattern NOT_A_CODE_BEFORE = Pattern.compile(
        "\\b(?:otp[-\\s]?id|id|uan|ref(?:erence)?|txn|transaction|a/c|acct|account|card|ending|no)[\\s:#.\\-]*$"
            + "|x{2,}[\\s:#.\\-]*$|\\*{2,}[\\s:#.\\-]*$",
        Pattern.CASE_INSENSITIVE);
    private static final Pattern CURRENCY_BEFORE = Pattern.compile(
        "(?:\\brs\\.?|\\binr|\\busd|\u20B9|\\$|\\bamount|\\bamt|\\bbalance|\\bbal)\\s*[:.]?\\s*$",
        Pattern.CASE_INSENSITIVE);

    private OtpExtractor() {}

    static String extract(String text) {
        if (text == null || !KEYWORD.matcher(text).find()) return null;

        String best = null;
        int bestScore = -1;
        Matcher m = NUMBER.matcher(text);
        while (m.find()) {
            int start = m.start();
            int end = m.end();
            String before = text.substring(Math.max(0, start - 22), start);
            if (NOT_A_CODE_BEFORE.matcher(before).find() || CURRENCY_BEFORE.matcher(before).find()) continue;
            // part of a decimal such as 351.69
            if (end + 1 < text.length() && text.charAt(end) == '.' && Character.isDigit(text.charAt(end + 1))) continue;
            if (start > 1 && text.charAt(start - 1) == '.' && Character.isDigit(text.charAt(start - 2))) continue;

            int score = 1;
            String around = text.substring(Math.max(0, start - 45), Math.min(text.length(), end + 30));
            if (KEYWORD.matcher(around).find()) score += 5;
            int len = end - start;
            if (len == 6) score += 2;
            else if (len == 4 || len == 8) score += 1;

            if (score > bestScore) {
                best = m.group();
                bestScore = score;
            }
        }
        return best;
    }
}
