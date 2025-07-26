// In Types.ts or create a new file like components/ItemDisplay.tsx
import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { Item } from '../../shared/constants/Types';
import { parseLocations } from '../../shared/constants/Types';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';

interface ItemDisplayProps {
  item: Item;
  scroll?: boolean;
}

export const ItemDisplay: React.FC<ItemDisplayProps> = ({ item, scroll=false }) => {
  // Always normalize locations using parseLocations
  const locations = parseLocations(item.locations);
  return (
    <ThemedView style={styles.container} scroll={scroll}>
      <ThemedText style={styles.label}>Barcode ID: <ThemedText style={styles.value}>{item.barcode_id}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Barcode Type: <ThemedText style={styles.value}>{item.barcode_type}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Name: <ThemedText style={styles.value}>{item.name || 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Description: <ThemedText style={styles.value}>{item.description || 'N/A'}</ThemedText></ThemedText>
      <ThemedText style={styles.label}>Total Quantity: <ThemedText style={styles.value}>{item.total_quantity}</ThemedText></ThemedText>
      {locations.length > 0 && (
        <ScrollView horizontal={false} style={{ width: '100%' }}>
          <ThemedView style={styles.locationsTable}>
            <ThemedView style={styles.locationsHeaderRow}>
              <ThemedText style={[styles.locationsHeaderCell, { minWidth: 50, flex: 1 }]}>Bin</ThemedText>
              <ThemedText style={[styles.locationsHeaderCell, { minWidth: 50, flex: 1 }]}>Quantity</ThemedText>
              <ThemedText style={[styles.locationsHeaderCell, { minWidth: 60, flex: 1 }]}>Type</ThemedText>
              <ThemedText style={[styles.locationsHeaderCell, { minWidth: 60, flex: 1 }]}>Area</ThemedText>
            </ThemedView>
            {locations.map((loc, idx) => (
              <View key={idx} style={styles.locationsRow}>
                <ThemedText style={[styles.locationsCell, { minWidth: 50, flex: 1 }]} numberOfLines={2} ellipsizeMode="tail">{loc.bin}</ThemedText>
                <ThemedText style={[styles.locationsCell, { minWidth: 50, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{loc.quantity}</ThemedText>
                <ThemedText style={[styles.locationsCell, { minWidth: 60, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{loc.type}</ThemedText>
                <ThemedText style={[styles.locationsCell, { minWidth: 60, flex: 1 }]} numberOfLines={2} ellipsizeMode="tail">{loc.area_name || ''}</ThemedText>
              </View>
            ))}
          </ThemedView>
        </ScrollView>
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
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'center',
  },
  locationsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  locationsHeaderCell: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  locationsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationsCell: {
    fontSize: 12,
    textAlign: 'center',
  },
});