import { Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import MapGL, { Source, Layer } from "solid-map-gl";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { AddressWithStats } from "~/lib/server/addresses";
import { setSelectedAddress } from "~/lib/stores/mapSelection";

const STYLE = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [
    { id: "basemap", type: "raster", source: "basemap", minzoom: 0, maxzoom: 20 },
  ],
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
} as const;

type Props = {
  addresses: AddressWithStats[];
  center?: [number, number];
  zoom?: number;
};

export default function MapView(props: Props) {
  const center: [number, number] = props.center ?? [-105.2705, 40.015];
  const zoom = props.zoom ?? 13;
  const [mapRef, setMapRef] = createSignal<maplibregl.Map | null>(null);

  const geojson = createMemo(() => ({
    type: "FeatureCollection" as const,
    features: props.addresses.map((a) => ({
      type: "Feature" as const,
      properties: {
        id: a.id,
        street: a.street,
        visitCount: a.visitCount,
        peopleCount: a.peopleCount,
        lastStatus: a.lastVisit?.homeStatus ?? null,
      },
      geometry: { type: "Point" as const, coordinates: [a.lng, a.lat] },
    })),
  }));

  createEffect(() => {
    const map = mapRef();
    if (!map) return;

    const onPinClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const id = (f.properties as { id?: number } | null)?.id;
      const addr = props.addresses.find((a) => a.id === id);
      if (addr) setSelectedAddress(addr);
    };

    const onClusterClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const clusterId = (f.properties as { cluster_id?: number } | null)?.cluster_id;
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      const source = map.getSource("addresses") as maplibregl.GeoJSONSource | undefined;
      if (!source || clusterId == null) return;
      source
        .getClusterExpansionZoom(clusterId)
        .then((zoomTo) => {
          setSelectedAddress(null);
          map.easeTo({ center: coords, zoom: zoomTo, duration: 300 });
        })
        .catch(() => {});
    };

    const onMapClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point", "clusters"],
      });
      if (features.length === 0) setSelectedAddress(null);
    };

    const onMoveStart = () => setSelectedAddress(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedAddress(null);
    };

    map.on("click", "unclustered-point", onPinClick);
    map.on("click", "clusters", onClusterClick);
    map.on("click", onMapClick);
    map.on("movestart", onMoveStart);
    window.addEventListener("keydown", onKey);

    if (import.meta.env.DEV) {
      (window as unknown as { __map?: maplibregl.Map }).__map = map;
    }

    onCleanup(() => {
      map.off("click", "unclustered-point", onPinClick);
      map.off("click", "clusters", onClusterClick);
      map.off("click", onMapClick);
      map.off("movestart", onMoveStart);
      window.removeEventListener("keydown", onKey);
      if (import.meta.env.DEV) {
        delete (window as unknown as { __map?: maplibregl.Map }).__map;
      }
    });
  });

  return (
    <div class="relative w-full h-full">
      <MapGL
        mapLib={maplibregl}
        style={{ position: "absolute", inset: 0 }}
        options={
          {
            style: STYLE as unknown as maplibregl.StyleSpecification,
            center,
            zoom,
            interactive: true,
            dragRotate: false,
            pitchWithRotate: false,
            touchPitch: false,
            attributionControl: { compact: true },
          } as maplibregl.MapOptions
        }
        onLoad={(e) => setMapRef((e as unknown as { target: maplibregl.Map }).target)}
      >
        <Source
          id="addresses"
          source={
            {
              type: "geojson",
              data: geojson(),
              cluster: true,
              clusterMaxZoom: 16,
              clusterRadius: 50,
            } as unknown as maplibregl.GeoJSONSourceSpecification
          }
        >
          <Layer
            id="clusters"
            style={
              {
                type: "circle",
                filter: ["has", "point_count"],
                paint: {
                  "circle-color": "#2563eb",
                  "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30],
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 2,
                },
              } as unknown as maplibregl.CircleLayerSpecification
            }
          />
          <Layer
            id="cluster-count"
            style={
              {
                type: "symbol",
                filter: ["has", "point_count"],
                layout: {
                  "text-field": "{point_count_abbreviated}",
                  "text-size": 12,
                },
                paint: { "text-color": "#ffffff" },
              } as unknown as maplibregl.SymbolLayerSpecification
            }
          />
          <Layer
            id="unclustered-point"
            style={
              {
                type: "circle",
                filter: ["!", ["has", "point_count"]],
                paint: {
                  "circle-color": [
                    "case",
                    ["==", ["get", "visitCount"], 0],
                    "#ef4444",
                    ["==", ["get", "lastStatus"], "home"],
                    "#10b981",
                    "#f59e0b",
                  ],
                  "circle-radius": 8,
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 2,
                },
              } as unknown as maplibregl.CircleLayerSpecification
            }
          />
        </Source>
      </MapGL>
    </div>
  );
}
