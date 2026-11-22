const TELUGU_UNITS = [
  "సున్నా", "ఒకటి", "రెండు", "మూడు", "నాలుగు", "ఐదు",
  "ఆరు", "ఏడు", "ఎనిమిది", "తొమ్మిది", "పది",
  "పదకొండు", "పన్నెండు", "పదమూడు", "పద్నాలుగు", "పదిహేను",
  "పదహారు", "పదిహేడు", "పద్దెనిమిది", "పంతొమ్మిది"
];

const TELUGU_TENS = [
  "", "", "ఇరవై", "ముప్పై", "నలభై", "యాభై",
  "అరవై", "డెబ్బై", "ఎనభై", "తొంభై"
];

export function numberToTeluguWords(num) {
  const n = Math.floor(Number(num));
  if (!isFinite(n) || n < 0 || n > 999) return String(num);
  if (n < 20) return TELUGU_UNITS[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rem = n % 10;
    return rem === 0 ? TELUGU_TENS[tens] : (TELUGU_TENS[tens] + " " + TELUGU_UNITS[rem]);
  }
  return String(num);
}
