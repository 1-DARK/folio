import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { routes, location } from "./routes";
import { Outlet, Router } from "@tanstack/react-location";
import { EditorLayoutProvider } from "./components/tiptap-templates/simple/context/editor-layout-provider";
import { ActivePageProvider } from "./components/tiptap-templates/simple/context/active-page-provider";
import { PageViewProvider } from "./components/tiptap-templates/simple/context/page-view-provider";
import { SearchProvider } from "./components/tiptap-templates/simple/context/search-provider";
import { LibraryProvider } from "./components/tiptap-templates/simple/context/library-provider";
import { TemplatesProvider } from "./components/tiptap-templates/simple/context/templates-provider";
import { WorkspaceSettingsProvider } from "./components/tiptap-templates/simple/context/workspace-settings-provider";
import { AuthGate } from "./components/tiptap-templates/simple/components/auth-gate";
import { NotificationProvider } from "./components/tiptap-ui/notification";
import { PageCapabilitiesProvider } from "./components/tiptap-templates/simple/context/page-capabilities-provider";
import { ToastProvider } from "./components/tiptap-templates/simple/components/toast";
import { Sidebar } from "./components/tiptap-templates/simple/components/sidebar";
import { OfflineCacheGuard } from "./components/tiptap-templates/simple/components/offline/offline-cache-guard";
import {
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE,
  queryPersister,
  shouldPersistQuery,
} from "./lib/query-persistence";

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
