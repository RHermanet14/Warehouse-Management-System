import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View, Text, Alert, Keyboard, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import { barcode_types } from "../../constants/Types";
import { inputStyles, heading } from "../../constants/Styles";
import BarcodeScanner from "../../components/BarcodeScanner";
import axios from "axios";
import { BACKEND_URL } from "@env";

const Relocate = () => {
    // State for form
    const [barcode, setBarcode] = useState("");
    const [sourceLocation, setSourceLocation] = useState("");
    const [destLocation, setDestLocation] = useState("");
    const [quantity, setQuantity] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Camera/scanner state
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [flashlightEnabled, setFlashlightEnabled] = useState(false);
    const [scanningField, setScanningField] = useState<"barcode" | "source" | "dest" | null>(null);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await import("expo-camera").then(m => m.Camera.requestCameraPermissionsAsync());
            setHasPermission(status === "granted");
        };
        getCameraPermissions();
    }, []);

    if (hasPermission === null) return <ThemedText>Requesting camera permission</ThemedText>;
    if (hasPermission === false) return <ThemedText>No camera access</ThemedText>;

    const handleBarcodeScanned = ({ type, data }: { type: string, data: string }) => {
        if (scanningField === "barcode") setBarcode(data);
        if (scanningField === "source") setSourceLocation(data);
        if (scanningField === "dest") setDestLocation(data);
        setShowScanner(false);
        setScanningField(null);
    };

    const handleOpenScanner = (field: "barcode" | "source" | "dest") => {
        setScanningField(field);
        setShowScanner(true);
    };

    const handleMove = async () => {
        setMessage("");
        if (!barcode || !sourceLocation || !destLocation || !quantity) {
            Alert.alert("Missing Information", "Please fill in all fields before moving the item.");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.put(`${BACKEND_URL}/items/move-location-quantity`, {
                barcode_id: barcode,
                source_bin: sourceLocation,
                dest_bin: destLocation,
                quantity: Number(quantity),
            });
            if (res.status === 200) {
                setMessage("Quantity moved successfully.");
                Alert.alert("Success", "Quantity moved successfully.");
                setBarcode("");
                setSourceLocation("");
                setDestLocation("");
                setQuantity("");
            } else {
                setMessage(res.data.error || "Failed to move quantity.");
                Alert.alert("Error", res.data.error || "Failed to move quantity.");
            }
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.error) {
                setMessage(err.response.data.error);
                Alert.alert("Error", err.response.data.error);
            } else {
                setMessage("Network error.");
                Alert.alert("Error", "Network error.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedView style={styles.container}>
            {showScanner && scanningField && (
                <BarcodeScanner
                    onScanned={handleBarcodeScanned}
                    onClose={() => { setShowScanner(false); setScanningField(null); }}
                    flashlightEnabled={flashlightEnabled}
                    setFlashlightEnabled={setFlashlightEnabled}
                    barcodeTypes={barcode_types as any as import('expo-camera').BarcodeType[]}
                />
            )}
            {!showScanner && (
                <>
                    <ThemedText title={true} style={heading.primary}>
                        Move Item Quantity
                    </ThemedText>
                    <Spacer/>

                    <ThemedText>Item Barcode:</ThemedText>
                    <View style={styles.inputRow}>
                        <TextInput
                            value={barcode}
                            onChangeText={setBarcode}
                            style={[inputStyles.primary, { flex: 1, color: '#000' }]}
                            placeholder="Scan or enter barcode"
                            placeholderTextColor="#888"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => handleOpenScanner("barcode")}
                            style={styles.scanButton} accessibilityRole="button">
                            <Ionicons name="barcode-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Spacer/>

                    <ThemedText>Source Location ID:</ThemedText>
                    <View style={styles.inputRow}>
                        <TextInput
                            value={sourceLocation}
                            onChangeText={setSourceLocation}
                            style={[inputStyles.primary, { flex: 1, color: '#000' }]}
                            placeholder="Scan or enter source ID"
                            placeholderTextColor="#888"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => handleOpenScanner("source")}
                            style={styles.scanButton} accessibilityRole="button">
                            <Ionicons name="barcode-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Spacer/>

                    <ThemedText>Destination Location ID:</ThemedText>
                    <View style={styles.inputRow}>
                        <TextInput
                            value={destLocation}
                            onChangeText={setDestLocation}
                            style={[inputStyles.primary, { flex: 1, color: '#000' }]}
                            placeholder="Scan or enter destination ID"
                            placeholderTextColor="#888"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => handleOpenScanner("dest")}
                            style={styles.scanButton} accessibilityRole="button">
                            <Ionicons name="barcode-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Spacer/>

                    <ThemedText>Quantity:</ThemedText>
                    <TextInput
                        value={quantity}
                        onChangeText={text => setQuantity(text.replace(/[^0-9]/g, ""))}
                        style={[inputStyles.primary, { color: '#000' }]}
                        placeholder="Enter quantity"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        onFocus={() => setQuantity("")}
                    />
                    <Spacer height={10}/>

                    <TouchableOpacity
                        onPress={handleMove}
                        style={[styles.moveButton, loading && styles.buttonDisabled]}
                        disabled={loading}
                        accessibilityRole="button"
                    >
                        <Text style={styles.moveButtonText}>
                            {loading ? "Moving..." : "Move"}
                        </Text>
                    </TouchableOpacity>
                    <Spacer/>

                    {message && <ThemedText>{message}</ThemedText>}
                </>
            )}
        </ThemedView>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    scanButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 6,
        marginLeft: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#aaa',
    },
    moveButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    moveButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 18,
    },
});

export default Relocate;