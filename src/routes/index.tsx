import { Show, Suspense, onCleanup } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { listAddresses, stats } from "~/lib/data/addresses";
import { setSelectedAddress } from "~/lib/stores/mapSelection";
import MapClient from "~/lib/components/MapClient";
import AddressInfoCard from "~/lib/components/AddressInfoCard";

export default function Home() {
  const addresses = createQuery(() => ({
    queryKey: ["addresses"],
    queryFn: () => listAddresses(),
  }));
  const counts = createQuery(() => ({
    queryKey: ["stats"],
    queryFn: () => stats(),
  }));
  onCleanup(() => setSelectedAddress(null));

  return (
    <div class="h-full flex">
      <aside class="w-72 border-r border-base-300 bg-base-200 overflow-y-auto p-4 flex flex-col gap-3">
        <h2 class="font-bold text-lg">Overview</h2>
        <Suspense fallback={<div class="loading loading-spinner loading-sm" />}>
          <Show when={counts.data}>
            <Stat label="Addresses" value={counts.data!.addresses} />
            <Stat label="People" value={counts.data!.people} />
            <Stat label="Visits" value={counts.data!.visits} />
            <Stat label="Talked" value={counts.data!.talked} />
            <Stat label="Interested" value={counts.data!.interested} />
          </Show>
        </Suspense>
        <div class="text-xs opacity-60 mt-auto">
          Pins colored by last visit status. Red = never visited, green = spoke with someone home,
          yellow = not home / unknown.
        </div>
      </aside>
      <section class="flex-1 min-w-0 relative">
        <Suspense
          fallback={
            <div class="h-full grid place-items-center">
              <span class="loading loading-spinner loading-lg" />
            </div>
          }
        >
          <Show
            when={addresses.data && addresses.data.length > 0}
            fallback={
              <div class="h-full grid place-items-center p-8 text-center">
                <div>
                  <div class="text-2xl mb-2">No addresses yet</div>
                  <div class="opacity-70 mb-4">
                    Import a CSV of residents to get started. Sample data ships in{" "}
                    <code class="kbd kbd-sm">data/seed.json</code>.
                  </div>
                  <a href="/import" class="btn btn-primary">Import CSV</a>
                </div>
              </div>
            }
          >
            <MapClient addresses={addresses.data!} />
            <AddressInfoCard />
          </Show>
        </Suspense>
      </section>
    </div>
  );
}

function Stat(props: { label: string; value: number | string }) {
  return (
    <div class="flex items-baseline justify-between border-b border-base-300 py-1">
      <span class="text-sm opacity-70">{props.label}</span>
      <span class="font-mono font-bold">{props.value}</span>
    </div>
  );
}
