import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Network from 'expo-network';
import { firestore, withFirebaseRetry, addConnectionStateListener, checkFirebaseConnection } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export default function ExportFeeModule() {
  const [isLoading, setIsLoading] = useState(false);
  const [feeData, setFeeData] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [dateTo, setDateTo] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Monitor Firebase connection state
  useEffect(() => {
    const unsubscribe = addConnectionStateListener((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setConnectionError("You are offline. Some features may be limited.");
      } else {
        setConnectionError(null);
      }
    });

    // Initial connection check
    checkFirebaseConnection().then(result => {
      setIsConnected(result.connected);
      if (!result.connected) {
        setConnectionError("No internet connection. Limited functionality available.");
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load fee data when component mounts or filter changes
  useEffect(() => {
    fetchFeeData();
  }, [filterPeriod, dateFrom, dateTo]);

  // Calculate totals when fee data changes
  useEffect(() => {
    calculateTotals();
  }, [feeData]);

  const fetchFeeData = async () => {
    if (!isConnected) {
      setConnectionError("You are offline. Cannot fetch fee data.");
      return;
    }

    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // Create a query to the fee_payments collection
      const feePaymentsRef = collection(firestore, 'fee_payments');
      let feeQuery;
      
      // Apply date filters based on selected period
      if (filterPeriod === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = Timestamp.fromDate(today);
        const endOfDay = Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1));
        
        feeQuery = query(
          feePaymentsRef,
          where('payment_date', '>=', startOfDay),
          where('payment_date', '<=', endOfDay),
          orderBy('payment_date', 'desc')
        );
      } else if (filterPeriod === 'thisWeek') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const startOfWeek = Timestamp.fromDate(weekStart);
        
        feeQuery = query(
          feePaymentsRef,
          where('payment_date', '>=', startOfWeek),
          orderBy('payment_date', 'desc')
        );
      } else if (filterPeriod === 'thisMonth') {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const startOfMonth = Timestamp.fromDate(monthStart);
        
        feeQuery = query(
          feePaymentsRef,
          where('payment_date', '>=', startOfMonth),
          orderBy('payment_date', 'desc')
        );
      } else if (filterPeriod === 'custom') {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);
        
        feeQuery = query(
          feePaymentsRef,
          where('payment_date', '>=', startTimestamp),
          where('payment_date', '<=', endTimestamp),
          orderBy('payment_date', 'desc')
        );
      } else {
        // 'all' - fetch all records
        feeQuery = query(
          feePaymentsRef,
          orderBy('payment_date', 'desc')
        );
      }
      
      // Execute the query with retry mechanism
      const querySnapshot = await withFirebaseRetry(() => getDocs(feeQuery));
      
      // Transform data
      const data = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to JS Dates for display
        const payment_date = data.payment_date ? data.payment_date.toDate() : new Date();
        const created_at = data.created_at ? data.created_at.toDate() : new Date();
        
        return {
          id: doc.id,
          ...data,
          payment_date,
          created_at
        };
      });
      
      console.log(`Retrieved ${data.length} fee records`);
      setFeeData(data);
      
    } catch (error) {
      console.error('Fee data fetch error:', error);
      let errorMessage = 'Failed to fetch fee data';
      
      if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (error.code) {
        errorMessage += ` (Error code: ${error.code})`;
      }
      
      setConnectionError(errorMessage);
      
      Alert.alert(
        'Connection Error', 
        errorMessage, 
        [
          { 
            text: 'Retry', 
            onPress: () => fetchFeeData() 
          },
          { 
            text: 'OK', 
            style: 'cancel' 
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalAmountSum = feeData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalDiscountsSum = feeData.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
    
    setTotalAmount(totalAmountSum);
    setTotalDiscounts(totalDiscountsSum);
  };

  const handleExport = async () => {
    if (feeData.length === 0) {
      Alert.alert('No Data', 'There is no fee data to export');
      return;
    }
    
    if (!isConnected) {
      Alert.alert('Offline', 'You need to be online to export data');
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Format date range for filename
      let dateRange = '';
      if (filterPeriod === 'today') {
        dateRange = 'Today';
      } else if (filterPeriod === 'thisWeek') {
        dateRange = 'ThisWeek';
      } else if (filterPeriod === 'thisMonth') {
        dateRange = 'ThisMonth';
      } else if (filterPeriod === 'custom') {
        dateRange = `${dateFrom.toISOString().split('T')[0]}_to_${dateTo.toISOString().split('T')[0]}`;
      } else {
        dateRange = 'AllTime';
      }
      
      // Create CSV content
      let csvContent = 'Admission Number,Student Name,Term,Payment Date,Amount,Receipt Number,Discount,Remarks,Payment Mode\n';
      
      feeData.forEach(item => {
        const paymentDate = new Date(item.payment_date).toLocaleDateString();
        const row = [
          item.admission_number || '',
          item.student_name || '',
          item.term || '',
          paymentDate,
          item.amount || 0,
          item.receipt_number || '',
          item.discount || 0,
          item.remarks || '',
          item.payment_mode || '',
        ].map(value => `"${value}"`).join(',');
        
        csvContent += row + '\n';
      });
      
      // Add summary at the end
      csvContent += '\n';
      csvContent += `"SUMMARY",,,,,,,,,\n`;
      csvContent += `"Total Payments","${feeData.length}",,,,,,,,\n`;
      csvContent += `"Total Amount","${totalAmount}",,,,,,,,\n`;
      csvContent += `"Total Discounts","${totalDiscounts}",,,,,,,,\n`;
      csvContent += `"Net Amount","${totalAmount - totalDiscounts}",,,,,,,,\n`;
      
      // Save to file
      const fileName = `FeeReport_${dateRange}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
      
    } catch (error) {
      Alert.alert('Export Failed', error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateFromChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateFrom;
    setShowFromDatePicker(Platform.OS === 'ios');
    setDateFrom(currentDate);
  };

  const handleDateToChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateTo;
    setShowToDatePicker(Platform.OS === 'ios');
    setDateTo(currentDate);
  };

  const renderFeeItem = ({ item }) => {
    const paymentDate = new Date(item.payment_date);
    const formattedDate = paymentDate.toLocaleDateString();
    
    return (
      <View style={styles.feeItem}>
        <View style={styles.feeItemHeader}>
          <Text style={styles.studentName}>{item.student_name}</Text>
          <Text style={styles.receiptNumber}>Receipt: {item.receipt_number}</Text>
        </View>
        
        <View style={styles.feeDetails}>
          <View style={styles.feeDetail}>
            <Text style={styles.feeDetailLabel}>Admission No.</Text>
            <Text style={styles.feeDetailValue}>{item.admission_number}</Text>
          </View>
          
          <View style={styles.feeDetail}>
            <Text style={styles.feeDetailLabel}>Date</Text>
            <Text style={styles.feeDetailValue}>{formattedDate}</Text>
          </View>
          
          <View style={styles.feeDetail}>
            <Text style={styles.feeDetailLabel}>Term</Text>
            <Text style={styles.feeDetailValue}>
              {item.term === 'term1' ? 'Term 1' : 'Term 2'}
            </Text>
          </View>
        </View>
        
        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>₹{item.amount}</Text>
          </View>
          
          {parseFloat(item.discount) > 0 && (
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.discountValue}>-₹{item.discount}</Text>
            </View>
          )}
          
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Net</Text>
            <Text style={styles.netAmountValue}>₹{parseFloat(item.amount) - (parseFloat(item.discount) || 0)}</Text>
          </View>
        </View>
        
        {item.remarks && (
          <Text style={styles.remarks}>Remarks: {item.remarks}</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Connection Status Banner */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.connectionBannerText}>
            You are offline. Fee operations require an internet connection.
          </Text>
        </View>
      )}
      
      {connectionError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#fff" />
          <Text style={styles.connectionBannerText}>
            {connectionError}
          </Text>
        </View>
      )}
      
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Export Fee Details</Text>
        
        <View style={styles.filterPeriodContainer}>
          <Text style={styles.filterLabel}>Filter Period:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filterPeriod}
              onValueChange={(itemValue) => setFilterPeriod(itemValue)}
              style={styles.picker}
              enabled={isConnected}
            >
              <Picker.Item label="All Time" value="all" />
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="This Week" value="thisWeek" />
              <Picker.Item label="This Month" value="thisMonth" />
              <Picker.Item label="Custom Range" value="custom" />
            </Picker>
          </View>
        </View>
        
        {filterPeriod === 'custom' && (
          <View style={styles.dateRangeContainer}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>From:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowFromDatePicker(true)}
                disabled={!isConnected}
              >
                <Text>{dateFrom.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </TouchableOpacity>
              
              {showFromDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  testID="dateFromPicker"
                  value={dateFrom}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={handleDateFromChange}
                  maximumDate={dateTo}
                />
              )}
              
              {Platform.OS === 'ios' && showFromDatePicker && (
                <DateTimePicker
                  testID="dateFromPickerIOS"
                  value={dateFrom}
                  mode="date"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleDateFromChange}
                  maximumDate={dateTo}
                />
              )}
            </View>
            
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>To:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowToDatePicker(true)}
                disabled={!isConnected}
              >
                <Text>{dateTo.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </TouchableOpacity>
              
              {showToDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  testID="dateToPicker"
                  value={dateTo}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={handleDateToChange}
                  minimumDate={dateFrom}
                  maximumDate={new Date()}
                />
              )}
              
              {Platform.OS === 'ios' && showToDatePicker && (
                <DateTimePicker
                  testID="dateToPickerIOS"
                  value={dateTo}
                  mode="date"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleDateToChange}
                  minimumDate={dateFrom}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Payments</Text>
          <Text style={styles.summaryValue}>{feeData.length}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Discounts</Text>
          <Text style={styles.summaryValue}>₹{totalDiscounts.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryItem, styles.netSummaryItem]}>
          <Text style={styles.summaryLabel}>Net Amount</Text>
          <Text style={styles.netSummaryValue}>₹{(totalAmount - totalDiscounts).toFixed(2)}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.exportButton,
          (!isConnected || isExporting || feeData.length === 0) && styles.disabledButton
        ]}
        onPress={handleExport}
        disabled={!isConnected || isExporting || feeData.length === 0}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>Export to CSV</Text>
          </>
        )}
      </TouchableOpacity>
      
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Fee Payment History</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF7200" style={styles.loader} />
        ) : (
          <FlatList
            data={feeData}
            renderItem={renderFeeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.feeList}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>
                {connectionError ? 'Connection error. Please check your internet connection.' : 'No fee payment records found'}
              </Text>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  connectionBanner: {
    backgroundColor: '#2196F3',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: 5,
  },
  errorBanner: {
    backgroundColor: '#F44336',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderRadius: 5,
  },
  connectionBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  filterPeriodContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  picker: {
    height: 50,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerContainer: {
    flex: 1,
    marginRight: 8,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  summarySection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  netSummaryItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 4,
    paddingTop: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  netSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF7200',
  },
  exportButton: {
    backgroundColor: '#FF7200',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  loader: {
    marginTop: 24,
  },
  feeList: {
    flexGrow: 1,
  },
  feeItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  feeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  receiptNumber: {
    fontSize: 12,
    color: '#666',
  },
  feeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  feeDetail: {
    width: '33%',
    marginBottom: 4,
  },
  feeDetailLabel: {
    fontSize: 10,
    color: '#888',
  },
  feeDetailValue: {
    fontSize: 14,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  amountItem: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    color: '#888',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  netAmountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF7200',
  },
  remarks: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 8,
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontStyle: 'italic',
  },
});