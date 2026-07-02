import { Suspense, Show, For, createSignal } from "solid-js";
import { createQuery, createMutation, useQueryClient } from "@tanstack/solid-query";
import { A, useParams } from "@solidjs/router";
import { getAddress, logVisit } from "~/lib/server/addresses";
import { homeStatuses, type HomeStatus } from "~/lib/db/schema";

export default function AddressDetail() {
  const params = useParams();
  const qc = useQueryClient();
  const data = createQuery(() => ({
    queryKey: ["address", params.id],
    queryFn: () => getAddress(Number(params.id)),
  }));

  return (
    <div class="max-w-3xl mx-auto p-4">
      <A href="/" class="btn btn-ghost btn-sm mb-2">← Back to map</A>
      <Suspense fallback={<span class="loading loading-spinner" />}>
        <Show
          when={data.data}
          fallback={<div class="alert alert-error">Address not found.</div>}
        >
          <header class="mb-4">
            <h1 class="text-2xl font-bold">{data.data!.address.street}</h1>
            <div class="text-sm opacity-70">
              {data.data!.address.city}, {data.data!.address.state} {data.data!.address.zip}
            </div>
          </header>

          <section class="mb-6">
            <h2 class="font-bold mb-2">People at this address</h2>
            <Show
              when={data.data!.people.length > 0}
              fallback={<div class="opacity-60 text-sm">No people records.</div>}
            >
              <ul class="grid grid-cols-2 gap-2">
                <For each={data.data!.people}>
                  {(p) => (
                    <li class="card bg-base-200 p-2 text-sm">
                      <div class="font-medium">
                        {p.firstName} {p.lastName}
                      </div>
                      <div class="text-xs opacity-70">
                        {p.age && <span>age {p.age}</span>}
                        {p.age && p.party && <span> · </span>}
                        {p.party && <span>{p.party}</span>}
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </section>

          <VisitForm
            addressId={data.data!.address.id}
            people={data.data!.people}
            onLogged={() => {
              qc.invalidateQueries({ queryKey: ["address", params.id] });
              qc.invalidateQueries({ queryKey: ["addresses"] });
              qc.invalidateQueries({ queryKey: ["visits"] });
              qc.invalidateQueries({ queryKey: ["stats"] });
            }}
          />

          <section class="mt-6">
            <h2 class="font-bold mb-2">Visit history</h2>
            <Show
              when={data.data!.visits.length > 0}
              fallback={<div class="opacity-60 text-sm">No visits yet.</div>}
            >
              <ul class="space-y-2">
                <For each={data.data!.visits}>
                  {(v) => (
                    <li class="card bg-base-200 p-3 text-sm">
                      <div class="flex justify-between items-center">
                        <span class="font-mono text-xs opacity-60">
                          {new Date(v.visitedAt as any).toLocaleString()}
                        </span>
                        <span class="flex gap-1">
                          <span
                            class="badge badge-sm"
                            classList={{
                              "badge-success": v.homeStatus === "home",
                              "badge-warning": v.homeStatus === "not_home",
                              "badge-ghost": v.homeStatus === "unknown",
                            }}
                          >
                            {v.homeStatus.replace("_", " ")}
                          </span>
                          {v.talked && <span class="badge badge-sm badge-info">talked</span>}
                          {v.interested === true && (
                            <span class="badge badge-sm badge-primary">interested</span>
                          )}
                        </span>
                      </div>
                      {v.notes && <div class="mt-1">{v.notes}</div>}
                      {(v.contactEmail || v.contactPhone) && (
                        <div class="mt-1 text-xs opacity-70">
                          {v.contactEmail}
                          {v.contactEmail && v.contactPhone && " · "}
                          {v.contactPhone}
                        </div>
                      )}
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </section>
        </Show>
      </Suspense>
    </div>
  );
}

function VisitForm(props: {
  addressId: number;
  people: { id: number; firstName: string; lastName: string }[];
  onLogged: () => void;
}) {
  const [personId, setPersonId] = createSignal<number | "">("");
  const [homeStatus, setHomeStatus] = createSignal<HomeStatus>("home");
  const [talked, setTalked] = createSignal(true);
  const [interested, setInterested] = createSignal<boolean | "">("");
  const [notes, setNotes] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [phone, setPhone] = createSignal("");

  const mut = createMutation(() => ({
    mutationFn: (input: Parameters<typeof logVisit>[0]) => logVisit(input),
    onSuccess: () => {
      setNotes("");
      setEmail("");
      setPhone("");
      setInterested("");
      setPersonId("");
      props.onLogged();
    },
  }));

  return (
    <section class="card bg-base-200 p-4">
      <h2 class="font-bold mb-3">Log a visit</h2>
      <form
        class="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate({
            addressId: props.addressId,
            personId: personId() === "" ? null : Number(personId()),
            homeStatus: homeStatus(),
            talked: talked(),
            interested: interested() === "" ? null : Boolean(interested()),
            notes: notes() || undefined,
            contactEmail: email() || undefined,
            contactPhone: phone() || undefined,
          });
        }}
      >
        <label class="form-control">
          <span class="label-text text-xs mb-1">Person (optional)</span>
          <select
            class="select select-bordered select-sm"
            value={personId()}
            onChange={(e) => setPersonId(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))}
          >
            <option value="">—</option>
            <For each={props.people}>
              {(p) => (
                <option value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              )}
            </For>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text text-xs mb-1">Were they home?</span>
          <select
            class="select select-bordered select-sm"
            value={homeStatus()}
            onChange={(e) => setHomeStatus(e.currentTarget.value as HomeStatus)}
          >
            <For each={homeStatuses}>
              {(s) => <option value={s}>{s.replace("_", " ")}</option>}
            </For>
          </select>
        </label>

        <label class="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={talked()}
            onChange={(e) => setTalked(e.currentTarget.checked)}
          />
          <span class="text-sm">Talked to someone</span>
        </label>

        <label class="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={interested() === true}
            onChange={(e) => setInterested(e.currentTarget.checked ? true : "")}
          />
          <span class="text-sm">They expressed interest</span>
        </label>

        <label class="form-control col-span-2">
          <span class="label-text text-xs mb-1">Notes</span>
          <textarea
            class="textarea textarea-bordered textarea-sm"
            rows="2"
            value={notes()}
            onInput={(e) => setNotes(e.currentTarget.value)}
          />
        </label>

        <label class="form-control">
          <span class="label-text text-xs mb-1">Email</span>
          <input
            type="email"
            class="input input-bordered input-sm"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
        </label>

        <label class="form-control">
          <span class="label-text text-xs mb-1">Phone</span>
          <input
            type="tel"
            class="input input-bordered input-sm"
            value={phone()}
            onInput={(e) => setPhone(e.currentTarget.value)}
          />
        </label>

        <button
          type="submit"
          class="btn btn-primary col-span-2"
          disabled={mut.isPending}
        >
          {mut.isPending ? "Saving…" : "Log visit"}
        </button>
        <Show when={mut.isError}>
          <div class="alert alert-error col-span-2 text-xs">
            {(mut.error as Error).message}
          </div>
        </Show>
      </form>
    </section>
  );
}
