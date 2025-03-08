import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions, FlatList,
  ScrollView, StyleSheet,
  Text, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from '../firebaseConfig';

const { width } = Dimensions.get('window');

// Simplified transaction item without interaction
const TransactionItem = ({ item }) => {
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIconContainer}>
        <View style={[
          styles.transactionIcon, 
          {backgroundColor: item.type === 'credit' ? '#E8F5E9' : '#FFEBEE'}
        ]}>
          <MaterialIcons 
            name={item.type === 'credit' ? 'arrow-downward' : 'arrow-upward'} 
            size={20} 
            color={item.type === 'credit' ? '#34c759' : '#ff3b30'} 
          />
        </View>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText, 
          {color: item.type === 'credit' ? '#34c759' : '#ff3b30'}
        ]}>
          {item.type === 'credit' ? '+' : '-'}₹{item.amount.toLocaleString()}
        </Text>
        <MaterialIcons name="receipt" size={16} color="#888" />
      </View>
    </View>
  );
};

const FeesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [userFeeData, setUserFeeData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  const getUserFeeData = async () => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log("No authenticated user found");
        return null;
      }
      
      // Get the user document from Firestore
      const userDocRef = doc(firestore, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log("User document not found in Firestore");
        return null;
      }
      
      const userData = userDoc.data();
      
      // Check if user has locationData with fee information
      // or if there's userData containing the fee details
      if (userData.locationData || userData.userData) {
        // Check different possible structures based on your app's data model
        return {
          ...userData.locationData,
          ...userData.userData
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching user fee data:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userData = await getUserFeeData();
        
        if (userData) {
          setUserFeeData(userData);
          
          // Create transactions based on term payments
          const userTransactions = [];
          
          if (userData.term1_date && userData.term1_amount) {
            userTransactions.push({
              id: 1,
              date: new Date(userData.term1_date).toLocaleDateString('en-IN', 
                { year: 'numeric', month: 'short', day: 'numeric' }),
              description: 'Term 1 Fee Payment',
              amount: userData.term1_amount,
              type: 'debit',
              receipt: userData.term1_receipt
            });
          }
          
          if (userData.term2_date && userData.term2_amount) {
            userTransactions.push({
              id: 2,
              date: new Date(userData.term2_date).toLocaleDateString('en-IN', 
                { year: 'numeric', month: 'short', day: 'numeric' }),
              description: 'Term 2 Fee Payment',
              amount: userData.term2_amount,
              type: 'debit',
              receipt: userData.term2_receipt
            });
          }
          
          if (userData.discount && userData.discount > 0) {
            userTransactions.push({
              id: 3,
              date: new Date().toLocaleDateString('en-IN', 
                { year: 'numeric', month: 'short', day: 'numeric' }),
              description: 'Fee Discount',
              amount: userData.discount,
              type: 'credit'
            });
          }
          
          setTransactions(userTransactions);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        Alert.alert("Error", "Failed to load fee data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Calculate totals - handle possible different data structures
  const totalFee = userFeeData?.total_fee || 0;
  const paidAmount = userFeeData ? 
    (userFeeData.term1_amount || 0) + (userFeeData.term2_amount || 0) : 0;
  const discount = userFeeData?.discount || 0;
  const pendingAmount = totalFee - paidAmount - discount;

  const renderOverviewSection = () => {
    if (loading) {
      return (
        <View style={[styles.feeOverviewContainer, {justifyContent: 'center', alignItems: 'center', height: 200}]}>
          <ActivityIndicator size="large" color="#FF7200" />
          <Text style={{marginTop: 10}}>Loading fee data...</Text>
        </View>
      );
    }
    
    if (!userFeeData) {
      return (
        <View style={[styles.feeOverviewContainer, {justifyContent: 'center', alignItems: 'center', height: 200}]}>
          <MaterialIcons name="error-outline" size={50} color="#888" />
          <Text style={{marginTop: 10}}>No fee data found</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.feeOverviewContainer}>
        <Text style={[styles.overviewTotalFee, 
          pendingAmount <= 0 ? styles.paidAmountValue : styles.overviewNegativeValue]}>
          {pendingAmount <= 0 ? 'PAID' : `₹${pendingAmount.toLocaleString()}`}
        </Text>
        <Text style={styles.pendingAmountLabel}>
          {pendingAmount <= 0 ? 'All payments completed' : 'Pending Amount'}
        </Text>
        
        {pendingAmount > 0 && (
          <View style={styles.overviewPayButton}>
            <Text style={styles.overviewPayButtonText}>Pay Now</Text>
          </View>
        )}
        
        <View style={styles.overviewFooter}>
          <View style={styles.overviewFooterItem}>
            <Text style={styles.overviewLabel}>Total Fee</Text>
            <Text style={[styles.overviewValue, styles.totalFeeValue]}>₹{totalFee.toLocaleString()}</Text>
          </View>
          <View style={styles.overviewFooterItem}>
            <Text style={styles.overviewLabel}>Paid Amount</Text>
            <Text style={[styles.overviewValue, styles.paidAmountValue]}>₹{paidAmount.toLocaleString()}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.overviewFooterItem}>
              <Text style={styles.overviewLabel}>Discount</Text>
              <Text style={[styles.overviewValue, styles.discountValue]}>₹{discount.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTransactionHistory = () => {
    return (
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Transaction History</Text>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.transactionList}
          renderItem={({ item }) => (
            <TransactionItem item={item} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={50} color="#AAA" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          nestedScrollEnabled
          scrollEnabled={false}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF7200', '#FF5C00']} style={styles.header}>
        <Text style={styles.headerText}>Bus Fee Details</Text>
      </LinearGradient>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderOverviewSection()}
        {renderTransactionHistory()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 0, // Lower z-index to ensure it stays in the background
    position: 'absolute', // Make it absolute positioned
    width: '100%', // Cover the full width
    top: 0, // Position at the top
  },
  headerText: {
    marginTop: -80,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingTop: 120, // Increase top padding to position content properly
    zIndex: 2, // Higher z-index to appear above the header
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionIconContainer: {
    marginRight: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 16,
  },
  feeOverviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    paddingTop: 24, // Slightly increased top padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, // Slightly stronger shadow
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8, // Increased elevation for Android
    marginBottom: 20,
    marginHorizontal: 4,
    marginTop: 30, // Add top margin to position below the header text
    borderWidth: 0.5, // Add subtle border
    borderColor: 'rgba(0,0,0,0.05)', // Very light border color
  },
  overviewTotalFee: {
    textAlign: 'center',
    fontSize: 36, // Slightly larger
    fontWeight: '700',
    color: '#333333',
    marginTop: 10, // Add some top margin since we removed the heading
    marginBottom: 8, // Adjusted for better spacing
  },
  overviewPaidAmount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#10b981',
    marginBottom: 10,
  },
  overviewPayButton: {
    backgroundColor: '#FF7200',
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 5,
  },
  overviewPayButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
  },
  overviewFooterItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  overviewNegativeValue: {
    color: '#ff3b30',
  },
  totalFeeValue: {
    color: '#333333',
  },
  paidAmountValue: {
    color: '#10b981',
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF7200',
    marginBottom: 16,
  },
  transactionList: {
    paddingBottom: 20,
  },
  pendingAmountLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ff3b30',
    marginBottom: 10,
  },
  discountValue: {
    color: '#34c759',
  },
});

export default FeesScreen;