import React, { useState, useRef, useEffect } from 'react';
import { BACKEND_URL } from "@env";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput, useColorScheme } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../shared/constants/Colors';
import { flashLightButtonStyles } from '../constants/Styles';
import { CameraView, Camera, BarcodeScanningResult, BarcodeType } from "expo-camera";
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import ThemedTextInput from '../components/ThemedTextInput';
import { parseLocations, barcode_types, Location } from '../../shared/constants/Types';
import BarcodeScanner from '../components/BarcodeScanner';

interface Item {
  barcode_id: string;
  name: string;
  description?: string;
  quantity: number;
  picked_quantity?: number;
  total_quantity?: number;
  locations?: Location[];
}

export default function OrderScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const [step, setStep] = useState<'select' | 'fulfill'>('select');
  const [areas, setAreas] = useState<{ area_id: string; name: string }[]>([]); // <-- new state
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]); // stores area_id as string
  const [orderItems, setOrderItems] = useState<Item[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [locationBarcode, setLocationBarcode] = useState('');
  const [itemBarcode, setItemBarcode] = useState('');
  const [pickedQty, setPickedQty] = useState('');
  const [noMoreOrders, setNoMoreOrders] = useState(false);
  const [loadingNewOrder, setLoadingNewOrder] = useState(false);
  const [showLocationScanner, setShowLocationScanner] = useState(false);
  const [showItemScanner, setShowItemScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  // Fetch areas from backend on mount
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/items/areas`);
        const data = await res.json();
        if (Array.isArray(data)) setAreas(data);
      } catch (err) {
        setAreas([]);
      }
    };
    fetchAreas();
  }, []);

  // Retrieve employee ID on mount
  useEffect(() => {
    const getEmployeeId = async () => {
      try {
        const storedEmployeeId = await AsyncStorage.getItem('employeeId');
        if (storedEmployeeId) {
          setEmployeeId(storedEmployeeId);
        } else {
          Alert.alert('Error', 'Employee ID not found. Please log in again.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to retrieve employee ID.');
      }
    };
    getEmployeeId();
  }, []);

  // Location selection logic
  const toggleLocation = (area_id: string) => {
    setSelectedLocations(prev =>
      prev.includes(area_id)
        ? prev.filter(l => l !== area_id)
        : [...prev, area_id]
    );
  };
  const allSelected = selectedLocations.length === areas.length;
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(areas.map(a => a.area_id));
    }
  };

  // Fetch order and items for selected locations
  const fetchOrderForLocations = async (locations: string[]): Promise<Item[] | null> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/orders/by-locations?locations=${encodeURIComponent(locations.join(','))}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrderId(data.order_id); // store order_id
        // Fetch order items
        const itemsRes = await fetch(`${BACKEND_URL}/orders/${data.order_id}/items`);
        if (!itemsRes.ok) return null;
        const orderItems = await itemsRes.json();
        return orderItems;
      }
      return null;
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch order');
      return null;
    }
  };

  const handleContinue = async () => {
    const items = await fetchOrderForLocations(selectedLocations);
    if (items && items.length > 0) {
      setOrderItems(items);
      setCurrentIndex(0);
      setStep('fulfill');
      setNoMoreOrders(false);
    } else {
      Alert.alert('No Orders', 'There are no orders right now');
    }
  };

  // Fulfillment logic
  const picked = parseInt(pickedQty, 10) || 0;

  const handleSubmit = async () => {
    if (!locationBarcode || !itemBarcode || !pickedQty) {
      Alert.alert('Please fill all fields');
      return;
    }
    if (!employeeId) {
      Alert.alert('Error', 'Employee ID not found. Please log in again.');
      return;
    }
    if (itemBarcode !== currentItem.barcode_id) {
      Alert.alert('Wrong item barcode!');
      return;
    }
    if (picked <= 0) {
      Alert.alert('Pick at least 1 item.');
      return;
    }
    if (picked > remainingQty) {
      Alert.alert('Invalid Quantity', 'You cannot pick more than the remaining quantity.');
      return;
    }
    try {
      const response = await fetch(
        `${BACKEND_URL}/orders/${orderId}/items/${currentItem.barcode_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            picked_quantity: picked,
            picked_location: locationBarcode,
            picked_by: parseInt(employeeId, 10)
          })
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error && errorData.error.includes('Invalid location')) {
          Alert.alert('Invalid Location', 'This item does not have the specified location.');
          return;
        }
        Alert.alert('Error', errorData.error || 'Failed to update picked quantity');
        return;
      }
      // Re-fetch order items
      const itemsRes = await fetch(`${BACKEND_URL}/orders/${orderId}/items`);
      const updatedItems = await itemsRes.json();
      setOrderItems(updatedItems);
      setCurrentIndex(idx => idx + 1);
      setLocationBarcode('');
      setItemBarcode('');
      setPickedQty('');
    } catch (e) {
      Alert.alert('Error', 'Failed to update picked quantity');
    }
  };

  const handleSkip = () => {
    setOrderItems(items => {
      const skipped = items[currentIndex];
      const newItems = [...items.slice(0, currentIndex), ...items.slice(currentIndex + 1), skipped];
      // Find the next incomplete line (excluding the just-skipped one, now at the end)
      const firstIncomplete = newItems.findIndex((item, idx) => idx !== newItems.length - 1 && (item.picked_quantity || 0) < item.quantity);
      setCurrentIndex(firstIncomplete !== -1 ? firstIncomplete : 0);
      return newItems;
    });
    setLocationBarcode('');
    setItemBarcode('');
    setPickedQty('');
  };

  const handleNewOrder = async () => {
    setLoadingNewOrder(true);
    const newItems = await fetchOrderForLocations(selectedLocations);
    setLoadingNewOrder(false);
    if (newItems && newItems.length > 0) {
      setOrderItems(newItems);
      setCurrentIndex(0);
      setNoMoreOrders(false);
    } else {
      setNoMoreOrders(true);
      Alert.alert('No Orders', 'There are no orders right now');
    }
  };



  // Camera permission setup
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  // Set picked_by when currentItem changes
  useEffect(() => {
    if (step === 'fulfill' && orderItems.length > 0 && employeeId && orderId) {
      const nextIncompleteIndex = orderItems.findIndex(item => (item.picked_quantity || 0) < item.quantity);
      if (nextIncompleteIndex !== -1) {
        const currentItem = orderItems[nextIncompleteIndex];
        fetch(`${BACKEND_URL}/orders/${orderId}/items/${currentItem.barcode_id}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ picked_by: parseInt(employeeId, 10) })
        }).catch(e => {
          console.log('Failed to set picked_by:', e);
        });
      }
    }
  }, [step, orderItems, employeeId, orderId]);

  // Barcode scanning functions
  const handleLocationBarcodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (!scanningEnabled || lastScannedRef.current === data) {
      return;
    }
    setScanningEnabled(false);
    lastScannedRef.current = data;
    
    setLocationBarcode(data);
    setShowLocationScanner(false);
    setScanningEnabled(true);
    lastScannedRef.current = null;
  };

  const handleItemBarcodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (!scanningEnabled || lastScannedRef.current === data) {
      return;
    }
    setFlashlightEnabled(false);
    setScanningEnabled(false);
    lastScannedRef.current = data;
    
    setItemBarcode(data);
    setShowItemScanner(false);
    setScanningEnabled(true);
    lastScannedRef.current = null;
  };

  const toggleFlashlight = () => {
    setFlashlightEnabled(!flashlightEnabled);
  };

  // UI rendering
  if (step === 'select') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Item Locations</Text>
        <TouchableOpacity style={styles.selectAllBtn} onPress={handleSelectAll}>
          <Text style={styles.selectAllBtnText}>{allSelected ? 'Deselect All' : 'Select All'}</Text>
        </TouchableOpacity>
        <FlatList
          data={areas}
          keyExtractor={item => item.area_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.locationItem,
                selectedLocations.includes(item.area_id) && styles.selected,
              ]}
              onPress={() => toggleLocation(item.area_id)}
            >
              <Text style={styles.locationText}>{item.name}</Text>
              {selectedLocations.includes(item.area_id) && <Text>✓</Text>}
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

  // Find the next incomplete item
  const nextIncompleteIndex = orderItems.findIndex(item => (item.picked_quantity || 0) < item.quantity);
  const allItemsFulfilled = orderItems.length > 0 && nextIncompleteIndex === -1;
  const currentItem = nextIncompleteIndex !== -1 ? orderItems[nextIncompleteIndex] : undefined;
  const remainingQty = currentItem ? (currentItem.quantity - (currentItem.picked_quantity || 0)) : 0;

  if (allItemsFulfilled) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>All items fulfilled! Order complete.</Text>
        <TouchableOpacity style={styles.button} onPress={handleNewOrder} disabled={loadingNewOrder}>
          <Text style={styles.buttonText}>{loadingNewOrder ? 'Searching...' : 'Start New Order'}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!currentItem) {
    // If for some reason there are no incomplete items and not all fulfilled, show a fallback
    return null;
  }

  const locations: Location[] = parseLocations(currentItem.locations);

  return (
    <ThemedView style={styles.container} scroll={true}>
      <ThemedText style={styles.title}>Order ID: {orderId}</ThemedText>
      <ThemedText style={styles.subtitle}>Line {nextIncompleteIndex + 1} of {orderItems.length}</ThemedText>
      
              {/* Item Information */}
        <ThemedView style={styles.itemInfo}>
          <ThemedText style={styles.label}>Name: <ThemedText style={styles.value}>{currentItem.name}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Description: <ThemedText style={styles.value}>{currentItem.description || 'N/A'}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Barcode: <ThemedText style={styles.value}>{currentItem.barcode_id}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Total Quantity: <ThemedText style={styles.value}>{currentItem.total_quantity}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>To Pick: <ThemedText style={styles.value}>{remainingQty}</ThemedText></ThemedText>
          
          {/* Location Information */}
          <ThemedText style={styles.locationLabel}>Locations:</ThemedText>
          {locations.length > 0 ? (
            locations.map((loc, index) => (
              <View key={index} style={styles.locationRow}>
                <ThemedText style={styles.locationText}>
                  {loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}: <ThemedText style={styles.value}>{loc.bin}</ThemedText>
                  {loc.area_name ? <ThemedText style={styles.value}>  |  Area: {loc.area_name}</ThemedText> : null}
                </ThemedText>
                <ThemedText style={styles.locationQuantity}>
                  {loc.quantity}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={styles.locationText}>No locations found</ThemedText>
          )}
        </ThemedView>

      {/* Location Barcode Input */}
      <ThemedView style={styles.inputRow}>
        <ThemedTextInput
          style={[styles.input, styles.flexInput]}
          placeholder="Enter location barcode"
          value={locationBarcode}
          onValueChange={setLocationBarcode}
        />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setShowLocationScanner(true)}
        >
          <Text style={styles.scanButtonText}>📷</Text>
        </TouchableOpacity>
      </ThemedView>

      {/* Item Barcode Input */}
      <ThemedView style={styles.inputRow}>
        <ThemedTextInput
          style={[styles.input, styles.flexInput]}
          placeholder="Enter item barcode"
          value={itemBarcode}
          onValueChange={setItemBarcode}
        />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setShowItemScanner(true)}
        >
          <Text style={styles.scanButtonText}>📷</Text>
        </TouchableOpacity>
      </ThemedView>

      {/* Quantity Input */}
      <ThemedTextInput
        style={styles.input}
        placeholder="Enter quantity picked"
        value={pickedQty}
        onValueChange={setPickedQty}
        keyboardType="numeric"
      />

      {/* Action Buttons */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.buttonText}>Skip (Do Last)</Text>
      </TouchableOpacity>


      {/* Location Barcode Scanner */}
      {showLocationScanner && (
        <BarcodeScanner
          onScanned={handleLocationBarcodeScanned}
          onClose={() => setShowLocationScanner(false)}
          flashlightEnabled={flashlightEnabled}
          setFlashlightEnabled={setFlashlightEnabled}
          barcodeTypes={barcode_types as any as import('expo-camera').BarcodeType[]}
        />
      )}

      {/* Item Barcode Scanner */}
      {showItemScanner && (
        <BarcodeScanner
          onScanned={handleItemBarcodeScanned}
          onClose={() => setShowItemScanner(false)}
          flashlightEnabled={flashlightEnabled}
          setFlashlightEnabled={setFlashlightEnabled}
          barcodeTypes={barcode_types as any as import('expo-camera').BarcodeType[]}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0},
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 18, marginBottom: 16, textAlign: 'center', color: '#666' },
  label: { fontSize: 18, marginBottom: 8, fontWeight: 'bold' },
  value: { fontSize: 18, marginBottom: 8, fontWeight: 'normal' },
  itemInfo: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  locationText: { fontSize: 16, marginBottom: 4},
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  scanButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButton: {
    backgroundColor: '#888',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
});
