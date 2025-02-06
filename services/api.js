// services/api.js
import axios from 'axios';

const USERNAME = '9961446758';
const PASSWORD = '123456';

export const fetchBusLocation = async () => {
    try {
        console.log('Fetching bus locations...');

        const params = {
            status: 'ALL',
            isAddressRequired: false,
            limit: 80,
            offset: 0
        };

        const config = {
            auth: {
                username: USERNAME,
                password: PASSWORD
            },
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        try {
            console.log('Trying axios request...');
            const response = await axios.get(
                'https://login.airotrack.in:8082/api/positions?status=ALL&isAddressRequired=false&limit=80&offset=0',
                config
            );
            console.log('Axios request successful');
            return response.data;
        } catch (axiosError) {
            console.log('Axios error:', axiosError.message);

            // Fallback to fetch
            console.log('Trying fetch as fallback...');
            const fetchResponse = await fetch(
                'http://login.airotrack.in:8082/api/positions?status=ALL&isAddressRequired=false&limit=80&offset=0',
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`
                    }
                }
            );

            if (!fetchResponse.ok) {
                throw new Error(`HTTP error! status: ${fetchResponse.status}`);
            }

            const data = await fetchResponse.json();
            console.log('Fetch request successful');
            return data;
        }

    } catch (error) {
        console.error('API Error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        throw error;
    }
};
// const API_URL = 'https://login.airotrack.in:8082/api/positions?status=ALL&isAddressRequired=false&limit=80&offset=0#';
// const USERNAME = '9961446758';  // Replace with your actual username
// const PASSWORD = '123456'; 

// const API_URL = 'https://9961446758:123456@login.airotrack.in:8082/api/positions?status=ALL&isAddressRequired=false&limit=80&offset=0#';
