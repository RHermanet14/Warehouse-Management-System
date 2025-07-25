import { StyleSheet } from 'react-native'
import {Link } from 'expo-router'
import React from 'react'

//Themed Components
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'


const login = () => {
    
  return (
    <ThemedView style = {styles.container}>

        <Link href="/order" style={styles.link}>
          <ThemedText>Fulfill Order</ThemedText>
        </Link>
        <Link href="/relocate" style={styles.link}>
          <ThemedText>Dashboard</ThemedText>
        </Link>
    </ThemedView>
  )
}

export default login

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: 'center' },
    link: { fontSize: 20, marginVertical: 8 }
})