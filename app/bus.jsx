// Bus.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_OPENSTREETMAP } from 'react-native-maps';
import { fetchBusLocation } from '../services/api';
import * as Network from 'expo-network'; // Add this import

const Bus = () => {
    const [busLocation, setBusLocation] = useState({
        latitude: 11.563643,
        longitude: 75.650776,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkNetwork = async () => {
        const networkState = await Network.getNetworkStateAsync();
        return networkState.isConnected && networkState.isInternetReachable;
    };

    const updateBusLocation = async () => {
        try {
            setError(null);

            // Add debug logging
            console.log('Starting bus location update...');

            const data = await fetchBusLocation();
            console.log('Received data from API:', data);

            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }

            const activeBus = data[2];

            if (!activeBus) {
                throw new Error('No active bus data available');
            }

            console.log('Active bus data:', activeBus);

            if (activeBus.valid &&
                typeof activeBus.latitude === 'number' &&
                typeof activeBus.longitude === 'number' &&
                activeBus.latitude !== 0 &&
                activeBus.longitude !== 0) {

                console.log('Updating bus location:', {
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude
                });

                setBusLocation(prev => ({
                    ...prev,
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude,
                }));
            } else {
                throw new Error('Invalid bus coordinates received');
            }
        } catch (err) {
            const errorMessage = `Failed to update location: ${err.message}`;
            setError(errorMessage);
            console.error('Location update error:', {
                message: err.message,
                name: err.name,
                stack: err.stack
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        updateBusLocation();
        const intervalId = setInterval(updateBusLocation, 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_OPENSTREETMAP}
                region={busLocation}
                showsUserLocation={false}
                showsMyLocationButton={false}
                zoomEnabled={true}
                minZoomLevel={5}
                maxZoomLevel={19}
            >
                <Marker
                    coordinate={{
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude,
                    }}
                    title="KL18G4525"
                    description={`Last updated: ${new Date().toLocaleTimeString()}`}
                />
            </MapView>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 5,
    },
    errorText: {
        color: 'white',
        textAlign: 'center',
    },
});

export default Bus;