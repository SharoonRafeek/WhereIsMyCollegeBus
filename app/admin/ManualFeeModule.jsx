import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../utils/supabase';

export default function ManualFeeModule() {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fee payment details
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [discount, setDiscount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Verify student by admission number
  const verifyStudent = async () => {
    if (!admissionNumber.trim()) {
      Alert.alert('Error', 'Please enter an admission number');
      return;
    }
    
    try {
      setIsVerifying(true);
      
      // Query Supabase for student details
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('admission_number', admissionNumber)
        .single();
      
      if (error) {
        Alert.alert('Error', 'Student not found. Please check the admission number.');
        setStudentDetails(null);
        return;
      }
      
      setStudentDetails(data);
      
    } catch (error) {
      Alert.alert('Error', `Verification failed: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Process fee payment
  const processFeePayment = async () => {
    if (!studentDetails) {
      Alert.alert('Error', 'Please verify a student first');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!receiptNumber.trim()) {
      Alert.alert('Error', 'Please enter a receipt number');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Optional discount validation
      let discountAmount = 0;
      if (discount && !isNaN(parseFloat(discount))) {
        discountAmount = parseFloat(discount);
      }
      
      // Create fee payment record in Supabase
      const { data, error } = await supabase
        .from('fee_payments')
        .insert([
          {
            student_id: studentDetails.id,
            admission_number: admissionNumber,
            student_name: `${studentDetails.first_name} ${studentDetails.last_name || ''}`,
            term: selectedTerm,
            payment_date: paymentDate.toISOString(),
            amount: parseFloat(amount),
            receipt_number: receiptNumber,
            discount: discountAmount,
            remarks: remarks,
            payment_mode: 'manual',
            created_at: new Date().toISOString(),
          }
        ]);
      
      if (error) throw error;
      
      Alert.alert('Success', `Fee payment of ₹${amount} recorded successfully for ${studentDetails.first_name}`);
      
      // Reset form fields
      resetForm();
      
    } catch (error) {
      Alert.alert('Error', `Payment processing failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setAdmissionNumber('');
    setStudentDetails(null);
    setSelectedTerm('term1');
    setPaymentDate(new Date());
    setAmount('');
    setReceiptNumber('');
    setDiscount('');
    setRemarks('');
  };
  
  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || paymentDate;
    setShowDatePicker(Platform.OS === 'ios');
    setPaymentDate(currentDate);
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Manual Fee Entry</Text>
          
          <View style={styles.verificationSection}>
            <TextInput
              style={styles.input}
              placeholder="Enter Admission Number"
              value={admissionNumber}
              onChangeText={setAdmissionNumber}
              keyboardType="numeric"
              editable={!studentDetails}
            />
            
            <TouchableOpacity
              style={[styles.verifyButton, studentDetails && styles.disabledButton]}
              onPress={verifyStudent}
              disabled={isVerifying || studentDetails}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Verify</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {studentDetails && (
            <View style={styles.studentDetailsCard}>
              <View style={styles.studentHeader}>
                <Ionicons name="person-circle-outline" size={24} color="#FF7200" />
                <Text style={styles.studentName}>
                  {studentDetails.first_name} {studentDetails.last_name || ''}
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={resetForm}
                >
                  <Ionicons name="close-circle-outline" size={24} color="#FF7200" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.studentInfoRow}>
                <View style={styles.studentInfoItem}>
                  <Text style={styles.studentInfoLabel}>Admission No:</Text>
                  <Text style={styles.studentInfoValue}>{studentDetails.admission_number}</Text>
                </View>
                <View style={styles.studentInfoItem}>
                  <Text style={styles.studentInfoLabel}>Branch:</Text>
                  <Text style={styles.studentInfoValue}>{studentDetails.branch || 'N/A'}</Text>
                </View>
              </View>
              
              <View style={styles.studentInfoRow}>
                <View style={styles.studentInfoItem}>
                  <Text style={styles.studentInfoLabel}>Semester:</Text>
                  <Text style={styles.studentInfoValue}>{studentDetails.semester || 'N/A'}</Text>
                </View>
                <View style={styles.studentInfoItem}>
                  <Text style={styles.studentInfoLabel}>Contact:</Text>
                  <Text style={styles.studentInfoValue}>{studentDetails.phone || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}
          
          {studentDetails && (
            <>
              <View style={styles.paymentFormSection}>
                <Text style={styles.paymentFormTitle}>Fee Payment Details</Text>
                
                <View style={styles.pickerContainer}>
                  <Text style={styles.inputLabel}>Select Term</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedTerm}
                      onValueChange={(itemValue) => setSelectedTerm(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Term 1" value="term1" />
                      <Picker.Item label="Term 2" value="term2" />
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.datePickerContainer}>
                  <Text style={styles.inputLabel}>Payment Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {paymentDate.toLocaleDateString()}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#555" />
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={paymentDate}
                      mode="date"
                      is24Hour={true}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                    />
                  )}
                </View>
                
                <View style={styles.twoColumnInputs}>
                  <View style={styles.inputColumn}>
                    <Text style={styles.inputLabel}>Amount (₹)</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Amount"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputColumn}>
                    <Text style={styles.inputLabel}>Receipt No.</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Receipt Number"
                      value={receiptNumber}
                      onChangeText={setReceiptNumber}
                    />
                  </View>
                </View>
                
                <View style={styles.twoColumnInputs}>
                  <View style={styles.inputColumn}>
                    <Text style={styles.inputLabel}>Discount (₹)</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Discount (Optional)"
                      value={discount}
                      onChangeText={setDiscount}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputColumn}>
                    <Text style={styles.inputLabel}>Remarks</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Remarks (Optional)"
                      value={remarks}
                      onChangeText={setRemarks}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={processFeePayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="cash-outline" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Process Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  verificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  verifyButton: {
    backgroundColor: '#FF7200',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  studentDetailsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  studentInfoItem: {
    flex: 1,
  },
  studentInfoLabel: {
    fontSize: 12,
    color: '#666',
  },
  studentInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentFormSection: {
    marginTop: 8,
  },
  paymentFormTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
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
  datePickerContainer: {
    marginBottom: 16,
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
  dateText: {
    color: '#333',
  },
  twoColumnInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  smallInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#FF7200',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});