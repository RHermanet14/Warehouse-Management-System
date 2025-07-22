import React, { useState } from "react";
import { StyleSheet, TextInput, Alert, Text, View, ScrollView } from "react-native";
import axios from "axios";
import { BACKEND_URL } from "@env";
import { Item } from "../../constants/Types";
import type { Location } from "../../constants/Types";
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import { ItemDisplay } from "../../components/ItemDisplay";
import ThemedButton from "../../components/ThemedButton";
import { inputStyles, buttonStyles, heading } from "../../constants/Styles";

const Search = () => {
    const [barcodeId, setBarcodeId] = useState("");
    const [item, setItem] = useState<Item | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!barcodeId.trim()) {
            Alert.alert("Error", "Please enter a barcode ID");
            return;
        }

        setIsLoading(true);
        setSearched(true);
        try {
            // Try different barcode types since we don't know which one it is
            const res = await axios.get(`${BACKEND_URL}/items?barcode_id=${barcodeId}`);
                if (res.data.item) {
                    setItem(res.data.item);
                    setIsLoading(false);
                    return;
            }
            
            // If we get here, no item was found with any barcode type
            setItem(null);
            Alert.alert("Not Found", "No item found with this barcode ID");
        } catch (error) {
            console.log(error);
            Alert.alert("Error", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setBarcodeId("");
        setItem(null);
        setSearched(false);
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
                <ThemedText title={true} style={heading.primary}>
                    Search by Barcode ID
                </ThemedText>
                <Spacer/>

                <TextInput
                    style={[inputStyles.primary]}
                    placeholder="Enter Barcode ID"
                    placeholderTextColor="#666"
                    value={barcodeId}
                    onChangeText={setBarcodeId}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Spacer height={10} />

                <ThemedButton onPress={handleSearch} style={buttonStyles.primary} disabled={isLoading}>
                    <ThemedText>{isLoading ? "Searching..." : "Search"}</ThemedText>
                </ThemedButton>

                <Spacer height={10} />

                {searched && !isLoading && (
                    <ThemedButton onPress={handleClear} style={buttonStyles.primary}>
                        <ThemedText>Clear Search</ThemedText>
                    </ThemedButton>
                )}

                {item && (
                    <ItemDisplay item={item} scroll={true} />
                )}

                {searched && !item && !isLoading && (
                    <ThemedView style={styles.noResultContainer}>
                        <ThemedText style={styles.noResultText}>
                            No item found with barcode ID: {barcodeId}
                        </ThemedText>
                    </ThemedView>
                )}
            </ScrollView>
        </ThemedView>
    );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  noResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 16,
    textAlign: 'center',
  },
});