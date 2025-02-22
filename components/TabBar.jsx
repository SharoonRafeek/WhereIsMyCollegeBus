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

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function TabBar({ state, descriptors, navigation }) {
  // Define tab icons and labels based on the image
  const tabConfig = [
    { name: 'home', icon: 'home', label: 'Home' },
    { name: 'bus-pass', icon: 'bus-outline', label: 'Bus Pass' },
    { name: 'fee', icon: 'document-text-outline', label: 'Fee' },
    { name: 'account', icon: 'person-outline', label: 'Account' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabConfig.map((tab, index) => {
        const { options } = descriptors[state.routes[index].key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[index].key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(state.routes[index].name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons 
              name={isFocused ? tab.icon.replace('-outline', '') : tab.icon} 
              size={24} 
              color={isFocused ? '#FF7200' : '#666'} 
            />
            <Text 
              style={[
                styles.tabLabel,
                { color: isFocused ? '#FF7200' : '#666' }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  }
});

export default TabBar;