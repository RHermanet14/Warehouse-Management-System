import React, { useState, useEffect, useRef } from "react";
import { Text, StyleSheet, Alert, TouchableOpacity, useColorScheme } from "react-native";
import { CameraView, Camera, BarcodeScanningResult, BarcodeType } from "expo-camera";
import axios from "axios";
import { BACKEND_URL } from "@env";
import { Item, barcode_types } from "../../constants/Types";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { ItemDisplay } from "../../components/ItemDisplay";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import ThemedButton from "../../components/ThemedButton";
import { flashLightButtonStyles, buttonStyles} from "../../constants/Styles";

export default function App() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [barcode, setBarcode] = useState<Item | string | null>(null);
  const [scanningEnabled, setScanningEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
      console.log(data, type);
      const res = await axios.get(`${BACKEND_URL}/items?barcode_id=${data}&barcode_type=${type}`);
      if (res.status === 204) {
        Alert.alert('Error', 'Barcode not found in database', [{text: 'Scan Again', onPress: handleClear,}]);
        return;
      } else {
        //console.log(res.data.item);
        setBarcode(res.data.item);
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
  };

  const toggleFlashlight = () => {
    setFlashlightEnabled(!flashlightEnabled);
  };

  if (hasPermission === null) return <Text>Requesting camera permission</Text>;
  if (hasPermission === false) return <Text>No camera access</Text>;

  return (
    <ThemedView style={styles.container}>
      <CameraView
        onBarcodeScanned={scanningEnabled ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: barcode_types as BarcodeType[],
        }}
        style={StyleSheet.absoluteFillObject}
        enableTorch={flashlightEnabled}
      />
      
      {/* Flashlight Toggle Button */}
      <TouchableOpacity 
        style={flashLightButtonStyles.primary} 
        onPress={toggleFlashlight}
      >
        <Ionicons
          size={24}
          name={flashlightEnabled ? 'flashlight' : 'flashlight-outline'}
          color={theme.iconColorFocused}
        />
      </TouchableOpacity>
      
      {barcode && typeof barcode === 'object' ? (
        <ThemedView style={styles.barcodeContainer}>
          <ItemDisplay item={barcode} scroll={false} />
          <ThemedButton onPress={handleClear} style={buttonStyles.primary}>
            <ThemedText>Scan Another</ThemedText>
          </ThemedButton>
        </ThemedView>
      ) : null}
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
  barcodeText: {
    fontSize: 16,
    marginBottom: 10,
  },
  flashlightText: {
    fontSize: 24,
  },
});