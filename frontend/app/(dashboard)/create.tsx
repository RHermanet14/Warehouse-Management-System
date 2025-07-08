import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TextInput, Alert, ScrollView, View, TouchableOpacity, useColorScheme, Text } from "react-native";
import { CameraView, Camera, BarcodeScanningResult, BarcodeType } from "expo-camera";
import axios from "axios";
import { BACKEND_URL } from "@env";
import { barcode_types } from "../../constants/Types";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";
import { inputStyles, buttonStyles, flashLightButtonStyles, heading } from "../../constants/Styles";

const Create = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [flashlightEnabled, setFlashlightEnabled] = useState(false);
    const [scanningEnabled, setScanningEnabled] = useState(true);
    const lastScannedRef = useRef<string | null>(null);
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial form state
    const initialFormState = {
        barcode_id: "",
        barcode_type: barcode_types[0],
        name: "",
        description: "",
        total_quantity: "",
        primary_location: "",
        primary_quantity: "",
        secondary_location: "",
        secondary_quantity: ""
    };

    // Form state
    const [formData, setFormData] = useState(initialFormState);

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
        if (!scanningEnabled || lastScannedRef.current === data) {
            return;
        }
        setFlashlightEnabled(false);
        setScanningEnabled(false);
        lastScannedRef.current = data;
        
        // Find the matching barcode type
        const detectedType = barcode_types.find(bt => bt.toLowerCase() === type.toLowerCase()) || barcode_types[0];
        
        setFormData(prev => ({
            ...prev,
            barcode_id: data,
            barcode_type: detectedType
        }));
        
        setShowScanner(false);
        setScanningEnabled(true);
        lastScannedRef.current = null;
    };

    const handleSubmit = async () => {
        if (!formData.barcode_id.trim()) {
            Alert.alert("Error", "Please enter or scan a barcode ID");
            return;
        }
        const quantity = parseInt(formData.total_quantity);
/*
        if (!formData.name.trim()) {
            Alert.alert("Error", "Please enter an item name");
            return;
        }

        if (isNaN(quantity) || quantity <= 0) {
            Alert.alert("Error", "Please enter a valid quantity");
            return;
        }
*/
        setIsLoading(true);
        try {
            // Prepare location data
            const primaryLocation = formData.primary_location.trim() && formData.primary_quantity.trim() 
                ? { "location": formData.primary_location, "quantity": parseInt(formData.primary_quantity) }
                : null;
            
            const secondaryLocation = formData.secondary_location.trim() && formData.secondary_quantity.trim()
                ? { "location": formData.secondary_location, "quantity": parseInt(formData.secondary_quantity) }
                : null;

            const response = await axios.post(`${BACKEND_URL}/items`, {
                barcode_id: formData.barcode_id,
                barcode_type: formData.barcode_type,
                name: formData.name,
                description: formData.description || null,
                primary_location: primaryLocation,
                secondary_location: secondaryLocation,
                total_quantity: quantity
            });
            console.log(response.data);
            if (response.status === 200) {
              Alert.alert("Success", "Item quantity updated successfully!", [{text: "Update Another", onPress: handleClear}]);
              return;
            } else if (response.status === 201) {
              Alert.alert("Success", "Item created successfully!", [{text: "Create Another", onPress: handleClear}]);
              return;
            } else {
              Alert.alert("Error", "Failed to create item", [{text: "OK", onPress: handleClear}]);
            }

            
        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 400) {
                Alert.alert("Error", error.response.data.error || "Invalid data provided");
            } else {
                Alert.alert("Error", "Failed to create item");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setFormData(initialFormState);
    };

    const toggleFlashlight = () => {
        setFlashlightEnabled(!flashlightEnabled);
    };

    if (hasPermission === null) return <ThemedText>Requesting camera permission</ThemedText>;
    if (hasPermission === false) return <ThemedText>No camera access</ThemedText>;

    return (
        <ThemedView style={styles.container}>
            {showScanner ? (
                <View style={styles.scannerContainer}>
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

                    {/* Close Scanner Button */}
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={() => setShowScanner(false)}
                    >
                        <Ionicons
                            size={24}
                            name="close"
                            color="white"
                        />
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.formContainer}>
                    <ThemedText title={true} style={heading.primary}>
                        Create New Item
                    </ThemedText>
                    <Spacer />
                    {/* Barcode Section */}
                    <ThemedText style={styles.sectionTitle}>Barcode Information (Required)</ThemedText>
                    
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Barcode ID"
                        placeholderTextColor="#666"
                        value={formData.barcode_id}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, barcode_id: text }))}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    
                    <ThemedButton 
                        onPress={() => setShowScanner(true)} 
                        style={styles.scanButton}
                    >
                        <ThemedText>Scan Barcode</ThemedText>
                    </ThemedButton>

                    <Spacer />
                    <ThemedText style={styles.sectionTitle}>Barcode Type</ThemedText>
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Barcode Type"
                        placeholderTextColor="#666"
                        value={formData.barcode_type}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, barcode_type: text }))}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Spacer height={10} />

                    {/* Item Details */}
                    <ThemedText style={styles.sectionTitle}>Item Details</ThemedText>
                    
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Item Name"
                        placeholderTextColor="#666"
                        value={formData.name}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                        autoCapitalize="words"
                    />
                    <Spacer height={10} />

                    <TextInput
                        style={[inputStyles.primary, styles.textArea]}
                        placeholder="Description"
                        placeholderTextColor="#666"
                        value={formData.description}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                    <Spacer height={10} />

                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Total Quantity"
                        placeholderTextColor="#666"
                        value={formData.total_quantity}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, total_quantity: text }))}
                        keyboardType="numeric"
                    />
                    <Spacer height={20} />

                    {/* Location Information */}
                    <ThemedText style={styles.sectionTitle}>Location Information</ThemedText>
                    
                    <ThemedText style={styles.subsectionTitle}>Primary Location</ThemedText>
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Primary Location"
                        placeholderTextColor="#666"
                        value={formData.primary_location}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, primary_location: text }))}
                        autoCapitalize="words"
                    />
                    <Spacer height={10} />
                    
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Primary Location Quantity"
                        placeholderTextColor="#666"
                        value={formData.primary_quantity}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, primary_quantity: text }))}
                        keyboardType="numeric"
                    />
                    <Spacer height={15} />

                    <ThemedText style={styles.subsectionTitle}>Secondary Location</ThemedText>
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Secondary Location"
                        placeholderTextColor="#666"
                        value={formData.secondary_location}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, secondary_location: text }))}
                        autoCapitalize="words"
                    />
                    <Spacer height={10} />
                    
                    <TextInput
                        style={[inputStyles.primary]}
                        placeholder="Secondary Location Quantity"
                        placeholderTextColor="#666"
                        value={formData.secondary_quantity}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, secondary_quantity: text }))}
                        keyboardType="numeric"
                    />
                    <Spacer height={20} />

                    {/* Action Buttons */}
                    <ThemedButton onPress={handleSubmit} style={buttonStyles.primary} disabled={isLoading}>
                        <Text style={{color: 'white'}}>{isLoading ? "Creating..." : "Create Item"}</Text>
                    </ThemedButton>

                    <Spacer height={10} />

                    <ThemedButton onPress={handleClear} style={[buttonStyles.primary, {backgroundColor: "#FF3B30"}]}>
                        <Text style={{color: 'white'}}>Clear Form</Text>
                    </ThemedButton>
                </ScrollView>
            )}
        </ThemedView>
    );
};

export default Create;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scannerContainer: {
        flex: 1,
        position: 'relative',
    },
    formContainer: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
    },
    subsectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
        marginTop: 5,
    },
    textArea: {
        height: 80,
        paddingTop: 15,
    },
    scanButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: "#007AFF",
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});