// import React, { useEffect, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import { MaterialIcons } from '@expo/vector-icons'; // Import MaterialIcons for bus icon

// export function TabBar({ state, descriptors, navigation }) {
//     const icon = {
//         home: 'home',
//         bus: 'directions-bus', // Changed to a real bus icon from MaterialIcons
//         alert: 'bell',
//         profile: 'user',
//     };

//     return (
//         <View style={styles.tabbar}>
//             {state.routes.map((route, index) => {
//                 const { options } = descriptors[route.key];
//                 const label =
//                     options.tabBarLabel !== undefined
//                         ? options.tabBarLabel
//                         : options.title !== undefined
//                             ? options.title
//                             : route.name;

//                 const isFocused = state.index === index;

//                 // Animation references
//                 const scaleValue = useRef(new Animated.Value(1)).current;
//                 const backgroundColor = isFocused ? '#e0e8ff' : 'transparent';
//                 const iconColor = isFocused ? '#3b82f6' : '#8e8e8e';

//                 const onPress = () => {
//                     const event = navigation.emit({
//                         type: 'tabPress',
//                         target: route.key,
//                         canPreventDefault: true,
//                     });

//                     if (!isFocused && !event.defaultPrevented) {
//                         navigation.navigate(route.name, route.params);
//                     }
//                 };

//                 const onLongPress = () => {
//                     navigation.emit({
//                         type: 'tabLongPress',
//                         target: route.key,
//                     });
//                 };

//                 // Animate scaling when focused
//                 useEffect(() => {
//                     Animated.spring(scaleValue, {
//                         toValue: isFocused ? 1.2 : 1,
//                         useNativeDriver: true,
//                     }).start();
//                 }, [isFocused]);

//                 return (
//                     <TouchableOpacity
//                         key={route.name}
//                         accessibilityRole="button"
//                         accessibilityState={isFocused ? { selected: true } : {}}
//                         accessibilityLabel={options.tabBarAccessibilityLabel}
//                         testID={options.tabBarTestID}
//                         onPress={onPress}
//                         onLongPress={onLongPress}
//                         style={[styles.tabbarItem, { backgroundColor }]}
//                     >
//                         <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
//                             {route.name === 'bus' ? (
//                                 <MaterialIcons name={icon[route.name]} size={24} color={iconColor} />
//                             ) : (
//                                 <Feather name={icon[route.name]} size={24} color={iconColor} />
//                             )}
//                         </Animated.View>
//                         {isFocused && <Text style={[styles.label, { color: iconColor }]}>{label}</Text>}
//                     </TouchableOpacity>
//                 );
//             })}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     tabbar: {
//         backgroundColor: '#f6f6f6',
//         position: 'absolute',
//         bottom: 0,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingVertical: 10,
//         paddingHorizontal: 10,
//         shadowColor: 'black',
//         shadowOffset: { width: 0, height: 10 },
//         shadowRadius: 20,
//         shadowOpacity: 0.1,
//         elevation: 5, // Add shadow for Android
//     },
//     tabbarItem: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderRadius: 20,
//         paddingVertical: 10,
//         paddingHorizontal: 15,
//         marginHorizontal: 5,
//     },
//     label: {
//         marginTop: 5,
//         fontSize: 12,
//     },
// });

// export default TabBar;

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

export function TabBar({ state, descriptors, navigation }) {
    const icon = {
        home: 'home',
        bus: 'directions-bus',
        alert: 'bell',
        profile: 'user',
    };

    const animatedValues = useRef(state.routes.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.parallel(
            state.routes.map((_, i) =>
                Animated.timing(animatedValues[i], {
                    toValue: i === state.index ? 1 : 0,
                    duration: 200,
                    useNativeDriver: false,
                })
            )
        ).start();
    }, [state.index]);

    return (
        <View style={styles.tabbar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;
                const isFirstItem = index === 0;
                const isLastItem = index === state.routes.length - 1;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                const animatedWidth = animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['20%', '28%'],
                });

                const animatedBackgroundColor = animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['transparent', '#e0e8ff'],
                });

                const iconColor = isFocused ? '#3b82f6' : '#8e8e8e';

                return (
                    <Animated.View
                        key={route.name}
                        style={[
                            styles.tabbarItem,
                            {
                                width: animatedWidth,
                                backgroundColor: animatedBackgroundColor,
                                marginLeft: isFirstItem ? 16 : 0,
                                marginRight: isLastItem ? 16 : 0,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.touchable}
                        >
                            <View style={styles.iconLabelContainer}>
                                {route.name === 'bus' ? (
                                    <MaterialIcons name={icon[route.name]} size={28} color={iconColor} />
                                ) : (
                                    <Feather name={icon[route.name]} size={28} color={iconColor} />
                                )}
                                {isFocused && <Text style={[styles.label, { color: iconColor }]}>{label}</Text>}
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabbar: {
        flexDirection: 'row',
        backgroundColor: '#f6f6f6',
        height: 72, // Increased height
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 8, // Added vertical padding
    },
    tabbarItem: {
        height: 52, // Increased height
        borderRadius: 26, // Adjusted to match new height
        justifyContent: 'center',
        alignItems: 'center',
    },
    touchable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    iconLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    label: {
        marginLeft: 4,
        fontSize: 16,
        fontWeight: '500',
    },
});

export default TabBar;