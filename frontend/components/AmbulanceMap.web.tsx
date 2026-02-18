import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

// Leaflet variables (will be loaded dynamically)
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let Popup: any;
let useMap: any;
let L: any;

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    // @ts-ignore
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const AmbulanceMap = ({ location, nearbyAmbulances, errorMsg, region }: { location: any; nearbyAmbulances: any[], errorMsg?: string | null, region?: any }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Only load Leaflet on the client side
        if (typeof window !== 'undefined') {
            try {
                const RL = require('react-leaflet');
                MapContainer = RL.MapContainer;
                TileLayer = RL.TileLayer;
                Marker = RL.Marker;
                Popup = RL.Popup;
                useMap = RL.useMap;
                L = require('leaflet');
                require('leaflet/dist/leaflet.css');
                setIsClient(true);
            } catch (e) {
                console.error("Failed to load Leaflet", e);
            }
        }
    }, []);

    if (!isClient || !location) {
        return (
            <View style={styles.loadingContainer}>
                {errorMsg ? (
                    <Text>{errorMsg}</Text>
                ) : (
                    <>
                        <ActivityIndicator size="large" color="#E10600" />
                        <Text style={{ marginTop: 10 }}>Locating you...</Text>
                    </>
                )}
            </View>
        )
    }

    // Icons logic (must be client-side only)
    const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const ambulanceIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Calculate center: use search region if available, otherwise user location
    const mapCenter: [number, number] = region
        ? [region.latitude, region.longitude]
        : [location.coords.latitude, location.coords.longitude];

    return (
        <View style={styles.container}>
            {/* @ts-ignore */}
            <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <ChangeView center={mapCenter} zoom={13} />
                <TileLayer
                    // @ts-ignore
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.coords.latitude, location.coords.longitude]} icon={icon}>
                    <Popup>
                        You are here
                    </Popup>
                </Marker>

                {nearbyAmbulances.map((ambulance) => (
                    <Marker
                        key={ambulance.id}
                        position={[ambulance.latitude, ambulance.longitude]}
                        icon={ambulanceIcon}
                    >
                        <Popup>
                            Ambulance {ambulance.id + 1}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
    },
});

export default AmbulanceMap;
