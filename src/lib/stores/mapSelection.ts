import { createSignal } from "solid-js";
import type { AddressWithStats } from "~/lib/server/addresses";

const [selectedAddress, setSelectedAddress] = createSignal<AddressWithStats | null>(null);

export { selectedAddress, setSelectedAddress };
