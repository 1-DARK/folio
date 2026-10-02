import i18n from "src/i18n/config";

// Date suggestions for the "@" menu: today, tomorrow, yesterday, next week
// and "remind me", plus a date read from what was typed ("in 3 days",
// "friday", "dans 2 semaines", "vendredi", "2026-10-12", "12/10").
// Picking one inserts a date chip (a mention with a `date` attribute).

export interface DateSuggestion {
  /** Stable id: today, tomorrow, yesterday, nextWeek, remind, typed. */
  id: string;
  label: string;
  /** ISO date the chip starts with. */
  iso: string;
  /** The date written out, shown next to the label. */
  hint: string;
  /** "Remind me": a reminder on the day, at 9:00. */
  remind?: string;
  includeTime?: boolean;
}

const strip = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

const locale = () => (i18n.language?.startsWith("fr") ? "fr-FR" : "en-US");

export function formatDateHint(d: Date, withTime = false): string {
  return d.toLocaleDateString(locale(), {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" }
      : {}),
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** "Today", "Tomorrow", "In 3 days", "Aujourd’hui", "Demain"… */
export function relativeDayLabel(date: Date): string {
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000,
  );
  if (Math.abs(diff) < 7) {
    const text = new Intl.RelativeTimeFormat(locale(), {
      numeric: "auto",
    }).format(diff, "day");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return date.toLocaleDateString(locale(), {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== new Date().getFullYear()
      ? { year: "numeric" }
      : {}),
  });
}

// Weekday words, Sunday first (Date#getDay order).
const WEEKDAYS: string[][] = [
  ["sunday", "sun", "dimanche", "dim"],
  ["monday", "mon", "lundi", "lun"],
  ["tuesday", "tue", "mardi", "mar"],
  ["wednesday", "wed", "mercredi", "mer"],
  ["thursday", "thu", "jeudi", "jeu"],
  ["friday", "fri", "vendredi", "ven"],
  ["saturday", "sat", "samedi", "sam"],
];

/** A date read from the typed text, or null. */
export function parseTypedDate(query: string): Date | null {
  const q = strip(query);
  if (q.length < 2) return null;
  const today = startOfDay(new Date());

  // in 3 days / in 2 weeks / dans 3 jours / dans 2 semaines
  const rel =
    /^(?:in|dans)\s+(\d{1,3})\s*(d|days?|j|jours?|w|weeks?|semaines?)$/.exec(q);
  if (rel) {
    const n = Number(rel[1]);
    const weeks = /^(w|week|semaine)/.test(rel[2]);
    return addDays(today, weeks ? n * 7 : n);
  }

  // A weekday: the next one (today's weekday → next week's).
  for (let day = 0; day < 7; day++) {
    const [en, , fr] = WEEKDAYS[day];
    if (
      WEEKDAYS[day].includes(q) ||
      (q.length >= 3 && (en.startsWith(q) || fr.startsWith(q)))
    ) {
      const ahead = (day - today.getDay() + 7) % 7 || 7;
      return addDays(today, ahead);
    }
  }

  // 2026-10-12
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(q);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // 12/10 or 12/10/2026 — day first in French, month first in English.
  const num = /^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$/.exec(q);
  if (num) {
    const [a, b] = [Number(num[1]), Number(num[2])];
    const frenchOrder = locale() === "fr-FR";
    const day = frenchOrder ? a : b;
    const month = frenchOrder ? b : a;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    let year = num[3] ? Number(num[3]) : today.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month - 1, day);
    // No year typed and the date has passed this year → next year.
    if (!num[3] && d < today) d.setFullYear(year + 1);
    return d.getMonth() === month - 1 ? d : null;
  }

  return null;
}

/** The suggestions matching the query (all of them when it's empty). */
export function getDateSuggestions(query: string): DateSuggestion[] {
  const t = i18n.t.bind(i18n);
  const today = startOfDay(new Date());
  const remindAt = addDays(today, 1);
  remindAt.setHours(9, 0, 0, 0);

  const fixed: (DateSuggestion & { words: string })[] = [
    {
      id: "today",
      label: t("mention.dates.today"),
      iso: today.toISOString(),
      hint: formatDateHint(today),
      words: "today now aujourd'hui aujourdhui maintenant",
    },
    {
      id: "tomorrow",
      label: t("mention.dates.tomorrow"),
      iso: addDays(today, 1).toISOString(),
      hint: formatDateHint(addDays(today, 1)),
      words: "tomorrow demain",
    },
    {
      id: "yesterday",
      label: t("mention.dates.yesterday"),
      iso: addDays(today, -1).toISOString(),
      hint: formatDateHint(addDays(today, -1)),
      words: "yesterday hier",
    },
    {
      id: "nextWeek",
      label: t("mention.dates.nextWeek"),
      iso: addDays(today, 7).toISOString(),
      hint: formatDateHint(addDays(today, 7)),
      words: "next week semaine prochaine",
    },
    {
      id: "remind",
      label: t("mention.dates.remindMe"),
      iso: remindAt.toISOString(),
      hint: formatDateHint(remindAt, true),
      remind: "on_day",
      includeTime: true,
      words: "remind me reminder rappel rappelle-moi me rappeler",
    },
  ];

  const q = strip(query);
  // Every typed word starts a word of the label or of its keywords.
  const parts = q.split(/\s+/).filter(Boolean);
  const matches = fixed.filter((s) => {
    const words = strip(`${s.label} ${s.words}`).split(/\s+/);
    return parts.every((part) => words.some((w) => w.startsWith(part)));
  });

  const typed = parseTypedDate(query);
  const out: DateSuggestion[] = matches.map((s) => ({
    id: s.id,
    label: s.label,
    iso: s.iso,
    hint: s.hint,
    remind: s.remind,
    includeTime: s.includeTime,
  }));
  const sameDay = (s: DateSuggestion) =>
    typed && startOfDay(new Date(s.iso)).getTime() === typed.getTime();
  if (typed && !out.some(sameDay)) {
    // Within a week it reads "In 3 days" with the date beside it; further
    // out, the date itself is the label.
    const near = Math.abs(typed.getTime() - today.getTime()) < 7 * 86400000;
    out.unshift({
      id: "typed",
      label: near ? relativeDayLabel(typed) : formatDateHint(typed),
      iso: typed.toISOString(),
      hint: near ? formatDateHint(typed) : "",
    });
  }
  return out;
}
