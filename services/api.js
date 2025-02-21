import axios from 'axios';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import * as Network from 'expo-network';

const USERNAME = '9961446758';
const PASSWORD = '123456';
const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

export const fetchBusLocation = async () => {
    try {
        console.log(`Fetching bus locations on ${Platform.OS}...`);

        // Get detailed network info for debugging
        const networkInfo = await Network.getNetworkStateAsync();
        console.log('Network state:', JSON.stringify(networkInfo));

        // Try alternate protocol and port combinations
        const apiHost = 'login.airotrack.in';
        const endpoints = [
            `https://${apiHost}:8082/api/positions`,  // Original endpoint
            `http://${apiHost}:8082/api/positions`,   // Try HTTP (less secure)
            `https://${apiHost}/api/positions`,       // Try default HTTPS port
        ];

        const queryParams = 'status=ALL&isAddressRequired=false&limit=80&offset=0';

        // Try each endpoint combination
        for (const baseUrl of endpoints) {
            const fullUrl = `${baseUrl}?${queryParams}`;
            console.log(`Attempting: ${fullUrl}`);

            try {
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${basicAuth}`,
                        'Accept': 'application/json'
                    },
                    // Lower timeout for faster testing
                    timeout: 5000
                });

                console.log(`Response status: ${response.status}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('API call succeeded!');
                    return data;
                }
            } catch (endpointError) {
                console.log(`Endpoint ${baseUrl} failed:`, endpointError.message);
                // Continue to next endpoint
            }
        }

        // If we're on Android and all direct attempts failed, try a workaround
        if (Platform.OS === 'android') {
            console.log('All direct endpoints failed, trying workaround...');

            // Option 1: Try with a public CORS proxy (for testing only)
            // WARNING: This sends your auth credentials through a third party
            // NOT recommended for production!
            try {
                const corsProxyUrl = `https://cors-anywhere.herokuapp.com/https://${apiHost}:8082/api/positions?${queryParams}`;
                console.log('Attempting CORS proxy (for testing only)');

                const proxyResponse = await fetch(corsProxyUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${basicAuth}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (proxyResponse.ok) {
                    const data = await proxyResponse.json();
                    console.log('Proxy approach succeeded');
                    return data;
                }
            } catch (proxyError) {
                console.log('Proxy attempt failed:', proxyError.message);
            }
        }

        // If all attempts failed
        throw new Error('All connection attempts failed');

    } catch (error) {
        console.error(`API Error (${Platform.OS}):`, error.message);

        // Return a structured error object
        return {
            error: 'Unable to connect to bus tracking service',
            details: error.message,
            platform: Platform.OS
        };
    }
};