import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import ThemedButton from '../components/ThemedButton';
import axios from 'axios';
import { BACKEND_URL } from '@env';

export default function App() {
  const [accountId, setAccountId] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    const id = parseInt(accountId, 10);
    if (!isNaN(id) && accountId.trim() !== '' && String(id) === accountId.trim()) {
      try {
        const res = await axios.get(`${BACKEND_URL}/employees/${id}/exists`);
        if (res.data && (res.data as { exists: boolean }).exists) {
          // Store employee ID in AsyncStorage for use in other screens
          await AsyncStorage.setItem('employeeId', accountId);
          router.push('/login');
        } else {
          Alert.alert('Invalid ID', 'No employee found with that account ID.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to verify employee ID.');
      }
    } else {
      Alert.alert('Invalid ID', 'Please enter a valid integer account ID.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.otherContainer}>
          <ThemedText style={styles.text} title={true}>Warehouse Management System</ThemedText>
        </ThemedView>
        <ThemedView style={styles.otherContainer}>
          <ThemedText title={true} style={styles.title}>
              Login to Your Account
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder=""
            value={accountId}
            onChangeText={setAccountId}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          <ThemedButton onPress={handleSubmit} style={{}}>
              <Text style={{color:'#f2f2f2'}}>Login</Text>
          </ThemedButton>
        </ThemedView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 50 },
  otherContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  text: { fontSize: 32, textAlign: 'center', fontWeight: 'bold' },
  title: { textAlign: "center", fontSize: 18, },
  input: {
    width: 220,
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white',
    color: 'black',
    marginVertical: 12,
    textAlign: 'center',
  },
});
