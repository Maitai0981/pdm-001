import React from 'react';
import { View, Text,SafeAreaView,StyleSheet  } from 'react-native'
import BBlue from '../components/BBlue.js'
import {useNavigation} from '@react-navigation/native'


export default function HomeScreen() {
  const nav = useNavigation()
  return (
    <SafeAreaView style = {style.container}>
        <BBlue label="Teste sua Sorte" onPress={()=>nav.navigate("Biscoito")}/>
        <BBlue label="Calculo de Chuva" onPress={()=>nav.navigate("PrevisaoTempo")}/>
        <BBlue label="Detalhes" onPress={()=>nav.navigate("Detalhes")}/>
    </SafeAreaView>
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
