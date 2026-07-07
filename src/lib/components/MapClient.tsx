import { clientOnly } from "@solidjs/start";
import type { AddressWithStats } from "~/lib/data/addresses";

type Props = {
  addresses: AddressWithStats[];
  center?: [number, number];
  zoom?: number;
};

const Map = clientOnly(() => import("./Map"));

export default function MapClient(props: Props) {
  return <Map {...props} />;
}
