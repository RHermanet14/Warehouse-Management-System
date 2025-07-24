import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { CameraView, BarcodeScanningResult, BarcodeType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface BarcodeScannerProps {
  onScanned: (result: BarcodeScanningResult) => void;
  onClose: () => void;
  flashlightEnabled: boolean;
  setFlashlightEnabled: (enabled: boolean) => void;
  barcodeTypes?: BarcodeType[];
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanned,
  onClose,
  flashlightEnabled,
  setFlashlightEnabled,
  barcodeTypes,
}) => {
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const lastScannedRef = useRef<string | null>(null);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!scanningEnabled || lastScannedRef.current === result.data) return;
    setScanningEnabled(false);
    lastScannedRef.current = result.data;
    onScanned(result);
    setTimeout(() => {
      setScanningEnabled(true);
      lastScannedRef.current = null;
    }, 1000);
  };

  return (
    <View style={styles.scannerOverlay}>
      <CameraView
        onBarcodeScanned={scanningEnabled ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={barcodeTypes ? { barcodeTypes } : undefined}
        style={StyleSheet.absoluteFillObject}
        enableTorch={flashlightEnabled}
      />
      {/* Close Button */}
      <TouchableOpacity style={styles.closeScannerButton} onPress={onClose}>
        <Text style={styles.closeScannerText}>✕</Text>
      </TouchableOpacity>
      {/* Flashlight Button */}
      <TouchableOpacity
        style={styles.flashlightButton}
        onPress={() => setFlashlightEnabled(!flashlightEnabled)}
      >
        <Ionicons
          size={24}
          name={flashlightEnabled ? 'flashlight' : 'flashlight-outline'}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 100,
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
    zIndex: 101,
  },
  closeScannerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flashlightButton: {
    position: 'absolute',
    top: 80, // 20 (top) + 50 (button height) + 10 (gap)
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
});

export default BarcodeScanner; 