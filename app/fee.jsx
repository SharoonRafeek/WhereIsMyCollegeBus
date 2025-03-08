import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions, FlatList,
  ScrollView, StyleSheet,
  Text, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, firestore } from './firebaseConfig';

const { width } = Dimensions.get('window');

// Simplified transaction item without interaction
const TransactionItem = ({ item }) => {
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIconContainer}>
        <View style={[
          styles.transactionIcon, 
          {backgroundColor: item.type === 'credit' ? '#e6f7ee' : '#fff0f0'}
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
        {item.receipt && <MaterialIcons name="receipt" size={16} color="#888" />}
      </View>
    </View>
  );
};

const FeesScreen = () => {
  // Add state for Firebase data
  const [loading, setLoading] = useState(true);
  const [termFees, setTermFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalFee, setTotalFee] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  
  // Static options (not changed)
  const showPaymentOptions = false;
  const selectedPaymentOption = 'full';
  const selectedTerm = null;
  
  // Fetch fee data from Firebase
  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        if (!auth.currentUser) {
          console.error("User not authenticated");
          setLoading(false);
          return;
        }
        
        const userId = auth.currentUser.uid;
        const userDocRef = doc(firestore, "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fees = [];
          const paymentHistory = [];
          let totalPaid = 0;
          
          // Get total fee
          const totalAmount = parseFloat(userData.total_fee || 0);
          setTotalFee(totalAmount);
          
          // Process Term 1 payment details
          if (userData.term1_amount) {
            const term1Amount = parseFloat(userData.term1_amount);
            const hasTerm1Receipt = !!userData.term1_receipt;
            
            // Add to term fees list
            fees.push({
              id: 1,
              name: 'Term 1',
              amount: term1Amount,
              paid: hasTerm1Receipt,
              dueDate: userData.term1_date || 'Not specified'
            });
            
            // If paid, add to transaction history
            if (hasTerm1Receipt) {
              totalPaid += term1Amount;
              paymentHistory.push({
                id: 1,
                date: userData.term1_date || 'Payment date not recorded',
                description: 'First Term Fee',
                amount: term1Amount,
                type: 'debit',
                receipt: true
              });
            }
          }
          
          // Process Term 2 payment details
          if (userData.term2_amount) {
            const term2Amount = parseFloat(userData.term2_amount);
            const hasTerm2Receipt = !!userData.term2_receipt;
            
            // Add to term fees list
            fees.push({
              id: 2,
              name: 'Term 2',
              amount: term2Amount,
              paid: hasTerm2Receipt,
              dueDate: userData.term2_date || 'Not specified'
            });
            
            // If paid, add to transaction history
            if (hasTerm2Receipt) {
              totalPaid += term2Amount;
              paymentHistory.push({
                id: 2,
                date: userData.term2_date || 'Payment date not recorded',
                description: 'Second Term Fee',
                amount: term2Amount,
                type: 'debit',
                receipt: true
              });
            }
          }
          
          // Handle discount if present
          if (userData.discount && parseFloat(userData.discount) > 0) {
            const discountAmount = parseFloat(userData.discount);
            paymentHistory.push({
              id: paymentHistory.length + 1,
              date: 'Discount applied',
              description: 'Fee Discount',
              amount: discountAmount,
              type: 'credit',
              receipt: false
            });
            totalPaid += discountAmount;
          }
          
          // Update state with collected data
          setTermFees(fees);
          setTransactions(paymentHistory);
          setPaidAmount(totalPaid);
          setPendingAmount(Math.max(0, totalAmount - totalPaid));
        }
      } catch (error) {
        console.error("Error fetching fee data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeeData();
  }, []);

  const renderOverviewSection = () => {
    return (
      <View style={styles.feeOverviewContainer}>
        <Text style={styles.overviewHeading}>Fee Overview</Text>
        <Text style={[styles.overviewTotalFee, styles.overviewNegativeValue]}>₹{pendingAmount.toLocaleString()}</Text>
        <Text style={styles.pendingAmountLabel}>Pending Amount</Text>
        
        {pendingAmount > 0 && !showPaymentOptions && (
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
              <MaterialIcons name="receipt-long" size={50} color="#ccc" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          nestedScrollEnabled
          scrollEnabled={false}
        />
      </View>
    );
  };

  // Show loading screen while fetching data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Fee Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A81FF" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Management</Text>
      </View>
      
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
    backgroundColor: '#f0f4ff',
  },
  // Keep your existing styles...
  
  // Add loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  
  // Fix typo in variable name from original code
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A81FF',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  // All other styles remain unchanged...
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
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
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#888',
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
    color: '#888',
    fontSize: 16,
  },
  feeOverviewContainer: {
    backgroundColor: '#f8f9fc',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  overviewHeading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  overviewTotalFee: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 5,
  },
  overviewPaidAmount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#10b981',
    marginBottom: 10,
  },
  overviewPayButton: {
    backgroundColor: '#1A81FF',
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 5,
  },
  overviewPayButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 15,
  },
  overviewFooterItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  overviewNegativeValue: {
    color: '#ef4444',
  },
  totalFeeValue: {
    color: '#333',  // Darker neutral color for total fee
  },
  paidAmountValue: {
    color: '#10b981',  // Green color for paid amount (matching overviewPaidAmount)
  },
  historySection: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  transactionList: {
    paddingBottom: 20,
  },
  pendingAmountLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ef4444',  // Red color to match the negative value style
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default FeesScreen;