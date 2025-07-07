import React from 'react'
import {Stack } from 'expo-router'
import {StatusBar, useColorScheme} from 'react-native'
import { Colors } from '../../constants/Colors'

export default function AuthLayout() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light 
    
    return (
        <>
            <StatusBar barStyle="default"/>
            <Stack screenOptions={{
                    headerStyle: { backgroundColor: theme.navBackground},
                    headerTintColor: theme.title,
                    animation: "none",
            }}/>
        </>
    )
}