import { StyleSheet } from 'react-native'
import {Link } from 'expo-router'
import React from 'react'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BACKEND_URL } from "@env";

//Themed Components
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'


const login = () => {
    
  useFocusEffect(
    React.useCallback(() => {
      const checkAndCleanupUserProgress = async () => {
        try {
          const employeeId = await AsyncStorage.getItem('employeeId');
          if (!employeeId) return;

          // Check if this user has any incomplete work and clean it up
          const response = await fetch(`${BACKEND_URL}/orders/cleanup-user-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: parseInt(employeeId, 10) })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.cleanedItems > 0) {
              console.log(`Cleaned up ${result.cleanedItems} incomplete line items for employee ${employeeId}`);
            }
          }
        } catch (err) {
          console.log('Error cleaning up user progress:', err);
        }
      };

      checkAndCleanupUserProgress();
    }, [])
  );

  return (
    <ThemedView style = {styles.container}>

        <Link href="/order" style={styles.link}>
          <ThemedText>Fulfill Order</ThemedText>
        </Link>
        <Link href="/relocate" style={styles.link}>
          <ThemedText>Dashboard</ThemedText>
        </Link>
    </ThemedView>
  )
}

export default login

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: 'center' },
    link: { fontSize: 20, marginVertical: 8 }
})