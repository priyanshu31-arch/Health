import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Marker Icons
const ambulanceIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1032/1032989.png', // Or another ambulance icon
    iconSize: [35, 35],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
});

const pickupIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png', // Location pin icon
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

const hospitalIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/4332/4332912.png', // Hospital icon
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

// Component to smoothly pan the map
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lon], map.getZoom(), {
            animate: true,
            duration: 1.5 // Smooth flight
        });
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
    const lastFetchPos = useRef<{ lat: number; lon: number } | null>(null);

    // Function to calculate distance (simple approximation)
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        if (!pickupLat || !pickupLon) return;

        // Only fetch route if we haven't fetched yet OR if we've moved significantly (> 100m)
        if (lastFetchPos.current) {
            const dist = getDistance(lat, lon, lastFetchPos.current.lat, lastFetchPos.current.lon);
            if (dist < 100) return; // Skip if moved less than 100 meters
        }

        const fetchRoute = async () => {
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
                    const positions = coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
                    setRoutePositions(positions);
                    lastFetchPos.current = { lat, lon };
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
            zoom={15} // Slightly closer zoom for tracking
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Ambulance Marker */}
            <Marker position={[lat, lon]} icon={ambulanceIcon}>
                <Popup>
                    <b>Ambulance {vehicleNumber || ''}</b> <br />
                    {status}
                </Popup>
            </Marker>

            {/* Pickup Marker */}
            {pickupLat && pickupLon && (
                <Marker position={[pickupLat, pickupLon]} icon={pickupIcon}>
                    <Popup>
                        <b>Pickup Point</b> <br />
                        Patient Location
                    </Popup>
                </Marker>
            )}

            {/* Drop Marker */}
            {dropLat && dropLon && (
                <Marker position={[dropLat, dropLon]} icon={hospitalIcon}>
                    <Popup>
                        <b>Hospital</b> <br />
                        {dropAddress || 'Destination'}
                    </Popup>
                </Marker>
            )}

            {/* Route Line */}
            {routePositions.length > 0 && (
                <Polyline positions={routePositions} pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.6, dashArray: '10, 10' }} />
            )}

            <RecenterMap lat={lat} lon={lon} />
        </MapContainer>
    );
}
