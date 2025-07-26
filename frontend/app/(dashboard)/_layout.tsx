import { Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Colors } from "../../../shared/constants/Colors"
import {Ionicons } from '@expo/vector-icons'
const DashboardLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Tabs
        screenOptions={{
          headerShown: false, 
          tabBarStyle: {
            backgroundColor: theme.navBackground,
            paddingTop: 10,
            height: 90,
        },
        tabBarActiveTintColor: theme.iconColorFocused,
        tabBarInactiveTintColor: theme.iconColor
    }}
    >
      <Tabs.Screen name="relocate" options={{title: 'Relocate', tabBarIcon: ({ focused }) => (
        <Ionicons
          size={24}
          name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'}
          color={focused ? theme.iconColorFocused : theme.iconColor}
        />
      )}}/>
      <Tabs.Screen name="search" options={{title: 'Search', tabBarIcon: ({ focused }) => (
        <Ionicons
          size={24}
          name={focused ? 'search-circle' : 'search-circle-outline'}
          color={focused ? theme.iconColorFocused : theme.iconColor}
        />
      )}}/>
      <Tabs.Screen name="create" options={{title: 'Create', tabBarIcon: ({ focused }) => (
        <Ionicons
          size={24}
          name={focused ? 'create' : 'create-outline'}
          color={focused ? theme.iconColorFocused : theme.iconColor}
        />
      )}}/>
      <Tabs.Screen name="identify" options={{title: 'Identify', tabBarIcon: ({ focused }) => (
        <Ionicons
          size={24}
          name={focused ? 'finger-print' : 'finger-print-outline'}
          color={focused ? theme.iconColorFocused : theme.iconColor}
        />
      )}}/>
    </Tabs>
  )
}

export default DashboardLayout