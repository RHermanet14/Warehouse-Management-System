import React, { useState, useEffect, useRef } from "react";
import { Text, StyleSheet, Alert, useColorScheme } from "react-native";
import { Camera, BarcodeScanningResult } from "expo-camera";
import axios from "axios";
import { BACKEND_URL } from "@env";
import { Item, barcode_types } from "../../../shared/constants/Types";
import { Colors } from "../../../shared/constants/Colors";
import { ItemDisplay } from "../../components/ItemDisplay";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import { buttonStyles} from "../../constants/Styles";
import BarcodeScanner from '../../components/BarcodeScanner';

export default function App() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [barcode, setBarcode] = useState<Item | string | null>(null);
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  const handleBarcodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (!scanningEnabled || isProcessing || lastScannedRef.current === data) {
      return;
    }
    setFlashlightEnabled(false);
    setScanningEnabled(false);
    setIsProcessing(true);
    lastScannedRef.current = data;
    try {
      //console.log(data, type);
      const res = await axios.get(`${BACKEND_URL}/items?barcode_id=${data}&barcode_type=${type}`);
      if (res.status === 204) {
        Alert.alert('Error', 'Barcode not found in database', [{text: 'Scan Again', onPress: handleClear,}]);
        return;
      } else {
        const data = res.data as { item: Item };
        //console.log(data.item);
        setBarcode(data.item);
        setShowScanner(false);
      }
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 500) {
        Alert.alert(
          'Error',
          'Backend not working properly',
          [
            {
              text: 'Scan Again',
              onPress: () => {
                if (scanTimeoutRef.current) {
                  clearTimeout(scanTimeoutRef.current);
                }
                scanTimeoutRef.current = setTimeout(() => {
                  setScanningEnabled(true);
                  setIsProcessing(false);
                  lastScannedRef.current = null;
                  setShowScanner(true);
                }, 500);
              },
            },
          ]
        );
      }
    }
  };

  const handleClear = () => {
    setBarcode(null);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    setScanningEnabled(true);
    setIsProcessing(false);
    lastScannedRef.current = null;
    setShowScanner(true);
  };

  const toggleFlashlight = () => {
    setFlashlightEnabled(!flashlightEnabled);
  };

  if (hasPermission === null) return <Text>Requesting camera permission</Text>;
  if (hasPermission === false) return <Text>No camera access</Text>;

  return (
    <ThemedView style={styles.container}>
      {showScanner ? (
        <BarcodeScanner
          onScanned={handleBarcodeScanned}
          onClose={() => {}}
          flashlightEnabled={flashlightEnabled}
          setFlashlightEnabled={setFlashlightEnabled}
          barcodeTypes={barcode_types as any as import('expo-camera').BarcodeType[]}
        />
      ) : (
        barcode && typeof barcode === 'object' ? (
          <ThemedView style={styles.barcodeContainer}>
            <ItemDisplay item={barcode} scroll={false} />
            <ThemedButton onPress={handleClear} style={buttonStyles.primary}>
              <ThemedText>Scan Another</ThemedText>
            </ThemedButton>
          </ThemedView>
        ) : null
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  barcodeContainer: {
    margin: 16,
    borderRadius: 8,
    padding: 16,
  },

});