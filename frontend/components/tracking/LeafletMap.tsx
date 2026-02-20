// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon paths in React/Webpack/Vite environments
// This prevents the "broken image" or default marker issues
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Premium Custom Marker Icons using DivIcon for better styling control
const createCustomIcon = (iconName: string, color: string, size: number = 40) => {
    return L.divIcon({
        className: 'custom-map-marker',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            ">
                <img src="https://cdn-icons-png.flaticon.com/512/${iconName}" style="width: ${size * 0.6}px; height: ${size * 0.6}px;" />
            </div>
            <div style="
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid ${color};
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
            "></div>
        `,
        iconSize: [size, size + 10],
        iconAnchor: [size / 2, size + 8],
        popupAnchor: [0, -(size + 10)],
    });
};

const ambulanceIcon = createCustomIcon('1032/1032989.png', '#EF4444', 44);
const pickupIcon = createCustomIcon('3177/3177361.png', '#22C55E', 36);
const hospitalIcon = createCustomIcon('4332/4332912.png', '#3B82F6', 36);

// Component to smoothly pan the map
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (isFirstLoad.current) {
            map.setView([lat, lon], 15);
            isFirstLoad.current = false;
        } else {
            // Use slow flyTo for tracking updates
            map.flyTo([lat, lon], map.getZoom(), {
                animate: true,
                duration: 2.0
            });
        }
    }, [lat, lon, map]);
    return null;
}

interface MapProps {
    lat?: number;
    lon?: number;
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

    // Determine Map Center: Priority -> Ambulance -> Pickup -> Drop -> Default
    const centerLat = lat || pickupLat || dropLat || 20.5937;
    const centerLon = lon || pickupLon || dropLon || 78.9629;

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
        if (!pickupLat || !pickupLon || !lat || !lon) return;

        // Threshold of 150m prevents route flickering but stays close enough
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
                console.error("OSRM Error:", error);
            }
        };

        fetchRoute();
    }, [lat, lon, pickupLat, pickupLon, dropLat, dropLon]);

    // Create a smooth combined path from current location to the OSRM route
    const livePath: [number, number][] = (routePositions.length > 0 && lat && lon)
        ? [[lat, lon], ...routePositions]
        : [];

    return (
        <MapContainer
            center={[centerLat, centerLon]}
            zoom={15} // Slightly closer zoom for tracking
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Route Line - Premium Blue Gradient Style */}
            {livePath.length > 0 ? (
                <Polyline
                    positions={livePath}
                    pathOptions={{
                        color: '#3B82F6',
                        weight: 5,
                        opacity: 0.7,
                        lineJoin: 'round',
                        dashArray: '1, 10'
                    }}
                />
            ) : null}

            {/* Ambulance Marker */}
            {lat && lon && (
                <Marker position={[lat, lon]} icon={ambulanceIcon}>
                    <Popup>
                        <b>Ambulance {vehicleNumber || ''}</b> <br />
                        {status}
                    </Popup>
                </Marker>
            )}

            {/* Destination Marker */}
            {dropLat && dropLon ? (
                <Marker position={[dropLat, dropLon]} icon={hospitalIcon}>
                    <Popup>
                        <b>{dropAddress || 'Destination Hospital'}</b>
                    </Popup>
                </Marker>
            ) : null}

            {/* Pickup Marker */}
            {pickupLat && pickupLon ? (
                <Marker position={[pickupLat, pickupLon]} icon={pickupIcon}>
                    <Popup>
                        <b>Pickup Point</b><br />Patient's Current Location
                    </Popup>
                </Marker>
            ) : null}

            <RecenterMap lat={centerLat} lon={centerLon} />
        </MapContainer>
    );
}
