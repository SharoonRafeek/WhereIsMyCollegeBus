import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchMockLocationData } from '../../services/mockApi.js'; // Import the mock service

// CEV coordinates
const CEV_COORDINATES = {
    latitude: 11.5644,
    longitude: 75.6508,
};

// Tolerance in degrees (adjust as needed)
const TOLERANCE = 0.001; // Approximately 100 meters

export default function App() {
    const [location, setLocation] = useState({ latitude: 11.5000, longitude: 75.5000 });
    const [status, setStatus] = useState('En route');
    const intervalRef = useRef(null); // Use a ref to store interval ID

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchMockLocationData();

                // Extract the bus data (only one item in this mock service)
                const busData = data[0];

                if (busData && busData.latitude && busData.longitude) {
                    const currentLocation = {
                        latitude: busData.latitude,
                        longitude: busData.longitude,
                    };

                    setLocation(currentLocation);

                    // Check if the bus has reached CEV
                    if (
                        Math.abs(currentLocation.latitude - CEV_COORDINATES.latitude) <= TOLERANCE &&
                        Math.abs(currentLocation.longitude - CEV_COORDINATES.longitude) <= TOLERANCE
                    ) {
                        setStatus('Reached');
                        // Clear interval when reached
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null; // Reset intervalRef
                        }
                    } else {
                        setStatus('En route');
                    }
                }
            } catch (error) {
                console.error('Error loading location data:', error);
            }
        };

        // Fetch data initially
        loadData();

        // Set interval to fetch location data every 1 second
        intervalRef.current = setInterval(loadData, 1000);

        // Cleanup function to clear the interval on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []); // Empty dependency array, this useEffect runs only once on mount

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Status: {status}</Text>
            <Text style={styles.text}>Latitude: {location.latitude.toFixed(6)}</Text>
            <Text style={styles.text}>Longitude: {location.longitude.toFixed(6)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 20,
        margin: 10,
    },
});
