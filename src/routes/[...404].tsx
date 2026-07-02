import { A } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <div class="p-8 text-center">
      <HttpStatusCode code={404} />
      <h1 class="text-3xl font-bold">404</h1>
      <p class="opacity-70">Not found.</p>
      <A href="/" class="btn btn-primary mt-4">Back to map</A>
    </div>
  );
}
