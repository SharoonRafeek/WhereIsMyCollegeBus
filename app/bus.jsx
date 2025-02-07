import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_OPENSTREETMAP } from 'react-native-maps';
import { fetchBusLocation } from '../services/api';
import * as Network from 'expo-network';

const Bus = () => {
    const [busLocation, setBusLocation] = useState({
        latitude: 11.563643,
        longitude: 75.650776,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const updateBusLocation = async () => {
        try {
            setError(null);
            setUpdating(true);

            const data = await fetchBusLocation();

            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }

            const activeBus = data[2];

            if (!activeBus) {
                throw new Error('No active bus data available');
            }

            if (activeBus.valid &&
                typeof activeBus.latitude === 'number' &&
                typeof activeBus.longitude === 'number' &&
                activeBus.latitude !== 0 &&
                activeBus.longitude !== 0) {

                // Log current location
                console.log('Current Location:', {
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude,
                    timestamp: new Date().toLocaleTimeString()
                });

                setBusLocation(prev => ({
                    ...prev,
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude,
                }));
            }
        } catch (err) {
            if (!err.message.includes('aborted')) {
                setError(`Failed to update location: ${err.message}`);
                // Log error with location
                console.error('Location Update Error:', {
                    error: err.message,
                    lastKnownLocation: {
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude
                    }
                });
            }
        } finally {
            setLoading(false);
            setUpdating(false);
        }
    };

    useEffect(() => {
        updateBusLocation();
        const intervalId = setInterval(updateBusLocation, 2000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading map...</Text>
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

            {updating && (
                <View style={[styles.updatingContainer, { top: error ? 70 : 10 }]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.updatingText}>Updating location...</Text>
                </View>
            )}

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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 5,
        zIndex: 2,
    },
    errorText: {
        color: 'white',
        textAlign: 'center',
    },
    updatingContainer: {
        position: 'absolute',
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    updatingText: {
        color: 'white',
        marginLeft: 10,
    },
});

export default Bus;