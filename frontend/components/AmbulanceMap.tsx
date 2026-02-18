import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface AmbulanceMapProps {
    location: any;
    nearbyAmbulances: any[];
    errorMsg?: string | null;
    region?: any; // Add region prop
}

const AmbulanceMap: React.FC<AmbulanceMapProps> = ({ location, nearbyAmbulances, errorMsg, region }) => {
    const mapRef = React.useRef<MapView>(null);

    // Effect to animate to new region when it changes
    React.useEffect(() => {
        if (region && mapRef.current) {
            mapRef.current.animateToRegion(region, 1000);
        }
    }, [region]);

    if (!location) {
        // ... existing loading logic ...
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
        );
    }

    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            // provider={PROVIDER_GOOGLE} 
            showsUserLocation
            showsMyLocationButton={false} // We will implement our own button
            initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
        >
            {nearbyAmbulances.map((ambulance) => (
                <Marker
                    key={ambulance.id}
                    coordinate={{
                        latitude: ambulance.latitude,
                        longitude: ambulance.longitude,
                    }}
                    title={`Ambulance ${ambulance.id + 1}`}
                    description="Available"
                >
                    <View style={styles.markerContainer}>
                        <Ionicons name="medical" size={24} color="#E10600" />
                    </View>
                </Marker>
            ))}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
    markerContainer: {
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E10600',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
    },
});

export default AmbulanceMap;
