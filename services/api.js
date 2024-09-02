// apiService.js
const API_URL = 'https://api.example.com/location'; // API URL

// Basic Authentication credentials
const username = '';
const password = '';

// Function to fetch location data
export const fetchLocationData = async () => {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': 'Basic ' + btoa(`${username}:${password}`),
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching location data:', error);
        throw error;
    }
};
