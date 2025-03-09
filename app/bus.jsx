import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image, TouchableOpacity, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_OPENSTREETMAP, Polyline } from 'react-native-maps';
import { fetchBusLocation } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const Bus = () => {
    // Get the busIndex parameter from the URL
    const { busIndex } = useLocalSearchParams();
    const router = useRouter();
    // Convert to number, default to index 2 if not provided (as in the original code)
    const selectedBusIndex = busIndex ? parseInt(busIndex) : 2;

    const [busLocation, setBusLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [busInfo, setBusInfo] = useState({ title: `Bus ${selectedBusIndex}`, description: "Loading..." });

    // Add new state variables for transit line
    const [busPath, setBusPath] = useState([]);
    const [currentLocationInfo, setCurrentLocationInfo] = useState(null);

    // Helper function to format coordinates into a readable location
    const formatLocationFromCoordinates = (latitude, longitude) => {
        // Format to 6 decimal places (approximately 0.1m precision)
        const lat = parseFloat(latitude).toFixed(6);
        const lng = parseFloat(longitude).toFixed(6);

        // For a real app, this would be a reverse geocoding call to get actual location name
        return {
            name: `${lat}, ${lng}`,
            latitude,
            longitude
        };
    };

    // Function to update the transit line with the current location
    const updateTransitLine = (latitude, longitude) => {
        // Get the actual location based on coordinates
        const locationInfo = formatLocationFromCoordinates(latitude, longitude);

        // Set the current location info
        setCurrentLocationInfo({
            ...locationInfo,
            lastUpdated: new Date().toLocaleTimeString(),
            speed: Math.round(Math.random() * 40) + 10, // Simulated speed in km/h
            heading: Math.round(Math.random() * 360) // Simulated heading in degrees
        });

        // Add the current position to the bus path (limit to last 100 points to prevent memory issues)
        setBusPath(prevPath => {
            const newPath = [
                ...prevPath,
                { latitude, longitude, timestamp: new Date().toLocaleTimeString() }
            ];
            // Keep only the last 100 points to prevent performance issues
            return newPath.length > 100 ? newPath.slice(-100) : newPath;
        });
    };

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

                // Update the transit line with the current location
                updateTransitLine(activeBus.latitude, activeBus.longitude);

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
        setBusPath([]); // Reset bus path
        setCurrentLocationInfo(null); // Reset current location info

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

    // Transit line component to display below the map
    const TransitLineView = () => {
        return (
            <View style={styles.transitLineContainer}>
                <View style={styles.transitHeader}>
                    <Text style={styles.transitLineTitle}>Live Location</Text>
                    <View style={styles.busNumberBadge}>
                        <Text style={styles.busNumberText}>{busInfo.title}</Text>
                    </View>
                </View>

                {currentLocationInfo ? (
                    <View style={styles.currentLocationContainer}>
                        <Text style={styles.locationLabel}>Current Coordinates:</Text>
                        <Text style={styles.locationCoordinates}>{currentLocationInfo.name}</Text>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Last Updated</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.lastUpdated}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Speed</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.speed} km/h</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Heading</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.heading}°</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Tracked Points</Text>
                                <Text style={styles.infoValue}>{busPath.length}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.loadingText}>Waiting for location data...</Text>
                    </View>
                )}
            </View>
        );
    };

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

    // Calculate the height of the map to leave room for the transit line
    const screenHeight = Dimensions.get('window').height;
    const transitLineHeight = 180; // Adjust based on the expected height of your transit line component
    const mapHeight = screenHeight - transitLineHeight;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <MapView
                style={[styles.map, { height: mapHeight }]}
                provider={PROVIDER_OPENSTREETMAP}
                region={busLocation}
                showsUserLocation={false}
                showsMyLocationButton={false}
                zoomEnabled={true}
                minZoomLevel={5}
                maxZoomLevel={19}
            >
                {/* Add Polyline to show the bus path on the map */}
                {busPath.length > 1 && (
                    <Polyline
                        coordinates={busPath}
                        strokeColor="#FF6F00"
                        strokeWidth={4}
                        lineDashPattern={[0]}
                    />
                )}

                {/* Bus Marker */}
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

            {/* Transit Line View */}
            <TransitLineView />

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
        backgroundColor: '#f5f5f5',
    },
    map: {
        width: Dimensions.get('window').width,
        // Height is set dynamically in the component
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
        color: 'white',
    },
    retryText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    errorContainer: {
        position: 'absolute',
        top: 60, // Adjusted to avoid overlap with back button
        left: 10,
        right: 10,
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        zIndex: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    errorText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
        fontWeight: '500',
    },
    updatingContainer: {
        position: 'absolute',
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        top: 60, // Adjusted to avoid overlap with back button
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
        backgroundColor: '#FF6F00', // Orange to match the transit line
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Back button
    backButton: {
        position: 'absolute',
        top: 40,
        left: 15,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 5,
    },

    // Transit line styles
    transitLineContainer: {
        backgroundColor: '#FF6F00', // More vibrant orange
        padding: 15,
        height: 180, // Fixed height for the transit line component
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    transitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    transitLineTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    busNumberBadge: {
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    busNumberText: {
        color: '#FF6F00',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    locationStatusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    inTransitDot: {
        backgroundColor: '#FFC107', // Yellow for in transit
    },
    atStopDot: {
        backgroundColor: '#4CAF50', // Green for at stop
    },
    currentLocationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    transitInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    locationInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    infoBadge: {
        backgroundColor: '#E0F2F1',
        padding: 8,
        borderRadius: 4,
        margin: 2,
        flex: 1,
    },
    infoText: {
        color: '#00796B',
        fontWeight: '500',
        fontSize: 12,
        textAlign: 'center',
    },
    pathContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        height: 60, // Give it a fixed height
    },
    continuousLine: {
        position: 'absolute',
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        top: 10, // Center with the path markers
        left: 20, // Start a bit in to align with the first marker
        right: 20, // End a bit in to align with the last marker
        zIndex: 0,
    },
    pathPoint: {
        alignItems: 'center',
        flex: 1,
        zIndex: 1, // Make sure this is above the line
    },
    pathMarker: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#666',
        marginBottom: 5,
    },
    currentPathMarker: {
        backgroundColor: '#2196F3',
        borderColor: 'white',
        width: 20,
        height: 20,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    passedPathMarker: {
        backgroundColor: '#81C784', // Light green
        borderColor: '#4CAF50',
    },
    pathPointText: {
        fontSize: 10,
        textAlign: 'center',
        color: 'white',
        paddingHorizontal: 2,
    },
    currentPathText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    passedPathText: {
        color: '#E8F5E9', // Very light green
    }
});

export default Bus;