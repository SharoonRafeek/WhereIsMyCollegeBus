// import React from 'react';
// import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// export default function BusPassPage() {
//   return (
//     <View style={styles.container}>
//       <View style={styles.topSection}>
//         <Ionicons name="arrow-back-outline" style={styles.backIcon} />
//         <Text style={styles.pageTitle}>Bus Pass</Text>
//       </View>

//       <View style={styles.cardContainer}>
//         <View style={styles.card}>
          
//           <View style={styles.cardDetails}>
//             <Text style={styles.cardTitle}>Bus Pass #12345</Text>
//             <Text style={styles.cardInfo}>Bus Route: Perambra - College</Text>
//             <Text style={styles.cardInfo}>Bus Timing: 8:05 AM - 8:45 AM</Text>
//             <Text style={styles.cardInfo}>Valid Until: 25th Jan 2025</Text>
//             <Text style={styles.cardInfo}>Issued: 1st Jan 2025</Text>
//           </View>
//         </View>
//       </View>

//       <TouchableOpacity style={styles.button} onPress={() => { /* Handle pass usage or other actions */ }}>
//         <Text style={styles.buttonText}>Use Bus Pass</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//     paddingTop: 50,
//     paddingHorizontal: 20,
//   },
//   topSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   backIcon: {
//     fontSize: 24,
//     color: '#000',
//     marginRight: 10,
//   },
//   pageTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   cardContainer: {
//     alignItems: 'center',
//   },
//   card: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 15,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 5,
//     padding: 20,
//     marginBottom: 20,
//   },
 
//   cardDetails: {
//     paddingLeft: 10,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000',
//     marginBottom: 5,
//   },
//   cardInfo: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 5,
//   },
//   button: {
//     backgroundColor: '#1A81FF',
//     borderRadius: 15,
//     paddingVertical: 15,
//     alignItems: 'center',
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#FFF',
//   },
// });






import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BusPassPage() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/Pass.png')} // Ensure pass.png is placed in the correct path.
        style={styles.backgroundImage}
        resizeMode="cover" // Ensures the image covers the entire screen.
      />
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // Fills the entire screen.
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Ensures the overlay covers the screen.
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Adds a semi-transparent overlay for readability.
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFF',
    marginRight: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
