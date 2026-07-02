import { Show, createEffect, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import { selectedAddress, setSelectedAddress } from "~/lib/stores/mapSelection";

export default function AddressInfoCard() {
  let closeBtn: HTMLButtonElement | undefined;
  const [wasOpen, setWasOpen] = createSignal(false);

  createEffect(() => {
    const open = selectedAddress() != null;
    if (open && !wasOpen()) closeBtn?.focus();
    setWasOpen(open);
  });

  return (
    <Show when={selectedAddress()}>
      {(addr) => (
        <aside
          role="dialog"
          aria-modal="false"
          aria-label="Address details"
          data-testid="address-info-card"
          class="absolute top-3 right-3 z-20 w-80 max-w-[calc(100vw-2rem)] card bg-base-100 shadow-xl border border-base-300"
        >
          <div class="card-body p-4 gap-2">
            <header class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="font-bold text-base leading-tight truncate">{addr().street}</h3>
                <p class="text-xs opacity-70">
                  {addr().city}, {addr().state} {addr().zip}
                </p>
              </div>
              <button
                ref={closeBtn}
                type="button"
                aria-label="Close"
                class="btn btn-ghost btn-xs btn-square"
                onClick={() => setSelectedAddress(null)}
              >
                ✕
              </button>
            </header>

            <div class="flex flex-wrap gap-1 mt-1">
              {addr().peopleCount > 0 && (
                <span class="badge badge-sm">{addr().peopleCount} people</span>
              )}
              {addr().visitCount > 0 ? (
                <span class="badge badge-sm badge-outline">
                  {addr().visitCount} visit{addr().visitCount === 1 ? "" : "s"}
                </span>
              ) : (
                <span class="badge badge-sm badge-warning">Never visited</span>
              )}
            </div>

            <Show when={addr().lastVisit}>
              {(v) => (
                <div class="text-xs opacity-70">
                  Last visit: {new Date(v().visitedAt as unknown as number).toLocaleDateString()}
                  {" · "}
                  <span class="capitalize">{v().homeStatus.replace("_", " ")}</span>
                  {v().talked && " · talked"}
                </div>
              )}
            </Show>

            <div class="card-actions justify-end mt-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onClick={() => setSelectedAddress(null)}
              >
                Close
              </button>
              <A href={`/addresses/${addr().id}`} class="btn btn-primary btn-sm">
                Open
              </A>
            </div>
          </div>
        </aside>
      )}
    </Show>
  );
}
