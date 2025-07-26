import { View, useColorScheme, StyleSheet } from 'react-native'
import {Colors} from '../../shared/constants/Colors'
import React from 'react'

const ThemedCard = ({ style, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
  return (
    <View 
    style={[{backgroundColor: theme.uiBackground}, styles.card, style]}
        {...props}
    />
      
  )
}

export default ThemedCard

const styles = StyleSheet.create({
    card: {
        borderRadius: 5,
        padding: 20
    }
})