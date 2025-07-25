import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TextInput, Alert, ScrollView, View, TouchableOpacity, useColorScheme, Text, Keyboard, TouchableWithoutFeedback } from "react-native";
import { Camera, BarcodeScanningResult } from "expo-camera";
import axios from "axios";
import { BACKEND_URL } from "@env";
import { barcode_types } from "../../constants/Types";
import { Colors } from "../../constants/Colors";
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";
import { inputStyles, buttonStyles, heading } from "../../constants/Styles";
import DropDownPicker from 'react-native-dropdown-picker';
import BarcodeScanner from '../../components/BarcodeScanner';

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
    const [dropdownOpen, setDropdownOpen] = useState<{[key: number]: boolean}>({});
    const [areas, setAreas] = useState<{ area_id: string; name: string }[]>([]);

    // Initial form state
    const initialFormState = {
        barcode_id: "",
        barcode_type: barcode_types[0],
        name: "",
        description: "",
        total_quantity: "",
        locations: [] as Array<{ bin: string; quantity: string; type: string; area_id: string }>,
    };

    // Form state
    const [formData, setFormData] = useState(initialFormState);

    // Add location
    const addLocation = () => {
        setFormData(prev => ({
            ...prev,
            locations: [...prev.locations, { bin: '', quantity: '', type: 'primary', area_id: '' }],
        }));
    };

    // Remove location
    const removeLocation = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            locations: prev.locations.filter((_, i) => i !== idx),
        }));
    };

    // Update location field
    const updateLocationField = (idx: number, field: 'bin' | 'quantity' | 'type' | 'area_id', value: string) => {
        setFormData(prev => ({
            ...prev,
            locations: prev.locations.map((loc, i) => i === idx ? { ...loc, [field]: value } : loc),
        }));
    };

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };
        getCameraPermissions();
    }, []);

    useEffect(() => {
        return () => {
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        // Fetch areas from backend
        axios.get(`${BACKEND_URL}/items/areas`).then(res => {
            if (Array.isArray(res.data)) setAreas(res.data);
        });
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
        setIsLoading(true);
        try {
            // Prepare locations array for backend
            const locations = formData.locations
                .filter(loc => loc.bin.trim() !== '' && loc.quantity.trim() !== '')
                .map(loc => ({
                    bin: loc.bin,
                    quantity: parseInt(loc.quantity.replace(/^0+(?=\d)/, '')) || 0,
                    type: loc.type,
                    area_id: loc.area_id,
                }));

            const response = await axios.post(`${BACKEND_URL}/items`, {
                barcode_id: formData.barcode_id,
                barcode_type: formData.barcode_type,
                name: formData.name,
                description: formData.description || null,
                locations,
                total_quantity: quantity
            });
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedView style={styles.container}>
            {showScanner && (
                <BarcodeScanner
                    onScanned={handleBarcodeScanned}
                    onClose={() => setShowScanner(false)}
                    flashlightEnabled={flashlightEnabled}
                    setFlashlightEnabled={setFlashlightEnabled}
                    barcodeTypes={barcode_types as any as import('expo-camera').BarcodeType[]}
                />
            )}
            {!showScanner && (
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
                    <ThemedText style={styles.sectionTitle}>Locations</ThemedText>
                    {formData.locations.map((loc, idx) => (
                        <View key={idx} style={{ marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 12 }}>
                            <TextInput
                                style={[inputStyles.primary, { marginBottom: 8 }]}
                                placeholder="Location Name"
                                placeholderTextColor="#666"
                                value={loc.bin}
                                onChangeText={text => updateLocationField(idx, 'bin', text)}
                                autoCapitalize="words"
                            />
                            <TextInput
                                style={[inputStyles.primary, { marginBottom: 8 }]}
                                placeholder="Quantity"
                                placeholderTextColor="#666"
                                value={loc.quantity}
                                onChangeText={text => updateLocationField(idx, 'quantity', text)}
                                keyboardType="numeric"
                            />
                            <DropDownPicker
                                open={!!dropdownOpen[`type_${idx}`]}
                                value={loc.type}
                                items={[
                                    { label: 'Primary', value: 'primary' },
                                    { label: 'Secondary', value: 'secondary' },
                                    { label: 'Overflow', value: 'overflow' },
                                    { label: 'Storage', value: 'storage' },
                                ]}
                                setOpen={open => setDropdownOpen(prev => ({ ...prev, [`type_${idx}`]: !!open }))}
                                setValue={cb => {
                                    const value = typeof cb === 'function' ? cb(loc.type) : cb;
                                    updateLocationField(idx, 'type', value);
                                }}
                                setItems={() => {}}
                                style={[inputStyles.primary, { marginBottom: 8 }]}
                                containerStyle={{ marginBottom: 8 }}
                                zIndex={1000 - idx}
                                listMode="SCROLLVIEW"
                            />
                            <DropDownPicker
                                open={!!dropdownOpen[`area_${idx}`]}
                                value={loc.area_id}
                                items={[
                                    { label: 'Select Area', value: '' },
                                    ...areas.map(area => ({ label: area.name, value: String(area.area_id) })),
                                ]}
                                setOpen={open => setDropdownOpen(prev => ({ ...prev, [`area_${idx}`]: !!open }))}
                                setValue={cb => {
                                    const value = typeof cb === 'function' ? cb(loc.area_id) : cb;
                                    updateLocationField(idx, 'area_id', value);
                                }}
                                setItems={() => {}}
                                style={[inputStyles.primary, { marginBottom: 8 }]}
                                containerStyle={{ marginBottom: 8 }}
                                zIndex={900 - idx}
                                listMode="SCROLLVIEW"
                            />
                            <TouchableOpacity onPress={() => removeLocation(idx)} style={{ backgroundColor: '#dc3545', borderRadius: 4, padding: 8, alignSelf: 'flex-start' }}>
                                <Text style={{ color: 'white' }}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <ThemedButton onPress={addLocation} style={[buttonStyles.primary, { backgroundColor: '#28a745', marginBottom: 10 }]}>
                        <Text style={{ color: 'white' }}>Add Location</Text>
                    </ThemedButton>
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
        </TouchableWithoutFeedback>
    );
};

export default Create;

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});