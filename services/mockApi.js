
const STOPS = [
    { name: 'Perambra', coords: { latitude: 11.5640, longitude: 75.7564 } },
    { name: 'Valiyakode', coords: { latitude: 11.5525, longitude: 75.7459 } },
    { name: 'Meppayur', coords: { latitude: 11.5250, longitude: 75.7206 } },
    { name: 'Manhakulam', coords: { latitude: 11.5248, longitude: 75.7046 } },
    { name: 'Thurayur', coords: { latitude: 11.5239, longitude: 75.6732 } },
    { name: 'Kurunthodi', coords: { latitude: 11.5586, longitude: 75.6470 } },
    { name: 'CEV', coords: { latitude: 11.5644, longitude: 75.6508 } },
];

let currentStopIndex = 0;
let progress = 0;

export const fetchMockLocationData = () => {
    const currentStop = STOPS[currentStopIndex];
    const nextStop = STOPS[currentStopIndex + 1];

    if (nextStop) {
        const latDiff = nextStop.coords.latitude - currentStop.coords.latitude;
        const lonDiff = nextStop.coords.longitude - currentStop.coords.longitude;

        progress += 0.99;

        if (progress >= 1) {
            currentStopIndex++;
            progress = 0;
        } else {
            const currentLat = currentStop.coords.latitude + latDiff * progress;
            const currentLon = currentStop.coords.longitude + lonDiff * progress;

            return Promise.resolve({
                coords: { latitude: currentLat, longitude: currentLon },
                currentStopIndex: currentStopIndex,
                nextStopIndex: currentStopIndex + 1,
                progress: progress
            });
        }
    }

    return Promise.resolve({
        coords: STOPS[currentStopIndex].coords,
        currentStopIndex: currentStopIndex,
        nextStopIndex: currentStopIndex,
        progress: 1
    });
};