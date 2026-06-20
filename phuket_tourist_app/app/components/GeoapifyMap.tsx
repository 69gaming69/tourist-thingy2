// components/GeoapifyMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js/Webpack
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function GeoapifyMap() {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  // Geoapify Tile URL template
  // You can change 'osm-bright' to other styles like 'klokantech-basic', 'positron', etc.
  const tileUrl = `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=d8c4dd9c65864d37803a77f2cde2c7fc`;

  // Default position (London)
  const position: [number, number] = [51.505, -0.09];

  if (!apiKey) {
    return <div>Missing Geoapify API Key</div>;
  }

  return (
    <MapContainer 
      center={position} 
      zoom={13} 
      scrollWheelZoom={true} 
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        url={tileUrl}
        attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</> | <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  );
}