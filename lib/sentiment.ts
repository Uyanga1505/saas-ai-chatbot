// ─── Sentiment normalization ─────────────────────────────────────────────────
//
// The AI analysis writes free-form sentiment labels in mixed languages
// ("Positive", "Позитив", "Сайн", "Нэгэн Эерэг", "Neutral", "Нейтрал",
// "Нэгэн Хэвийн", "Negative", "Негатив", "Сөрөг", ...). These all mean
// one of three things. This module maps any raw label to a canonical
// bucket so dashboards group them correctly.
// ─────────────────────────────────────────────────────────────────────────────

export type CanonicalSentiment = "positive" | "neutral" | "negative"

// Substring markers, lowercase. Negative is checked FIRST so phrases like
// "Нэгэн Зэрэг Сөрөг" ("somewhat negative") land in negative even though
// they also contain neutral-ish words.
const NEGATIVE_MARKERS = [
  "negative",
  "негатив",   // negative (ru/mn)
  "сөрөг",     // negative (mn)
  "муу",       // bad (mn)
  "bad",
  "angry",
  "ууртай",    // angry (mn)
  "сэтгэл дундуур", // dissatisfied (mn)
]

const POSITIVE_MARKERS = [
  "positive",
  "позитив",   // positive (ru/mn)
  "эерэг",     // positive (mn)
  "сайн",      // good (mn)
  "сайхан",    // nice (mn)
  "good",
  "happy",
  "баяртай",   // happy (mn)
  "сэтгэл хангалуун", // satisfied (mn)
]

export function normalizeSentiment(raw?: string | null): CanonicalSentiment {
  if (!raw) return "neutral"
  const s = raw.trim().toLowerCase()
  if (!s) return "neutral"
  if (NEGATIVE_MARKERS.some((m) => s.includes(m))) return "negative"
  if (POSITIVE_MARKERS.some((m) => s.includes(m))) return "positive"
  // Everything else — "neutral", "нейтрал", "нэгэн хэвийн", "нэгэн
  // төрлийн", "нэгэн зэрэг", "нэгэн адил", "unknown", fragments — is
  // treated as neutral.
  return "neutral"
}

export function sentimentLabel(s: CanonicalSentiment): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
