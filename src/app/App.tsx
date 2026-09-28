import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { routes, location } from "./routes";
import { Outlet, Router } from "@tanstack/react-location";
import { EditorLayoutProvider } from "../features/shell/context/editor-layout-provider";
import { ActivePageProvider } from "../features/pages/context/active-page-provider";
import { PageViewProvider } from "../features/pages/context/page-view-provider";
import { SearchProvider } from "../features/shell/search/search-provider";
import { LibraryProvider } from "../features/pages/library/library-provider";
import { TemplatesProvider } from "../features/pages/templates/templates-provider";
import { WorkspaceSettingsProvider } from "../features/workspace/context/workspace-settings-provider";
import { AuthGate } from "../features/auth/auth-gate";
import { NotificationProvider } from "../features/inbox/notification";
import { PageCapabilitiesProvider } from "../features/pages/context/page-capabilities-provider";
import { ToastProvider } from "../features/shell/toast";
import { Sidebar } from "../features/shell/sidebar";
import { OfflineCacheGuard } from "../features/shell/offline/offline-cache-guard";
import {
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE,
  queryPersister,
  shouldPersistQuery,
} from "../lib/query-persistence";

// gcTime must be at least the persisted maxAge, or restored queries would be
// garbage-collected (and dropped from disk) before anything uses them.
const client = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: QUERY_CACHE_MAX_AGE,
    },
  },
});

function App() {
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: queryPersister,
        maxAge: QUERY_CACHE_MAX_AGE,
        buster: QUERY_CACHE_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistQuery,
          // Paused mutations can't be resumed after a reload (their
          // functions aren't registered as defaults) — don't save them.
          shouldDehydrateMutation: () => false,
        },
      }}
      // Anything queued while restoring goes out once the cache is back.
      onSuccess={() => void client.resumePausedMutations()}
    >
      <AuthGate>
        <OfflineCacheGuard>
          <EditorLayoutProvider>
            <SearchProvider>
              <TemplatesProvider>
                <PageViewProvider>
                  <Router location={location} routes={routes}>
                    <LibraryProvider>
                      <ActivePageProvider>
                        <WorkspaceSettingsProvider>
                          <PageCapabilitiesProvider>
                            <NotificationProvider>
                              <ToastProvider>
                                <Sidebar />
                                <Outlet />
                              </ToastProvider>
                            </NotificationProvider>
                          </PageCapabilitiesProvider>
                        </WorkspaceSettingsProvider>
                      </ActivePageProvider>
                    </LibraryProvider>
                  </Router>
                </PageViewProvider>
              </TemplatesProvider>
            </SearchProvider>
          </EditorLayoutProvider>
        </OfflineCacheGuard>
      </AuthGate>
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}

export default App;
