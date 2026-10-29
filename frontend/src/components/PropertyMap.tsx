
"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface PropertyMapProps {
  latitude: number | null;
  longitude: number | null;
  name: string;
}

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function PropertyMap({
  latitude,
  longitude,
  name,
}: PropertyMapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (latitude == null || longitude == null) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-gray-100 p-6 text-center text-gray-500">
        Esta propiedad todavía no tiene coordenadas registradas.
      </div>
    );
  }

  if (!ready) {
    return <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />;
  }

  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-gray-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[latitude, longitude]}
          icon={markerIcon}
        >
          <Popup>{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
