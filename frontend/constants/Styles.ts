import { StyleSheet } from "react-native";
export const inputStyles = StyleSheet.create({
    primary: {
        width: "100%",
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: "white",
        color: "black",
    }
});

export const buttonStyles = StyleSheet.create({
    primary: {
        margin: 20,
        alignItems: 'center',
        fontWeight: 'bold',
    }
});

export const flashLightButtonStyles = StyleSheet.create({
    primary: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export const heading = StyleSheet.create({
    primary: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    }
});