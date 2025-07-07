import React from 'react';
import { StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';

export default function App() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.otherContainer}>
        <ThemedText style={styles.text} title={true}>Warehouse Management System</ThemedText>
      </ThemedView>
      <ThemedView style={styles.otherContainer}>
        <Link href="/register" style={styles.link}>Go to Register</Link>
        <Link href="/login" style={styles.link}>Go to Login</Link>
        <Link href="/profile" style={styles.link}>
          <ThemedText>Dashboard</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 50 },
  otherContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  text: { fontSize: 32, textAlign: 'center', fontWeight: 'bold' },
  link: { fontSize: 20, color: '#6849a7', marginVertical: 8 }
});
