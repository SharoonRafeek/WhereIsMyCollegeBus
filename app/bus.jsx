import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image, TouchableOpacity, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_OPENSTREETMAP, Polyline, Circle } from 'react-native-maps';
import { fetchBusLocation } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

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

    // Add state for user's location
    const [userLocation, setUserLocation] = useState(null);

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

    // Add place name function
    const getPlaceNameFromCoordinates = async (latitude, longitude) => {
        try {
            const locations = await Location.reverseGeocodeAsync({
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            });

            if (locations && locations.length > 0) {
                const location = locations[0];

                // Construct a formatted address string based on available fields
                const addressParts = [];

                if (location.name) addressParts.push(location.name);
                if (location.street) addressParts.push(location.street);
                if (location.district) addressParts.push(location.district);
                if (location.city) addressParts.push(location.city);
                if (location.region) addressParts.push(location.region);

                // Join address parts that are available
                let formattedAddress = addressParts.join(', ');

                // If no address parts are available, use coordinates as fallback
                if (!formattedAddress) {
                    formattedAddress = `${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}`;
                }

                return {
                    name: formattedAddress,
                    latitude,
                    longitude
                };
            }

            // Fallback to original function if reverse geocoding fails
            return formatLocationFromCoordinates(latitude, longitude);
        } catch (error) {
            console.error('Error in reverse geocoding:', error);
            // Return original functionality if there's an error
            return formatLocationFromCoordinates(latitude, longitude);
        }
    };

    // Function to get user's current location
    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        } catch (error) {
            console.error('Error getting user location:', error);
        }
    };

    // Function to update the transit line with the current location
    const updateTransitLine = async (activeBus) => {
        if (!activeBus || !activeBus.latitude || !activeBus.longitude) return;

        // Get the actual location based on coordinates
        const locationInfo = await getPlaceNameFromCoordinates(activeBus.latitude, activeBus.longitude);

        // Get time in readable format
        const timeStr = new Date().toLocaleTimeString();

        // Get formatted distance values with fallbacks
        const distanceToday = parseFloat(activeBus.attributes?.distanceForday || 0).toFixed(2);
        const totalDistance = parseFloat(activeBus.attributes?.totalDistance || 0).toFixed(2);

        // Set the current location info with all API data
        setCurrentLocationInfo({
            ...locationInfo,
            lastUpdated: timeStr,

            // Use actual values from API
            speed: activeBus.speed || 0,
            heading: activeBus.course || 0,

            // Status information
            status: activeBus.status || "UNKNOWN",
            connection: activeBus.attributes?.connection_status || "unknown",
            motion: activeBus.attributes?.motion ? "Moving" : "Stationary",
            ignition: activeBus.attributes?.ignition ? "On" : "Off",

            // Distance information
            distanceToday: distanceToday,
            totalDistance: totalDistance,
            mileage: activeBus.attributes?.mileage || "N/A",

            // Device information
            deviceId: activeBus.deviceId || "N/A",
            uniqueId: activeBus.uniqueId || "N/A",
            fixTime: activeBus.fixTime || timeStr,
            model: activeBus.model || "N/A",

            // Additional information
            category: activeBus.category || "N/A",
            expireDate: activeBus.attributes?.expiredate || "N/A"
        });

        // Add the current position to the bus path (limit to last 100 points to prevent memory issues)
        setBusPath(prevPath => {
            const newPath = [
                ...(prevPath || []),
                { latitude: activeBus.latitude, longitude: activeBus.longitude, timestamp: timeStr }
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
                    bus: activeBus.name || `Bus ${selectedBusIndex}`,
                    latitude: activeBus.latitude,
                    longitude: activeBus.longitude,
                    timestamp: new Date().toLocaleTimeString()
                });

                const currentTime = new Date();
                setLastUpdated(currentTime.toLocaleTimeString());

                // Set bus info for the marker with full API data
                setBusInfo({
                    title: activeBus.name || `KL18G45${selectedBusIndex + 23}`, // Generate a bus number if none exists
                    description: `Last updated: ${currentTime.toLocaleTimeString()}`,
                    ...activeBus // Store all API data
                });

                // Update the transit line with the current location and API data
                await updateTransitLine(activeBus);

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
        // Get user's location
        getUserLocation();

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
                        <View style={styles.locationHeader}>
                            <View style={styles.locationNameContainer}>
                                <Text style={styles.locationName}>{busInfo.title || "Bus"}</Text>
                                <Text style={styles.placeName} numberOfLines={2} ellipsizeMode="tail">
                                    {currentLocationInfo.name}
                                </Text>
                            </View>

                            <View style={[
                                styles.statusBadge,
                                currentLocationInfo.status === "STOPPED" ? styles.stoppedBadge : styles.movingBadge
                            ]}>
                                <Text style={styles.statusText}>{currentLocationInfo.status || "UNKNOWN"}</Text>
                            </View>
                        </View>

                        {/* Status Indicators */}
                        <View style={styles.featuresRow}>
                            <View style={styles.featureBadge}>
                                <Ionicons
                                    name={currentLocationInfo.status === "STOPPED" ? "stop-circle" : "car"}
                                    size={14}
                                    color={currentLocationInfo.status === "STOPPED" ? "#FF6F00" : "#4CAF50"}
                                />
                                <Text style={styles.featureText}>
                                    {currentLocationInfo.motion || (currentLocationInfo.status === "STOPPED" ? "Stationary" : "Moving")}
                                </Text>
                            </View>

                            <View style={styles.featureBadge}>
                                <Ionicons
                                    name="wifi"
                                    size={14}
                                    color={currentLocationInfo.connection === "online" ? "#4CAF50" : "#F44336"}
                                />
                                <Text style={styles.featureText}>{currentLocationInfo.connection}</Text>
                            </View>

                            <View style={styles.featureBadge}>
                                <Ionicons name="time" size={14} color="#2196F3" />
                                <Text style={styles.featureText}>{currentLocationInfo.lastUpdated}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Speed</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.speed} km/h</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Heading</Text>
                                <Text style={styles.infoValue}>
                                    {typeof currentLocationInfo.heading === 'number'
                                        ? currentLocationInfo.heading.toFixed(1)
                                        : currentLocationInfo.heading}°
                                </Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Today</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.distanceToday} km</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Total</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.totalDistance} km</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Device ID</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.deviceId}</Text>
                            </View>

                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Category</Text>
                                <Text style={styles.infoValue}>{currentLocationInfo.category}</Text>
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

            {/* Location Button */}
            <TouchableOpacity
                style={styles.locationButton}
                onPress={getUserLocation}
            >
                <Ionicons name="locate" size={24} color="white" />
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
                initialRegion={busLocation}
            >
                {/* User location marker */}
                {userLocation && (
                    <>
                        {/* Circle showing accuracy radius */}
                        <Circle
                            center={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                            }}
                            radius={100} // 100 meters radius
                            fillColor="rgba(0, 0, 255, 0.1)"
                            strokeColor="rgba(0, 0, 255, 0.3)"
                            strokeWidth={2}
                        />
                        {/* User location marker */}
                        <Marker
                            coordinate={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                            }}
                            title="Your Location"
                            description="You are here"
                            pinColor="#1E88E5"
                        >
                            <View style={styles.userLocationMarker}>
                                <View style={styles.userLocationDot} />
                            </View>
                        </Marker>
                    </>
                )}

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
                    description={currentLocationInfo ? currentLocationInfo.name : busInfo.description}
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
        color: '#333',
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

    // Location button
    locationButton: {
        position: 'absolute',
        top: 40,
        right: 15,
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

    // User location marker
    userLocationMarker: {
        height: 24,
        width: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(30, 136, 229, 0.3)',
        borderWidth: 1,
        borderColor: '#1E88E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userLocationDot: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: '#1E88E5',
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
        padding: 15,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    locationNameContainer: {
        flex: 1,
        marginRight: 10,
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    placeName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    coordinates: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    movingBadge: {
        backgroundColor: '#4CAF50',
    },
    stoppedBadge: {
        backgroundColor: '#FF6F00',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    featuresRow: {
        flexDirection: 'row',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    featureText: {
        fontSize: 12,
        color: '#333',
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        marginVertical: 8,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    infoItem: {
        width: '50%',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    }
});

export default Bus;