import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// Time-of-day greeting for the home page ("Good afternoon, Jule").
// Set in the app's own UI font, bold with tight tracking, like Notion's home
// heading, so it reads as part of the layout rather than a decorative serif.

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "greeting.morning";
  if (hour >= 12 && hour < 18) return "greeting.afternoon";
  if (hour >= 18 && hour < 22) return "greeting.evening";
  return "greeting.night";
}

interface GreetingProps {
  name?: string;
  className?: string;
}

export function Greeting({ name, className }: GreetingProps) {
  const { t } = useTranslation();
  const [textKey, setTextKey] = useState(getGreetingKey);

  // Re-check on each minute boundary so the greeting flips at 12:00, 18:00…
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      setTextKey(getGreetingKey());
      interval = setInterval(() => setTextKey(getGreetingKey()), 60_000);
    }, msUntilNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const text = t(textKey);

  return (
    <h1
      className={className}
      style={{
        margin: 0,
        fontFamily: "inherit",
        // 30px from ~600px wide up; scales down to 20px on phones
        // (≈20px at 375px) so the greeting stays one calm line.
        fontSize: "clamp(20px, 5vw, 30px)",
        overflowWrap: "break-word",
        maxWidth: "100%",
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        color: "inherit",
      }}
    >
      {name ? t("greeting.withName", { greeting: text, name }) : text}
    </h1>
  );
}
