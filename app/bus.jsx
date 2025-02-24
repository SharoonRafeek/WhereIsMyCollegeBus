import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_OPENSTREETMAP } from 'react-native-maps';
import { fetchBusLocation } from '../services/api';
import { useLocalSearchParams } from 'expo-router';

const Bus = () => {
    // Get the busIndex parameter from the URL
    const { busIndex } = useLocalSearchParams();
    // Convert to number, default to index 2 if not provided (as in the original code)
    const selectedBusIndex = busIndex ? parseInt(busIndex) : 2;

    const [busLocation, setBusLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [busInfo, setBusInfo] = useState({ title: `Bus ${selectedBusIndex}`, description: "Loading..." });

    const updateBusLocation = async () => {
        try {
            // Only show the updating indicator, don't clear errors if we already
            // have a valid bus location (this prevents UI flashing during retries)
            setUpdating(true);
            if (busLocation) {
                // Don't clear existing errors if we already have a location
                // This prevents error messages from flashing during retries
            } else {
                setError(null);
            }

            const data = await fetchBusLocation();

            // Check if API returned an error object
            if (data && data.error) {
                throw new Error(data.error);
            }

            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }

            // Use the selectedBusIndex instead of hardcoded index 2
            const activeBus = data[selectedBusIndex];

            if (!activeBus) {
                throw new Error(`No active bus data available for Bus ${selectedBusIndex}`);
            }

            if (activeBus.valid &&
                typeof activeBus.latitude === 'number' &&
                typeof activeBus.longitude === 'number' &&
                activeBus.latitude !== 0 &&
                activeBus.longitude !== 0) {

                // Log current location
                console.log('Current Location:', {
                    bus: `Bus ${selectedBusIndex}`,
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude,
                    timestamp: new Date().toLocaleTimeString()
                });

                const currentTime = new Date();
                setLastUpdated(currentTime.toLocaleTimeString());

                // Set bus info for the marker
                setBusInfo({
                    title: activeBus.name || `KL18G45${selectedBusIndex + 23}`, // Generate a bus number if none exists
                    description: `Last updated: ${currentTime.toLocaleTimeString()}`
                });

                // Clear any previous errors since we now have valid data
                setError(null);

                // Set the location with appropriate delta values for map zoom
                setBusLocation({
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            } else {
                // Don't throw error for invalid location if we already have a valid one
                // Just log it and continue using the previous location
                if (!busLocation) {
                    throw new Error(`Invalid location data for Bus ${selectedBusIndex}`);
                } else {
                    console.log(`Received invalid location data for Bus ${selectedBusIndex}, using previous location`);
                }
            }
        } catch (err) {
            // Only update the error state if this is an initial load or a serious error
            if (!err.message.includes('aborted')) {
                // Only show errors to the user if we don't have a valid location yet
                // or if we've been failing for multiple attempts
                if (!busLocation) {
                    setError(`Unable to get Bus ${selectedBusIndex} location: ${err.message}`);
                } else {
                    // For temporary errors when we already have a location,
                    // just log them without showing to the user
                    console.warn('Temporary location update error:', {
                        bus: `Bus ${selectedBusIndex}`,
                        error: err.message,
                        continuingWithPreviousLocation: true
                    });
                }

                console.error('Location Update Error:', {
                    bus: `Bus ${selectedBusIndex}`,
                    error: err.message,
                    lastKnownLocation: busLocation ? {
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude
                    } : 'No previous location data'
                });
            }
        } finally {
            setLoading(false);
            setUpdating(false);
        }
    };

    // Track consecutive failures
    const [failureCount, setFailureCount] = useState(0);
    const maxRetryAttempts = 5;

    // Function to handle retries with exponential backoff
    const retryWithBackoff = async (retryCount = 0) => {
        try {
            // Update failure tracking
            setFailureCount(prev => prev + 1);

            // Calculate backoff delay (2^retryCount * 1000ms)
            const delay = Math.min(Math.pow(2, retryCount) * 1000, 10000); // Cap at 10 seconds

            console.log(`Retry attempt ${retryCount + 1} with ${delay}ms delay for Bus ${selectedBusIndex}`);

            // Wait for the backoff period
            await new Promise(resolve => setTimeout(resolve, delay));

            // Try again
            await updateBusLocation();

            // Reset failure count on success
            setFailureCount(0);
        } catch (err) {
            console.error(`Retry ${retryCount + 1} failed for Bus ${selectedBusIndex}:`, err.message);

            // If we haven't reached max retries, try again
            if (retryCount < maxRetryAttempts) {
                retryWithBackoff(retryCount + 1);
            } else {
                console.error(`Max retries (${maxRetryAttempts}) reached for Bus ${selectedBusIndex}. Giving up.`);
            }
        }
    };

    useEffect(() => {
        // Reset state when bus index changes
        setBusLocation(null);
        setError(null);
        setLoading(true);
        setFailureCount(0);
        setBusInfo({ title: `Bus ${selectedBusIndex}`, description: "Loading..." });

        // Initial fetch to get the current location
        updateBusLocation().catch(err => {
            console.error(`Initial location fetch failed for Bus ${selectedBusIndex}:`, err.message);
            // If initial fetch fails, try again with backoff
            retryWithBackoff();
        });

        // Set up interval for subsequent updates
        // Use a longer interval (5 seconds) to reduce network load
        const intervalId = setInterval(updateBusLocation, 5000);
        return () => clearInterval(intervalId);
    }, [selectedBusIndex]); // Re-run when selectedBusIndex changes

    if (loading && !busLocation) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading Bus {selectedBusIndex} location...</Text>
                {failureCount > 0 && (
                    <Text style={styles.retryText}>
                        Connection attempts: {failureCount}
                        {failureCount >= 3 ? "\nStill trying to connect..." : ""}
                    </Text>
                )}
            </View>
        );
    }

    // Don't render the map until we have a valid location
    if (!busLocation) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>
                    Unable to get Bus {selectedBusIndex} location. Please check your connection.
                </Text>
                <View style={styles.retryButtonContainer}>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setLoading(true);
                            updateBusLocation();
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
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
                    title={busInfo.title}
                    description={busInfo.description}
                >
                    <Image
                        source={require('../assets/images/bus-icon.png')}
                        style={styles.busIcon}
                        resizeMode="contain"
                    />
                </Marker>
            </MapView>

            {updating && (
                <View style={[styles.updatingContainer, { top: error ? 70 : 10 }]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.updatingText}>Updating Bus {selectedBusIndex} location...</Text>
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {busLocation && (
                        <Text style={[styles.updatingText, { fontSize: 12 }]}>
                            Using last known position. Auto-updating...
                        </Text>
                    )}
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
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    retryText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
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
        color: 'red',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
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
    busIcon: {
        width: 40,
        height: 40,
    },
    retryButtonContainer: {
        marginTop: 20,
    },
    retryButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default Bus;