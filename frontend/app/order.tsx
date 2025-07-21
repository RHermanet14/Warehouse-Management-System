import React, { useState, useRef, useEffect } from 'react';
import { BACKEND_URL } from "@env";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, TextInput, useColorScheme } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from '../constants/Colors';
import { flashLightButtonStyles } from '../constants/Styles';
import { CameraView, Camera, BarcodeScanningResult, BarcodeType } from "expo-camera";
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import ThemedTextInput from '../components/ThemedTextInput';
import { parseLocations } from '../constants/Types';

const LOCATIONS = [
  'Garage',
  'Pantry',
  'Fridge',
  'Basement',
  'Bedroom',
  'No',
  'Where',
  'Tat Two',
];

interface Item {
  barcode_id: string;
  name: string;
  description?: string;
  quantity: number;
  picked_quantity?: number;
  locations?: Array<{
    quantity: number;
    location: string;
    type: string;
  }>;
  // Keep backward compatibility for existing code
  primary_location?: string;
  primary_quantity?: number;
  secondary_location?: string;
  secondary_quantity?: number;
}

export default function OrderScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const [step, setStep] = useState<'select' | 'fulfill'>('select');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
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
  const lastScannedRef = useRef<string | null>(null);

  // Location selection logic
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
  const currentItem = orderItems[currentIndex];
  const remainingQty = currentItem ? (currentItem.quantity - (currentItem.picked_quantity || 0)) : 0;
  const picked = parseInt(pickedQty, 10) || 0;

  const handleSubmit = async () => {
    if (!locationBarcode || !itemBarcode || !pickedQty) {
      Alert.alert('Please fill all fields');
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
            picked_location: locationBarcode 
          }),
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

  const handleCancelOrder = async () => {
    if (orderId) {
      try {
        await fetch(`${BACKEND_URL}/orders/${orderId}/reset`, { method: 'PUT' });
        // Navigate back to location selection
        setStep('select');
        setOrderItems([]);
        setCurrentIndex(0);
        setOrderId(null);
        setLocationBarcode('');
        setItemBarcode('');
        setPickedQty('');
      } catch (err) {
        Alert.alert('Error', 'Failed to cancel order');
      }
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

  // Fulfillment UI
  if (!currentItem || currentIndex >= orderItems.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>All items fulfilled! Order complete.</Text>
        <TouchableOpacity style={styles.button} onPress={handleNewOrder} disabled={loadingNewOrder}>
          <Text style={styles.buttonText}>{loadingNewOrder ? 'Searching...' : 'Start New Order'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const locations = parseLocations(currentItem?.locations);

  return (
    <ThemedView style={styles.container} scroll={true}>
      <ThemedText style={styles.title}>Order ID: {orderId}</ThemedText>
      <ThemedText style={styles.subtitle}>Line {currentIndex + 1} of {orderItems.length}</ThemedText>
      
              {/* Item Information */}
        <ThemedView style={styles.itemInfo}>
          <ThemedText style={styles.label}>Name: <ThemedText style={styles.value}>{currentItem.name}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Description: <ThemedText style={styles.value}>{currentItem.description || 'N/A'}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>Barcode: <ThemedText style={styles.value}>{currentItem.barcode_id}</ThemedText></ThemedText>
          <ThemedText style={styles.label}>To Pick: <ThemedText style={styles.value}>{remainingQty}</ThemedText></ThemedText>
          
          {/* Location Information */}
          <ThemedText style={styles.locationLabel}>Locations:</ThemedText>
          {locations.length > 0 ? (
            locations.map((loc, index) => (
              <View key={index} style={styles.locationRow}>
                <ThemedText style={styles.locationText}>
                  {loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}: <ThemedText style={styles.value}>{loc.location}</ThemedText>
                </ThemedText>
                <ThemedText style={styles.locationQuantity}>
                  {loc.quantity}
                </ThemedText>
              </View>
            ))
          ) : (
            // Fallback to old format for backward compatibility
            <>
              <View style={styles.locationRow}>
                <ThemedText style={styles.locationText}>
                  Primary: <ThemedText style={styles.value}>{currentItem.primary_location || 'Not set'}</ThemedText>
                </ThemedText>
                <ThemedText style={styles.locationQuantity}>
                  {currentItem.primary_quantity || 0}
                </ThemedText>
              </View>
              {currentItem.secondary_location && (
                <View style={styles.locationRow}>
                  <ThemedText style={styles.locationText}>
                    Secondary: <ThemedText style={styles.value}>{currentItem.secondary_location}</ThemedText>
                  </ThemedText>
                  <ThemedText style={styles.locationQuantity}>
                    {currentItem.secondary_quantity || 0}
                  </ThemedText>
                </View>
              )}
            </>
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
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
        <Text style={styles.buttonText}>Cancel Order</Text>
      </TouchableOpacity>

      {/* Location Barcode Scanner */}
      {showLocationScanner && (
        <View style={styles.scannerOverlay}>
          <CameraView
            onBarcodeScanned={scanningEnabled ? handleLocationBarcodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
            }}
            style={StyleSheet.absoluteFillObject}
            enableTorch={flashlightEnabled}
          />
          
          <TouchableOpacity 
            style={styles.closeScannerButton}
            onPress={() => setShowLocationScanner(false)}
          >
            <Text style={styles.closeScannerText}>✕</Text>
          </TouchableOpacity>

          {/* Flashlight Toggle Button */}
          <TouchableOpacity 
            style={styles.flashlightButton}
            onPress={toggleFlashlight}
          >
            <Ionicons
              size={24}
              name={flashlightEnabled ? 'flashlight' : 'flashlight-outline'}
              color={theme.iconColorFocused}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Item Barcode Scanner */}
      {showItemScanner && (
        <View style={styles.scannerOverlay}>
          <CameraView
            onBarcodeScanned={scanningEnabled ? handleItemBarcodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'],
            }}
            style={StyleSheet.absoluteFillObject}
            enableTorch={flashlightEnabled}
          />
          
          <TouchableOpacity 
            style={styles.closeScannerButton}
            onPress={() => setShowItemScanner(false)}
          >
            <Text style={styles.closeScannerText}>✕</Text>
          </TouchableOpacity>

          {/* Flashlight Toggle Button */}
          <TouchableOpacity 
            style={styles.flashlightButton}
            onPress={toggleFlashlight}
          >
            <Ionicons
              size={24}
              name={flashlightEnabled ? 'flashlight' : 'flashlight-outline'}
              color={theme.iconColorFocused}
            />
          </TouchableOpacity>
        </View>
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
    //backgroundColor: '#f8f9fa',
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
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  closeScannerButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeScannerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flashlightButton: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
