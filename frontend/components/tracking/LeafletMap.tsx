import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet/Webpack
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to center map when position changes
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lon]);
    }, [lat, lon, map]);
    return null;
}

interface MapProps {
    lat: number;
    lon: number;
    vehicleNumber?: string;
    status: string;
    pickupLat?: number;
    pickupLon?: number;
    dropLat?: number;
    dropLon?: number;
    dropAddress?: string;
}

export default function LeafletMap({
    lat, lon, vehicleNumber, status,
    pickupLat, pickupLon, dropLat, dropLon, dropAddress
}: MapProps) {
    const [routePositions, setRoutePositions] = useState<[number, number][]>([]);

    useEffect(() => {
        // Simple routing: Ambulance -> Pickup -> Drop
        const fetchRoute = async () => {
            if (!pickupLat || !pickupLon) return;

            // Coordinates in OSRM are lon,lat
            const start = `${lon},${lat}`;
            const pickup = `${pickupLon},${pickupLat}`;
            let waypoints = `${start};${pickup}`;

            if (dropLat && dropLon) {
                const drop = `${dropLon},${dropLat}`;
                waypoints += `;${drop}`;
            }

            try {
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`);
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates;
                    // GeoJSON is [lon, lat], Leaflet needs [lat, lon]
                    const positions = coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
                    setRoutePositions(positions);
                }
            } catch (error) {
                console.error("Error fetching route:", error);
            }
        };

        fetchRoute();
    }, [lat, lon, pickupLat, pickupLon, dropLat, dropLon]);

    return (
        <MapContainer
            center={[lat, lon]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Ambulance Marker */}
            <Marker position={[lat, lon]}>
                <Popup>
                    <b>Ambulance {vehicleNumber || ''}</b> <br />
                    {status}
                </Popup>
            </Marker>

            {/* Pickup Marker */}
            {pickupLat && pickupLon && (
                <Marker position={[pickupLat, pickupLon]} opacity={0.7}>
                    <Popup>
                        <b>Pickup Location</b> <br />
                        Patient Waiting Here
                    </Popup>
                </Marker>
            )}

            {/* Drop Marker */}
            {dropLat && dropLon && (
                <Marker position={[dropLat, dropLon]} opacity={0.7}>
                    <Popup>
                        <b>Drop Location</b> <br />
                        {dropAddress || 'Hospital'}
                    </Popup>
                </Marker>
            )}

            {/* Route Line */}
            {routePositions.length > 0 && (
                <Polyline positions={routePositions} pathOptions={{ color: 'blue' }} />
            )}

            <RecenterMap lat={lat} lon={lon} />
        </MapContainer>
    );
}
