import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDataSources } from "src/hooks/use-data-sources";
import { usePagesBase } from "src/hooks/use-pages";
import { useCurrentPerson } from "src/hooks/use-session";
import {
  useNotificationActions,
  useNotificationState,
} from "src/features/inbox/notification/notification-context";
import type {
  DatabaseProperty,
  DataSource,
  DateNotifications,
  ID,
  Page,
} from "src/types";

// Date properties with a reminder ("On the day", "1 day before", "2 days
// before") put a notification in the inbox of the people the row is for:
// everyone in the row's Person properties, or the row's creator when it has
// none. Each person's own app sends their reminder while they use Folio, once
// per row, property and date — a new date gets a new reminder.

const DAYS_BEFORE: Record<Exclude<DateNotifications, "none">, number> = {
  same_day: 0,
  "1_day_before": 1,
  "2_days_before": 2,
};

const DAY = 86_400_000;
const SENT_KEY = "folio-date-reminders-sent";

// Reminders the person dismissed are deleted from the server, so keep a
// device copy too; otherwise a dismissed reminder would come back.
function readSent(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function writeSent(sent: Set<string>) {
  try {
    // Keep the newest 500 so this never grows without bound.
    localStorage.setItem(SENT_KEY, JSON.stringify([...sent].slice(-500)));
  } catch {
    // Storage unavailable: the server-side dedup still applies.
  }
}

/** A stored date (ISO string or { start, end }) → local midnight, or null. */
function dueDay(raw: unknown): { day: number; key: string } | null {
  const s =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "start" in raw
        ? String((raw as { start: unknown }).start ?? "")
        : "";
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { day: d.getTime(), key };
}

/** Who a row's reminders are for. */
function recipients(row: Page, properties: DatabaseProperty[]): ID[] {
  const ids = new Set<ID>();
  for (const prop of properties) {
    if (prop.config.type !== "person") continue;
    const value = row.values?.[prop.id];
    if (Array.isArray(value)) {
      for (const p of value as { id?: ID }[]) if (p?.id) ids.add(p.id);
    }
  }
  if (ids.size === 0 && row.ownerId) ids.add(row.ownerId);
  return [...ids];
}

export function useDatabaseDateReminders() {
  const { t } = useTranslation();
  const { data: sources } = useDataSources();
  const { data: pages } = usePagesBase();
  const { person } = useCurrentPerson();
  const { ready } = useNotificationState();
  const { addNotification, hasNotified, registerNotified } =
    useNotificationActions();
  const meId = person?.id ?? null;

  useEffect(() => {
    if (!ready || !meId || !sources || !pages) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = today.getTime();
    const sent = readSent();
    let changed = false;

    for (const source of sources as DataSource[]) {
      const dateProps = source.properties.filter(
        (p) =>
          p.config.type === "date" &&
          p.config.notifications &&
          p.config.notifications !== "none",
      );
      if (!dateProps.length) continue;

      const rows = (pages as Page[]).filter(
        (p) =>
          p.sourceId === source.id &&
          p.deletedAt == null &&
          p.category !== "Template",
      );

      for (const row of rows) {
        if (!recipients(row, source.properties).includes(meId)) continue;

        for (const prop of dateProps) {
          if (prop.config.type !== "date") continue;
          const due = dueDay(row.values?.[prop.id]);
          if (!due) continue;
          const before =
            DAYS_BEFORE[
              prop.config.notifications as Exclude<DateNotifications, "none">
            ];
          // In the window from the reminder day to the date itself.
          if (now < due.day - before * DAY || now > due.day) continue;

          const key = `db-date:${row.id}:${prop.id}:${due.key}`;
          if (hasNotified(key) || sent.has(key)) continue;
          registerNotified(key);
          sent.add(key);
          changed = true;

          const daysLeft = Math.round((due.day - now) / DAY);
          const vars = {
            property: prop.name,
            title: row.title || t("page.untitled"),
            count: daysLeft,
          };
          addNotification({
            type: "date-due",
            title: t("database.reminder.title", vars),
            message:
              daysLeft === 0
                ? t("database.reminder.today", vars)
                : daysLeft === 1
                  ? t("database.reminder.tomorrow", vars)
                  : t("database.reminder.inDays", vars),
            dedupKey: key,
            sourcePageId: row.id,
            sourcePageTitle: row.title || undefined,
            mentionLabel: prop.name,
          });
        }
      }
    }

    if (changed) writeSent(sent);
  }, [
    ready,
    meId,
    sources,
    pages,
    t,
    addNotification,
    hasNotified,
    registerNotified,
  ]);
}
