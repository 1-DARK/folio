import { useEffect, useState, type ReactNode } from "react";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { useSession } from "src/hooks/use-session";
import { claimOfflineCache } from "src/lib/query-persistence";

// Holds the app until the saved query cache is restored AND known to belong
// to the signed-in person — so one account never sees another account's
// cached pages on a shared device. Signed out: renders straight through.
export function OfflineCacheGuard({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const isRestoring = useIsRestoring();
  const { session } = useSession();
  const personId = session?.user?.id ?? null;
  const [claimedFor, setClaimedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!personId || isRestoring) return;
    claimOfflineCache(personId, () => qc.clear());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClaimedFor(personId);
  }, [personId, isRestoring, qc]);

  if (personId && (isRestoring || claimedFor !== personId)) return null;
  return <>{children}</>;
}
