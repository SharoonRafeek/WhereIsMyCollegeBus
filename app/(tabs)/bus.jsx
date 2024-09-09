import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchMockLocationData } from '../../services/mockApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Adjust sizes based on screen width
const scale = SCREEN_WIDTH / 375; // 375 is the base width we're designing for
const normalize = (size) => Math.round(scale * size);

const STOPS = [
    { name: 'Perambra', distance: '0 KM' },
    { name: 'Valiyakode', distance: '2.5 KM' },
    { name: 'Meppayur', distance: '5 KM' },
    { name: 'Manhakulam', distance: '8 KM' },
    { name: 'Thurayur', distance: '10 KM' },
    { name: 'Kurunthodi', distance: '12 KM' },
    { name: 'CEV', distance: '14 KM' },
];

const TransitScreen = () => {
    const [busPosition, setBusPosition] = useState(0);
    const [currentStopIndex, setCurrentStopIndex] = useState(0);

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
                        <View style={[
                            styles.busIconContainer,
                            {
                                top: isLastStop ? '0%' : `${busPosition * 100}%`,
                                zIndex: 2
                            }
                        ]}>
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <MaterialIcons name="arrow-back" size={normalize(24)} color="white" />
                    <MaterialIcons name="info-outline" size={normalize(24)} color="white" />
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
                <View style={styles.stopsHeader}>
                    <Text style={styles.stopsTitle}>Stops</Text>
                    <Text style={styles.departureTitle}>Departure</Text>
                </View>
                <ScrollView style={styles.stopsContainer}>
                    {STOPS.map(renderStop)}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#2196F3',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: normalize(16),
        backgroundColor: '#2196F3',
    },
    busInfo: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: normalize(8),
        margin: normalize(16),
        padding: normalize(16),
        elevation: 4,
    },
    busInfoItem: {
        flex: 1,
    },
    busInfoLabel: {
        fontSize: normalize(12),
        color: '#888',
    },
    busInfoValue: {
        fontSize: normalize(16),
        fontWeight: 'bold',
    },
    stopsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(16),
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
    stopsContainer: {
        flex: 1,
    },
    stopContainer: {
        flexDirection: 'row',
        paddingVertical: normalize(8),
        paddingHorizontal: normalize(16),
        alignItems: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        marginRight: normalize(16),
        width: normalize(24),
        height: normalize(40),
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
        top: normalize(12),
        bottom: normalize(-28),
        left: normalize(11),
        backgroundColor: '#BDBDBD',
        zIndex: 0,
    },
    stopInfo: {
        flex: 1,
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
});

export default TransitScreen;