// Scam patterns and "never filter" patterns shipped inside the model file.
// Keep them to portable syntax (alternation, \b, \d, \s, (?:...), quantifiers): the same text is
// compiled by JavaScript in the app and by java.util.regex in SpamFilter.java.
export const RULES = [
  { re: 'kyc\\b.{0,40}(?:expire|suspend|block|pending|update|verify)|(?:expire|suspend|block|pending|update|verify).{0,40}\\bkyc\\b', w: 2.5, strong: true },
  { re: '(?:account|a/c|card|sim|number|upi|wallet).{0,30}(?:will be|has been|is being)\\s+(?:blocked|suspended|deactivated|disconnected|closed)', w: 2.5, strong: true },
  { re: "(?:you(?:'|\u2019)?ve|you have|you are|congratulations?).{0,40}(?:won|winner|selected|lucky)|lottery|jackpot|lucky draw", w: 2.5, strong: true },
  { re: '(?:electricity|power)\\s+(?:bill|connection).{0,40}(?:disconnect|cut|tonight|today)', w: 2.5, strong: true },
  { re: '(?:digital arrest|cbi|narcotics|customs officer|police).{0,40}(?:arrest|case|warrant)', w: 2.0, strong: true },
  { re: '(?:click|tap|visit|open)\\b.{0,25}(?:link|here|below)|http\\S*\\.(?:xyz|top|tk|cc|ml|ga|cf)\\b', w: 1.2 },
  { re: '(?:pre-?approved|instant)\\s+(?:personal\\s+)?loan|loan\\s+(?:approved|offer)|no\\s+(?:cibil|documents?)', w: 1.8 },
  { re: '(?:work from home|part[- ]time job|earn\\s+(?:rs\\.?|inr)?\\s*\\d+).{0,40}(?:daily|per day|weekly|hour)|telegram|whatsapp\\s*(?:us|me|group)', w: 1.6 },
  { re: '(?:customs|parcel|courier|delivery).{0,40}(?:fee|charges?|pay|held|stuck)', w: 1.0 },
  { re: '(?:cashback|reward|gift)\\b.{0,30}(?:claim|redeem|expires?)|claim\\s+(?:now|your)', w: 1.5 },
  { re: '(?:betting|casino|rummy|teen patti|fantasy)\\b.{0,30}(?:bonus|win|deposit)|\\bjoin now\\b', w: 1.8 },
  { re: '\\b(?:unsubscribe|reply stop|stop to opt[- ]out|t&c apply|tc apply|terms apply)\\b', w: 0.8 },
];

export const SAFE = [
  '\\b(?:otp|one[- ]?time password|verification code|passcode|security code|login code)\\b',
  '\\b(?:debited|credited|txn|upi ref|avl bal|available bal|a/c no)\\b',
  '\\b(?:your order|order id|shipped|out for delivery|delivered|awb|tracking)\\b',
  '\\b(?:appointment|booking confirmed|pnr|boarding)\\b',
  "\\b(?:withdrawal of|you(?:'|\u2019)?ve paid|you have paid|payment (?:of|received|successful)|paid rs)\\b",
];
