// In Types.ts or create a new file like components/ItemDisplay.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Item } from '../constants/Types';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';
interface ItemDisplayProps {
  item: Item;
  scroll?: boolean;
}

export const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, scroll=false }) => {
  return (
    <ThemedView style={styles.container} scroll={scroll}>
      <ThemedText style={styles.label}>Barcode ID: <ThemedText style={styles.value}>{item.barcode_id}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Barcode Type: <ThemedText style={styles.value}>{item.barcode_type}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Name: <ThemedText style={styles.value}>{item.name || 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Description: <ThemedText style={styles.value}>{item.description || 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Primary Location: <ThemedText style={styles.value}>{item.primary_location?.location ?? 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Primary Location Quantity: <ThemedText style={styles.value}>{item.primary_location?.quantity ?? 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Secondary Location: <ThemedText style={styles.value}>{item.secondary_location?.location ?? 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Secondary Location Quantity: <ThemedText style={styles.value}>{item.secondary_location?.quantity ?? 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Total Quantity: <ThemedText style={styles.value}>{item.total_quantity}</ThemedText></ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: { 
    fontWeight: 'bold', 
    marginBottom: 8,
  },
  value: { 
    fontWeight: 'normal',  
  },
});