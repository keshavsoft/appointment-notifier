var TELUGU_UNITS = [
  "సున్నా", "ఒకటి", "రెండు", "మూడు", "నాలుగు", "ఐదు",
  "ఆరు", "ఏడు", "ఎనిమిది", "తొమ్మిది", "పది",
  "పదకొండు", "పన్నెండు", "పదమూడు", "పద్నాలుగు", "పదిహేను",
  "పదహారు", "పదిహేడు", "పద్దెనిమిది", "పంతొమ్మిది"
];

var TELUGU_TENS = [
  "", "", "ఇరవై", "ముప్పై", "నలభై", "యాభై",
  "అరవై", "డెబ్బై", "ఎనభై", "తొంభై"
];

export function numberToTeluguWords(num) {
  var n = Math.floor(Number(num));
  if (!isFinite(n) || n < 0 || n > 999) return String(num);
  if (n < 20) return TELUGU_UNITS[n];
  if (n < 100) {
    var tens = Math.floor(n / 10);
    var rem = n % 10;
    return rem === 0 ? TELUGU_TENS[tens] : (TELUGU_TENS[tens] + " " + TELUGU_UNITS[rem]);
  }
  var hundreds = Math.floor(n / 100);
  var rem100 = n % 100;
  var hundredText = hundreds === 1 ? "వంద" : (TELUGU_UNITS[hundreds] + " వందల");
  if (rem100 === 0) return hundredText;
  return hundredText + " " + numberToTeluguWords(rem100);
}
