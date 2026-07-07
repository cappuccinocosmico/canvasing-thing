import { createSignal, Show, For } from "solid-js";
import { useQueryClient } from "@tanstack/solid-query";
import { importCsv, type ImportSummary } from "~/lib/data/csv";

export default function ImportPage() {
  const qc = useQueryClient();
  const [result, setResult] = createSignal<ImportSummary | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  return (
    <div class="max-w-2xl mx-auto p-4 space-y-4">
      <h1 class="text-2xl font-bold">Import CSV</h1>
      <p class="text-sm opacity-70">
        Upload a CSV of voter / resident records. Required columns (case-insensitive, common
        aliases accepted): <code>first_name</code>, <code>last_name</code>, <code>street</code>,{" "}
        <code>city</code>, <code>state</code>, <code>zip</code>. Optional: <code>age</code>,{" "}
        <code>party</code>.
      </p>
      <p class="text-xs opacity-60">
        Note: this is a UI demo — imported rows live in browser memory and reset on refresh.
      </p>
      <form
        class="card bg-base-200 p-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setResult(null);
          setBusy(true);
          try {
            const fd = new FormData(e.currentTarget);
            const file = fd.get("file") as File | null;
            if (!file || file.size === 0) throw new Error("No file uploaded.");
            const text = await file.text();
            const r = await importCsv(file.name, text);
            setResult(r);
            qc.invalidateQueries({ queryKey: ["addresses"] });
            qc.invalidateQueries({ queryKey: ["stats"] });
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          class="file-input file-input-bordered w-full"
          required
        />
        <button type="submit" class="btn btn-primary" disabled={busy()}>
          {busy() ? "Importing…" : "Import"}
        </button>
      </form>

      <Show when={error()}>
        <div class="alert alert-error text-sm">{error()}</div>
      </Show>

      <Show when={result()}>
        <div class="card bg-base-200 p-4 text-sm space-y-1">
          <div class="font-bold">Imported {result()!.filename}</div>
          <div>Rows: {result()!.rowCount}</div>
          <div>New addresses: {result()!.addressesAdded}</div>
          <div>People added: {result()!.peopleAdded}</div>
          <div>Geocoded: {result()!.geocodedCount}</div>
          <Show when={result()!.failed.length > 0}>
            <div class="mt-2">
              <div class="font-bold text-warning">
                {result()!.failed.length} row(s) failed:
              </div>
              <ul class="text-xs opacity-80 max-h-48 overflow-y-auto">
                <For each={result()!.failed.slice(0, 50)}>
                  {(f) => (
                    <li>
                      row {f.row}: {f.reason}
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
