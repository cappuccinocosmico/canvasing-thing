// @refresh reload
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import Nav from "~/lib/components/Nav";
import "./app.css";
import "maplibre-gl/dist/maplibre-gl.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <Router
      root={(props) => (
        <QueryClientProvider client={queryClient}>
          <div class="flex flex-col h-screen">
            <Nav />
            <main class="flex-1 min-h-0">
              <Suspense>{props.children}</Suspense>
            </main>
          </div>
        </QueryClientProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
