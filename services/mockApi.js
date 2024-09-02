// mockApiService.js
let busCoordinates = {
    latitude: 11.5400, // Starting mock locatio
    longitude: 75.6200, // Starting mock location
};

// CEV coordinates
const CEV_COORDINATES = {
    latitude: 11.5644,
    longitude: 75.6508,
};

// Tolerance in degrees (adjust as needed)
const TOLERANCE = 0.001; // Approximately 100 meters

// Function to simulate bus movement
export const fetchMockLocationData = () => {
    // Move the bus a small distance towards CEV
    const latDiff = CEV_COORDINATES.latitude - busCoordinates.latitude;
    const longDiff = CEV_COORDINATES.longitude - busCoordinates.longitude;

    busCoordinates = {
        latitude: busCoordinates.latitude + latDiff * 0.01,
        longitude: busCoordinates.longitude + longDiff * 0.01,
    };

    // Simulate a response with the bus's current coordinates
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { latitude: busCoordinates.latitude, longitude: busCoordinates.longitude }
            ]);
        }, 500); // Simulate network delay
    });
};
