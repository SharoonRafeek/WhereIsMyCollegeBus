
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchMockLocationData } from '../services/mockApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Adjust sizes based on screen width
const scale = SCREEN_WIDTH / 375; // 375 is the base width we're designing for
const normalize = (size) => Math.round(scale * size);

const STOPS = [
    { name: 'Perambra', distance: '0 KM' },
    { name: 'Anchampeedi', distance: '5.2 KM' },
    { name: 'Meppayur', distance: '7.4 KM' },
    { name: 'Iringath', distance: '10.9 KM' },

    { name: 'Payyoli Angadi', distance: '13.9 KM' },
    { name: 'Attakund', distance: '16 KM' },
    { name: 'CEV', distance: '22 KM' },
];

const TransitScreen = () => {
    const [busPosition, setBusPosition] = useState(0);
    const [currentStopIndex, setCurrentStopIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const updateBusLocation = async () => {
            try {
                const data = await fetchMockLocationData();

                if (data.currentStopIndex >= STOPS.length - 1) {
                    setCurrentStopIndex(STOPS.length - 1);
                    setBusPosition(1);
                } else {
                    setBusPosition(data.progress);
                    setCurrentStopIndex(data.currentStopIndex);
                }
            } catch (error) {
                console.error('Error fetching location:', error);
            }
        };

        const interval = setInterval(updateBusLocation, 1000);
        return () => clearInterval(interval);
    }, []);

    const renderStop = (stop, index) => {
        const isCurrent = index === currentStopIndex;
        const isPassed = index < currentStopIndex;
        const isLastStop = index === STOPS.length - 1;

        return (
            <View key={stop.name} style={styles.stopContainer}>
                <View style={styles.iconContainer}>
                    <View style={[styles.dot, (isPassed || isCurrent) && styles.passedDot]} />
                    {((index === currentStopIndex && busPosition < 1) || (isLastStop && currentStopIndex === STOPS.length - 1)) && (
                        <View style={[styles.busIconContainer, { top: isLastStop ? '0%' : `${busPosition * 100}%`, zIndex: 2 }]}>
                            <View style={styles.busIconCircle}>
                                <MaterialIcons name="directions-bus" size={normalize(16)} color="white" />
                            </View>
                        </View>
                    )}
                    {index < STOPS.length - 1 && <View style={styles.line} />}
                </View>
                <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <Text style={styles.stopDistance}>{stop.distance}</Text>
                </View>
                <View style={styles.timeInfo}>
                    <Text style={styles.delayTime}>
                        {isCurrent ? 'Now' : !isPassed ? 'Delay : 5 m' : ''}
                    </Text>
                    <Text style={styles.departureTime}>
                        {(8 + Math.floor(index * 0.1)).toString().padStart(2, '0')} : {((index * 5) % 60).toString().padStart(2, '0')}
                    </Text>
                </View>
            </View>
        );
    };

    const driverDetails = {
        name: "John Doe",
        licenseNumber: "L123456",
        phoneNumber: "+1234567890",
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={['#1A81FF', '#0D47A1']}
                        style={styles.header}
                    >
                        <View style={styles.appBar}>
                            <MaterialIcons name="arrow-back" size={normalize(24)} color="white" style={styles.backButton} />
                            <TouchableOpacity onPress={() => setModalVisible(true)}>
                                <MaterialIcons name="info-outline" size={normalize(24)} color="white" style={styles.infoButton} />
                            </TouchableOpacity>
                        </View>
                        <Image
                            source={require('../assets/images/raah.png')} // Adjust the path based on your project structure
                            style={styles.logo}
                        />
                    </LinearGradient>
                </View>

                <View style={styles.busInfo}>
                    <View style={styles.busInfoItem}>
                        <Text style={styles.busInfoLabel}>Bus No</Text>
                        <Text style={styles.busInfoValue}>05</Text>
                    </View>
                    <View style={styles.busInfoItem}>
                        <Text style={styles.busInfoLabel}>Location</Text>
                        <Text style={styles.busInfoValue}>{STOPS[currentStopIndex].name}</Text>
                    </View>
                    <View style={styles.busInfoItem}>
                        <Text style={styles.busInfoLabel}>Time</Text>
                        <Text style={styles.busInfoValue}>09 min</Text>
                    </View>
                </View>

                <View style={styles.stopsContainer}>
                    <View style={styles.stopsHeader}>
                        <Text style={styles.stopsTitle}>Stops</Text>
                        <Text style={styles.departureTitle}>Departure</Text>
                    </View>
                    <ScrollView>
                        {STOPS.map(renderStop)}
                    </ScrollView>
                </View>

                {/* Modal for Bus Driver Details */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Bus Driver Details</Text>
                            <Text style={styles.modalText}>Name: {driverDetails.name}</Text>
                            <Text style={styles.modalText}>License Number: {driverDetails.licenseNumber}</Text>
                            <Text style={styles.modalText}>Phone Number: {driverDetails.phoneNumber}</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1A81FF', // Change this color to match the app's primary color
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        height: normalize(180),
        justifyContent: 'flex-start',
        backgroundColor: '#2196F3',
        borderBottomLeftRadius: normalize(20),
        borderBottomRightRadius: normalize(20),
        paddingHorizontal: normalize(16),
    },
    appBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: normalize(0),
    },
    backButton: {
        padding: normalize(8),
    },
    infoButton: {
        padding: normalize(8),
    },
    logo: {
        width: 100,  // Adjust the width as needed
        height: 100, // Adjust the height as needed
        resizeMode: 'contain', // Maintain the original aspect ratio
        marginTop: -15, // Add some spacing below the logo
        alignSelf: 'center', // Center the logo horizontally
    },
    busInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: normalize(15),
        marginHorizontal: normalize(16),
        padding: normalize(14),
        elevation: 8, // Adjust this value for shadow depth on Android
        position: 'absolute',
        top: normalize(150),
        left: normalize(4),
        right: normalize(4),
        shadowColor: '#000', // Shadow color
        shadowOffset: { width: 0, height: 2 }, // Shadow offset
        shadowOpacity: 0.25, // Shadow opacity
        shadowRadius: 3.5, // Shadow radius
    },
    busInfoItem: {
        flex: 1,
        alignItems: 'center',
    },
    busInfoLabel: {
        fontSize: normalize(12),
        color: '#888',
        textAlign: 'center',
    },
    busInfoValue: {
        fontSize: normalize(16),
        fontWeight: 'bold',
        textAlign: 'center',
    },
    stopsContainer: {
        flex: 1,
        marginTop: normalize(60),
        backgroundColor: '#fff',
        paddingHorizontal: normalize(16),
    },
    stopsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: normalize(8),
    },
    stopsTitle: {
        fontWeight: 'bold',
        fontSize: normalize(14),
    },
    departureTitle: {
        fontWeight: 'bold',
        fontSize: normalize(14),
    },
    stopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: normalize(8),
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center', // Align dot to the center vertically
        marginRight: normalize(16),
        width: normalize(24),
        height: normalize(40), // Make sure the height matches the line and the place names
    },
    busIconContainer: {
        position: 'absolute',
        left: 0,
        zIndex: 2,
    },
    busIconCircle: {
        backgroundColor: '#2196F3',
        borderRadius: normalize(12),
        width: normalize(24),
        height: normalize(24),
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        width: normalize(12),
        height: normalize(12),
        borderRadius: normalize(6),
        backgroundColor: '#BDBDBD',
        zIndex: 1,
    },
    passedDot: {
        backgroundColor: '#4CAF50',
    },
    line: {
        position: 'absolute',
        width: normalize(2),
        top: normalize(15), // Start the line from the center of the dot (dot height is 12, so half is 6)
        bottom: normalize(-36), // The bottom of the line remains the same
        left: normalize(11), // Align the line horizontally with the center of the dot
        backgroundColor: '#BDBDBD',
        zIndex: 0,
    },
    stopInfo: {
        flex: 1,
        justifyContent: 'center', // Center vertically for alignment with the dot
    },
    stopName: {
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
    stopDistance: {
        fontSize: normalize(14),
        color: '#888',
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    delayTime: {
        fontSize: normalize(12),
        color: 'red',
    },
    departureTime: {
        fontSize: normalize(14),
        color: '#888',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalContent: {
        width: normalize(300),
        backgroundColor: 'white',
        borderRadius: normalize(10),
        padding: normalize(20),
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        marginBottom: normalize(10),
    },
    modalText: {
        fontSize: normalize(14),
        marginBottom: normalize(5),
    },
    closeButton: {
        marginTop: normalize(10),
        padding: normalize(10),
        backgroundColor: '#2196F3',
        borderRadius: normalize(5),
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});


export default TransitScreen;

