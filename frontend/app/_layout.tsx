import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export default function Layout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <Stack
      screenOptions={{
        headerShown: true, // Show the header with a back button
        headerTitle: '', // Remove the name from the header
        headerStyle: { backgroundColor: theme.navBackground},
        headerTintColor: theme.title,
      }}
    />
  );
}