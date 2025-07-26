import { View, ScrollView, useColorScheme } from 'react-native'
import {Colors} from '../../shared/constants/Colors'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ThemedView = ({ style, safe=false, scroll=false, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    if(scroll) {
      if(!safe) return (
        <ScrollView
        style={[{backgroundColor: theme.background}, style]}
            {...props}
        /> 
      )
      const insets = useSafeAreaInsets()
      return (
        <ScrollView
        style={[{
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        },
        style]}
        {...props}
        />
      )
    }
    if(!safe) return (
      <View
      style={[{backgroundColor: theme.background}, style]}
          {...props}
      /> 
    )
    const insets = useSafeAreaInsets()
    return (
      <View
      style={[{
        backgroundColor: theme.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      },
      style]}
      {...props}
      />
    )
}

export default ThemedView