// In Types.ts or create a new file like components/ItemDisplay.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Item } from '../constants/Types';
import { parseLocations } from '../constants/Types';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';

interface ItemDisplayProps {
  item: Item;
  scroll?: boolean;
}

export const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, scroll=false }) => {
  const locations = parseLocations(item.locations);
  return (
    <ThemedView style={styles.container} scroll={scroll}>
      <ThemedText style={styles.label}>Barcode ID: <ThemedText style={styles.value}>{item.barcode_id}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Barcode Type: <ThemedText style={styles.value}>{item.barcode_type}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Name: <ThemedText style={styles.value}>{item.name || 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Description: <ThemedText style={styles.value}>{item.description || 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Total Quantity: <ThemedText style={styles.value}>{item.total_quantity}</ThemedText></ThemedText>
      {locations.length > 0 && (
        <View style={styles.locationsTable}>
          <View style={styles.locationsHeaderRow}>
            <ThemedText style={[styles.locationCell, styles.headerCell]}>Bin</ThemedText>
            <ThemedText style={[styles.locationCell, styles.headerCell]}>Quantity</ThemedText>
            <ThemedText style={[styles.locationCell, styles.headerCell]}>Type</ThemedText>
          </View>
          {locations.map((loc, idx) => (
            <View key={idx} style={styles.locationsRow}>
              <ThemedText style={styles.locationCell}>{loc.location}</ThemedText>
              <ThemedText style={styles.locationCell}>{loc.quantity}</ThemedText>
              <ThemedText style={styles.locationCell}>{loc.type}</ThemedText>
            </View>
          ))}
        </View>
      )}
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
  locationsTable: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
  },
  locationsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    paddingVertical: 6,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
  },
  locationsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
  },
  locationCell: {
    flex: 1,
    textAlign: 'left',
    paddingHorizontal: 8,
  },
});