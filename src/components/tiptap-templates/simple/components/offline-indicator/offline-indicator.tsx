import { CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "src/hooks/use-online-status";

// A small "Offline" pill for the page toolbar. Renders nothing online.
export function OfflineIndicator() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <span
      role="status"
      title={t(
        "offline.hint",
        "You're offline. Pages you've opened on this device still work — your edits sync when you're back online.",
      )}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 10px",
        borderRadius: 999,
        fontSize: 13,
        color: "var(--tt-text-primary)",
        background:
          "color-mix(in srgb, var(--tt-text-primary) 7%, transparent)",
        whiteSpace: "nowrap",
      }}
    >
      <CloudOff size={14} />
      {t("offline.label", "Offline")}
    </span>
  );
}
