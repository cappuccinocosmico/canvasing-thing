import { A } from "@solidjs/router";

export default function Nav() {
  return (
    <nav class="navbar bg-base-200 border-b border-base-300 px-4 gap-2">
      <div class="flex-1">
        <A href="/" class="text-lg font-bold tracking-tight">
          🗺 Canvasing Thing
        </A>
      </div>
      <div class="flex-none gap-1">
        <A href="/" end class="btn btn-ghost btn-sm" activeClass="btn-active">
          Map
        </A>
        <A href="/visits" class="btn btn-ghost btn-sm" activeClass="btn-active">
          Visits
        </A>
        <A href="/import" class="btn btn-ghost btn-sm" activeClass="btn-active">
          Import
        </A>
      </div>
    </nav>
  );
}
