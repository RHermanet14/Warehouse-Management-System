import React, { useState } from 'react';
import { BACKEND_URL } from "@env";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';

const LOCATIONS = [
  'Garage',
  'Pantry',
  'Fridge',
  'Basement',
  'Bedroom',
  'one',
  'word',
];

export default function OrderScreen() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const allSelected = selectedLocations.length === LOCATIONS.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations([...LOCATIONS]);
    }
  };

  const handleContinue = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/orders/by-locations?locations=${encodeURIComponent(selectedLocations.join(','))}`
      );
      if (response.ok) {
        const data = await response.json();
        Alert.alert('Order Found', `Order ID: ${data.order_id}`);
      } else {
        const err = await response.json();
        Alert.alert('No Orders', err.error || 'There are no orders right now');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch order');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Item Locations</Text>
      <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
        <Text style={styles.selectAllBtnText}>{allSelected ? 'Deselect All' : 'Select All'}</Text>
      </TouchableOpacity>
      <FlatList
        data={LOCATIONS}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.locationItem,
              selectedLocations.includes(item) && styles.selected,
            ]}
            onPress={() => toggleLocation(item)}
          >
            <Text style={styles.locationText}>{item}</Text>
            {selectedLocations.includes(item) && <Text>✓</Text>}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={[styles.continueBtn, selectedLocations.length === 0 && styles.continueBtnDisabled]}
        onPress={handleContinue}
        disabled={selectedLocations.length === 0}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  selectAllBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectAllBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    justifyContent: 'space-between',
  },
  selected: {
    backgroundColor: '#cce5ff',
  },
  locationText: {
    fontSize: 18,
  },
  continueBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  continueBtnDisabled: {
    backgroundColor: '#b0b0b0',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
