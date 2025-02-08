import axios from 'axios';
import { Buffer } from 'buffer'; // Add Buffer for base64 encoding

const USERNAME = '9961446758';
const PASSWORD = '123456';

const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

export const fetchBusLocation = async () => {
    try {
        console.log('Fetching bus locations...');

        const config = {
            auth: { username: USERNAME, password: PASSWORD },
            timeout: 10000,
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        };

        const apiUrl = 'https://login.airotrack.in:8082/api/positions';
        const queryParams = 'status=ALL&isAddressRequired=false&limit=80&offset=0';
        const fullUrl = `${apiUrl}?${queryParams}`;

        try {
            const response = await axios.get(fullUrl, config);
            return response.data;
        } catch (axiosError) {
            console.log('Axios error, trying fetch...');

            const fetchResponse = await fetch(fullUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${basicAuth}` // Pre-encoded credentials
                }
            });

            if (!fetchResponse.ok) throw new Error(`HTTP error! status: ${fetchResponse.status}`);
            return await fetchResponse.json();
        }
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
};