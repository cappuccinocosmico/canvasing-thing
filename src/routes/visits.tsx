import { Suspense, Show, For, createSignal } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { A } from "@solidjs/router";
import { listVisits } from "~/lib/server/addresses";

export default function Visits() {
  const [filter, setFilter] = createSignal<"all" | "talked" | "interested" | "home">("all");
  const visits = createQuery(() => ({
    queryKey: ["visits"],
    queryFn: () => listVisits(500),
  }));

  const filtered = () => {
    const all = visits.data ?? [];
    switch (filter()) {
      case "talked":
        return all.filter((v) => v.talked);
      case "interested":
        return all.filter((v) => v.interested === true);
      case "home":
        return all.filter((v) => v.homeStatus === "home");
      default:
        return all;
    }
  };

  return (
    <div class="max-w-4xl mx-auto p-4">
      <h1 class="text-2xl font-bold mb-2">Visits</h1>
      <div class="join mb-3">
        <For each={["all", "talked", "interested", "home"] as const}>
          {(f) => (
            <button
              class="join-item btn btn-sm"
              classList={{ "btn-active": filter() === f }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          )}
        </For>
      </div>
      <Suspense fallback={<span class="loading loading-spinner" />}>
        <Show
          when={filtered().length > 0}
          fallback={<div class="opacity-60 text-sm">No visits match this filter.</div>}
        >
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Address</th>
                  <th>Person</th>
                  <th>Home</th>
                  <th>Talked</th>
                  <th>Interested</th>
                  <th>Contact</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <For each={filtered()}>
                  {(v) => (
                    <tr>
                      <td class="text-xs opacity-70 whitespace-nowrap">
                        {new Date(v.visitedAt as any).toLocaleString()}
                      </td>
                      <td>
                        <A href={`/addresses/${v.addressId}`} class="link link-hover">
                          {v.street}
                        </A>
                      </td>
                      <td>
                        {v.personFirst ? `${v.personFirst} ${v.personLast}` : "—"}
                      </td>
                      <td>{v.homeStatus.replace("_", " ")}</td>
                      <td>{v.talked ? "✓" : ""}</td>
                      <td>{v.interested === true ? "✓" : ""}</td>
                      <td class="text-xs">
                        {v.contactEmail}
                        {v.contactEmail && v.contactPhone && <br />}
                        {v.contactPhone}
                      </td>
                      <td class="max-w-xs truncate" title={v.notes ?? ""}>
                        {v.notes}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Suspense>
    </div>
  );
}
